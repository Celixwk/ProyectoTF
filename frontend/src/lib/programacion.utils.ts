/**
 * Utilidades para la programación de turnos
 */

export interface DiaMes {
  fecha: string; // YYYY-MM-DD
  dia: number;
  diaSemana: string;
  esDomingo: boolean;
  esFestivo: boolean;
  nombreFestivo?: string | null;
}

/**
 * Genera un array de días del mes
 * IMPORTANTE: Solo genera días del mes actual (del día 1 al último día del mes)
 * NO incluye días del mes anterior ni siguiente, independientemente del día de la semana
 */
export function generarDiasMes(
  fechaInicio: string,
  fechaFin: string,
  calendarioMap?: Map<string, { es_festivo: boolean; es_domingo: boolean; nombre_festivo: string | null }>
): DiaMes[] {
  const dias: DiaMes[] = [];
  
  // Parsear fechas directamente desde strings YYYY-MM-DD
  const [añoInicio, mesInicioStr, diaInicioStr] = fechaInicio.split('-');
  const [añoFin, mesFinStr, diaFinStr] = fechaFin.split('-');
  
  const año = parseInt(añoInicio);
  const mes = parseInt(mesInicioStr); // mes ya viene como 1-12
  const diaInicio = parseInt(diaInicioStr);
  const diaFin = parseInt(diaFinStr);
  
  // Validar que las fechas sean del mismo mes y año
  if (añoInicio !== añoFin || mesInicioStr !== mesFinStr) {
    console.error('Error: fechaInicio y fechaFin deben ser del mismo mes', { fechaInicio, fechaFin });
    return [];
  }
  
  // Validar que fechaInicio sea el día 1
  if (diaInicio !== 1) {
    console.warn('Advertencia: fechaInicio debería ser el día 1 del mes', fechaInicio);
  }
  
  // Calcular el último día del mes
  const ultimoDiaMes = diaFin;
  
  const nombresDias = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  
  // Generar días SOLO del día 1 hasta el último día del mes
  // NO importa qué día de la semana sea el día 1
  for (let dia = 1; dia <= ultimoDiaMes; dia++) {
    // Crear fecha para este día usando UTC para evitar problemas de zona horaria
    const fechaUTC = new Date(Date.UTC(año, mes - 1, dia, 12, 0, 0));
    
    // Obtener día de la semana (0 = domingo, 6 = sábado)
    const diaSemana = fechaUTC.getUTCDay();
    const fechaStr = `${año}-${mesInicioStr.padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    
    // Intentar obtener información del calendario
    const infoCalendario = calendarioMap?.get(fechaStr);
    
    // Si hay información del calendario, usarla; si no, calcular domingo como fallback
    // Asegurar conversión correcta de valores booleanos
    let esDomingo = false;
    let esFestivo = false;
    
    if (infoCalendario !== undefined) {
      // Convertir valores que pueden venir como boolean, number, o string
      // Usar type assertion para manejar diferentes tipos que pueden venir del backend
      const esDomingoValue: any = infoCalendario.es_domingo;
      const esFestivoValue: any = infoCalendario.es_festivo;
      
      // Conversión explícita y robusta de booleanos
      // Para esDomingo: true, 1, 'true', '1', o cualquier valor truthy
      esDomingo = esDomingoValue === true || esDomingoValue === 1 || esDomingoValue === 'true' || esDomingoValue === '1' || (typeof esDomingoValue === 'string' && esDomingoValue.toLowerCase() === 'true');
      
      // Para esFestivo: true, 1, 'true', '1', o cualquier valor truthy (pero NO false, 0, null, undefined)
      esFestivo = esFestivoValue === true || esFestivoValue === 1 || esFestivoValue === 'true' || esFestivoValue === '1' || (typeof esFestivoValue === 'string' && esFestivoValue.toLowerCase() === 'true');
      
      // Asegurar que sean booleanos puros
      esDomingo = Boolean(esDomingo);
      esFestivo = Boolean(esFestivo);
    } else {
      // Si no hay info del calendario, calcular domingo como fallback
      esDomingo = (diaSemana === 0);
      esFestivo = false;
    }
    
    const nombreFestivo = infoCalendario?.nombre_festivo ?? null;
    
    // Logging detallado para debugging
    if (infoCalendario) {
      if (dia <= 3 || esFestivo) {
        console.log(`📅 Fecha ${fechaStr}: es_festivo=${infoCalendario.es_festivo}, es_domingo=${infoCalendario.es_domingo}, nombre=${nombreFestivo || 'N/A'}`);
      }
    } else {
      // Si no hay info del calendario, verificar si debería haberla
      if (calendarioMap && calendarioMap.size > 0 && (dia <= 3 || diaSemana === 0)) {
        console.warn(`⚠️ No se encontró info de calendario para ${fechaStr} (calendario tiene ${calendarioMap.size} días, buscando en:`, Array.from(calendarioMap.keys()).slice(0, 5).join(', '), '...)');
      }
    }
    
    // Log para debugging del día 1 y festivos
    if (dia === 1) {
      console.log(`📅 Día 1 - Fecha: ${fechaStr}, Calendario disponible: ${calendarioMap ? 'Sí' : 'No'}, Info calendario: ${infoCalendario ? 'Sí' : 'No'}, Es domingo: ${esDomingo}, Es festivo: ${esFestivo}`);
    }
    if (esFestivo) {
      console.log(`🎉 Día festivo detectado: ${fechaStr} - ${nombreFestivo || 'Sin nombre'}`);
    }
    
    dias.push({
      fecha: fechaStr,
      dia: dia,
      diaSemana: nombresDias[diaSemana],
      esDomingo,
      esFestivo,
      nombreFestivo,
    });
  }
  
  return dias;
}

/**
 * Agrupa empleados por área según sus turnos asignados
 * IMPORTANTE: Solo muestra empleados que tengan al menos un turno asignado
 * Si no hay turnos asignados, retorna un Map vacío
 */
export function agruparEmpleadosPorArea(
  empleados: Array<{ 
    id_empleado: number; 
    nombre_completo: string; 
    areas_permitidas?: number[] | null;
    nombre_cargo?: string;
  }>,
  areas: Array<{ id_area: number; nombre_area: string }>,
  turnosAsignados?: Array<{ id_empleado: number; id_area: number; nombre_area: string }>
): Map<string, Array<{ id_empleado: number; nombre_completo: string }>> {
  const agrupados = new Map<string, Array<{ id_empleado: number; nombre_completo: string }>>();
  
  // Si no hay turnos asignados, retornar Map vacío (no mostrar empleados)
  if (!turnosAsignados || turnosAsignados.length === 0) {
    return agrupados;
  }
  
  // Crear un mapa de áreas por ID
  const mapaAreas = new Map(areas.map(a => [a.id_area, a.nombre_area]));
  
  // Crear un Set de empleados que tienen turnos asignados
  const empleadosConTurnos = new Set(turnosAsignados.map(t => t.id_empleado));
  
  // Contar frecuencia de áreas por empleado
  const frecuenciaAreas = new Map<number, Map<number, number>>();
  
  turnosAsignados.forEach(turno => {
    if (!frecuenciaAreas.has(turno.id_empleado)) {
      frecuenciaAreas.set(turno.id_empleado, new Map());
    }
    const frecuencias = frecuenciaAreas.get(turno.id_empleado)!;
    frecuencias.set(turno.id_area, (frecuencias.get(turno.id_area) || 0) + 1);
  });
  
  // Agrupar SOLO empleados que tengan turnos asignados
  empleados.forEach(empleado => {
    // Solo incluir si el empleado tiene al menos un turno asignado
    if (!empleadosConTurnos.has(empleado.id_empleado)) {
      return; // Saltar este empleado
    }
    
    const frecuencias = frecuenciaAreas.get(empleado.id_empleado);
    let areaPrincipal: number | null = null;
    let maxFrecuencia = 0;
    
    if (frecuencias) {
      frecuencias.forEach((frecuencia, idArea) => {
        if (frecuencia > maxFrecuencia) {
          maxFrecuencia = frecuencia;
          areaPrincipal = idArea;
        }
      });
    }
    
    // Si no tiene área principal de turnos, usar la primera área permitida como fallback
    if (!areaPrincipal) {
      const areasEmpleado = empleado.areas_permitidas || [];
      areaPrincipal = areasEmpleado.length > 0 ? areasEmpleado[0] : null;
    }
    
    const nombreArea = areaPrincipal 
      ? (mapaAreas.get(areaPrincipal) || `Área ${areaPrincipal}`)
      : 'Sin área';
    
    if (!agrupados.has(nombreArea)) {
      agrupados.set(nombreArea, []);
    }
    
    agrupados.get(nombreArea)!.push({
      id_empleado: empleado.id_empleado,
      nombre_completo: empleado.nombre_completo,
    });
  });
  
  return agrupados;
}

/**
 * Formatea el código del turno con el área (ej: T1 C5, T11 ST)
 */
export function formatearTurnoDisplay(turno: {
  codigo_turno: string;
  nombre_area: string;
}): string {
  // Mapear nombres de áreas a códigos cortos
  const codigosArea: Record<string, string> = {
    'Sala Principal': 'C 5',
    'Puertas y Sala': 'PTA1',
    'Baño 1': 'BÑO1',
    'Baños 3': 'BÑO3',
    'Sala Taxis': 'ST',
    'Caseta de Entrada': 'CTE',
    'Caseta de Salida': 'CTS',
    'Conduce': 'C',
    'Parqueadero 1': 'PQA1',
    'Parqueadero 2': 'PQA2',
    'Periférico Norte': 'PN',
    'Periférico Sur': 'PS',
  };
  
  const codigoArea = codigosArea[turno.nombre_area] || turno.nombre_area.substring(0, 4).toUpperCase();
  return `${turno.codigo_turno} ${codigoArea}`;
}

/**
 * Obtiene el turno asignado para un empleado en una fecha específica
 */
export function obtenerTurnoAsignado(
  idEmpleado: number,
  fecha: string,
  turnosAsignados: Array<{
    id_empleado: number;
    fecha: string;
    codigo_turno: string;
    nombre_area: string;
    id_detalle_turno?: number;
  }>
): {
  id_detalle_turno?: number;
  codigo_turno: string;
  nombre_area: string;
  display: string;
} | null {
  const turno = turnosAsignados.find(
    t => t.id_empleado === idEmpleado && t.fecha === fecha
  );
  
  if (!turno) return null;
  
  return {
    id_detalle_turno: turno.id_detalle_turno,
    codigo_turno: turno.codigo_turno,
    nombre_area: turno.nombre_area,
    display: formatearTurnoDisplay(turno),
  };
}

