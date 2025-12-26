import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../../prisma/cliente";
import { capa3_obtenerPrioridadAreas } from "./capa3.reglasArea";
import { capa5_generarAsignacionesConComodines } from "./capa5.GeneracionAsignacion";
import { Asignacion, OpcionesGeneracion, ProgramacionDia } from "./tipos";

async function obtenerProgramacionHistorica(fechaInicio: Date, fechaFin: Date): Promise<Asignacion[]> {
  const asignacionesBD = await prisma.detalleProgramacion.findMany({
    where: { fecha: { gte: fechaInicio, lte: fechaFin } },
    include: { turno: true, area: true, empleado: true }
  });
  return asignacionesBD.map((det: any) => ({
    id_asignacion: det.id_detalle_programacion,
    id_empleado: det.id_empleado,
    id_area: det.id_area || 0,
    id_turno: det.id_turno || 0,
    fecha: det.fecha,
    nombre_empleado: `${det.empleado.nombre1} ${det.empleado.apellido1}`,
    nombre_area: det.area?.nombre_area || "Sin Área",
    codigo_turno: det.turno?.tipo_turno || "S/T"
  }));
}

export async function capa6_guardarAsignaciones(asignaciones: Asignacion[]): Promise<{ guardadas: number; errores: number }> {
  let guardadas = 0, errores = 0;
  try {
    await prisma.$transaction(
      asignaciones.map((asig) =>
        prisma.detalleProgramacion.upsert({
          where: { uq_empleado_fecha: { id_empleado: asig.id_empleado, fecha: asig.fecha } },
          update: { id_area: asig.id_area, id_turno: asig.id_turno, updated_at: new Date() },
          create: { id_empleado: asig.id_empleado, fecha: asig.fecha, id_area: asig.id_area, id_turno: asig.id_turno, tipo_dia: "Laborado" },
        })
      )
    );
    guardadas = asignaciones.length;
  } catch (error) {
    console.error("Error en guardado:", error);
    errores = asignaciones.length;
  }
  return { guardadas, errores };
}

export async function capa6_generarProgramacionDia(fecha: Date, opciones?: OpcionesGeneracion): Promise<ProgramacionDia> {
  const fechaNormalizada = new Date(fecha);
  fechaNormalizada.setHours(0, 0, 0, 0);

  const [empleadosBD, areasBD, turnosBD] = await Promise.all([
    prisma.empleado.findMany({
      where: { id_estado: 1 },
      include: { empleado_area: { include: { area: true } }, cargo: true }
    }),
    prisma.area.findMany({ orderBy: { nombre_area: "asc" } }),
    prisma.turno.findMany({ where: { estado: "Activo" } })
  ]);

  const empleadosOrdenados = empleadosBD.map((emp: any) => ({
    id_empleado: emp.id_empleado,
    cedula: emp.cedula,
    nombre_completo: `${emp.nombre1} ${emp.apellido1}`,
    total_areas: emp.empleado_area.length,
    clasificacion: (emp.empleado_area.length === 1 ? "especialista" : "flexible") as any,
    areas: emp.empleado_area.map((ea: any) => ({ id_area: ea.area.id_area, nombre_area: ea.area.nombre_area }))
  }));

  const areasPriorizadas = await capa3_obtenerPrioridadAreas(areasBD.map((a: any) => ({ id_area: a.id_area, nombre_area: a.nombre_area })));
  const necesidadesPorArea = new Map<number, number>();
  areasBD.forEach(a => necesidadesPorArea.set(a.id_area, 2));

  const todasLasAsignaciones: any[] = [];
  const todasLasAlertas: string[] = [];
  const empleadosDisponibles = empleadosOrdenados.map(e => ({ ...e, disponible: true }));

  const fechaInicioHistoria = new Date(fechaNormalizada);
  fechaInicioHistoria.setDate(fechaInicioHistoria.getDate() - 7);
  const programacionHistorica = await obtenerProgramacionHistorica(fechaInicioHistoria, fechaNormalizada);

  const idsTurnosAPrueba = [5, 6];

  for (const idTurno of idsTurnosAPrueba) {
    const turnoPrisma = turnosBD.find(t => t.id_turno === idTurno);
    if (!turnoPrisma) continue;

    const resultadoTurno = capa5_generarAsignacionesConComodines(
      empleadosOrdenados,
      empleadosDisponibles,
      areasPriorizadas,
      necesidadesPorArea,
      convertirTurnoPrismaATurno(turnoPrisma, fechaNormalizada),
      fechaNormalizada,
      { programacionExistente: programacionHistorica, maxDiasConsecutivos: 3 }
    );

    resultadoTurno.asignaciones.forEach(asig => {
      const emp = empleadosOrdenados.find(e => e.id_empleado === asig.id_empleado);
      const ar = areasBD.find(a => a.id_area === asig.id_area);
      todasLasAsignaciones.push({
        ...asig,
        nombre_empleado: emp?.nombre_completo || "S/N",
        nombre_area: ar?.nombre_area || "S/A",
        codigo_turno: turnoPrisma.tipo_turno
      });

      const empDisp = empleadosDisponibles.find(ed => ed.id_empleado === asig.id_empleado);
      if (empDisp) empDisp.disponible = false;
    });

    if (resultadoTurno.advertencias.length > 0) {
      todasLasAlertas.push(...resultadoTurno.advertencias.map(adv => `[${turnoPrisma.tipo_turno}] ${adv}`));
    }
  }

  return {
    fecha: fechaNormalizada,
    asignaciones: todasLasAsignaciones,
    alertas: todasLasAlertas.map(msg => ({ mensaje: msg, tipo: "ADVERTENCIA" })) as any,
    resumen: {
      total_asignaciones: todasLasAsignaciones.length,
      total_empleados: empleadosBD.length,
      total_areas: areasBD.length,
      huecos: []
    }
  };
}

function convertirTurnoPrismaATurno(turnoPrisma: any, fecha: Date): any {
  if (!turnoPrisma) return null;
  const periodos = [{ hora_entrada: turnoPrisma.hora_entrada, hora_salida: turnoPrisma.hora_salida }];
  if (turnoPrisma.hora_entrada_2 && turnoPrisma.hora_salida_2) {
    periodos.push({ hora_entrada: turnoPrisma.hora_entrada_2, hora_salida: turnoPrisma.hora_salida_2 });
  }
  return { id_turno: turnoPrisma.id_turno, codigo: turnoPrisma.tipo_turno, hora_entrada: turnoPrisma.hora_entrada, hora_salida: turnoPrisma.hora_salida, periodos };
}