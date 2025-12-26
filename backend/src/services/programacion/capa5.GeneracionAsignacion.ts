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
        area: { id_area: number },
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

    activarComodinesFn?: (
        huecos: Hueco[],
        comodines: EmpleadoOrdenado[],
        empleadosAsignados: Set<number>,
        fecha: Date,
        turno: Turno,
        programacionExistente: Asignacion[],
        empleadosDisponiblesInfo: Array<{ id_empleado: number; disponible: boolean }>,
        validadorReglasDuras: any
    ) => Array<{ empleado: EmpleadoOrdenado; area: number; hueco: Hueco }>;

    empleadosYaAsignados?: Set<number>;
    programacionExistente?: Asignacion[];
    maxDiasConsecutivos?: number;
    penalizarRepeticiones?: boolean;
}

export function capa5_calcularScore(
    empleado: EmpleadoOrdenado,
    idArea: number,
    programacionHistorica: Asignacion[],
    fecha: Date
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
    for (let d = 1; d <= 3; d++) {
        const fechaAnterior = new Date(fecha);
        fechaAnterior.setDate(fecha.getDate() - d);

        const trabajoEseDia = programacionHistorica.some(p =>
            p.id_empleado === empleado.id_empleado &&
            p.id_area === idArea &&
            p.fecha.getTime() === fechaAnterior.getTime()
        );

        if (trabajoEseDia) diasConsecutivos++;
        else break;
    }

    return (
        pesoClasificacion +
        totalAsignaciones * 10 +
        repeticionesArea * 5 +
        diasConsecutivos * 50
    );
}

export function capa5_seleccionarEmpleadoParaArea(
    area: AreaPriorizada,
    empleadosDisponibles: EmpleadoDisponible[],
    turno: Turno,
    fecha: Date,
    opciones?: OpcionesAsignacion
): { empleado: EmpleadoDisponible | null; razon?: string; score?: number } {
    const empleadosYaAsignados = opciones?.empleadosYaAsignados || new Set<number>();
    const programacionExistente = opciones?.programacionExistente || [];
    const maxDiasConsecutivos = opciones?.maxDiasConsecutivos ?? 3;

    const candidatos = empleadosDisponibles.filter(empleado => {
        if (!empleado.disponible) return false;
        if (empleadosYaAsignados.has(empleado.id_empleado)) return false;

        const tieneArea = empleado.areas.length === 0 ||
            empleado.areas.some(a => a.id_area === area.id_area);
        if (!tieneArea) return false;

        return true;
    });

    if (candidatos.length === 0) {
        return {
            empleado: null,
            razon: `No hay empleados elegibles para ${area.nombre_area}`
        };
    }

    let candidatosFiltrados = candidatos;

    if (opciones?.validarReglasFn) {
        candidatosFiltrados = candidatos.filter(empleado => {
            const validacion = opciones.validarReglasFn!(
                empleado,
                { id_area: area.id_area },
                turno,
                fecha,
                programacionExistente
            );
            return validacion.valido;
        });
    }

    if (candidatosFiltrados.length === 0) {
        return {
            empleado: null,
            razon: `Ningún candidato cumple las reglas duras para ${area.nombre_area}`
        };
    }

    const candidatosFinales = candidatosFiltrados.filter(empleado => {
        let diasConsecutivos = 0;
        for (let d = 1; d <= maxDiasConsecutivos; d++) {
            const fechaAnterior = new Date(fecha);
            fechaAnterior.setDate(fecha.getDate() - d);

            const trabajoEseDia = programacionExistente.some(p =>
                p.id_empleado === empleado.id_empleado &&
                p.id_area === area.id_area &&
                p.fecha.getTime() === fechaAnterior.getTime()
            );

            if (trabajoEseDia) diasConsecutivos++;
            else break;
        }

        return diasConsecutivos < maxDiasConsecutivos;
    });

    const candidatosParaScoring = candidatosFinales.length > 0
        ? candidatosFinales
        : candidatosFiltrados;

    const candidatosConScore = candidatosParaScoring.map(empleado => ({
        empleado,
        score: capa5_calcularScore(empleado, area.id_area, programacionExistente, fecha)
    }));

    candidatosConScore.sort((a, b) => a.score - b.score);

    const ganador = candidatosConScore[0];

    return {
        empleado: ganador.empleado,
        score: ganador.score
    };
}

