import type {
    EmpleadoOrdenado,
    EmpleadoDisponible,
    AreaPriorizada,
    Asignacion,
    Turno,
    ValidacionReglasDuras,
    Hueco
} from "./tipos";

interface OpcionesAsignacion {
    validarReglasFn?: (
        empleado: EmpleadoOrdenado,
        area: { id_area: number; nombre_area: string },
        turno: Turno,
        fecha: Date,
        programacionExistente: Asignacion[]
    ) => ValidacionReglasDuras;
    detectarHuecosFn?: (
        programacion: Asignacion[],
        areas: Array<{ id_area: number; nombre_area: string; prioridad?: number }>,
        fecha: Date,
        maximosPorArea: Map<number, number>
    ) => Hueco[];
    empleadosYaAsignados?: Set<number>;
    programacionExistente?: Asignacion[];
    maxDiasConsecutivos?: number;
    penalizacionRefuerzoFallback?: number;
    permitirRefuerzoComoFallback?: boolean;
    areasQueUsanRefuerzo?: Set<number>;
}

const ID_AREA_REFUERZOS = 13;

export function capa5_calcularScore(
    empleado: EmpleadoDisponible,
    idAreaObjetivo: number,
    programacionHistorica: Asignacion[],
    fecha: Date,
    penalizacionExtra: number = 0
): number {
    const esAptoParaArea = empleado.areas.some(a => a.id_area === idAreaObjetivo);

    let score = empleado.clasificacion === "especialista" ? 0 :
        empleado.clasificacion === "flexible" ? 50 : 100;

    if (!esAptoParaArea) score += 300;

    const totalAsignaciones = programacionHistorica.filter(
        p => p.id_empleado === empleado.id_empleado
    ).length;

    const repeticionesArea = programacionHistorica.filter(
        p => p.id_empleado === empleado.id_empleado && p.id_area === idAreaObjetivo
    ).length;

    let diasConsecutivos = 0;
    const hoyMs = Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());

    for (let d = 1; d <= 3; d++) {
        const targetMs = hoyMs - (d * 86400000);
        const trabajo = programacionHistorica.some(p => {
            const fP = new Date(p.fecha);
            return p.id_empleado === empleado.id_empleado && p.id_area === idAreaObjetivo &&
                Date.UTC(fP.getUTCFullYear(), fP.getUTCMonth(), fP.getUTCDate()) === targetMs;
        });
        if (trabajo) diasConsecutivos++; else break;
    }

    return score + (totalAsignaciones * 5) + (repeticionesArea * 10) + (diasConsecutivos * 100) + penalizacionExtra;
}

export function capa5_seleccionarEmpleadoParaArea(
    area: AreaPriorizada,
    poolDisponibles: EmpleadoDisponible[],
    turno: Turno,
    fecha: Date,
    opciones?: OpcionesAsignacion
): { empleado: EmpleadoDisponible | null; razon?: string; score?: number; fuente?: string } {
    const yaAsignados = opciones?.empleadosYaAsignados || new Set<number>();
    const historico = opciones?.programacionExistente || [];
    const maxDiasConsecutivos = opciones?.maxDiasConsecutivos ?? 3;

    const candidatosDisponibles = poolDisponibles.filter(e => !yaAsignados.has(e.id_empleado) && e.disponible);

    let aptos = candidatosDisponibles;
    if (opciones?.validarReglasFn) {
        aptos = aptos.filter(e =>
            opciones.validarReglasFn!(e, area, turno, fecha, historico).valido
        );
    }

    aptos = aptos.filter(e => {
        let dias = 0;
        const hoyMs = Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate());
        for (let d = 1; d <= maxDiasConsecutivos; d++) {
            const targetMs = hoyMs - (d * 86400000);
            const trabajo = historico.some(p => {
                const f = new Date(p.fecha);
                return p.id_empleado === e.id_empleado && p.id_area === area.id_area &&
                    Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), f.getUTCDate()) === targetMs;
            });
            if (trabajo) dias++; else break;
        }
        return dias < maxDiasConsecutivos;
    });

    if (aptos.length === 0) return { empleado: null, razon: `Sin personal para ${area.nombre_area}` };

    const nivel1 = aptos.filter(e => e.areas.some(a => a.id_area === area.id_area));
    if (nivel1.length > 0) {
        const mejor = nivel1.map(e => ({ e, s: capa5_calcularScore(e, area.id_area, historico, fecha) }))
            .sort((a, b) => a.s - b.s)[0];
        return { empleado: mejor.e, score: mejor.s, fuente: "específico" };
    }

    const nivel2 = aptos.filter(e => e.areas.some(a => a.id_area === ID_AREA_REFUERZOS));
    if (nivel2.length > 0) {
        const mejor = nivel2.map(e => ({ e, s: capa5_calcularScore(e, area.id_area, historico, fecha, 100) }))
            .sort((a, b) => a.s - b.s)[0];
        return { empleado: mejor.e, score: mejor.s, fuente: "refuerzo" };
    }

    const mejorEmergencia = aptos.map(e => ({ e, s: capa5_calcularScore(e, area.id_area, historico, fecha, 500) }))
        .sort((a, b) => a.s - b.s)[0];

    return { empleado: mejorEmergencia.e, score: mejorEmergencia.s, fuente: "emergencia" };
}

