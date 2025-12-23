import prisma from "../../prisma/cliente";
import type { 
  EmpleadoOrdenado,
  EmpleadoDisponible,
  AreaPriorizada,
  Asignacion,
  Turno,
  ProgramacionDia,
  OpcionesGeneracion,
  Alerta,
  PeriodoTurno
} from "./tipos";

// Importar todas las capas
import { capa1_ordenarPorEspecializacion } from "./capa1.especializacion";
import { capa2_filtrarDisponibles, capa2_obtenerNovedadesPorFecha } from "./capa2.disponibilidad";
import { capa3_obtenerPrioridadAreas } from "./capa3.reglasArea";
import { capa4_detectarHuecos, capa4_activarComodines } from "./capa4.gestionHuecos";
import { capa5_generarAsignacionesConComodines } from "./capa5.GeneracionAsignacion";
import { capa7_validarReglasDuras } from "./capa7.reglasDuras";
import { capa9_detectarProblemas } from "./capa9.deteccionProblemas";

/**
 * CAPA 6: Integración con vistas y base de datos
 * 
 * Orquesta todas las capas anteriores para generar y guardar programación
 */

/**
 * Convierte un turno de Prisma al formato Turno usado por las capas
 */
function convertirTurnoPrismaATurno(turnoPrisma: any, fecha: Date): Turno {
  const periodos: PeriodoTurno[] = [];
  
  // Primer período (siempre existe)
  const horaEntrada1 = new Date(fecha);
  const horaSalida1 = new Date(fecha);
  
  // Convertir Time a Date - Prisma devuelve Date objects para Time
  const horaEntradaTime = turnoPrisma.hora_entrada instanceof Date 
    ? turnoPrisma.hora_entrada 
    : new Date(`1970-01-01T${turnoPrisma.hora_entrada}`);
  const horaSalidaTime = turnoPrisma.hora_salida instanceof Date 
    ? turnoPrisma.hora_salida 
    : new Date(`1970-01-01T${turnoPrisma.hora_salida}`);
  
  horaEntrada1.setHours(
    horaEntradaTime.getHours(),
    horaEntradaTime.getMinutes(),
    horaEntradaTime.getSeconds(),
    0
  );
  
  horaSalida1.setHours(
    horaSalidaTime.getHours(),
    horaSalidaTime.getMinutes(),
    horaSalidaTime.getSeconds(),
    0
  );
  
  periodos.push({
    hora_entrada: horaEntrada1,
    hora_salida: horaSalida1
  });
  
  // Segundo período (si existe)
  if (turnoPrisma.hora_entrada_2 && turnoPrisma.hora_salida_2) {
    const horaEntrada2 = new Date(fecha);
    const horaSalida2 = new Date(fecha);
    
    const horaEntrada2Time = turnoPrisma.hora_entrada_2 instanceof Date 
      ? turnoPrisma.hora_entrada_2 
      : new Date(`1970-01-01T${turnoPrisma.hora_entrada_2}`);
    const horaSalida2Time = turnoPrisma.hora_salida_2 instanceof Date 
      ? turnoPrisma.hora_salida_2 
      : new Date(`1970-01-01T${turnoPrisma.hora_salida_2}`);
    
    horaEntrada2.setHours(
      horaEntrada2Time.getHours(),
      horaEntrada2Time.getMinutes(),
      horaEntrada2Time.getSeconds(),
      0
    );
    
    horaSalida2.setHours(
      horaSalida2Time.getHours(),
      horaSalida2Time.getMinutes(),
      horaSalida2Time.getSeconds(),
      0
    );
    
    periodos.push({
      hora_entrada: horaEntrada2,
      hora_salida: horaSalida2
    });
  }
  
  return {
    id_turno: turnoPrisma.id_turno,
    codigo: (turnoPrisma as any).codigo || `T${turnoPrisma.id_turno}`,
    hora_entrada: periodos[0].hora_entrada,
    hora_salida: periodos[periodos.length - 1].hora_salida,
    periodos,
    duracion_horas: turnoPrisma.duracion_horas ? Number(turnoPrisma.duracion_horas) : null
  };
}

