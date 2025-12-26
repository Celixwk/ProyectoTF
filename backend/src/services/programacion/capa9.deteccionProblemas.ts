import type { 
  Asignacion, 
  Alerta, 
  EmpleadoDisponible,
  Hueco
} from "./tipos";
import { capa4_detectarHuecos } from "./capa4.gestionHuecos";

/**
 * CAPA 9: Detección de Problemas y Alertas
 * 
 * Analiza la programación generada y detecta problemas que requieren atención,
 * generando alertas claras y accionables para el supervisor.
 */

/**
 * Detecta áreas sin suficiente personal capacitado
 * 
 * @param programacion Programación generada
 * @param areas Áreas requeridas
 * @param maximosPorArea Máximos de trabajadores por área
 * @returns Array de alertas
 */
export function capa9_detectarFaltaPersonal(
  programacion: Asignacion[],
  areas: Array<{ id_area: number; nombre_area: string }>,
  maximosPorArea: Map<number, number>
): Alerta[] {
  const alertas: Alerta[] = [];
  
  // Contar asignaciones por área
  const asignacionesPorArea = new Map<number, number>();
  programacion.forEach(asig => {
    asignacionesPorArea.set(
      asig.id_area,
      (asignacionesPorArea.get(asig.id_area) || 0) + 1
    );
  });
  
  // Verificar cada área
  areas.forEach(area => {
    const asignados = asignacionesPorArea.get(area.id_area) || 0;
    const requeridos = maximosPorArea.get(area.id_area) || 0;
    const deficit = requeridos - asignados;
    
    if (deficit > 0) {
      if (asignados === 0) {
        // Error crítico: no hay nadie asignado
        alertas.push({
          tipo: 'error',
          mensaje: `Área "${area.nombre_area}" no tiene personal asignado (requeridos: ${requeridos})`,
          area: area.id_area,
          codigo: 'AREA_SIN_PERSONAL'
        });
      } else {
        // Advertencia: hay déficit pero se puede cubrir
        alertas.push({
          tipo: 'advertencia',
          mensaje: `Área "${area.nombre_area}" tiene déficit de personal (${asignados}/${requeridos} trabajadores)`,
          area: area.id_area,
          codigo: 'AREA_DEFICIT_PERSONAL'
        });
      }
    }
  });
  
  return alertas;
}

/**
 * Detecta empleados con más de X días consecutivos en la misma área
 * 
 * @param programacion Programación generada
 * @param maxDias Máximo de días consecutivos permitidos (por defecto 3)
 * @returns Array de alertas
 */
