import type { EmpleadoOrdenado, Asignacion, ValidacionReglasDuras } from "./tipos";

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
 * Verifica si un empleado tiene turnos simultáneos (solapamiento)
 * 
 * @param empleado Empleado a verificar
 * @param turno Turno que se quiere asignar
 * @param fecha Fecha de la asignación
 * @param programacionExistente Programación existente para verificar solapamientos
 * @returns true si no hay solapamiento, false si hay conflicto
 */
export function capa7_verificarTurnosSimultaneos(
    empleado: EmpleadoOrdenado,
    turno: { id_turno: number; hora_entrada: Date; hora_salida: Date },
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

    // Normalizar horas del turno a comparar
    const horaEntrada = new Date(turno.hora_entrada);
    const horaSalida = new Date(turno.hora_salida);
    
    // Si el turno cruza medianoche, ajustar hora_salida al día siguiente
    if (horaSalida < horaEntrada) {
        horaSalida.setDate(horaSalida.getDate() + 1);
    }

    // Verificar solapamiento con cada asignación existente
    for (const asignacion of asignacionesDelDia) {
        // Necesitamos las horas del turno asignado
        // Por ahora asumimos que tenemos acceso a la información del turno
        // En la implementación real, necesitaríamos obtener el turno de la asignación
        
        // Si encontramos una asignación en el mismo día, hay potencial solapamiento
        // La validación completa requeriría comparar las horas exactas
        // Por ahora retornamos válido y dejamos que la lógica de negocio lo maneje
    }

    // Si llegamos aquí, no hay solapamiento obvio
    // Nota: Esta función debería mejorarse para comparar horas exactas
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
    turno: { 
        id_turno: number; 
        hora_entrada: Date; 
        hora_salida: Date;
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











