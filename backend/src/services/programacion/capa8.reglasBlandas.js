"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capa6_guardarAsignaciones = capa6_guardarAsignaciones;
exports.capa6_generarProgramacionDia = capa6_generarProgramacionDia;
const cliente_1 = __importDefault(require("../../prisma/cliente"));
const capa3_reglasArea_1 = require("./capa3.reglasArea");
const capa5_GeneracionAsignacion_1 = require("./capa5.GeneracionAsignacion");
const capa9_deteccionProblemas_1 = require("./capa9.deteccionProblemas");
async function capa6_guardarAsignaciones(asignaciones, idUsuario) {
    let guardadas = 0;
    let errores = 0;
    try {
        await cliente_1.default.$transaction(asignaciones.map((asig) => cliente_1.default.detalleProgramacion.upsert({
            where: {
                uq_empleado_fecha: {
                    id_empleado: asig.id_empleado,
                    fecha: asig.fecha
                }
            },
            update: {
                id_area: asig.id_area,
                id_turno: asig.id_turno,
                updated_at: new Date(),
                tipo_dia: "Laborado",
                id_usuario_registro: idUsuario,
                origen_registro: "Automatico",
                id_labor_mes: asig.id_labor_mes
            },
            create: {
                id_empleado: asig.id_empleado,
                fecha: asig.fecha,
                id_area: asig.id_area,
                id_turno: asig.id_turno,
                id_labor_mes: asig.id_labor_mes,
                tipo_dia: "Laborado",
                estado: "Activo",
                id_usuario_registro: idUsuario,
                origen_registro: "Automatico"
            },
        })));
        guardadas = asignaciones.length;
    }
    catch (error) {
        console.error("❌ Error en persistencia Capa 6:", error);
        errores = asignaciones.length;
    }
    return { guardadas, errores };
}
async function capa6_generarProgramacionDia(fecha, opciones) {
    var _a;
    const fechaNormalizada = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
    const [empleadosBD, areasBD, turnosBD, novedades] = await Promise.all([
        cliente_1.default.empleado.findMany({
            where: {
                id_estado: 1
            },
            include: {
                empleado_area: { include: { area: true } },
                labor_mes: {
                    where: {
                        fecha_inicio: { lte: fechaNormalizada },
                        fecha_fin: { gte: fechaNormalizada }
                    }
                }
            }
        }),
        cliente_1.default.area.findMany(),
        cliente_1.default.turno.findMany({ where: { estado: "Activo" } }),
        cliente_1.default.detalleNovedad.findMany({
            where: { fecha: fechaNormalizada },
            include: { novedad_empleado: true }
        })
    ]);
    const idsEnNovedad = new Set(novedades.map(n => n.novedad_empleado.id_empleado));
    const candidatos = empleadosBD.map((emp) => {
        var _a;
        return ({
            id_empleado: emp.id_empleado,
            cedula: emp.cedula,
            nombre_completo: `${emp.nombre1} ${emp.apellido1 || ''}`.trim(),
            total_areas: emp.empleado_area.length,
            clasificacion: emp.empleado_area.length === 1 ? "especialista" : "flexible",
            areas: emp.empleado_area.map(ea => ({ id_area: ea.area.id_area, nombre_area: ea.area.nombre_area })),
            disponible: !idsEnNovedad.has(emp.id_empleado),
            razonNoDisponible: idsEnNovedad.has(emp.id_empleado) ? "Tiene Novedad/Ausencia" : undefined,
            id_labor_mes: ((_a = emp.labor_mes[0]) === null || _a === void 0 ? void 0 : _a.id_labor_mes) || null
        });
    });
    const areasPriorizadas = await (0, capa3_reglasArea_1.capa3_obtenerPrioridadAreas)(areasBD.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area })));
    const necesidadesPorArea = new Map();
    areasBD.forEach(a => necesidadesPorArea.set(a.id_area, a.max_trabajadores));
    let todasLasAsignaciones = [];
    const poolTrabajo = [...candidatos];
    const turnosOrdenados = [...turnosBD].sort((a, b) => {
        const horaA = a.hora_entrada ? a.hora_entrada.toString() : "00:00";
        const horaB = b.hora_entrada ? b.hora_entrada.toString() : "00:00";
        return horaA.localeCompare(horaB);
    });
    for (const tPrisma of turnosOrdenados) {
        const areasFiltradas = areasPriorizadas.filter(area => {
            if (!(opciones === null || opciones === void 0 ? void 0 : opciones.configuracion))
                return true;
            const config = opciones.configuracion[area.id_area];
            return config ? config.turnosIds.includes(tPrisma.id_turno) : false;
        });
        if (areasFiltradas.length === 0)
            continue;
        const resultadoTurno = (0, capa5_GeneracionAsignacion_1.capa5_generarAsignacionesDia)([], poolTrabajo, areasFiltradas, necesidadesPorArea, tPrisma, fechaNormalizada, { ...opciones, programacionExistente: todasLasAsignaciones });
        resultadoTurno.asignaciones.forEach(asig => {
            const empInfo = candidatos.find(e => e.id_empleado === asig.id_empleado);
            const areaInfo = areasBD.find(a => a.id_area === asig.id_area);
            todasLasAsignaciones.push({
                ...asig,
                nombre_empleado: (empInfo === null || empInfo === void 0 ? void 0 : empInfo.nombre_completo) || "Desconocido",
                nombre_area: (areaInfo === null || areaInfo === void 0 ? void 0 : areaInfo.nombre_area) || "Sin Área",
                codigo_turno: tPrisma.tipo_turno,
                cedula: empInfo === null || empInfo === void 0 ? void 0 : empInfo.cedula,
                id_labor_mes: (empInfo === null || empInfo === void 0 ? void 0 : empInfo.id_labor_mes) || null
            });
            const idx = poolTrabajo.findIndex(e => e.id_empleado === asig.id_empleado);
            if (idx !== -1)
                poolTrabajo[idx].disponible = false;
        });
    }
    const alertasFinales = (0, capa9_deteccionProblemas_1.capa9_detectarProblemas)(todasLasAsignaciones, areasPriorizadas.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area, prioridad: a.prioridad })), candidatos, necesidadesPorArea, fechaNormalizada, {
        maxDiasConsecutivos: (_a = opciones === null || opciones === void 0 ? void 0 : opciones.maxDiasConsecutivosArea) !== null && _a !== void 0 ? _a : 3,
        descansosRequeridos: opciones === null || opciones === void 0 ? void 0 : opciones.descansosRequeridos,
        empleados: candidatos.map(c => ({
            id_empleado: c.id_empleado,
            nombre_completo: c.nombre_completo,
            cedula: c.cedula,
            total_areas: c.total_areas,
            clasificacion: c.clasificacion,
            areas: c.areas
        }))
    });
    const respuestaBase = {
        fecha: fechaNormalizada,
        asignaciones: todasLasAsignaciones,
        alertas: alertasFinales,
        resumen: {
            total_asignaciones: todasLasAsignaciones.length,
            total_empleados: empleadosBD.length,
            total_areas: areasBD.length,
            huecos: []
        }
    };
    if (todasLasAsignaciones.length === 0) {
        return {
            ...respuestaBase,
            guardado: { realizado: false, razon: 'sin_asignaciones' }
        };
    }
    const resultadoGuardado = await capa6_guardarAsignaciones(todasLasAsignaciones, opciones === null || opciones === void 0 ? void 0 : opciones.idUsuario);
    return {
        ...respuestaBase,
        guardado: {
            realizado: resultadoGuardado.errores === 0,
            ...resultadoGuardado
        }
    };
}
