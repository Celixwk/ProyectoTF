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
    cuposRestantes?: Map<number, number>;
}

const ID_AREA_REFUERZOS = 13;

export function capa5_calcularScore(
    empleado: EmpleadoOrdenado,
    idArea: number,
    programacionHistorica: Asignacion[],
    fecha: Date,
    esFallback: boolean = false,
    penalizacion: number = 500
): number {
    const pesoClasificacion =
        empleado.clasificacion === "especialista" ? 0 :
            empleado.clasificacion === "flexible" ? 50 : 100;

    const totalAsignaciones = programacionHistorica.filter(
        p => p.id_empleado === empleado.id_empleado
    ).length;

    const repeticionesArea = programacionHistorica.filter(
        p => p.id_empleado === empleado.id_empleado && p.id_area === idArea
    ).length;

    let diasConsecutivos = 0;
    const fechaRef = new Date(fecha);
    fechaRef.setHours(0, 0, 0, 0);

    for (let d = 1; d <= 3; d++) {
        const fechaAnterior = new Date(fechaRef);
        fechaAnterior.setDate(fechaRef.getDate() - d);
        const trabajoEseDia = programacionHistorica.some(p => {
            const fP = new Date(p.fecha);
            fP.setHours(0, 0, 0, 0);
            return p.id_empleado === empleado.id_empleado &&
                p.id_area === idArea &&
                fP.getTime() === fechaAnterior.getTime();
        });
        if (trabajoEseDia) diasConsecutivos++;
        else break;
    }

    let score = pesoClasificacion +
        (totalAsignaciones * 50) +
        (repeticionesArea * 100) +
        (diasConsecutivos * 200);

    if (esFallback) score += penalizacion;

    return score;
}

