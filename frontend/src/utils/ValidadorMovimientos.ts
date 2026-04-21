export interface AsignacionValidacion {
    id_empleado: number;
    fecha: string;
    id_area: number;
    id_turno: number;
}

export interface EmpleadoInfoValidacion {
    id_empleado: number;
    nombre: string;
    areas_habilitadas: number[];
}

export const validarMovimiento = (
    idEmpleado: number,
    fechaDestino: string,
    idAreaDestino: number,
    programacionActual: { id_empleado: number; fecha: string; id_area: number; id_turno?: number }[],
    infoEmpleado?: EmpleadoInfoValidacion,
    fechaOrigen?: string,
    idAreaOrigen?: number,
    maxDiasConsecutivos: number = 3
): string[] => {
    const errores: string[] = [];
    if (idAreaDestino === -1) return errores;

    const fechaDestinoNorm = fechaDestino.split('T')[0];
    const fechaOrigenNorm = fechaOrigen?.split('T')[0];
    const esMovimientoDentroMismoDia = fechaOrigenNorm === fechaDestinoNorm;
    const nombre = infoEmpleado?.nombre || 'El empleado';


    if (infoEmpleado && idAreaOrigen !== idAreaDestino) {
        const tienePermiso = infoEmpleado.areas_habilitadas.some(areaId => Number(areaId) === Number(idAreaDestino));
        if (!tienePermiso) {
            errores.push(`⛔ PROHIBIDO: ${nombre} NO está capacitado ni autorizado para operar en esta área.`);
            return errores;
        }
    }


    if (!esMovimientoDentroMismoDia) {
        const yaTrabajaEseDia = programacionActual.some(p =>
            p.id_empleado === idEmpleado &&
            p.fecha.split('T')[0] === fechaDestinoNorm
        );

        if (yaTrabajaEseDia) {
            errores.push(`⛔ CONFLICTO: ${nombre} ya tiene un turno asignado para esta fecha.`);
            return errores;
        }
    }


    const asignacionesEnArea = programacionActual.filter(p => {
        if (p.id_empleado !== idEmpleado) return false;
        if (Number(p.id_area) !== Number(idAreaDestino)) return false;
        const fechaAsig = p.fecha.split('T')[0];

        return fechaAsig !== fechaOrigenNorm;
    });

    const fechasSet = new Set(asignacionesEnArea.map(p => p.fecha.split('T')[0]));
    fechasSet.add(fechaDestinoNorm);

    const fechasOrdenadas = Array.from(fechasSet).sort();

    let rachaActual = 1;
    let rachaQueIncluyeDestino = 1;

    for (let i = 0; i < fechasOrdenadas.length - 1; i++) {
        const actual = new Date(fechasOrdenadas[i] + 'T12:00:00Z');
        const siguiente = new Date(fechasOrdenadas[i + 1] + 'T12:00:00Z');
        const diffDays = Math.round(Math.abs(siguiente.getTime() - actual.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            rachaActual++;
            if (fechasOrdenadas[i + 1] === fechaDestinoNorm) rachaQueIncluyeDestino = rachaActual;
        } else {
            rachaActual = 1;
        }
    }

    if (rachaQueIncluyeDestino > maxDiasConsecutivos) {
        errores.push(`⛔ FATIGA: ${nombre} excedería el límite de días consecutivos (${rachaQueIncluyeDestino}/${maxDiasConsecutivos} días).`);
    }

    return errores;
};

export const validarCapacidadArea = (
    idAreaDestino: number,
    idTurnoDestino: number,
    fechaDestino: string,
    programacionActual: any[],
    maximosAreas: Map<number, number>,
    idEmpleadoMoviendo: number
): { valido: boolean; mensaje?: string } => {

    if (idAreaDestino === -1) {
        return { valido: true };
    }

    const fechaNorm = fechaDestino.split('T')[0];
    const maxPermitido = maximosAreas.get(Number(idAreaDestino)) || 0;

    const empleadosEnAreaTurnoFecha = programacionActual.filter(p =>
        Number(p.id_area) === Number(idAreaDestino) &&
        Number(p.id_turno) === Number(idTurnoDestino) &&
        p.fecha.split('T')[0] === fechaNorm &&
        p.id_empleado !== idEmpleadoMoviendo &&
        !p._eliminado
    );

    const ocupacionActual = empleadosEnAreaTurnoFecha.length;

    if (maxPermitido > 0 && ocupacionActual >= maxPermitido) {
        return {
            valido: false,
            mensaje: `⛔ AREA LLENA: Capacidad máxima alcanzada (${ocupacionActual}/${maxPermitido}). Movimiento rechazado.`
        };
    }

    return { valido: true };
};