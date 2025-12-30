
import prisma from "../../prisma/cliente";
import { capa3_obtenerPrioridadAreas } from "./capa3.reglasArea";
import { capa5_generarAsignacionesDia } from "./capa5.GeneracionAsignacion";
import { Asignacion, OpcionesGeneracion, ProgramacionDia, EmpleadoDisponible, AreaPriorizada, Turno } from "./tipos";

async function obtenerProgramacionHistorica(fechaInicio: Date, fechaFin: Date): Promise<Asignacion[]> {
  const asignacionesBD = await prisma.detalleProgramacion.findMany({
    where: { fecha: { gte: fechaInicio, lte: fechaFin } },
    include: { turno: true, area: true, empleado: true }
  });

  return asignacionesBD.map((det): Asignacion => ({
    id_asignacion: det.id_detalle_programacion,
    id_empleado: det.id_empleado,
    id_area: det.id_area || 0,
    id_turno: det.id_turno || 0,
    fecha: det.fecha,
    // Estructura mínima requerida por Capa 5
    hora_entrada: det.turno?.hora_entrada || new Date(),
    hora_salida: det.turno?.hora_salida || new Date()
  }));
}

export async function capa6_guardarAsignaciones(asignaciones: Asignacion[]): Promise<{ guardadas: number; errores: number }> {
  let guardadas = 0, errores = 0;
  try {
    // Usamos una transacción para que se guarde todo el día completo o nada
    await prisma.$transaction(
      asignaciones.map((asig) =>
        prisma.detalleProgramacion.upsert({
          where: { uq_empleado_fecha: { id_empleado: asig.id_empleado, fecha: asig.fecha } },
          update: { id_area: asig.id_area, id_turno: asig.id_turno, updated_at: new Date() },
          create: {
            id_empleado: asig.id_empleado,
            fecha: asig.fecha,
            id_area: asig.id_area,
            id_turno: asig.id_turno,
            tipo_dia: "Laborado"
          },
        })
      )
    );
    guardadas = asignaciones.length;
  } catch (error) {
    console.error("Error en guardado masivo:", error);
    errores = asignaciones.length;
  }
  return { guardadas, errores };
}

export async function capa6_generarProgramacionDia(fecha: Date, opciones?: OpcionesGeneracion): Promise<ProgramacionDia> {
  // NORMALIZACIÓN UTC (Lo que aprendimos en Capa 5 aplicado aquí)
  const fechaNormalizada = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));

  const [empleadosBD, areasBD, turnosBD] = await Promise.all([
    prisma.empleado.findMany({
      where: { id_estado: 1 },
      include: { empleado_area: { include: { area: true } }, cargo: true }
    }),
    prisma.area.findMany({ orderBy: { nombre_area: "asc" } }),
    prisma.turno.findMany({ where: { estado: "Activo" } })
  ]);

  const empleadosOrdenados: EmpleadoDisponible[] = empleadosBD.map((emp) => ({
    id_empleado: emp.id_empleado,
    cedula: emp.cedula ?? "",
    nombre_completo: `${emp.nombre1} ${emp.apellido1}`,
    total_areas: emp.empleado_area.length ?? 0,
    clasificacion: (emp.empleado_area.length === 1 ? "especialista" : "flexible"),
    areas: emp.empleado_area.map((ea) => ({ id_area: ea.area.id_area, nombre_area: ea.area.nombre_area })),
    disponible: true
  }));

  const areasPriorizadas: AreaPriorizada[] = await capa3_obtenerPrioridadAreas(
    areasBD.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area }))
  );

  const necesidadesPorArea = new Map<number, number>();
  areasBD.forEach(a => necesidadesPorArea.set(a.id_area, 2));

  const todasLasAsignaciones: any[] = [];
  const todasLasAlertas: string[] = [];
  const empleadosDisponibles = [...empleadosOrdenados];

  const fechaInicioHistoria = new Date(fechaNormalizada);
  fechaInicioHistoria.setUTCDate(fechaInicioHistoria.getUTCDate() - 7);
  const programacionHistorica = await obtenerProgramacionHistorica(fechaInicioHistoria, fechaNormalizada);

  const idsTurnosAPrueba = [5, 6];

  for (const idTurno of idsTurnosAPrueba) {
    const turnoPrisma = turnosBD.find(t => t.id_turno === idTurno);
    if (!turnoPrisma) continue;

    const resultadoTurno = capa5_generarAsignacionesDia(
      [],
      empleadosDisponibles,
      areasPriorizadas,
      necesidadesPorArea,
      convertirTurnoPrismaATurno(turnoPrisma),
      fechaNormalizada,
      { ...opciones, programacionExistente: [...programacionHistorica, ...todasLasAsignaciones], maxDiasConsecutivos: 3 }
    );

    resultadoTurno.asignaciones.forEach(asig => {
      todasLasAsignaciones.push({
        ...asig,
        codigo_turno: turnoPrisma.tipo_turno
      });

      const index = empleadosDisponibles.findIndex(ed => ed.id_empleado === asig.id_empleado);
      if (index !== -1) empleadosDisponibles[index].disponible = false;
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

function convertirTurnoPrismaATurno(turnoPrisma: any): Turno {
  return {
    id_turno: turnoPrisma.id_turno,
    hora_entrada: turnoPrisma.hora_entrada,
    hora_salida: turnoPrisma.hora_salida,
    hora_entrada_2: turnoPrisma.hora_entrada_2,
    hora_salida_2: turnoPrisma.hora_salida_2
  };
}