export function capa5_generarAsignacionesDia(
    empleadosOrdenados: EmpleadoOrdenado[],
    empleadosDisponibles: EmpleadoDisponible[],
    areasPriorizadas: AreaPriorizada[],
    maximosPorArea: Map<number, number>,
    turno: Turno,
    fecha: Date,
    opciones?: OpcionesAsignacion
): {
    asignaciones: Asignacion[];
    huecos: Hueco[];
    empleadosNoAsignados: EmpleadoDisponible[];
    advertencias: string[];
    detalles: Array<{ area: string; empleado: string; score: number }>;
} {
    const asignaciones: Asignacion[] = [];
    const empleadosAsignados = new Set<number>();
    const advertencias: string[] = [];
    const detalles: Array<{ area: string; empleado: string; score: number }> = [];
    const programacionExistente = opciones?.programacionExistente || [];

    const areasOrdenadas = [...areasPriorizadas].sort((a, b) => a.prioridad - b.prioridad);

    for (const area of areasOrdenadas) {
        const maximoRequerido = maximosPorArea.get(area.id_area) || 0;
        let asignadosEnArea = 0;

        for (let i = 0; i < maximoRequerido; i++) {
            const seleccion = capa5_seleccionarEmpleadoParaArea(
                area,
                empleadosDisponibles,
                turno,
                fecha,
                {
                    ...opciones,
                    empleadosYaAsignados: empleadosAsignados,
                    programacionExistente: [...programacionExistente, ...asignaciones]
                }
            );

            if (!seleccion.empleado) {
                advertencias.push(
                    seleccion.razon || `No se pudo asignar empleado para ${area.nombre_area}`
                );
                break;
            }

            const esPartido = !!(turno.hora_entrada_2 && turno.hora_salida_2); const periodosTurno = esPartido

                ? [
                    {
                        hora_entrada: new Date(turno.hora_entrada!),
                        hora_salida: new Date(turno.hora_salida!)
                    },

                    {
                        hora_entrada: new Date(turno.hora_entrada_2!),
                        hora_salida: new Date(turno.hora_salida_2!)
                    }
                ]

                : [
                    {
                        hora_entrada: new Date(turno.hora_entrada!),
                        hora_salida: new Date(turno.hora_salida!)
                    }
                ];

            const primeraEntrada = periodosTurno[0].hora_entrada;
            const ultimaSalida = periodosTurno[periodosTurno.length - 1].hora_salida;

            const asignacion: Asignacion = {
                id_asignacion: asignaciones.length + 1,
                id_empleado: seleccion.empleado.id_empleado,
                id_area: area.id_area,
                id_turno: turno.id_turno,
                fecha: new Date(fecha),
                hora_entrada: primeraEntrada,
                hora_salida: ultimaSalida,
                periodos: periodosTurno
            };

            asignaciones.push(asignacion);
            empleadosAsignados.add(seleccion.empleado.id_empleado);
            asignadosEnArea++;

            detalles.push({
                area: area.nombre_area,
                empleado: seleccion.empleado.nombre_completo,
                score: seleccion.score || 0
            });
        }
    }

    let huecos: Hueco[] = [];

    if (opciones?.detectarHuecosFn) {
        huecos = opciones.detectarHuecosFn(
            asignaciones,
            areasOrdenadas,
            fecha,
            maximosPorArea
        );
    } else {
        huecos = areasOrdenadas
            .map(area => {
                const requeridos = maximosPorArea.get(area.id_area) || 0;
                const asignados = asignaciones.filter(a => a.id_area === area.id_area).length;
                const deficit = requeridos - asignados;

                return {
                    id_area: area.id_area,
                    nombre_area: area.nombre_area,
                    deficit,
                    prioridad: area.prioridad,
                    trabajadores_actuales: asignados,
                    trabajadores_requeridos: requeridos
                };
            })
            .filter(h => h.deficit > 0);
    }

    const empleadosNoAsignados = empleadosDisponibles.filter(
        emp => emp.disponible && !empleadosAsignados.has(emp.id_empleado)
    );

    return {
        asignaciones,
        huecos,
        empleadosNoAsignados,
        advertencias,
        detalles
    };
}

