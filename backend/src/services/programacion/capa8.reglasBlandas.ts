import type { 
  EmpleadoOrdenado, 
  EmpleadoDisponible,
  Asignacion, 
  ValidacionReglasBlandas,
  Turno
} from "./tipos";

/**
 * CAPA 8: Reglas Blandas (se pueden violar, pero generan advertencias)
 * 
 * Estas reglas son recomendaciones que pueden ser ignoradas si es necesario,
 * pero el sistema debe alertar cuando se violan.
 */

/**
 * Verifica si un empleado ha trabajado días consecutivos en la misma área
 * 
 * @param empleado Empleado a verificar
 * @param area Área a verificar
 * @param fecha Fecha de la asignación propuesta
 * @param programacionExistente Programación histórica
 * @param maxDias Máximo de días consecutivos permitidos (por defecto 3)
 * @returns true si excede el máximo, false si está dentro del límite
 */
export function capa8_verificarRepeticionArea(
  empleado: EmpleadoOrdenado,
  area: { id_area: number },
  fecha: Date,
  programacionExistente: Asignacion[],
  maxDias: number = 3
): { viola: boolean; diasConsecutivos: number; mensaje?: string } {
  let diasConsecutivos = 0;
  
  // Contar días consecutivos hacia atrás
  for (let d = 1; d <= maxDias; d++) {
    const fechaAnterior = new Date(fecha);
    fechaAnterior.setDate(fecha.getDate() - d);
    fechaAnterior.setHours(0, 0, 0, 0);
    
    const trabajoEseDia = programacionExistente.some(p => {
      const fechaAsig = new Date(p.fecha);
      fechaAsig.setHours(0, 0, 0, 0);
      
      return p.id_empleado === empleado.id_empleado &&
             p.id_area === area.id_area &&
             fechaAsig.getTime() === fechaAnterior.getTime();
    });
    
    if (trabajoEseDia) {
      diasConsecutivos++;
    } else {
      break; // Si no trabajó ese día, rompe la racha
    }
  }
  
  if (diasConsecutivos >= maxDias) {
    return {
      viola: true,
      diasConsecutivos,
      mensaje: `Empleado ha trabajado ${diasConsecutivos} días consecutivos en esta área (máximo recomendado: ${maxDias})`
    };
  }
  
  return {
    viola: false,
    diasConsecutivos
  };
}

/**
 * Verifica si se está usando un empleado refuerzo cuando no debería
 * 
 * @param empleado Empleado a verificar
 * @param opciones Opciones adicionales
 * @returns true si es refuerzo y no debería usarse, false en caso contrario
 */
export function capa8_verificarUsoRefuerzos(
  empleado: EmpleadoOrdenado,
  opciones?: { evitarRefuerzos?: boolean }
): { viola: boolean; mensaje?: string } {
  // Por ahora, no hay un campo específico para identificar refuerzos
  // Se puede implementar en el futuro basándose en alguna lógica de negocio
  // Por ejemplo, empleados con clasificación especial o un campo en la BD
  
  // Si la opción está deshabilitada, no verificar
  if (opciones?.evitarRefuerzos === false) {
    return { viola: false };
  }
  
  // Por defecto, no viola (implementación futura)
  return { viola: false };
}

/**
 * Verifica si un empleado debería tener descanso en la fecha indicada
 * 
 * @param empleado Empleado a verificar
 * @param fecha Fecha a verificar
 * @param descansosProgramados Mapa de descansos: id_empleado -> [días del mes]
 * @returns true si debería tener descanso, false en caso contrario
 */
export function capa8_verificarDescansos(
  empleado: EmpleadoOrdenado,
  fecha: Date,
  descansosProgramados?: Map<number, number[]>
): { viola: boolean; mensaje?: string } {
  if (!descansosProgramados) {
    return { viola: false };
  }
  
  const descansos = descansosProgramados.get(empleado.id_empleado);
  if (!descansos || descansos.length === 0) {
    return { viola: false };
  }
  
  const diaDelMes = fecha.getDate();
  if (descansos.includes(diaDelMes)) {
    return {
      viola: true,
      mensaje: `Empleado tiene descanso programado para este día`
    };
  }
  
  return { viola: false };
}

