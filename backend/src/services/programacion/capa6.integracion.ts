import prisma from "../../prisma/cliente";
import { capa3_obtenerPrioridadAreas } from "./capa3.reglasArea";
import { capa5_generarAsignacionesDia } from "./capa5.GeneracionAsignacion";
import { capa9_detectarProblemas } from "./capa9.deteccionProblemas";
import {
  Asignacion,
  OpcionesGeneracion,
  ProgramacionDia,
  EmpleadoDisponible,
  AreaPriorizada,
  Turno
} from "./tipos";

export async function capa6_guardarAsignaciones(asignaciones: Asignacion[]): Promise<{ guardadas: number; errores: number }> {
  let guardadas = 0;
  let errores = 0;

  try {
    await prisma.$transaction(
      asignaciones.map((asig) =>
        prisma.detalleProgramacion.upsert({
          where: {
            uq_empleado_fecha: {
              id_empleado: asig.id_empleado,
              fecha: asig.fecha
            }
          },
          update: {
            id_area: asig.id_area,
            id_turno: asig.id_turno,
            updated_at: new Date(),
            tipo_dia: "Laborado"
          },
          create: {
            id_empleado: asig.id_empleado,
            fecha: asig.fecha,
            id_area: asig.id_area,
            id_turno: asig.id_turno,
            tipo_dia: "Laborado",
            estado: "Activo"
          },
        })
      )
    );
    guardadas = asignaciones.length;
  } catch (error) {
    console.error("❌ Error en persistencia Capa 6:", error);
    errores = asignaciones.length;
  }
  return { guardadas, errores };
}

export async function capa6_generarProgramacionDia(fecha: Date, opciones?: OpcionesGeneracion): Promise<ProgramacionDia> {
  const fechaNormalizada = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));

  const [empleadosBD, areasBD, turnosBD] = await Promise.all([
    prisma.empleado.findMany({
      where: { id_estado: 1 },
      include: { empleado_area: { include: { area: true } } }
    }),
    prisma.area.findMany(),
    prisma.turno.findMany({ where: { estado: "Activo" } })
  ]);

  const candidatos: EmpleadoDisponible[] = empleadosBD.map((emp) => ({
    id_empleado: emp.id_empleado,
    cedula: emp.cedula,
    nombre_completo: `${emp.nombre1} ${emp.apellido1 || ''}`.trim(),
    total_areas: emp.empleado_area.length,
    clasificacion: emp.empleado_area.length === 1 ? "especialista" : "flexible",
    areas: emp.empleado_area.map(ea => ({ id_area: ea.area.id_area, nombre_area: ea.area.nombre_area })),
    disponible: true
  }));

  const areasPriorizadas: AreaPriorizada[] = await capa3_obtenerPrioridadAreas(
    areasBD.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area }))
  );

  const necesidadesPorArea = new Map<number, number>();
  areasBD.forEach(a => necesidadesPorArea.set(a.id_area, 2));

  let todasLasAsignaciones: Asignacion[] = [];
  const poolTrabajo = [...candidatos];

  const turnosAProcesar = turnosBD.filter(t => [5, 6].includes(t.id_turno));

  for (const tPrisma of turnosAProcesar) {
    const resultadoTurno = capa5_generarAsignacionesDia(
      [],
      poolTrabajo,
      areasPriorizadas,
      necesidadesPorArea,
      tPrisma as unknown as Turno,
      fechaNormalizada,
      { ...opciones, programacionExistente: todasLasAsignaciones }
    );

    resultadoTurno.asignaciones.forEach(asig => {
      const empInfo = candidatos.find(e => e.id_empleado === asig.id_empleado);
      const areaInfo = areasBD.find(a => a.id_area === asig.id_area);

      todasLasAsignaciones.push({
        ...asig,
        nombre_empleado: empInfo?.nombre_completo || "Desconocido",
        nombre_area: areaInfo?.nombre_area || "Sin Área",
        codigo_turno: tPrisma.tipo_turno,
        cedula: empInfo?.cedula
      });

      const idx = poolTrabajo.findIndex(e => e.id_empleado === asig.id_empleado);
      if (idx !== -1) poolTrabajo[idx].disponible = false;
    });
  }

  const alertasFinales = capa9_detectarProblemas(
    todasLasAsignaciones,
    areasPriorizadas.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area, prioridad: a.prioridad })),
    candidatos,
    necesidadesPorArea,
    fechaNormalizada,
    {
      maxDiasConsecutivos: opciones?.maxDiasConsecutivosArea ?? 3,
      descansosRequeridos: opciones?.descansosRequeridos,
      empleados: candidatos.map(c => ({
        id_empleado: c.id_empleado,
        nombre_completo: c.nombre_completo,
        cedula: c.cedula,
        total_areas: c.total_areas,
        clasificacion: c.clasificacion,
        areas: c.areas
      }))
    }
  );

  const hayErroresCriticos = alertasFinales.some(a => a.tipo === 'error');

  const respuestaBase = {
    fecha: fechaNormalizada,
    asignaciones: todasLasAsignaciones,
    alertas: alertasFinales,
    resumen: {
      total_asignaciones: todasLasAsignaciones.length,
      total_empleados: empleadosBD.length,
      total_areas: areasBD.length,
      huecos: []
    }
  };

  if (hayErroresCriticos || todasLasAsignaciones.length === 0) {
    return {
      ...respuestaBase,
      guardado: {
        realizado: false,
        razon: hayErroresCriticos ? 'alertas_criticas' : 'sin_asignaciones'
      }
    };
  }

  const resultadoGuardado = await capa6_guardarAsignaciones(todasLasAsignaciones);

  return {
    ...respuestaBase,
    guardado: {
      realizado: resultadoGuardado.errores === 0,
      ...resultadoGuardado
    }
  };
}