export function capa5_generarAsignacionesConComodines(
    empleadosOrdenados: EmpleadoOrdenado[],
    empleadosDisponibles: EmpleadoDisponible[],
    areasPriorizadas: AreaPriorizada[],
    maximosPorArea: Map<number, number>,
    turno: Turno,
    fecha: Date,
    opciones?: OpcionesAsignacion
): {
    asignaciones: Asignacion[];
    huecos: Hueco[];
    comodinesActivados: number;
    empleadosNoAsignados: EmpleadoDisponible[];
    advertencias: string[];
    detalles: Array<{ area: string; empleado: string; score: number }>;
} {
    const resultado = capa5_generarAsignacionesDia(
        empleadosOrdenados,
        empleadosDisponibles,
        areasPriorizadas,
        maximosPorArea,
        turno,
        fecha,
        opciones
    );

    if (resultado.huecos.length === 0) {
        return { ...resultado, comodinesActivados: 0 };
    }

    if (opciones?.activarComodinesFn) {
        const empleadosAsignadosIds = new Set(resultado.asignaciones.map(a => a.id_empleado));

        const comodinesDisponibles = empleadosDisponibles.filter(
            emp => emp.disponible &&
                !empleadosAsignadosIds.has(emp.id_empleado) &&
                (emp.clasificacion === 'comodin' || emp.areas.length === 0)
        );

        if (comodinesDisponibles.length > 0) {
            const programacionTotal = [...(opciones?.programacionExistente || []), ...resultado.asignaciones];

            const empleadosDisponiblesInfo = comodinesDisponibles.map(e => ({
                id_empleado: e.id_empleado,
                disponible: e.disponible
            }));

            const activados = opciones.activarComodinesFn(
                resultado.huecos,
                comodinesDisponibles as any,
                empleadosAsignadosIds,
                fecha,
                turno,
                programacionTotal,
                empleadosDisponiblesInfo,
                opciones.validarReglasFn
            );

            activados.forEach(act => {
                const esPartido = !!(turno.hora_entrada_2 && turno.hora_salida_2);

                const periodosTurno = esPartido
                    ? [
                        { hora_entrada: new Date(turno.hora_entrada!), hora_salida: new Date(turno.hora_salida!) },
                        { hora_entrada: new Date(turno.hora_entrada_2!), hora_salida: new Date(turno.hora_salida_2!) }
                    ]
                    : undefined;

                const primeraEntrada = new Date(turno.hora_entrada!);
                const ultimaSalida = esPartido
                    ? new Date(turno.hora_salida_2!)
                    : new Date(turno.hora_salida!);

                const asignacion: Asignacion = {
                    id_asignacion: resultado.asignaciones.length + 1,
                    id_empleado: act.empleado.id_empleado,
                    id_area: act.area,
                    id_turno: turno.id_turno,
                    fecha: new Date(fecha),
                    hora_entrada: primeraEntrada,
                    hora_salida: ultimaSalida,
                    periodos: periodosTurno
                };

                resultado.asignaciones.push(asignacion);

                resultado.detalles.push({
                    area: act.hueco.nombre_area,
                    empleado: act.empleado.nombre_completo,
                    score: 999
                });
            });

            const nuevosHuecos = resultado.huecos.filter(h => {
                const asignados = resultado.asignaciones.filter(a => a.id_area === h.id_area).length;
                const requeridos = maximosPorArea.get(h.id_area) || 0;
                return asignados < requeridos;
            });

            return {
                asignaciones: resultado.asignaciones,
                huecos: nuevosHuecos,
                comodinesActivados: activados.length,
                empleadosNoAsignados: resultado.empleadosNoAsignados.filter(
                    emp => !activados.some(act => act.empleado.id_empleado === emp.id_empleado)
                ),
                advertencias: resultado.advertencias,
                detalles: resultado.detalles
            };
        }
    }

    return { ...resultado, comodinesActivados: 0 };
}