/**
 * Obtiene la programación histórica para un rango de fechas
 */
async function obtenerProgramacionHistorica(
  fechaInicio: Date,
  fechaFin: Date
): Promise<Asignacion[]> {
  const asignacionesBD = await prisma.detalleProgramacion.findMany({
    where: {
      fecha: {
        gte: fechaInicio,
        lte: fechaFin
      }
    },
    include: {
      turno: true,
      area: true,
      labor_mes: {
        include: {
          empleado: true
        }
      }
    }
  });
  
  return asignacionesBD.map(det => {
    const fecha = new Date(det.fecha);
    fecha.setHours(0, 0, 0, 0);
    
    // Construir períodos del turno
    const periodos: PeriodoTurno[] = [];
    if (det.turno) {
      const horaEntrada1 = new Date(fecha);
      const horaEntradaTime = det.turno.hora_entrada instanceof Date 
        ? det.turno.hora_entrada 
        : new Date(`1970-01-01T${det.turno.hora_entrada}`);
      horaEntrada1.setHours(
        horaEntradaTime.getHours(),
        horaEntradaTime.getMinutes(),
        horaEntradaTime.getSeconds(),
        0
      );
      
      const horaSalida1 = new Date(fecha);
      const horaSalidaTime = det.turno.hora_salida instanceof Date 
        ? det.turno.hora_salida 
        : new Date(`1970-01-01T${det.turno.hora_salida}`);
      horaSalida1.setHours(
        horaSalidaTime.getHours(),
        horaSalidaTime.getMinutes(),
        horaSalidaTime.getSeconds(),
        0
      );
      
      periodos.push({ hora_entrada: horaEntrada1, hora_salida: horaSalida1 });
      
      if (det.turno.hora_entrada_2 && det.turno.hora_salida_2) {
        const horaEntrada2 = new Date(fecha);
        const horaEntrada2Time = det.turno.hora_entrada_2 instanceof Date 
          ? det.turno.hora_entrada_2 
          : new Date(`1970-01-01T${det.turno.hora_entrada_2}`);
        horaEntrada2.setHours(
          horaEntrada2Time.getHours(),
          horaEntrada2Time.getMinutes(),
          horaEntrada2Time.getSeconds(),
          0
        );
        
        const horaSalida2 = new Date(fecha);
        const horaSalida2Time = det.turno.hora_salida_2 instanceof Date 
          ? det.turno.hora_salida_2 
          : new Date(`1970-01-01T${det.turno.hora_salida_2}`);
        horaSalida2.setHours(
          horaSalida2Time.getHours(),
          horaSalida2Time.getMinutes(),
          horaSalida2Time.getSeconds(),
          0
        );
        
        periodos.push({ hora_entrada: horaEntrada2, hora_salida: horaSalida2 });
      }
    }
    
    return {
      id_asignacion: det.id_detalle_programacion,
      id_empleado: det.labor_mes.id_empleado,
      id_area: det.id_area || 0,
      id_turno: det.id_turno || 0,
      fecha,
      hora_entrada: periodos[0]?.hora_entrada,
      hora_salida: periodos[periodos.length - 1]?.hora_salida,
      periodos: periodos.length > 0 ? periodos : undefined,
      nombre_empleado: det.labor_mes.empleado ? 
        [det.labor_mes.empleado.nombre1, det.labor_mes.empleado.nombre2, 
         det.labor_mes.empleado.apellido1, det.labor_mes.empleado.apellido2]
          .filter(Boolean).join(" ") : undefined,
      nombre_area: det.area?.nombre_area,
      codigo_turno: det.turno?.codigo
    };
  });
}

/**
 * CAPA 6: Generar programación para un día específico
 * 
 * @param fecha Fecha para la cual generar la programación
 * @param opciones Opciones de generación
 * @returns Programación del día con asignaciones y alertas
 */
