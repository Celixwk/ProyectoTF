import type {
  EmpleadoOrdenado,
  Asignacion,
  ValidacionReglasBlandas,
  Turno
} from "./tipos";

const MS_POR_DIA = 86400000;

function toDate(v: any): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function fechaSoloDiaMs(d: Date | string): number | null {
  const dt = toDate(d);
  if (!dt) return null;
  return Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
}

export function capa8_verificarRepeticionArea(
  empleado: EmpleadoOrdenado,
  area: { id_area: number },
  fecha: Date,
  programacionExistente: Asignacion[],
  maxDias: number = 3
): { viola: boolean; diasConsecutivos: number; mensaje?: string } {
  const idEmp = empleado?.id_empleado;
  const idArea = area?.id_area;
  const fechaRefMs = fechaSoloDiaMs(fecha);

  if (!idEmp || !idArea || fechaRefMs === null) return { viola: false, diasConsecutivos: 0 };

  const fechaLimiteLookback = fechaRefMs - (30 * MS_POR_DIA);

  const historicoReciente = programacionExistente.filter(p => {
    if (!p) return false;
    const pMs = fechaSoloDiaMs(p.fecha);
    if (pMs === null) {
      console.error(`[Capa 8] Fecha inválida en asignación: ${p.id_asignacion}`);
      return false;
    }
    return p.id_empleado === idEmp && p.id_area === idArea && pMs >= fechaLimiteLookback;
  });

  let diasConsecutivos = 0;
  for (let d = 1; d <= maxDias; d++) {
    const fechaTargetMs = fechaRefMs - (d * MS_POR_DIA);
    const trabajoEseDia = historicoReciente.some(p => fechaSoloDiaMs(p.fecha) === fechaTargetMs);

    if (trabajoEseDia) diasConsecutivos++;
    else break;
  }

  if (diasConsecutivos >= maxDias) {
    return {
      viola: true,
      diasConsecutivos,
      mensaje: `Empleado ha trabajado ${diasConsecutivos} días consecutivos en esta área (máximo recomendado: ${maxDias})`
    };
  }

  return { viola: false, diasConsecutivos };
}

export function capa8_verificarUsoRefuerzos(
  empleado: EmpleadoOrdenado,
  opciones?: { evitarRefuerzos?: boolean }
): { viola: boolean; mensaje?: string } {
  if (opciones?.evitarRefuerzos === false || !empleado) return { viola: false };

  if (empleado.clasificacion === 'comodin') {
    return {
      viola: true,
      mensaje: `Se está usando un empleado con clasificación comodín (refuerzo)`
    };
  }

  return { viola: false };
}

export function capa8_verificarDescansos(
  empleado: EmpleadoOrdenado,
  fecha: Date,
  descansosProgramados?: Map<number, number[]>
): { viola: boolean; mensaje?: string } {
  const dt = toDate(fecha);
  const idEmp = empleado?.id_empleado;
  if (!descansosProgramados || !dt || !idEmp) return { viola: false };

  const descansos = descansosProgramados.get(idEmp);
  if (!descansos || descansos.length === 0) return { viola: false };

  const diaDelMes = dt.getUTCDate();
  if (descansos.includes(diaDelMes)) {
    return { viola: true, mensaje: `Empleado tiene descanso programado para este día` };
  }

  return { viola: false };
}

export function capa8_verificarDistribucionEquitativa(
  empleado: EmpleadoOrdenado,
  programacionExistente: Asignacion[],
  promedioAsignaciones: number
): { viola: boolean; mensaje?: string; diferencia?: number } {
  const idEmp = empleado?.id_empleado;
  if (!idEmp || promedioAsignaciones <= 0) return { viola: false, diferencia: 0 };

  const asignacionesEmpleado = programacionExistente.filter(p => p?.id_empleado === idEmp).length;
  const diferencia = asignacionesEmpleado - promedioAsignaciones;
  const umbral = promedioAsignaciones * 0.2;

  if (diferencia > umbral) {
    return {
      viola: true,
      diferencia,
      mensaje: `Empleado tiene ${asignacionesEmpleado} asignaciones vs promedio de ${promedioAsignaciones.toFixed(1)} (diferencia: +${diferencia.toFixed(1)})`
    };
  }

  return { viola: false, diferencia };
}

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
  if (opciones?.ignorarReglasBlandas || !empleado) return { violaciones: [], advertencias: [] };

  const violaciones: string[] = [];
  const advertencias: string[] = [];

  const repeticion = capa8_verificarRepeticionArea(empleado, area, fecha, programacionExistente, opciones?.maxDiasConsecutivos ?? 3);
  if (repeticion.viola) violaciones.push(repeticion.mensaje!);

  const refuerzos = capa8_verificarUsoRefuerzos(empleado, { evitarRefuerzos: opciones?.evitarRefuerzos });
  if (refuerzos.viola) advertencias.push(refuerzos.mensaje!);

  const descansos = capa8_verificarDescansos(empleado, fecha, opciones?.descansosProgramados);
  if (descansos.viola) advertencias.push(descansos.mensaje!);

  if (opciones?.promedioAsignaciones !== undefined) {
    const distribucion = capa8_verificarDistribucionEquitativa(empleado, programacionExistente, opciones.promedioAsignaciones);
    if (distribucion.viola) advertencias.push(distribucion.mensaje!);
  }

  return { violaciones, advertencias };
}
