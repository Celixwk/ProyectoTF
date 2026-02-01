"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capa7_verificarHorasMaximas = capa7_verificarHorasMaximas;
exports.capa7_verificarTurnosSimultaneos = capa7_verificarTurnosSimultaneos;
exports.capa7_validarReglasDuras = capa7_validarReglasDuras;
const MS_POR_DIA = 86400000;
function toDate(v) {
    if (!v)
        return null;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? null : d;
}
function fechaSoloDiaMs(d) {
    const dt = toDate(d);
    return dt ? Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()) : 0;
}
function obtenerPeriodosValidos(obj) {
    var _a;
    const raw = ((_a = obj.periodos) === null || _a === void 0 ? void 0 : _a.length) > 0
        ? obj.periodos
        : [{ hora_entrada: obj.hora_entrada, hora_salida: obj.hora_salida }];
    const filtrados = raw.map((p) => ({
        hora_entrada: toDate(p.hora_entrada),
        hora_salida: toDate(p.hora_salida)
    })).filter((p) => p.hora_entrada !== null && p.hora_salida !== null);
    return filtrados.length > 0 ? filtrados : null;
}
function capa7_verificarHorasMaximas(turno, horasMaximas = 12) {
    if (!turno || turno.duracion_horas == null)
        return { valido: true };
    const duracion = Number(turno.duracion_horas);
    if (isNaN(duracion))
        return { valido: false, razon: "Duración inválida", codigo: "DURACION_INVALIDA" };
    if (duracion > horasMaximas) {
        return {
            valido: false,
            razon: `El turno excede las ${horasMaximas} horas máximas (${duracion}h)`,
            codigo: "TURNO_EXCEDE_HORAS"
        };
    }
    return { valido: true };
}
function haySolapamientoPeriodos(p1, p2) {
    const e1 = toDate(p1.hora_entrada).getTime();
    let s1 = toDate(p1.hora_salida).getTime();
    const e2 = toDate(p2.hora_entrada).getTime();
    let s2 = toDate(p2.hora_salida).getTime();
    if (s1 <= e1)
        s1 += MS_POR_DIA;
    if (s2 <= e2)
        s2 += MS_POR_DIA;
    return !(s1 <= e2 || s2 <= e1);
}
function capa7_verificarTurnosSimultaneos(empleado, turno, fecha, programacionExistente) {
    const idEmp = empleado === null || empleado === void 0 ? void 0 : empleado.id_empleado;
    if (!idEmp)
        return { valido: false, razon: "Empleado inválido", codigo: "EMPLEADO_INVALIDO" };
    const fechaRefMs = fechaSoloDiaMs(fecha);
    const asignacionesDelDia = programacionExistente.filter(asig => asig.id_empleado === idEmp && fechaSoloDiaMs(asig.fecha) === fechaRefMs);
    if (asignacionesDelDia.length === 0)
        return { valido: true };
    const periodosNuevos = obtenerPeriodosValidos(turno);
    if (!periodosNuevos)
        return { valido: false, razon: "Turno sin horarios válidos", codigo: "PERIODO_INVALIDO" };
    for (const asig of asignacionesDelDia) {
        const periodosExistentes = obtenerPeriodosValidos(asig);
        if (!periodosExistentes)
            continue;
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
function capa7_validarReglasDuras(empleado, area, turno, fecha, programacionExistente, empleadoDisponible) {
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
    if (!vHoras.valido)
        return vHoras;
    const vSimul = capa7_verificarTurnosSimultaneos(empleado, turno, fecha, programacionExistente);
    if (!vSimul.valido)
        return vSimul;
    return { valido: true };
}
