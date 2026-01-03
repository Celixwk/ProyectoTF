import { capa4_detectarHuecos } from "./capa4.gestionHuecos";
import type { Asignacion, Alerta, EmpleadoDisponible, EmpleadoOrdenado } from "./tipos";

const MS_POR_DIA = 86400000;

const toDateSafe = (v: any) => {
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const fechaSoloDiaMsUTC = (d: any) => {
  const dt = toDateSafe(d);
  return dt ? Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()) : null;
};

export function capa9_detectarProblemas(
  programacion: Asignacion[],
  areas: Array<{ id_area: number; nombre_area: string; prioridad?: number }>,
  empleadosDisponibles: EmpleadoDisponible[],
  maximosPorArea: Map<number, number>,
  fecha: Date,
  opciones?: {
    maxDiasConsecutivos?: number;
    descansosRequeridos?: Map<number, number>;
    empleados?: EmpleadoOrdenado[];
  }
): Alerta[] {
  const alertas: Alerta[] = [];
  const corruptas: any[] = [];

  const idsAsignados = new Set(programacion.map(p => p.id_empleado));
  const sinAsignar = empleadosDisponibles.filter(e => e.disponible && !idsAsignados.has(e.id_empleado));

  if (sinAsignar.length > 0) {
    alertas.push({
      tipo: 'info',
      codigo: 'EMPLEADOS_SIN_ASIGNACION',
      mensaje: `${sinAsignar.length} empleados disponibles no recibieron turno: ${sinAsignar.map(e => e.nombre_completo).join(', ')}`,
      detalles: sinAsignar.map(e => e.id_empleado)
    });
  }

  const huecos = capa4_detectarHuecos(programacion, areas, fecha, maximosPorArea);
  huecos.forEach(h => {
    if (h.deficit > 0) {
      alertas.push({
        tipo: h.prioridad && h.prioridad <= 3 ? 'error' : 'advertencia',
        codigo: h.trabajadores_actuales === 0 ? 'AREA_SIN_PERSONAL' : 'AREA_DEFICIT_PERSONAL',
        mensaje: `Área "${h.nombre_area}" tiene déficit: ${h.trabajadores_actuales}/${h.trabajadores_requeridos}`,
        area: h.id_area,
        acciones_sugeridas: sinAsignar.length > 0 ? ['Asignar Personal Disponible'] : ['Revisar disponibilidad'],
        empleados_sugeridos: sinAsignar.slice(0, 3).map(e => ({ id: e.id_empleado, nombre: e.nombre_completo }))
      });
    }
  });

  const alertasRacha = detectarRachasUTC(programacion, opciones?.maxDiasConsecutivos ?? 3, corruptas);
  alertas.push(...alertasRacha);

  if (opciones?.descansosRequeridos && opciones?.empleados) {
    const alertasDescansos = detectarDescansosFaltantes(programacion, opciones.empleados, opciones.descansosRequeridos, fecha);
    alertas.push(...alertasDescansos);
  }

  if (corruptas.length > 0) {
    console.error(`[Capa 9] Se encontraron ${corruptas.length} registros con fechas inválidas.`);
  }

  return alertas;
}

function detectarRachasUTC(programacion: Asignacion[], max: number, corruptas: any[]): Alerta[] {
  const alertas: Alerta[] = [];
  const grupos = new Map<string, Asignacion[]>();

  programacion.forEach(a => {
    const key = `${a.id_empleado}-${a.id_area}`;
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(a);
  });

  grupos.forEach((asigs, key) => {
    const [idEmp, idArea] = key.split('-').map(Number);
    const ordenadas = asigs
      .map(a => ({ ...a, ms: fechaSoloDiaMsUTC(a.fecha) }))
      .filter(a => {
        if (!a.ms) { corruptas.push(a); return false; }
        return true;
      })
      .sort((a, b) => (a.ms as number) - (b.ms as number));

    let racha = 1;
    for (let i = 0; i < ordenadas.length - 1; i++) {
      if ((ordenadas[i + 1].ms! - ordenadas[i].ms!) === MS_POR_DIA) {
        racha++;
      } else {
        if (racha > max) {
          alertas.push(crearAlertaRacha(ordenadas[i], racha, max, idEmp, idArea));
        }
        racha = 1;
      }
    }
    if (racha > max) {
      alertas.push(crearAlertaRacha(ordenadas[ordenadas.length - 1], racha, max, idEmp, idArea));
    }
  });
  return alertas;
}

function crearAlertaRacha(asig: any, racha: number, max: number, idEmp: number, idArea: number): Alerta {
  return {
    tipo: 'advertencia',
    codigo: 'DIAS_CONSECUTIVOS_EXCEDIDOS',
    mensaje: `Empleado ${asig.nombre_empleado || idEmp} trabajó ${racha} días seguidos en ${asig.nombre_area || idArea}`,
    empleado: idEmp,
    area: idArea
  };
}

function detectarDescansosFaltantes(prog: Asignacion[], emps: EmpleadoOrdenado[], reqs: Map<number, number>, fecha: Date): Alerta[] {
  const alertas: Alerta[] = [];
  const diasMes = new Date(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, 0).getUTCDate();

  const mapeoDiasTrabajados = new Map<number, Set<number>>();
  prog.forEach(a => {
    if (!mapeoDiasTrabajados.has(a.id_empleado)) {
      mapeoDiasTrabajados.set(a.id_empleado, new Set());
    }
    const d = new Date(a.fecha);
    mapeoDiasTrabajados.get(a.id_empleado)!.add(d.getUTCDate());
  });

  emps.forEach(e => {
    const req = reqs.get(e.id_empleado);
    if (!req) return;

    const diasTrabajados = mapeoDiasTrabajados.get(e.id_empleado)?.size || 0;
    const diasLibresRestantesPosibles = diasMes - diasTrabajados;

    if (diasLibresRestantesPosibles < req) {
      alertas.push({
        tipo: 'error',
        codigo: 'DESCANSOS_FALTANTES',
        mensaje: `${e.nombre_completo}: Solo quedan ${diasLibresRestantesPosibles} días libres en el mes y requiere ${req}.`,
        empleado: e.id_empleado
      });
    }
    else if (diasTrabajados >= (diasMes * 0.5)) {
      alertas.push({
        tipo: 'info',
        codigo: 'DESCANSOS_ADVERTENCIA_PROGRESIVA',
        mensaje: `${e.nombre_completo} ha trabajado el 50% o más del mes (${diasTrabajados}/${diasMes} días).`,
        empleado: e.id_empleado
      });
    }
  });
  return alertas;
}