export async function capa6_generarProgramacionDia(
  fecha: Date,
  opciones?: OpcionesGeneracion
): Promise<ProgramacionDia> {
  // Normalizar fecha (solo día, sin hora)
  const fechaNormalizada = new Date(fecha);
  fechaNormalizada.setHours(0, 0, 0, 0);
  
  // 1. Obtener datos base de la BD
  const [empleadosBD, areasBD, turnosBD] = await Promise.all([
    prisma.empleado.findMany({
      where: { estado: true },
      include: {
        empleado_area: {
          include: {
            area: true
          }
        },
        cargo: true
      }
    }),
    prisma.area.findMany({
      orderBy: { nombre_area: 'asc' }
    }),
    prisma.turno.findMany({
      where: {
        estado: true
      },
      orderBy: { id_turno: 'asc' }
    })
  ]);
  
  if (empleadosBD.length === 0 || areasBD.length === 0 || turnosBD.length === 0) {
    throw new Error('No hay suficientes datos para generar programación (empleados, áreas o turnos)');
  }
  
  // 2. CAPA 1: Ordenar empleados por especialización
  const empleadosClasificados = await capa1_ordenarPorEspecializacion();
  
  // Convertir a formato EmpleadoOrdenado
  const empleadosOrdenados: EmpleadoOrdenado[] = empleadosBD.map(emp => {
    const nombre = [emp.nombre1, emp.nombre2, emp.apellido1, emp.apellido2]
      .filter(Boolean).join(" ");
    
    const totalAreas = emp.empleado_area.length;
    const clasificacion = totalAreas === 0 ? "comodin" :
                         totalAreas === 1 ? "especialista" : "flexible";
    
    return {
      id_empleado: emp.id_empleado,
      nombre_completo: nombre,
      cedula: emp.cedula,
      total_areas: totalAreas,
      clasificacion: clasificacion as "especialista" | "flexible" | "comodin",
      areas: emp.empleado_area.map(ea => ({
        id_area: ea.area.id_area,
        nombre_area: ea.area.nombre_area
      })),
      id_estado: emp.estado ? 1 : 0,
      cargo: emp.cargo ? {
        id_cargo: emp.cargo.id_cargo,
        nombre_cargo: emp.cargo.nombre_cargo
      } : undefined,
      activo: emp.estado
    };
  });
  
  // 3. CAPA 2: Filtrar por disponibilidad
  const empleadosDisponibles = await capa2_filtrarDisponibles(
    empleadosOrdenados,
    fechaNormalizada
  );
  
  // 4. CAPA 3: Obtener prioridad de áreas
  const areasPriorizadas = await capa3_obtenerPrioridadAreas(
    areasBD.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area }))
  );
  
  // 5. Obtener máximos por área (por defecto 5, se puede configurar)
  const maximosPorArea = new Map<number, number>();
  areasPriorizadas.forEach(area => {
    maximosPorArea.set(area.id_area, area.maximo_trabajadores || 5);
  });
  
  // 6. Obtener turno principal (por defecto el primero, se puede configurar)
  const turnoPrincipal = turnosBD[0];
  if (!turnoPrincipal) {
    throw new Error('No hay turnos disponibles');
  }
  
  const turno = convertirTurnoPrismaATurno(turnoPrincipal, fechaNormalizada);
  
  // 7. Obtener programación histórica (últimos 30 días para verificar días consecutivos)
  const fechaInicioHistoria = new Date(fechaNormalizada);
  fechaInicioHistoria.setDate(fechaInicioHistoria.getDate() - 30);
  const programacionHistorica = await obtenerProgramacionHistorica(
    fechaInicioHistoria,
    fechaNormalizada
  );
  
  // 8. CAPA 5: Generar asignaciones
  const resultado = capa5_generarAsignacionesConComodines(
    empleadosOrdenados,
    empleadosDisponibles,
    areasPriorizadas,
    maximosPorArea,
    turno,
    fechaNormalizada,
    {
      validarReglasFn: (empleado, area, turno, fecha, programacionExistente) => {
        const empleadoDisponible = empleadosDisponibles.find(
          e => e.id_empleado === empleado.id_empleado
        );
        return capa7_validarReglasDuras(
          empleado,
          area,
          turno,
          fecha,
          programacionExistente,
          empleadoDisponible
        );
      },
      detectarHuecosFn: capa4_detectarHuecos,
      activarComodinesFn: (huecos, comodines, empleadosAsignados, fecha, turno, programacionExistente, empleadosDisponiblesInfo, validadorReglasDuras) => {
        return capa4_activarComodines(
          huecos,
          comodines,
          empleadosAsignados,
          fecha,
          turno,
          programacionExistente,
          empleadosDisponiblesInfo,
          validadorReglasDuras
        );
      },
      programacionExistente: programacionHistorica,
      maxDiasConsecutivos: opciones?.maxDiasConsecutivos ?? 3,
      penalizarRepeticiones: !opciones?.rotacionForzada
    }
  );
  
  // 9. CAPA 9: Detectar problemas y generar alertas
  const alertas = capa9_detectarProblemas(
    resultado.asignaciones,
    areasPriorizadas,
    empleadosDisponibles,
    maximosPorArea,
    fechaNormalizada,
    {
      maxDiasConsecutivos: opciones?.maxDiasConsecutivos ?? 3,
      empleados: empleadosOrdenados
    }
  );
  
  // Agregar alertas de advertencias del motor
  resultado.advertencias.forEach(adv => {
    alertas.push({
      tipo: 'advertencia',
      mensaje: adv,
      codigo: 'ADVERTENCIA_MOTOR'
    });
  });
  
  // 10. Construir respuesta
  return {
    fecha: fechaNormalizada,
    asignaciones: resultado.asignaciones,
    alertas,
    resumen: {
      total_asignaciones: resultado.asignaciones.length,
      total_empleados: empleadosDisponibles.filter(e => e.disponible).length,
      total_areas: areasPriorizadas.length,
      huecos: resultado.huecos
    }
  };
}

