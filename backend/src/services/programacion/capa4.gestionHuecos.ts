import type { EmpleadoOrdenado, Asignacion, Hueco } from "./tipos";

export function capa4_detectarHuecos(
  programacion: Asignacion[],
  areas: Array<{ id_area: number; nombre_area: string; prioridad?: number }>,
  fecha: Date,
  maximosPorArea: Map<number, number>
): Hueco[] {
  const asignacionesPorArea = new Map<number, number>();
  programacion.forEach(asig => {
    if (asig.fecha.getTime() === fecha.getTime()) {
      asignacionesPorArea.set(asig.id_area, (asignacionesPorArea.get(asig.id_area) || 0) + 1);
    }
  });

  const huecos: Hueco[] = areas.map(area => {
    const actuales = asignacionesPorArea.get(area.id_area) || 0;
    const requeridos = maximosPorArea.get(area.id_area) || 0;
    const deficit = Math.max(0, requeridos - actuales);
    return {
      id_area: area.id_area,
      nombre_area: area.nombre_area,
      deficit,
      prioridad: area.prioridad ?? 999,
      trabajadores_actuales: actuales,
      trabajadores_requeridos: requeridos
    };
  }).filter(h => h.deficit > 0);

  return huecos.sort((a, b) => a.prioridad - b.prioridad || b.deficit - a.deficit);
}

export function capa4_activarComodines(
  huecos: Hueco[],
  comodines: EmpleadoOrdenado[],
  empleadosAsignados: Set<number>,
  fecha: Date,
  turno: { id_turno: number; hora_entrada: Date; hora_salida: Date; duracion_horas?: number | null },
  programacionExistente: Asignacion[],
  empleadosDisponiblesInfo: Array<{ id_empleado: number; disponible: boolean }>,
  validadorReglasDuras: (
    empleado: EmpleadoOrdenado,
    area: { id_area: number },
    turno: { id_turno: number; hora_entrada: Date; hora_salida: Date; duracion_horas?: number | null },
    fecha: Date,
    programacionExistente: Asignacion[]
  ) => { valido: boolean }
): Array<{ empleado: EmpleadoOrdenado; area: number; hueco: Hueco }> {
  const comodinesParaActivar: Array<{ empleado: EmpleadoOrdenado; area: number; hueco: Hueco }> = [];

  const comodinesDisponibles = comodines.filter(comodin => {
    if (empleadosAsignados.has(comodin.id_empleado)) return false;
    const infoDisponible = empleadosDisponiblesInfo.find(info => info.id_empleado === comodin.id_empleado);
    return infoDisponible?.disponible ?? false;
  });

  for (const hueco of huecos) {
    if (hueco.deficit <= 0) continue;

    const comodinesDisponibles = comodines.filter(comodin => {
      if (empleadosAsignados.has(comodin.id_empleado)) return false;
      const infoDisponible = empleadosDisponiblesInfo.find(info => info.id_empleado === comodin.id_empleado);
      return infoDisponible?.disponible ?? false;
    });
    for (const comodin of comodinesDisponibles) {
      const puedeTrabajarEnArea = comodin.areas.length === 0 || comodin.areas.some(a => a.id_area === hueco.id_area);
      if (!puedeTrabajarEnArea) continue;
      const validacion = validadorReglasDuras(comodin, { id_area: hueco.id_area }, turno, fecha, programacionExistente);

      if (validacion.valido) {
        comodinesParaActivar.push({ empleado: comodin, area: hueco.id_area, hueco });
        empleadosAsignados.add(comodin.id_empleado);
        break; 
      }

    }

  }

  return comodinesParaActivar;
}

export function capa4_activarRefuerzos(
  huecos: Hueco[],
  empleadosRefuerzo: EmpleadoOrdenado[]
): Array<{ empleado: EmpleadoOrdenado; area: number }> {
  return [];
}