/**
 * Verifica la distribución equitativa de asignaciones
 * 
 * @param empleado Empleado a verificar
 * @param programacionExistente Programación histórica
 * @param promedioAsignaciones Promedio de asignaciones por empleado
 * @returns true si tiene muchas más asignaciones que el promedio
 */
export function capa8_verificarDistribucionEquitativa(
  empleado: EmpleadoOrdenado,
  programacionExistente: Asignacion[],
  promedioAsignaciones: number
): { viola: boolean; mensaje?: string; diferencia?: number } {
  const asignacionesEmpleado = programacionExistente.filter(
    p => p.id_empleado === empleado.id_empleado
  ).length;
  
  const diferencia = asignacionesEmpleado - promedioAsignaciones;
  
  // Si tiene más del 20% de asignaciones adicionales que el promedio, es una violación
  const umbral = promedioAsignaciones * 0.2;
  
  if (diferencia > umbral) {
    return {
      viola: true,
      diferencia,
      mensaje: `Empleado tiene ${asignacionesEmpleado} asignaciones vs promedio de ${promedioAsignaciones.toFixed(1)} (diferencia: +${diferencia.toFixed(1)})`
    };
  }
  
  return {
    viola: false,
    diferencia
  };
}

/**
 * CAPA 8: Validar reglas blandas (se pueden violar, pero generan advertencias)
 * 
 * Reglas blandas:
 * - ⚠️ Evitar refuerzos cuando hay empleados regulares disponibles
 * - ⚠️ Evitar repetición de área varios días seguidos (máximo 3)
 * - ⚠️ Distribución equitativa de asignaciones
 * - ⚠️ Respetar descansos programados
 * 
 * @param empleado Empleado a validar
 * @param area Área a asignar
 * @param turno Turno a asignar
 * @param fecha Fecha de la asignación
 * @param programacionExistente Programación histórica
 * @param opciones Opciones adicionales
 * @returns Resultado de la validación con violaciones y advertencias
 */
export function capa8_validarReglasBlandas(
  empleado: EmpleadoOrdenado,
  area: { id_area: number },
  turno: Turno,
  fecha: Date,
  programacionExistente: Asignacion[],
  opciones?: {
    maxDiasConsecutivos?: number;
    evitarRefuerzos?: boolean;
    descansosProgramados?: Map<number, number[]>;
    ignorarReglasBlandas?: boolean;
    promedioAsignaciones?: number;
  }
): ValidacionReglasBlandas {
  const violaciones: string[] = [];
  const advertencias: string[] = [];
  
  // Si se ignoran las reglas blandas, retornar sin validaciones
  if (opciones?.ignorarReglasBlandas) {
    return { violaciones: [], advertencias: [] };
  }
  
  // Verificar repetición de área
  const maxDias = opciones?.maxDiasConsecutivos ?? 3;
  const repeticion = capa8_verificarRepeticionArea(
    empleado,
    area,
    fecha,
    programacionExistente,
    maxDias
  );
  
  if (repeticion.viola) {
    violaciones.push(repeticion.mensaje || `Repetición de área excede ${maxDias} días`);
  }
  
  // Verificar uso de refuerzos
  const refuerzos = capa8_verificarUsoRefuerzos(empleado, {
    evitarRefuerzos: opciones?.evitarRefuerzos
  });
  
  if (refuerzos.viola) {
    advertencias.push(refuerzos.mensaje || 'Se está usando un empleado refuerzo');
  }
  
  // Verificar descansos
  const descansos = capa8_verificarDescansos(
    empleado,
    fecha,
    opciones?.descansosProgramados
  );
  
  if (descansos.viola) {
    advertencias.push(descansos.mensaje || 'Empleado tiene descanso programado');
  }
  
  // Verificar distribución equitativa
  if (opciones?.promedioAsignaciones !== undefined) {
    const distribucion = capa8_verificarDistribucionEquitativa(
      empleado,
      programacionExistente,
      opciones.promedioAsignaciones
    );
    
    if (distribucion.viola) {
      advertencias.push(distribucion.mensaje || 'Distribución de asignaciones no es equitativa');
    }
  }
  
  return {
    violaciones,
    advertencias
  };
}