/**
 * CAPA 6: Generar programación para un rango de fechas
 * 
 * @param fechaInicio Fecha de inicio
 * @param fechaFin Fecha de fin
 * @param opciones Opciones de generación
 * @returns Array de programaciones por día
 */
export async function capa6_generarProgramacionRango(
  fechaInicio: Date,
  fechaFin: Date,
  opciones?: OpcionesGeneracion
): Promise<ProgramacionDia[]> {
  const fechaInicioNorm = new Date(fechaInicio);
  fechaInicioNorm.setHours(0, 0, 0, 0);
  
  const fechaFinNorm = new Date(fechaFin);
  fechaFinNorm.setHours(23, 59, 59, 999);
  
  const programaciones: ProgramacionDia[] = [];
  const fechaActual = new Date(fechaInicioNorm);
  
  // Obtener programación histórica una vez para todo el rango
  const fechaInicioHistoria = new Date(fechaInicioNorm);
  fechaInicioHistoria.setDate(fechaInicioHistoria.getDate() - 30);
  const programacionHistoricaInicial = await obtenerProgramacionHistorica(
    fechaInicioHistoria,
    fechaFinNorm
  );
  
  while (fechaActual <= fechaFinNorm) {
    const programacion = await capa6_generarProgramacionDia(fechaActual, opciones);
    programaciones.push(programacion);
    
    // Avanzar al siguiente día
    fechaActual.setDate(fechaActual.getDate() + 1);
  }
  
  return programaciones;
}

/**
 * CAPA 6: Regenerar programación para un día específico
 * 
 * Elimina las asignaciones existentes del día y genera nuevas
 * 
 * @param fecha Fecha a regenerar
 * @param opciones Opciones de generación
 * @returns Programación regenerada
 */
export async function capa6_regenerarDia(
  fecha: Date,
  opciones?: OpcionesGeneracion
): Promise<ProgramacionDia> {
  const fechaNormalizada = new Date(fecha);
  fechaNormalizada.setHours(0, 0, 0, 0);
  
  // Eliminar asignaciones existentes del día
  await prisma.detalleProgramacion.deleteMany({
    where: {
      fecha: fechaNormalizada
    }
  });
  
  // Generar nueva programación
  const programacion = await capa6_generarProgramacionDia(fechaNormalizada, opciones);
  
  // Guardar automáticamente
  await capa6_guardarAsignaciones(programacion.asignaciones);
  
  return programacion;
}