export function capa5_seleccionarEmpleadoParaArea(
    area: AreaPriorizada,
    empleadosDisponibles: EmpleadoDisponible[],
    turno: Turno,
    fecha: Date,
    opciones?: OpcionesAsignacion
): { empleado: EmpleadoDisponible | null; razon?: string; score?: number; fuente?: string } {
    const empleadosYaAsignados = opciones?.empleadosYaAsignados || new Set<number>();
    const programacionExistente = opciones?.programacionExistente || [];
    const maxDiasConsecutivos = opciones?.maxDiasConsecutivos ?? 3;
    const penalizacionRefuerzo = opciones?.penalizacionRefuerzoFallback ?? 500;
    const permitirFallback = opciones?.permitirRefuerzoComoFallback !== false;

    const poolCandidatos = empleadosDisponibles.filter(e =>
        e.disponible && !empleadosYaAsignados.has(e.id_empleado)
    );

    const candidatosPrimarios = poolCandidatos.filter(e =>
        !e.areas.some(a => a.id_area === ID_AREA_REFUERZOS) &&
        (e.areas.length === 0 || e.areas.some(a => a.id_area === area.id_area))
    );

    const ejecutarFiltrosYScoring = (lista: EmpleadoDisponible[], esFallback: boolean) => {
        let filtrados = lista;

        if (opciones?.validarReglasFn) {
            filtrados = filtrados.filter(e =>
                opciones.validarReglasFn!(e, { id_area: area.id_area, nombre_area: area.nombre_area }, turno, fecha, programacionExistente).valido
            );
        }

        filtrados = filtrados.filter(e => {
            let dias = 0;
            const hoy = new Date(fecha);
            const hoyTime = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

            for (let d = 1; d <= maxDiasConsecutivos; d++) {
                const fBusqueda = new Date(hoyTime);
                fBusqueda.setUTCDate(fBusqueda.getUTCDate() - d);
                const trabajoEseDia = programacionExistente.some(p => {
                    const fAsig = new Date(p.fecha);
                    const fAsigMs = Date.UTC(fAsig.getFullYear(), fAsig.getMonth(), fAsig.getDate());
                    return p.id_empleado === e.id_empleado &&
                        p.id_area === area.id_area &&
                        fAsigMs === fBusqueda.getTime();
                });
                if (trabajoEseDia) dias++;
                else break;
            }
            return dias < maxDiasConsecutivos;
        });

        return filtrados.map(e => ({
            empleado: e,
            score: capa5_calcularScore(e, area.id_area, programacionExistente, fecha, esFallback, penalizacionRefuerzo)
        })).sort((a, b) => a.score - b.score);
    };

    const resultadoPrimario = ejecutarFiltrosYScoring(candidatosPrimarios, false);
    if (resultadoPrimario.length > 0) {
        return { empleado: resultadoPrimario[0].empleado, score: resultadoPrimario[0].score, fuente: "primario" };
    }

    const areaHabilitadaParaRefuerzo = !opciones?.areasQueUsanRefuerzo || opciones.areasQueUsanRefuerzo.has(area.id_area);
    if (permitirFallback && areaHabilitadaParaRefuerzo) {
        const candidatosRefuerzo = poolCandidatos.filter(e =>
            e.areas.some(a => a.id_area === ID_AREA_REFUERZOS)
        );
        const resultadoFallback = ejecutarFiltrosYScoring(candidatosRefuerzo, true);
        if (resultadoFallback.length > 0) {
            return { empleado: resultadoFallback[0].empleado, score: resultadoFallback[0].score, fuente: "fallback-refuerzo" };
        }
    }
    return { empleado: null, razon: `Sin candidatos para ${area.nombre_area}` };
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
    const empleadosAsignados = opciones?.empleadosYaAsignados ?? new Set<number>();
    const advertencias: string[] = [];
    const detalles: any[] = [];
    const programacionExistente = opciones?.programacionExistente || [];
    const cuposRestantes = opciones?.cuposRestantes ?? new Map(maximosPorArea);

    const areasOrdenadas = [...areasPriorizadas]
        .filter(a => a.id_area !== ID_AREA_REFUERZOS)
        .sort((a, b) => a.prioridad - b.prioridad);

    for (const area of areasOrdenadas) {
        const cuposDisponiblesArea = cuposRestantes.get(area.id_area) || 0;
        if (cuposDisponiblesArea <= 0) continue;

        for (let i = 0; i < cuposDisponiblesArea; i++) {
            const seleccion = capa5_seleccionarEmpleadoParaArea(
                area,
                empleadosDisponibles,
                turno,
                fecha,
                {
                    ...opciones,
                    empleadosYaAsignados: empleadosAsignados,
                    programacionExistente: [...programacionExistente, ...asignaciones],
                    cuposRestantes
                }
            );

            if (!seleccion.empleado) {
                advertencias.push(seleccion.razon || `Hueco en ${area.nombre_area}`);
                break;
            }

            const esPartido = !!(turno.hora_entrada_2 && turno.hora_salida_2);
            const periodosTurno = esPartido
                ? [
                    { hora_entrada: new Date(turno.hora_entrada!), hora_salida: new Date(turno.hora_salida!) },
                    { hora_entrada: new Date(turno.hora_entrada_2!), hora_salida: new Date(turno.hora_salida_2!) }
                ]
                : [{ hora_entrada: new Date(turno.hora_entrada!), hora_salida: new Date(turno.hora_salida!) }];

            const asignacion: Asignacion = {
                id_asignacion: 0,
                id_empleado: seleccion.empleado.id_empleado,
                id_area: area.id_area,
                id_turno: turno.id_turno,
                fecha: new Date(fecha),
                hora_entrada: periodosTurno[0].hora_entrada,
                hora_salida: periodosTurno[periodosTurno.length - 1].hora_salida,
                periodos: periodosTurno,
                id_labor_mes: seleccion.empleado.id_labor_mes
            };

            asignaciones.push(asignacion);
            empleadosAsignados.add(seleccion.empleado.id_empleado);
            if (opciones?.empleadosYaAsignados) opciones.empleadosYaAsignados.add(seleccion.empleado.id_empleado);

            detalles.push({
                area: area.nombre_area,
                empleado: seleccion.empleado.nombre_completo,
                score: seleccion.score || 0,
                fuente: seleccion.fuente || "desconocido"
            });

            cuposRestantes.set(area.id_area, Math.max(0, (cuposRestantes.get(area.id_area) || 0) - 1));
        }
    }

    let huecos: Hueco[] = [];
    if (opciones?.detectarHuecosFn) {
        huecos = opciones.detectarHuecosFn(asignaciones, areasOrdenadas, fecha, cuposRestantes);
    } else {
        huecos = areasOrdenadas.map(area => {
            const asig = asignaciones.filter(a => a.id_area === area.id_area).length;
            const restante = cuposRestantes.get(area.id_area) || 0;
            return {
                id_area: area.id_area,
                nombre_area: area.nombre_area,
                deficit: restante,
                prioridad: area.prioridad,
                trabajadores_actuales: asig,
                trabajadores_requeridos: asig + restante
            };
        }).filter(h => h.deficit > 0);
    }

    return { asignaciones, huecos, advertencias, detalles };
}