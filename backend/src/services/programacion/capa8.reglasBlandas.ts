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
    const pMs = fechaSoloDiaMs(p.fecha);
    return p.id_empleado === idEmp && p.id_area === idArea && pMs !== null && pMs >= fechaLimiteLookback;
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
      mensaje: `El empleado ya cumplió ${diasConsecutivos} días seguidos en esta área.`
    };
  }

  return { viola: false, diasConsecutivos };
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
    return { viola: true, mensaje: `El empleado tiene este día marcado como descanso en su contrato.` };
  }

  return { viola: false };
}

export function capa8_verificarDistribucionEquitativa(
  empleado: EmpleadoOrdenado,
  programacionExistente: Asignacion[],
  promedioAsignaciones: number
): { viola: boolean; mensaje?: string } {
  const idEmp = empleado?.id_empleado;
  if (!idEmp || promedioAsignaciones <= 0) return { viola: false };

  const asignacionesEmpleado = programacionExistente.filter(p => p?.id_empleado === idEmp).length;
  const diferencia = asignacionesEmpleado - promedioAsignaciones;
  const umbral = promedioAsignaciones * 0.25;

  if (diferencia > umbral) {
    return {
      viola: true,
      mensaje: `Carga de trabajo superior al promedio (${asignacionesEmpleado} turnos vs promedio de ${promedioAsignaciones.toFixed(1)})`
    };
  }

  return { viola: false };
}

export function capa8_validarReglasBlandas(
  empleado: EmpleadoOrdenado,
  area: { id_area: number },
  turno: Turno,
  fecha: Date,
  programacionExistente: Asignacion[],
  opciones?: {
    maxDiasConsecutivos?: number;
    descansosProgramados?: Map<number, number[]>;
    promedioAsignaciones?: number;
  }
): ValidacionReglasBlandas {
  const violaciones: string[] = [];
  const advertencias: string[] = [];

  const repeticion = capa8_verificarRepeticionArea(empleado, area, fecha, programacionExistente, opciones?.maxDiasConsecutivos);
  if (repeticion.viola) violaciones.push(repeticion.mensaje!);

  const descansos = capa8_verificarDescansos(empleado, fecha, opciones?.descansosProgramados);
  if (descansos.viola) violaciones.push(descansos.mensaje!);

  if (opciones?.promedioAsignaciones) {
    const equidad = capa8_verificarDistribucionEquitativa(empleado, programacionExistente, opciones.promedioAsignaciones);
    if (equidad.viola) advertencias.push(equidad.mensaje!);
  }

  return { violaciones, advertencias };
}