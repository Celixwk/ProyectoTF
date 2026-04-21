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

export async function capa6_guardarAsignaciones(asignaciones: Asignacion[], idUsuario?: number): Promise<{ guardadas: number; errores: number }> {
  let guardadas = 0;
  let errores = 0;
  for (const asig of asignaciones) {
    try {
      await prisma.detalleProgramacion.upsert({
        where: { uq_empleado_fecha: { id_empleado: asig.id_empleado, fecha: asig.fecha } },
        update: { id_area: asig.id_area, id_turno: asig.id_turno, updated_at: new Date(), tipo_dia: "Laborado", id_usuario_registro: idUsuario, origen_registro: "Automatico", id_labor_mes: asig.id_labor_mes },
        create: { id_empleado: asig.id_empleado, fecha: asig.fecha, id_area: asig.id_area, id_turno: asig.id_turno, id_labor_mes: asig.id_labor_mes, tipo_dia: "Laborado", estado: "Activo", id_usuario_registro: idUsuario, origen_registro: "Automatico" }
      });
      guardadas++;
    } catch (error) { errores++; }
  }
  return { guardadas, errores };
}

export async function capa6_generarProgramacionDia(fecha: Date, opciones?: OpcionesGeneracion): Promise<ProgramacionDia> {
  const fechaNormalizada = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const finDia = new Date(fechaNormalizada);
  finDia.setUTCDate(fechaNormalizada.getUTCDate() + 1);

  const [empleadosBD, areasBD, turnosBD, novedades] = await Promise.all([
    prisma.empleado.findMany({
      where: { id_estado: 1, labor_mes: { some: { fecha_inicio: { lte: fechaNormalizada }, fecha_fin: { gte: fechaNormalizada }, estado: "Abierto" } } },
      include: { empleado_area: { include: { area: true } }, labor_mes: { where: { fecha_inicio: { lte: fechaNormalizada }, fecha_fin: { gte: fechaNormalizada }, estado: "Abierto" } } }
    }),
    prisma.area.findMany(),
    prisma.turno.findMany({ where: { estado: "Activo" } }),
    prisma.detalleNovedad.findMany({
      where: { fecha: { gte: fechaNormalizada, lt: finDia } },
      include: { novedad_empleado: true }
    })
  ]);

  const programacionDelMes = await prisma.detalleProgramacion.findMany({
    where: { fecha: { gte: new Date(Date.UTC(fechaNormalizada.getUTCFullYear(), fechaNormalizada.getUTCMonth(), 1)), lt: fechaNormalizada } },
    select: { id_empleado: true, id_area: true, fecha: true, id_turno: true }
  });

  const idsEnNovedad = new Set(novedades.map(n => n.novedad_empleado.id_empleado));

  const candidatos: EmpleadoDisponible[] = empleadosBD.map((emp) => ({
    id_empleado: emp.id_empleado,
    cedula: emp.cedula,
    nombre_completo: `${emp.nombre1} ${emp.apellido1 || ''}`.trim(),
    total_areas: emp.empleado_area.length,
    clasificacion: emp.empleado_area.length === 1 ? "especialista" : "flexible",
    areas: emp.empleado_area.map(ea => ({ id_area: ea.area.id_area, nombre_area: ea.area.nombre_area })),
    disponible: !idsEnNovedad.has(emp.id_empleado),
    id_labor_mes: emp.labor_mes[0]?.id_labor_mes
  }));

  const areasPriorizadas: AreaPriorizada[] = await capa3_obtenerPrioridadAreas(areasBD.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area })));
  const necesidadesPorArea = new Map<number, number>();
  areasBD.forEach(a => necesidadesPorArea.set(a.id_area, a.max_trabajadores));

  const cuposRestantesDia = new Map(necesidadesPorArea);
  const empleadosYaAsignadosHoy = new Set<number>();
  let todasLasAsignaciones: Asignacion[] = [];

  const poolTrabajo = candidatos.map(c => ({ ...c }));

  const turnosOrdenados = turnosBD.sort((a, b) => String(a.hora_entrada || "00:00").localeCompare(String(b.hora_entrada || "00:00")));

  for (const tPrisma of turnosOrdenados) {
    const areasConCupoParaTurno: AreaPriorizada[] = [];
    const maximosTemporales = new Map<number, number>();

    for (const area of areasPriorizadas) {
      if (!opciones?.configuracion) continue;
      const config = opciones.configuracion[area.id_area];
      if (!config || !config.turnosIds.includes(tPrisma.id_turno)) continue;

      const totalRequerido = necesidadesPorArea.get(area.id_area) || 0;
      const turnosHabilitadosArea = config.turnosIds;
      const indexTurnoActual = turnosHabilitadosArea.indexOf(tPrisma.id_turno);

      const basePorTurno = Math.floor(totalRequerido / turnosHabilitadosArea.length);
      const residuo = totalRequerido % turnosHabilitadosArea.length;

      let cupoParaEsteTurno = basePorTurno + (indexTurnoActual < residuo ? 1 : 0);
      const cupoRealRestanteArea = cuposRestantesDia.get(area.id_area) || 0;

      if (cupoParaEsteTurno > 0 && cupoRealRestanteArea > 0) {
        areasConCupoParaTurno.push(area);
        maximosTemporales.set(area.id_area, Math.min(cupoParaEsteTurno, cupoRealRestanteArea));
      }
    }

    if (areasConCupoParaTurno.length === 0) continue;

    const resultadoTurno = capa5_generarAsignacionesDia(
      [],
      poolTrabajo,
      areasConCupoParaTurno,
      maximosTemporales,
      tPrisma as unknown as Turno,
      fechaNormalizada,
      {
        ...opciones,
        programacionExistente: [...programacionDelMes, ...todasLasAsignaciones],
        cuposRestantes: maximosTemporales,
        empleadosYaAsignados: empleadosYaAsignadosHoy
      }
    );

    resultadoTurno.asignaciones.forEach(asig => {
      const empInfo = candidatos.find(e => e.id_empleado === asig.id_empleado);
      todasLasAsignaciones.push({
        ...asig,
        nombre_empleado: empInfo?.nombre_completo || "Desconocido",
        nombre_area: areasBD.find(a => a.id_area === asig.id_area)?.nombre_area || "Sin Área",
        codigo_turno: tPrisma.tipo_turno,
        cedula: empInfo?.cedula,
        id_labor_mes: empInfo?.id_labor_mes
      });

      const cupoActual = cuposRestantesDia.get(asig.id_area) || 0;
      cuposRestantesDia.set(asig.id_area, Math.max(0, cupoActual - 1));

      const idx = poolTrabajo.findIndex(e => e.id_empleado === asig.id_empleado);
      if (idx !== -1) {
        poolTrabajo[idx].disponible = false;
        empleadosYaAsignadosHoy.add(asig.id_empleado);
      }
    });
  }

  const alertasFinales = capa9_detectarProblemas(todasLasAsignaciones, areasPriorizadas.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area, prioridad: a.prioridad })), candidatos, necesidadesPorArea, fechaNormalizada, { maxDiasConsecutivos: opciones?.maxDiasConsecutivosArea ?? 3, empleados: candidatos, balancearHoras: opciones?.balancearHoras, maximoHorasExtras: opciones?.maximoHorasExtras });
  const respuestaBase = { fecha: fechaNormalizada, asignaciones: todasLasAsignaciones, alertas: alertasFinales, resumen: { total_asignaciones: todasLasAsignaciones.length, total_empleados: empleadosBD.length, total_areas: areasBD.length, huecos: [] } };

  if (todasLasAsignaciones.length === 0 && poolTrabajo.filter(e => e.disponible).length > 0) {
    return { ...respuestaBase, guardado: { realizado: false, razon: 'fallo_distribucion_con_personal_disponible' } };
  }

  const resultadoGuardado = await capa6_guardarAsignaciones(todasLasAsignaciones, opciones?.idUsuario);
  return { ...respuestaBase, guardado: { realizado: resultadoGuardado.guardadas > 0, ...resultadoGuardado } };
}