export function capa5_generarAsignacionesDia(
    empleadosOrdenados: EmpleadoOrdenado[],
    empleadosDisponibles: EmpleadoDisponible[],
    areasPriorizadas: AreaPriorizada[],
    maximosPorArea: Map<number, number>,
    turno: Turno,
    fecha: Date,
    opciones?: OpcionesAsignacion
) {
    const asignaciones: Asignacion[] = [];
    const idsAsignados = new Set<number>(opciones?.empleadosYaAsignados || []);
    const detalles: Array<{ area: string; empleado: string; score: number; fuente: string }> = [];
    const advertencias: string[] = [];
    const programacionExistente = opciones?.programacionExistente || [];

    for (const area of areasPriorizadas) {
        const cupos = maximosPorArea.get(area.id_area) || 0;

        for (let i = 0; i < cupos; i++) {
            const seleccion = capa5_seleccionarEmpleadoParaArea(
                area,
                empleadosDisponibles,
                turno,
                fecha,
                { ...opciones, empleadosYaAsignados: idsAsignados, programacionExistente: [...programacionExistente, ...asignaciones] }
            );

            if (seleccion.empleado) {
                const h1 = turno.hora_entrada ? new Date(turno.hora_entrada) : new Date();
                const s1 = turno.hora_salida ? new Date(turno.hora_salida) : new Date();

                const nuevaAsig: Asignacion = {
                    id_asignacion: asignaciones.length + 1,
                    id_empleado: seleccion.empleado.id_empleado,
                    id_area: area.id_area,
                    id_turno: turno.id_turno,
                    fecha: new Date(fecha),
                    hora_entrada: h1,
                    hora_salida: turno.hora_salida_2 ? new Date(turno.hora_salida_2) : s1,
                    periodos: turno.hora_entrada_2
                        ? [{ hora_entrada: h1, hora_salida: s1 }, { hora_entrada: new Date(turno.hora_entrada_2), hora_salida: new Date(turno.hora_salida_2!) }]
                        : [{ hora_entrada: h1, hora_salida: s1 }]
                };

                asignaciones.push(nuevaAsig);
                idsAsignados.add(seleccion.empleado.id_empleado);
                detalles.push({
                    area: area.nombre_area,
                    empleado: seleccion.empleado.nombre_completo,
                    score: seleccion.score || 0,
                    fuente: seleccion.fuente || "proceso"
                });
            } else {
                advertencias.push(seleccion.razon || `Hueco en ${area.nombre_area}`);
                break;
            }
        }
    }

    const huecos: Hueco[] = areasPriorizadas.map(area => {
        const req = maximosPorArea.get(area.id_area) || 0;
        const actual = asignaciones.filter(a => a.id_area === area.id_area).length;
        return { id_area: area.id_area, nombre_area: area.nombre_area, deficit: req - actual, prioridad: area.prioridad, trabajadores_actuales: actual, trabajadores_requeridos: req };
    }).filter(h => h.deficit > 0);

    return {
        asignaciones,
        huecos,
        empleadosNoAsignados: empleadosDisponibles.filter(e => e.disponible && !idsAsignados.has(e.id_empleado)),
        advertencias,
        detalles
    };
}