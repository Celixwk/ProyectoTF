
export interface AsignacionValidacion {
    id_empleado: number;
    fecha: string;
    id_area: number;
    id_turno: number;
}

export interface EmpleadoInfoValidacion {
    id_empleado: number;
    areas_habilitadas: number[];
}

export const validarMovimiento = (
    idEmpleado: number,
    fechaDestino: string,
    idAreaDestino: number,
    programacionActual: { id_empleado: number; fecha: string; id_area: number }[],
    infoEmpleado?: EmpleadoInfoValidacion
): string[] => {
    const errores: string[] = [];

    if (idAreaDestino !== -1 && infoEmpleado) {
        const areaDestinoNum = Number(idAreaDestino);
        const tienePermiso = infoEmpleado.areas_habilitadas.some(areaId => Number(areaId) === areaDestinoNum);

        if (!tienePermiso) {
            errores.push("⛔ PROHIBIDO: El empleado NO está capacitado ni autorizado para operar en esta área.");
        }
    }

    if (idAreaDestino === -1) {
        return errores;
    }

    const asignacionesEnArea = programacionActual.filter(
        p => p.id_empleado === idEmpleado && Number(p.id_area) === Number(idAreaDestino)
    );

    const fechasSet = new Set(asignacionesEnArea.map(p => p.fecha.split('T')[0]));
    fechasSet.add(fechaDestino.split('T')[0]);

    const fechasOrdenadas = Array.from(fechasSet).sort((a, b) => {
        const dateA = new Date(a + 'T12:00:00Z');
        const dateB = new Date(b + 'T12:00:00Z');
        return dateA.getTime() - dateB.getTime();
    });

    let rachaActual = 1;
    let rachaQueIncluyeDestino = 1;

    for (let i = 0; i < fechasOrdenadas.length - 1; i++) {
        const actual = new Date(fechasOrdenadas[i] + 'T12:00:00Z');
        const siguiente = new Date(fechasOrdenadas[i + 1] + 'T12:00:00Z');

        const diffTime = Math.abs(siguiente.getTime() - actual.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            rachaActual++;
            if (fechasOrdenadas[i] === fechaDestino.split('T')[0] ||
                fechasOrdenadas[i + 1] === fechaDestino.split('T')[0]) {
                rachaQueIncluyeDestino = rachaActual;
            }
        } else {
            rachaActual = 1;
        }
    }

    if (rachaQueIncluyeDestino > 3) {
        errores.push(`⛔ REGLA ROTA: Límite de fatiga excedido. Serían ${rachaQueIncluyeDestino} días consecutivos (Máx: 3).`);
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