export async function capa6_validarPeriodo(inicio: string, fin: string) {
  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);

  const [programacion, empleadosBD, areasBD, turnosBD] = await Promise.all([
    prisma.detalleProgramacion.findMany({
      where: { fecha: { gte: fechaInicio, lte: fechaFin } },
      include: { empleado: true, area: true, turno: true }
    }),
    prisma.empleado.findMany({
      include: { empleado_area: { include: { area: true } } }
    }),
    prisma.area.findMany(),
    prisma.turno.findMany({ where: { estado: "Activo" } })
  ]);

  const areasPriorizadas = await capa3_obtenerPrioridadAreas(areasBD.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area })));
  const necesidadesPorArea = new Map<number, number>();
  areasBD.forEach(a => necesidadesPorArea.set(a.id_area, a.max_trabajadores));

  const candidatos: EmpleadoDisponible[] = empleadosBD.map((emp) => ({
    id_empleado: emp.id_empleado,
    cedula: emp.cedula,
    nombre_completo: `${emp.nombre1} ${emp.apellido1 || ''}`.trim(),
    total_areas: emp.empleado_area.length,
    clasificacion: emp.empleado_area.length === 1 ? "especialista" : "flexible",
    areas: emp.empleado_area.map(ea => ({ id_area: ea.area.id_area, nombre_area: ea.area.nombre_area })),
    disponible: true
  }));

  const alertasTotales: Array<{ fecha: string; alertas: any[] }> = [];
  let curr = new Date(fechaInicio);
  while (curr <= fechaFin) {
    const fechaISO = curr.toISOString().split('T')[0];
    const asignacionesDia = programacion.filter(p => {
      const pFecha = new Date(p.fecha);
      return pFecha.toISOString().split('T')[0] === fechaISO;
    }).map(p => ({
      id_empleado: p.id_empleado,
      id_area: p.id_area,
      id_turno: p.id_turno,
      fecha: p.fecha,
      id_labor_mes: p.id_labor_mes || 0,
      tipo_dia: p.tipo_dia as any,
      nombre_empleado: p.empleado ? `${p.empleado.nombre1} ${p.empleado.apellido1}` : 'Desconocido',
      nombre_area: p.area?.nombre_area || 'Desconocido'
    }));

    const alertas = capa9_detectarProblemas(
      asignacionesDia,
      areasPriorizadas.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area, prioridad: a.prioridad })),
      candidatos as any,
      necesidadesPorArea,
      new Date(curr)
    );

    if (alertas.length > 0) {
      alertasTotales.push({ fecha: fechaISO, alertas });
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return alertasTotales;
}