import type { EmpleadoOrdenado, Asignacion, ValidacionReglasDuras, Turno, PeriodoTurno, OpcionesGeneracion } from "./tipos";

const MS_POR_DIA = 86400000;

function toDate(v: any): Date | null {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

function fechaSoloDiaMs(d: Date | string): number {
    const dt = toDate(d);
    return dt ? Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()) : 0;
}

function obtenerPeriodosValidos(obj: any): PeriodoTurno[] | null {
    const raw = obj.periodos?.length > 0
        ? obj.periodos
        : [{ hora_entrada: obj.hora_entrada, hora_salida: obj.hora_salida }];

    const filtrados = raw.map((p: any) => ({
        hora_entrada: toDate(p.hora_entrada),
        hora_salida: toDate(p.hora_salida)
    })).filter((p: any) => p.hora_entrada !== null && p.hora_salida !== null);

    return filtrados.length > 0 ? filtrados : null;
}

export function capa7_verificarHorasMaximas(
    turno: { duracion_horas?: number | null },
    horasMaximas: number = 12
): ValidacionReglasDuras {
    if (!turno || turno.duracion_horas == null) return { valido: true };

    const duracion = Number(turno.duracion_horas);
    if (isNaN(duracion)) return { valido: false, razon: "Duración inválida", codigo: "DURACION_INVALIDA" };

    if (duracion > horasMaximas) {
        return {
            valido: false,
            razon: `El turno excede las ${horasMaximas} horas máximas (${duracion}h)`,
            codigo: "TURNO_EXCEDE_HORAS"
        };
    }
    return { valido: true };
}

function haySolapamientoPeriodos(p1: PeriodoTurno, p2: PeriodoTurno): boolean {
    const e1 = toDate(p1.hora_entrada)!.getTime();
    let s1 = toDate(p1.hora_salida)!.getTime();
    const e2 = toDate(p2.hora_entrada)!.getTime();
    let s2 = toDate(p2.hora_salida)!.getTime();

    if (s1 <= e1) s1 += MS_POR_DIA;
    if (s2 <= e2) s2 += MS_POR_DIA;

    return !(s1 <= e2 || s2 <= e1);
}

export function capa7_verificarTurnosSimultaneos(
    empleado: EmpleadoOrdenado,
    turno: any,
    fecha: Date,
    programacionExistente: Asignacion[]
): ValidacionReglasDuras {
    const idEmp = empleado?.id_empleado;
    if (!idEmp) return { valido: false, razon: "Empleado inválido", codigo: "EMPLEADO_INVALIDO" };

    const fechaRefMs = fechaSoloDiaMs(fecha);
    const asignacionesDelDia = programacionExistente.filter(asig =>
        asig.id_empleado === idEmp && fechaSoloDiaMs(asig.fecha) === fechaRefMs
    );

    if (asignacionesDelDia.length === 0) return { valido: true };

    const periodosNuevos = obtenerPeriodosValidos(turno);
    if (!periodosNuevos) return { valido: false, razon: "Turno sin horarios válidos", codigo: "PERIODO_INVALIDO" };

    for (const asig of asignacionesDelDia) {
        const periodosExistentes = obtenerPeriodosValidos(asig);
        if (!periodosExistentes) continue;

        for (const pNuevo of periodosNuevos) {
            for (const pExistente of periodosExistentes) {
                if (haySolapamientoPeriodos(pNuevo, pExistente)) {
                    return {
                        valido: false,
                        razon: "El empleado ya tiene un turno que se solapa con este horario",
                        codigo: "TURNOS_SOLAPADOS"
                    };
                }
            }
        }
    }

    return { valido: true };
}

export function capa7_validarReglasDuras(
    empleado: EmpleadoOrdenado & { horas_acumuladas?: number; meta_periodo?: number },
    area: { id_area: number },
    turno: any,
    fecha: Date,
    programacionExistente: Asignacion[],
    empleadoDisponible?: { disponible: boolean; tipoNovedad?: string },
    opciones?: OpcionesGeneracion
): ValidacionReglasDuras {

    if (empleadoDisponible && !empleadoDisponible.disponible) {
        return {
            valido: false,
            razon: empleadoDisponible.tipoNovedad ? `Empleado con ${empleadoDisponible.tipoNovedad} no puede trabajar` : "Empleado no disponible",
            codigo: "EMPLEADO_NO_DISPONIBLE"
        };
    }

    if (empleado.id_estado !== 1) {
        return { valido: false, razon: "Empleado inactivo", codigo: "EMPLEADO_INACTIVO" };
    }

    const vHoras = capa7_verificarHorasMaximas(turno);
    if (!vHoras.valido) return vHoras;

    const vSimul = capa7_verificarTurnosSimultaneos(empleado, turno, fecha, programacionExistente);
    if (!vSimul.valido) return vSimul;

    // Phase B: Evitar si excederá horas laborables y se pide balancear
    if (opciones?.balancearHoras && empleado.horas_acumuladas !== undefined && empleado.meta_periodo !== undefined && turno.duracion_horas) {
        // Permitimos un margen de horas extra controlado por el sistema para no bloquear totalmente
        const margen = opciones?.maximoHorasExtras ?? 12;
        if ((empleado.horas_acumuladas + Number(turno.duracion_horas)) > (empleado.meta_periodo + margen)) {
            return {
                valido: false,
                razon: `Excede el límite de horas permitidas en este periodo (${empleado.horas_acumuladas}/${empleado.meta_periodo} + ${turno.duracion_horas}h)`,
                codigo: "EXCEDE_HORAS_PERIODO"
            };
        }
    }

    return { valido: true };
}