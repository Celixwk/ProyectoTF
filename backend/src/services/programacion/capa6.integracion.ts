import prisma from "../../prisma/cliente";
import { capa3_obtenerPrioridadAreas } from "./capa3.reglasArea";
import { capa4_detectarHuecos } from "./capa4.gestionHuecos";
import { capa5_generarAsignacionesDia } from "./capa5.GeneracionAsignacion";
import { capa9_detectarProblemas } from "./capa9.deteccionProblemas";
import { capa7_validarReglasDuras } from "./capa7.reglasDuras";
import { capa8_validarReglasBlandas } from "./capa8.reglasBlandas";
import {
  Asignacion,
  OpcionesGeneracion,
  ProgramacionDia,
  EmpleadoDisponible,
  AreaPriorizada,
  Turno,
  EmpleadoOrdenado
} from "./tipos";

export async function capa6_guardarAsignaciones(asignaciones: Asignacion[], idUsuario?: number): Promise<{ guardadas: number; errores: number }> {
  let guardadas = 0;
  let errores = 0;
  for (const asig of asignaciones) {
    try {
      await prisma.detalleProgramacion.upsert({
        where: { uq_empleado_fecha: { id_empleado: asig.id_empleado, fecha: asig.fecha } },
        update: {
          id_area: asig.id_area,
          id_turno: asig.id_turno,
          updated_at: new Date(),
          tipo_dia: "Laborado",
          id_usuario_registro: idUsuario,
          origen_registro: "Automatico"
        },
        create: {
          id_empleado: asig.id_empleado,
          fecha: asig.fecha,
          id_area: asig.id_area,
          id_turno: asig.id_turno,
          tipo_dia: "Laborado",
          estado: "Activo",
          id_usuario_registro: idUsuario,
          origen_registro: "Automatico"
        },
      });
      guardadas++;
    } catch (error) {
      errores++;
    }
  }
  return { guardadas, errores };
}

export async function capa6_generarProgramacionDia(fecha: Date, opciones?: OpcionesGeneracion): Promise<ProgramacionDia> {
  const fechaNormalizada = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));

  const [empleadosBD, areasBD, turnosBD, novedades] = await Promise.all([
    prisma.empleado.findMany({
      where: { id_estado: 1 },
      include: { empleado_area: { include: { area: true } } }
    }),
    prisma.area.findMany(),
    prisma.turno.findMany({ where: { estado: "Activo" } }),
    prisma.detalleNovedad.findMany({
      where: { fecha: fechaNormalizada },
      include: { novedad_empleado: true }
    })
  ]);

  const idsEnNovedad = new Set(novedades.map(n => n.novedad_empleado.id_empleado));

  const candidatos: EmpleadoDisponible[] = empleadosBD.map((emp) => ({
    id_empleado: emp.id_empleado,
    cedula: emp.cedula,
    nombre_completo: `${emp.nombre1} ${emp.apellido1 || ''}`.trim(),
    total_areas: emp.empleado_area.length,
    clasificacion: (emp.empleado_area.length === 1 ? "especialista" : "flexible") as any,
    areas: emp.empleado_area.map(ea => ({
      id_area: ea.area.id_area,
      nombre_area: ea.area.nombre_area
    })),
    disponible: !idsEnNovedad.has(emp.id_empleado)
  }));

  const areasPriorizadas: AreaPriorizada[] = await capa3_obtenerPrioridadAreas(
    areasBD.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area }))
  );

  const necesidadesPorArea = new Map<number, number>();
  areasBD.forEach(a => necesidadesPorArea.set(a.id_area, a.max_trabajadores));

  let todasLasAsignaciones: Asignacion[] = [];
  const empleadosYaAsignadosHoy = new Set<number>();

  for (const area of areasPriorizadas) {
    const turnosParaEstaArea = turnosBD.filter(t => {
      if (!opciones?.configuracion || !opciones.configuracion[area.id_area]) return true;
      return opciones.configuracion[area.id_area].turnosIds.includes(t.id_turno);
    });

    for (const tPrisma of turnosParaEstaArea) {
      const resultadoTurno = capa5_generarAsignacionesDia(
        candidatos as EmpleadoOrdenado[],
        candidatos,
        [area],
        necesidadesPorArea,
        tPrisma as unknown as Turno,
        fechaNormalizada,
        {
          ...opciones,
          programacionExistente: todasLasAsignaciones,
          empleadosYaAsignados: empleadosYaAsignadosHoy,
          validarReglasFn: (emp, areaObj, turno, f, prog) => {
            const dura = capa7_validarReglasDuras(emp, areaObj, turno, f, prog);
            if (!dura.valido) return dura;
            const blanda = capa8_validarReglasBlandas(emp, areaObj, turno, f, prog, {
              maxDiasConsecutivos: opciones?.maxDiasConsecutivosArea || 3
            });
            return blanda.violaciones.length > 0 ? { valido: false, razon: blanda.violaciones[0] } : { valido: true };
          }
        }
      );

      resultadoTurno.asignaciones.forEach(asig => {
        const empInfo = candidatos.find(e => e.id_empleado === asig.id_empleado);
        todasLasAsignaciones.push({
          ...asig,
          nombre_empleado: empInfo?.nombre_completo || "Desconocido",
          nombre_area: area.nombre_area,
          codigo_turno: tPrisma.tipo_turno,
          cedula: empInfo?.cedula
        });
        empleadosYaAsignadosHoy.add(asig.id_empleado);
      });
    }
  }

  return {
    fecha: fechaNormalizada,
    asignaciones: todasLasAsignaciones,
    alertas: capa9_detectarProblemas(todasLasAsignaciones, areasPriorizadas, candidatos, necesidadesPorArea, fechaNormalizada, {
      maxDiasConsecutivos: 3,
      empleados: candidatos
    }),
    resumen: {
      total_asignaciones: todasLasAsignaciones.length,
      total_empleados: empleadosBD.length,
      total_areas: areasBD.length,
      huecos: capa4_detectarHuecos(todasLasAsignaciones, areasPriorizadas, fechaNormalizada, necesidadesPorArea)
    }
  };
}