/**
 * CAPA 6: Guardar asignaciones en la base de datos
 * 
 * @param asignaciones Asignaciones a guardar
 * @returns Resultado con estadísticas
 */
export async function capa6_guardarAsignaciones(
  asignaciones: Asignacion[]
): Promise<{
  guardadas: number;
  errores: number;
  detalles: Array<{ id_empleado: number; fecha: Date; exito: boolean; error?: string }>;
}> {
  const detalles: Array<{ id_empleado: number; fecha: Date; exito: boolean; error?: string }> = [];
  let guardadas = 0;
  let errores = 0;
  
  // Agrupar asignaciones por empleado para crear laborMes
  const asignacionesPorEmpleado = new Map<number, Asignacion[]>();
  asignaciones.forEach(asig => {
    if (!asignacionesPorEmpleado.has(asig.id_empleado)) {
      asignacionesPorEmpleado.set(asig.id_empleado, []);
    }
    asignacionesPorEmpleado.get(asig.id_empleado)!.push(asig);
  });
  
  // Procesar cada empleado
  for (const [idEmpleado, asignacionesEmpleado] of asignacionesPorEmpleado.entries()) {
    // Determinar rango de fechas para laborMes
    const fechas = asignacionesEmpleado.map(a => new Date(a.fecha));
    const fechaMin = new Date(Math.min(...fechas.map(f => f.getTime())));
    const fechaMax = new Date(Math.max(...fechas.map(f => f.getTime())));
    
    // Normalizar fechas (solo día)
    fechaMin.setHours(0, 0, 0, 0);
    fechaMax.setHours(23, 59, 59, 999);
    
    // Obtener o crear laborMes
    let laborMes = await prisma.laborMes.findFirst({
      where: {
        id_empleado,
        fecha_inicio: fechaMin,
        fecha_fin: fechaMax
      }
    });
    
    if (!laborMes) {
      laborMes = await prisma.laborMes.create({
        data: {
          id_empleado,
          fecha_inicio: fechaMin,
          fecha_fin: fechaMax,
          horas_mes: 0,
          estado: "Abierto"
        }
      });
    }
    
    // Guardar cada asignación
    for (const asignacion of asignacionesEmpleado) {
      try {
        const fechaAsig = new Date(asignacion.fecha);
        fechaAsig.setHours(0, 0, 0, 0);
        
        // Verificar si ya existe
        const existe = await prisma.detalleProgramacion.findFirst({
          where: {
            id_labor_mes: laborMes.id_labor_mes,
            fecha: fechaAsig
          }
        });
        
        if (existe) {
          // Actualizar existente
          await prisma.detalleProgramacion.update({
            where: {
              id_detalle_programacion: existe.id_detalle_programacion
            },
            data: {
              id_turno: asignacion.id_turno,
              id_area: asignacion.id_area,
              total_horas_laboradas: asignacion.periodos ? 
                asignacion.periodos.reduce((total, p) => {
                  const horas = (p.hora_salida.getTime() - p.hora_entrada.getTime()) / (1000 * 60 * 60);
                  return total + horas;
                }, 0) : null
            }
          });
        } else {
          // Crear nuevo
          await prisma.detalleProgramacion.create({
            data: {
              id_labor_mes: laborMes.id_labor_mes,
              fecha: fechaAsig,
              id_turno: asignacion.id_turno,
              id_area: asignacion.id_area,
              total_horas_laboradas: asignacion.periodos ? 
                asignacion.periodos.reduce((total, p) => {
                  const horas = (p.hora_salida.getTime() - p.hora_entrada.getTime()) / (1000 * 60 * 60);
                  return total + horas;
                }, 0) : null
            }
          });
        }
        
        guardadas++;
        detalles.push({
          id_empleado,
          fecha: fechaAsig,
          exito: true
        });
      } catch (error: any) {
        errores++;
        detalles.push({
          id_empleado,
          fecha: new Date(asignacion.fecha),
          exito: false,
          error: error.message || 'Error desconocido'
        });
      }
    }
  }
  
  return {
    guardadas,
    errores,
    detalles
  };
}

