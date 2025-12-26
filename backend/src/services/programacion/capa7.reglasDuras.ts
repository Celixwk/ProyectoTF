import type { EmpleadoOrdenado, Asignacion, ValidacionReglasDuras, Turno, PeriodoTurno } from "./tipos";

/**
 * Verifica si un turno excede las horas máximas permitidas
 * 
 * @param turno Turno a verificar
 * @param horasMaximas Máximo de horas permitidas (por defecto 12)
 * @returns true si es válido, false si excede
 */
export function capa7_verificarHorasMaximas(
    turno: { duracion_horas?: number | null },
    horasMaximas: number = 12
): ValidacionReglasDuras {
    if (!turno.duracion_horas) {
        // Si no tiene duración definida, asumimos que es válido
        return { valido: true };
    }

    const duracion = Number(turno.duracion_horas);
    
    if (duracion > horasMaximas) {
        return {
            valido: false,
            razon: `El turno excede las ${horasMaximas} horas máximas permitidas (${duracion} horas)`,
            codigo: 'TURNO_EXCEDE_HORAS'
        };
    }

    return { valido: true };
}

/**
 * Obtiene los períodos de un turno (soporta horarios partidos)
 */
function obtenerPeriodosTurno(turno: Turno | { hora_entrada: Date; hora_salida: Date; periodos?: PeriodoTurno[] }): PeriodoTurno[] {
    // Si tiene períodos definidos explícitamente, usarlos
    if (turno.periodos && turno.periodos.length > 0) {
        return turno.periodos;
    }
    
    // Si no, usar hora_entrada/hora_salida como único período (compatibilidad hacia atrás)
    return [{
        hora_entrada: new Date(turno.hora_entrada),
        hora_salida: new Date(turno.hora_salida)
    }];
}

/**
 * Verifica si dos períodos se solapan
 */
function haySolapamientoPeriodos(periodo1: PeriodoTurno, periodo2: PeriodoTurno): boolean {
    const entrada1 = new Date(periodo1.hora_entrada);
    const salida1 = new Date(periodo1.hora_salida);
    const entrada2 = new Date(periodo2.hora_entrada);
    const salida2 = new Date(periodo2.hora_salida);
    
    // Si el período cruza medianoche, ajustar
    if (salida1 < entrada1) {
        salida1.setDate(salida1.getDate() + 1);
    }
    if (salida2 < entrada2) {
        salida2.setDate(salida2.getDate() + 1);
    }
    
    // Verificar solapamiento: hay solapamiento si no se cumple que uno termina antes de que el otro empiece
    return !(salida1 <= entrada2 || salida2 <= entrada1);
}

/**
 * Verifica si un empleado tiene turnos simultáneos (solapamiento)
 * Soporta horarios partidos (múltiples períodos por turno)
 * 
 * @param empleado Empleado a verificar
 * @param turno Turno que se quiere asignar
 * @param fecha Fecha de la asignación
 * @param programacionExistente Programación existente para verificar solapamientos
 * @returns true si no hay solapamiento, false si hay conflicto
 */
export function capa7_verificarTurnosSimultaneos(
    empleado: EmpleadoOrdenado,
    turno: Turno | { id_turno: number; hora_entrada: Date; hora_salida: Date; periodos?: PeriodoTurno[] },
    fecha: Date,
    programacionExistente: Asignacion[]
): ValidacionReglasDuras {
    // Buscar asignaciones del mismo empleado en la misma fecha
    const asignacionesDelDia = programacionExistente.filter(
        asig => asig.id_empleado === empleado.id_empleado &&
                asig.fecha.getTime() === fecha.getTime()
    );

    if (asignacionesDelDia.length === 0) {
        return { valido: true };
    }

    // Obtener períodos del turno que se quiere asignar
    const periodosTurnoNuevo = obtenerPeriodosTurno(turno);

    // Verificar solapamiento con cada asignación existente
    for (const asignacion of asignacionesDelDia) {
        // Obtener períodos del turno asignado
        const periodosTurnoAsignado = obtenerPeriodosTurno({
            hora_entrada: asignacion.hora_entrada || new Date(0),
            hora_salida: asignacion.hora_salida || new Date(0),
            periodos: asignacion.periodos
        });

        // Comparar cada período del turno nuevo con cada período del turno asignado
        for (const periodoNuevo of periodosTurnoNuevo) {
            for (const periodoAsignado of periodosTurnoAsignado) {
                if (haySolapamientoPeriodos(periodoNuevo, periodoAsignado)) {
                    return {
                        valido: false,
                        razon: `El turno se solapa con otro turno asignado el mismo día`,
                        codigo: 'TURNOS_SOLAPADOS'
                    };
                }
            }
        }
    }

    // Si llegamos aquí, no hay solapamiento
    return { valido: true };
}

/**
 * CAPA 7: Validar reglas duras (NUNCA se pueden violar)
 * 
 * Reglas duras:
 * - ❌ Empleado incapacitado/licencia no puede trabajar
 * - ❌ No puede trabajar 2 turnos simultáneos
 * - ❌ Turno no puede exceder horas establecidas
 * 
 * @param empleado Empleado a validar
 * @param area Área (no se usa en reglas duras, pero se mantiene para consistencia)
 * @param turno Turno a asignar
 * @param fecha Fecha de la asignación
 * @param programacionExistente Programación existente para verificar conflictos
 * @param empleadoDisponible Información de disponibilidad del empleado (de CAPA 2)
 * @returns Resultado de la validación
 */
export function capa7_validarReglasDuras(
    empleado: EmpleadoOrdenado,
    area: { id_area: number },
    turno: Turno | { 
        id_turno: number; 
        hora_entrada: Date; 
        hora_salida: Date;
        periodos?: PeriodoTurno[];
        duracion_horas?: number | null;
    },
    fecha: Date,
    programacionExistente: Asignacion[],
    empleadoDisponible?: { disponible: boolean; tipoNovedad?: string }
): ValidacionReglasDuras {
    // Regla 1: Empleado debe estar disponible (no incapacitado/licencia)
    if (empleadoDisponible && !empleadoDisponible.disponible) {
        return {
            valido: false,
            razon: empleadoDisponible.tipoNovedad 
                ? `Empleado con ${empleadoDisponible.tipoNovedad} no puede trabajar`
                : 'Empleado no disponible',
            codigo: 'EMPLEADO_NO_DISPONIBLE'
        };
    }

    // Regla 2: Empleado debe estar activo
    if (empleado.id_estado !== 1) {
        return {
            valido: false,
            razon: 'Empleado inactivo no puede trabajar',
            codigo: 'EMPLEADO_INACTIVO'
        };
    }

    // Regla 3: Verificar horas máximas del turno
    const validacionHoras = capa7_verificarHorasMaximas(turno);
    if (!validacionHoras.valido) {
        return validacionHoras;
    }

    // Regla 4: Verificar turnos simultáneos
    const validacionSimultaneos = capa7_verificarTurnosSimultaneos(
        empleado,
        turno,
        fecha,
        programacionExistente
    );
    if (!validacionSimultaneos.valido) {
        return validacionSimultaneos;
    }

    // Si todas las reglas pasan, es válido
    return { valido: true };
}