export function capa9_detectarDiasConsecutivos(
  programacion: Asignacion[],
  maxDias: number = 3
): Alerta[] {
  const alertas: Alerta[] = [];
  
  // Agrupar asignaciones por empleado y área
  const asignacionesPorEmpleadoArea = new Map<string, Asignacion[]>();
  
  programacion.forEach(asig => {
    const key = `${asig.id_empleado}-${asig.id_area}`;
    if (!asignacionesPorEmpleadoArea.has(key)) {
      asignacionesPorEmpleadoArea.set(key, []);
    }
    asignacionesPorEmpleadoArea.get(key)!.push(asig);
  });
  
  // Verificar cada combinación empleado-área
  asignacionesPorEmpleadoArea.forEach((asignaciones, key) => {
    // Ordenar por fecha
    const asignacionesOrdenadas = [...asignaciones].sort((a, b) => 
      a.fecha.getTime() - b.fecha.getTime()
    );
    
    // Buscar secuencias consecutivas
    let secuenciaActual: Asignacion[] = [];
    
    for (let i = 0; i < asignacionesOrdenadas.length; i++) {
      const asignacion = asignacionesOrdenadas[i];
      
      if (secuenciaActual.length === 0) {
        secuenciaActual.push(asignacion);
      } else {
        const ultimaFecha = new Date(secuenciaActual[secuenciaActual.length - 1].fecha);
        ultimaFecha.setHours(0, 0, 0, 0);
        
        const fechaActual = new Date(asignacion.fecha);
        fechaActual.setHours(0, 0, 0, 0);
        
        const diasDiferencia = Math.floor(
          (fechaActual.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (diasDiferencia === 1) {
          // Día consecutivo
          secuenciaActual.push(asignacion);
        } else {
          // Rompe la secuencia, verificar si excede el máximo
          if (secuenciaActual.length > maxDias) {
            const [idEmpleado, idArea] = key.split('-').map(Number);
            alertas.push({
              tipo: 'advertencia',
              mensaje: `Empleado ${asignaciones[0].nombre_empleado || idEmpleado} ha trabajado ${secuenciaActual.length} días consecutivos en área "${asignaciones[0].nombre_area || idArea}" (máximo recomendado: ${maxDias})`,
              empleado: idEmpleado,
              area: idArea,
              fecha: secuenciaActual[secuenciaActual.length - 1].fecha,
              codigo: 'DIAS_CONSECUTIVOS_EXCEDIDOS'
            });
          }
          // Reiniciar secuencia
          secuenciaActual = [asignacion];
        }
      }
    }
    
    // Verificar la última secuencia
    if (secuenciaActual.length > maxDias) {
      const [idEmpleado, idArea] = key.split('-').map(Number);
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Empleado ${asignaciones[0].nombre_empleado || idEmpleado} ha trabajado ${secuenciaActual.length} días consecutivos en área "${asignaciones[0].nombre_area || idArea}" (máximo recomendado: ${maxDias})`,
        empleado: idEmpleado,
        area: idArea,
        fecha: secuenciaActual[secuenciaActual.length - 1].fecha,
        codigo: 'DIAS_CONSECUTIVOS_EXCEDIDOS'
      });
    }
  });
  
  return alertas;
}

/**
 * Detecta empleados disponibles que no recibieron asignación
 * 
 * @param empleadosDisponibles Empleados que estaban disponibles
 * @param programacion Programación generada
 * @returns Array de alertas
 */
export function capa9_detectarEmpleadosSinAsignacion(
  empleadosDisponibles: EmpleadoDisponible[],
  programacion: Asignacion[]
): Alerta[] {
  const alertas: Alerta[] = [];
  
  // Obtener IDs de empleados asignados
  const empleadosAsignados = new Set(
    programacion.map(asig => asig.id_empleado)
  );
  
  // Encontrar empleados disponibles sin asignación
  const empleadosSinAsignacion = empleadosDisponibles.filter(
    emp => emp.disponible && !empleadosAsignados.has(emp.id_empleado)
  );
  
  if (empleadosSinAsignacion.length > 0) {
    if (empleadosSinAsignacion.length === 1) {
      const emp = empleadosSinAsignacion[0];
      alertas.push({
        tipo: 'info',
        mensaje: `Empleado "${emp.nombre_completo}" está disponible pero no recibió asignación`,
        empleado: emp.id_empleado,
        codigo: 'EMPLEADO_SIN_ASIGNACION'
      });
    } else {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `${empleadosSinAsignacion.length} empleados disponibles no recibieron asignación: ${empleadosSinAsignacion.map(e => e.nombre_completo).join(', ')}`,
        codigo: 'MULTIPLES_EMPLEADOS_SIN_ASIGNACION'
      });
    }
  }
  
  return alertas;
}

/**
 * Detecta si algún empleado no está cumpliendo con días de descanso
 * 
 * @param empleados Lista de empleados
 * @param programacion Programación generada
 * @param fecha Fecha de la programación
 * @param descansosRequeridos Mapa de descansos requeridos: id_empleado -> número de descansos requeridos
 * @returns Array de alertas
 */
export function capa9_detectarDescansosFaltantes(
  empleados: Array<{ id_empleado: number; nombre_completo?: string }>,
  programacion: Asignacion[],
  fecha: Date,
  descansosRequeridos?: Map<number, number>
): Alerta[] {
  const alertas: Alerta[] = [];
  
  if (!descansosRequeridos) {
    return alertas;
  }
  
  // Contar asignaciones por empleado en el mes
  const asignacionesPorEmpleado = new Map<number, number>();
  programacion.forEach(asig => {
    asignacionesPorEmpleado.set(
      asig.id_empleado,
      (asignacionesPorEmpleado.get(asig.id_empleado) || 0) + 1
    );
  });
  
  // Verificar cada empleado
  empleados.forEach(empleado => {
    const requeridos = descansosRequeridos.get(empleado.id_empleado);
    if (requeridos === undefined) {
      return; // No hay requisito de descanso para este empleado
    }
    
    const asignados = asignacionesPorEmpleado.get(empleado.id_empleado) || 0;
    const diasMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
    const descansosEsperados = diasMes - asignados;
    
    if (descansosEsperados < requeridos) {
      alertas.push({
        tipo: 'advertencia',
        mensaje: `Empleado "${empleado.nombre_completo || empleado.id_empleado}" no está cumpliendo con días de descanso requeridos (tiene ${descansosEsperados} días libres, requiere ${requeridos})`,
        empleado: empleado.id_empleado,
        fecha,
        codigo: 'DESCANSOS_FALTANTES'
      });
    }
  });
  
  return alertas;
}

/**
 * Detecta huecos en la programación usando CAPA 4
 * 
 * @param programacion Programación generada
 * @param areas Áreas requeridas
 * @param maximosPorArea Máximos de trabajadores por área
 * @param fecha Fecha de la programación
 * @returns Array de alertas
 */
export function capa9_detectarHuecos(
  programacion: Asignacion[],
  areas: Array<{ id_area: number; nombre_area: string; prioridad?: number }>,
  maximosPorArea: Map<number, number>,
  fecha: Date
): Alerta[] {
  const alertas: Alerta[] = [];
  
  const huecos = capa4_detectarHuecos(
    programacion,
    areas,
    fecha,
    maximosPorArea
  );
  
  huecos.forEach(hueco => {
    if (hueco.deficit > 0) {
      const tipoAlerta = hueco.prioridad <= 3 ? 'error' : 'advertencia';
      
      alertas.push({
        tipo: tipoAlerta,
        mensaje: `Hueco detectado en área "${hueco.nombre_area}": ${hueco.deficit} trabajador(es) faltante(s) (${hueco.trabajadores_actuales}/${hueco.trabajadores_requeridos})`,
        area: hueco.id_area,
        fecha,
        codigo: 'HUECO_DETECTADO'
      });
    }
  });
  
  return alertas;
}

/**
 * CAPA 9: Detectar problemas en la programación generada
 * 
 * Analiza la programación y genera alertas de diferentes tipos:
 * - error: Problemas críticos que requieren atención inmediata
 * - advertencia: Problemas que pueden resolverse o que requieren revisión
 * - info: Información relevante para el supervisor
 * 
 * @param programacion Programación generada
 * @param areas Áreas requeridas
 * @param empleadosDisponibles Empleados que estaban disponibles
 * @param maximosPorArea Máximos de trabajadores por área
 * @param fecha Fecha de la programación
 * @param opciones Opciones adicionales
 * @returns Array de alertas detectadas
 */
export function capa9_detectarProblemas(
  programacion: Asignacion[],
  areas: Array<{ id_area: number; nombre_area: string; prioridad?: number }>,
  empleadosDisponibles: EmpleadoDisponible[],
  maximosPorArea: Map<number, number>,
  fecha: Date,
  opciones?: {
    maxDiasConsecutivos?: number;
    descansosRequeridos?: Map<number, number>;
    empleados?: Array<{ id_empleado: number; nombre_completo?: string }>;
  }
): Alerta[] {
  const alertas: Alerta[] = [];
  
  // 1. Detectar falta de personal
  const alertasFaltaPersonal = capa9_detectarFaltaPersonal(
    programacion,
    areas,
    maximosPorArea
  );
  alertas.push(...alertasFaltaPersonal);
  
  // 2. Detectar días consecutivos excedidos
  const maxDias = opciones?.maxDiasConsecutivos ?? 3;
  const alertasDiasConsecutivos = capa9_detectarDiasConsecutivos(
    programacion,
    maxDias
  );
  alertas.push(...alertasDiasConsecutivos);
  
  // 3. Detectar empleados sin asignación
  const alertasSinAsignacion = capa9_detectarEmpleadosSinAsignacion(
    empleadosDisponibles,
    programacion
  );
  alertas.push(...alertasSinAsignacion);
  
  // 4. Detectar descansos faltantes
  if (opciones?.empleados && opciones?.descansosRequeridos) {
    const alertasDescansos = capa9_detectarDescansosFaltantes(
      opciones.empleados,
      programacion,
      fecha,
      opciones.descansosRequeridos
    );
    alertas.push(...alertasDescansos);
  }
  
  // 5. Detectar huecos
  const alertasHuecos = capa9_detectarHuecos(
    programacion,
    areas,
    maximosPorArea,
    fecha
  );
  alertas.push(...alertasHuecos);
  
  return alertas;
}







