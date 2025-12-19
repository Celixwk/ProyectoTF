import type { EmpleadoOrdenado, Asignacion, Hueco, ValidacionReglasDuras } from "./tipos";
import { capa7_validarReglasDuras } from "./capa7.reglasDuras";

/**
 * CAPA 4: Detectar huecos en la programación
 * Identifica áreas que no tienen suficiente cobertura
 * 
 * @param programacion Programación actual (asignaciones)
 * @param areas Áreas que deben cubrirse
 * @param fecha Fecha de la programación
 * @param maximosPorArea Mapa de máximos requeridos por área
 * @returns Lista de huecos detectados
 */
export function capa4_detectarHuecos(
    programacion: Asignacion[],
    areas: Array<{ id_area: number; nombre_area: string }>,
    fecha: Date,
    maximosPorArea: Map<number, number>
): Hueco[] {
    const huecos: Hueco[] = [];

    // Contar asignaciones por área
    const asignacionesPorArea = new Map<number, number>();
    programacion.forEach(asig => {
        if (asig.fecha.getTime() === fecha.getTime()) {
            const count = asignacionesPorArea.get(asig.id_area) || 0;
            asignacionesPorArea.set(asig.id_area, count + 1);
        }
    });

    // Verificar cada área
    areas.forEach(area => {
        const trabajadoresActuales = asignacionesPorArea.get(area.id_area) || 0;
        const trabajadoresRequeridos = maximosPorArea.get(area.id_area) || 0;
        const deficit = Math.max(0, trabajadoresRequeridos - trabajadoresActuales);

        if (deficit > 0) {
            huecos.push({
                id_area: area.id_area,
                nombre_area: area.nombre_area,
                deficit,
                prioridad: 1, // Se puede mejorar con prioridad real
                trabajadores_actuales: trabajadoresActuales,
                trabajadores_requeridos: trabajadoresRequeridos
            });
        }
    });

    // Ordenar por déficit (mayor primero)
    huecos.sort((a, b) => b.deficit - a.deficit);

    return huecos;
}

/**
 * CAPA 4: Activar comodines cuando se acaban especialistas
 * Selecciona comodines disponibles para cubrir huecos
 * 
 * @param huecos Huecos detectados
 * @param comodines Lista de comodines disponibles
 * @param empleadosAsignados Empleados ya asignados (para evitar duplicados)
 * @param fecha Fecha de la asignación
 * @param turno Turno a asignar
 * @param programacionExistente Programación existente
 * @param empleadosDisponiblesInfo Información de disponibilidad de comodines
 * @returns Lista de comodines que pueden cubrir los huecos
 */
export function capa4_activarComodines(
    huecos: Hueco[],
    comodines: EmpleadoOrdenado[],
    empleadosAsignados: Set<number>,
    fecha: Date,
    turno: { id_turno: number; hora_entrada: Date; hora_salida: Date; duracion_horas?: number | null },
    programacionExistente: Asignacion[],
    empleadosDisponiblesInfo: Array<{ id_empleado: number; disponible: boolean }>
): Array<{ empleado: EmpleadoOrdenado; area: number; hueco: Hueco }> {
    const comodinesParaActivar: Array<{ empleado: EmpleadoOrdenado; area: number; hueco: Hueco }> = [];

    // Filtrar comodines disponibles y no asignados
    const comodinesDisponibles = comodines.filter(comodin => {
        // No debe estar ya asignado
        if (empleadosAsignados.has(comodin.id_empleado)) {
            return false;
        }

        // Debe estar disponible según CAPA 2
        const infoDisponible = empleadosDisponiblesInfo.find(
            info => info.id_empleado === comodin.id_empleado
        );
        if (!infoDisponible || !infoDisponible.disponible) {
            return false;
        }

        return true;
    });

    // Para cada hueco, intentar encontrar un comodín
    for (const hueco of huecos) {
        if (hueco.deficit <= 0) continue;

        // Buscar comodín que pueda cubrir este área
        for (const comodin of comodinesDisponibles) {
            // Verificar que el comodín tenga esta área permitida
            // (o que no tenga áreas definidas, lo que significa que puede trabajar en todas)
            const puedeTrabajarEnArea = comodin.areas.length === 0 ||
                comodin.areas.some(a => a.id_area === hueco.id_area);

            if (!puedeTrabajarEnArea) continue;

            // Verificar reglas duras antes de activar
            const validacion = capa7_validarReglasDuras(
                comodin,
                { id_area: hueco.id_area },
                turno,
                fecha,
                programacionExistente
            );

            if (validacion.valido) {
                comodinesParaActivar.push({
                    empleado: comodin,
                    area: hueco.id_area,
                    hueco
                });
                empleadosAsignados.add(comodin.id_empleado);
                break; // Un comodín por hueco por ahora
            }
        }
    }

    return comodinesParaActivar;
}

/**
 * CAPA 4: Activar refuerzos (futuro)
 * Por ahora retorna estructura vacía, preparado para expansión
 * 
 * @param huecos Huecos detectados
 * @param empleadosRefuerzo Lista de empleados de refuerzo
 * @returns Lista vacía por ahora
 */
export function capa4_activarRefuerzos(
    huecos: Hueco[],
    empleadosRefuerzo: EmpleadoOrdenado[]
): Array<{ empleado: EmpleadoOrdenado; area: number }> {
    // Por ahora no hay implementación de refuerzos
    // Se puede implementar en el futuro
    return [];
}











