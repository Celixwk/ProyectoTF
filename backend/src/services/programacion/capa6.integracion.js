"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capa6_guardarAsignaciones = capa6_guardarAsignaciones;
exports.capa6_generarProgramacionDia = capa6_generarProgramacionDia;
exports.capa6_validarPeriodo = capa6_validarPeriodo;
const cliente_1 = __importDefault(require("../../prisma/cliente"));
const capa3_reglasArea_1 = require("./capa3.reglasArea");
const capa5_GeneracionAsignacion_1 = require("./capa5.GeneracionAsignacion");
const capa9_deteccionProblemas_1 = require("./capa9.deteccionProblemas");
async function capa6_guardarAsignaciones(asignaciones, idUsuario) {
    let guardadas = 0;
    let errores = 0;
    for (const asig of asignaciones) {
        try {
            await cliente_1.default.detalleProgramacion.upsert({
                where: { uq_empleado_fecha: { id_empleado: asig.id_empleado, fecha: asig.fecha } },
                update: { id_area: asig.id_area, id_turno: asig.id_turno, updated_at: new Date(), tipo_dia: "Laborado", id_usuario_registro: idUsuario, origen_registro: "Automatico", id_labor_mes: asig.id_labor_mes },
                create: { id_empleado: asig.id_empleado, fecha: asig.fecha, id_area: asig.id_area, id_turno: asig.id_turno, id_labor_mes: asig.id_labor_mes, tipo_dia: "Laborado", estado: "Activo", id_usuario_registro: idUsuario, origen_registro: "Automatico" }
            });
            guardadas++;
        }
        catch (error) {
            errores++;
        }
    }
    return { guardadas, errores };
}
async function capa6_generarProgramacionDia(fecha, opciones) {
    var _a;
    const fechaNormalizada = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
    const finDia = new Date(fechaNormalizada);
    finDia.setUTCDate(fechaNormalizada.getUTCDate() + 1);
    const [empleadosBD, areasBD, turnosBD, novedades] = await Promise.all([
        cliente_1.default.empleado.findMany({
            where: { id_estado: 1, labor_mes: { some: { fecha_inicio: { lte: fechaNormalizada }, fecha_fin: { gte: fechaNormalizada }, estado: "Abierto" } } },
            include: { empleado_area: { include: { area: true } }, labor_mes: { where: { fecha_inicio: { lte: fechaNormalizada }, fecha_fin: { gte: fechaNormalizada }, estado: "Abierto" } } }
        }),
        cliente_1.default.area.findMany(),
        cliente_1.default.turno.findMany({ where: { estado: "Activo" } }),
        cliente_1.default.detalleNovedad.findMany({
            where: { fecha: { gte: fechaNormalizada, lt: finDia } },
            include: { novedad_empleado: true }
        })
    ]);
    const programacionDelMes = await cliente_1.default.detalleProgramacion.findMany({
        where: { fecha: { gte: new Date(Date.UTC(fechaNormalizada.getUTCFullYear(), fechaNormalizada.getUTCMonth(), 1)), lt: fechaNormalizada } },
        select: { id_empleado: true, id_area: true, fecha: true, id_turno: true }
    });
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
            id_labor_mes: (_a = emp.labor_mes[0]) === null || _a === void 0 ? void 0 : _a.id_labor_mes
        });
    });
    const areasPriorizadas = await (0, capa3_reglasArea_1.capa3_obtenerPrioridadAreas)(areasBD.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area })));
    const necesidadesPorArea = new Map();
    areasBD.forEach(a => necesidadesPorArea.set(a.id_area, a.max_trabajadores));
    const cuposRestantesDia = new Map(necesidadesPorArea);
    const empleadosYaAsignadosHoy = new Set();
    let todasLasAsignaciones = [];
    const poolTrabajo = candidatos.map(c => ({ ...c }));
    const turnosOrdenados = turnosBD.sort((a, b) => String(a.hora_entrada || "00:00").localeCompare(String(b.hora_entrada || "00:00")));
    for (const tPrisma of turnosOrdenados) {
        const areasConCupoParaTurno = [];
        const maximosTemporales = new Map();
        for (const area of areasPriorizadas) {
            if (!(opciones === null || opciones === void 0 ? void 0 : opciones.configuracion))
                continue;
            const config = opciones.configuracion[area.id_area];
            if (!config || !config.turnosIds.includes(tPrisma.id_turno))
                continue;
            const totalRequerido = necesidadesPorArea.get(area.id_area) || 0;
            const turnosHabilitadosArea = config.turnosIds;
            const indexTurnoActual = turnosHabilitadosArea.indexOf(tPrisma.id_turno);
            const basePorTurno = Math.floor(totalRequerido / turnosHabilitadosArea.length);
            const residuo = totalRequerido % turnosHabilitadosArea.length;
            let cupoParaEsteTurno = basePorTurno + (indexTurnoActual < residuo ? 1 : 0);
            const cupoRealRestanteArea = cuposRestantesDia.get(area.id_area) || 0;
            if (cupoParaEsteTurno > 0 && cupoRealRestanteArea > 0) {
                areasConCupoParaTurno.push(area);
                maximosTemporales.set(area.id_area, Math.min(cupoParaEsteTurno, cupoRealRestanteArea));
            }
        }
        if (areasConCupoParaTurno.length === 0)
            continue;
        const resultadoTurno = (0, capa5_GeneracionAsignacion_1.capa5_generarAsignacionesDia)([], poolTrabajo, areasConCupoParaTurno, maximosTemporales, tPrisma, fechaNormalizada, {
            ...opciones,
            programacionExistente: [...programacionDelMes, ...todasLasAsignaciones],
            cuposRestantes: maximosTemporales,
            empleadosYaAsignados: empleadosYaAsignadosHoy
        });
        resultadoTurno.asignaciones.forEach(asig => {
            var _a;
            const empInfo = candidatos.find(e => e.id_empleado === asig.id_empleado);
            todasLasAsignaciones.push({
                ...asig,
                nombre_empleado: (empInfo === null || empInfo === void 0 ? void 0 : empInfo.nombre_completo) || "Desconocido",
                nombre_area: ((_a = areasBD.find(a => a.id_area === asig.id_area)) === null || _a === void 0 ? void 0 : _a.nombre_area) || "Sin Área",
                codigo_turno: tPrisma.tipo_turno,
                cedula: empInfo === null || empInfo === void 0 ? void 0 : empInfo.cedula,
                id_labor_mes: empInfo === null || empInfo === void 0 ? void 0 : empInfo.id_labor_mes
            });
            const cupoActual = cuposRestantesDia.get(asig.id_area) || 0;
            cuposRestantesDia.set(asig.id_area, Math.max(0, cupoActual - 1));
            const idx = poolTrabajo.findIndex(e => e.id_empleado === asig.id_empleado);
            if (idx !== -1) {
                poolTrabajo[idx].disponible = false;
                empleadosYaAsignadosHoy.add(asig.id_empleado);
            }
        });
    }
    const alertasFinales = (0, capa9_deteccionProblemas_1.capa9_detectarProblemas)(todasLasAsignaciones, areasPriorizadas.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area, prioridad: a.prioridad })), candidatos, necesidadesPorArea, fechaNormalizada, { maxDiasConsecutivos: (_a = opciones === null || opciones === void 0 ? void 0 : opciones.maxDiasConsecutivosArea) !== null && _a !== void 0 ? _a : 3, empleados: candidatos });
    const respuestaBase = { fecha: fechaNormalizada, asignaciones: todasLasAsignaciones, alertas: alertasFinales, resumen: { total_asignaciones: todasLasAsignaciones.length, total_empleados: empleadosBD.length, total_areas: areasBD.length, huecos: [] } };
    if (todasLasAsignaciones.length === 0 && poolTrabajo.filter(e => e.disponible).length > 0) {
        return { ...respuestaBase, guardado: { realizado: false, razon: 'fallo_distribucion_con_personal_disponible' } };
    }
    const resultadoGuardado = await capa6_guardarAsignaciones(todasLasAsignaciones, opciones === null || opciones === void 0 ? void 0 : opciones.idUsuario);
    return { ...respuestaBase, guardado: { realizado: resultadoGuardado.guardadas > 0, ...resultadoGuardado } };
}
async function capa6_validarPeriodo(inicio, fin) {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const [programacion, empleadosBD, areasBD, turnosBD] = await Promise.all([
        cliente_1.default.detalleProgramacion.findMany({
            where: { fecha: { gte: fechaInicio, lte: fechaFin } },
            include: { empleado: true, area: true, turno: true }
        }),
        cliente_1.default.empleado.findMany({
            include: { empleado_area: { include: { area: true } } }
        }),
        cliente_1.default.area.findMany(),
        cliente_1.default.turno.findMany({ where: { estado: "Activo" } })
    ]);
    const areasPriorizadas = await (0, capa3_reglasArea_1.capa3_obtenerPrioridadAreas)(areasBD.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area })));
    const necesidadesPorArea = new Map();
    areasBD.forEach(a => necesidadesPorArea.set(a.id_area, a.max_trabajadores));
    const candidatos = empleadosBD.map((emp) => ({
        id_empleado: emp.id_empleado,
        cedula: emp.cedula,
        nombre_completo: `${emp.nombre1} ${emp.apellido1 || ''}`.trim(),
        total_areas: emp.empleado_area.length,
        clasificacion: emp.empleado_area.length === 1 ? "especialista" : "flexible",
        areas: emp.empleado_area.map(ea => ({ id_area: ea.area.id_area, nombre_area: ea.area.nombre_area })),
        disponible: true
    }));
    const alertasTotales = [];
    let curr = new Date(fechaInicio);
    while (curr <= fechaFin) {
        const fechaISO = curr.toISOString().split('T')[0];
        const asignacionesDia = programacion.filter(p => {
            const pFecha = new Date(p.fecha);
            return pFecha.toISOString().split('T')[0] === fechaISO;
        }).map(p => {
            var _a;
            return ({
                id_empleado: p.id_empleado,
                id_area: p.id_area,
                id_turno: p.id_turno,
                fecha: p.fecha,
                id_labor_mes: p.id_labor_mes || 0,
                tipo_dia: p.tipo_dia,
                nombre_empleado: p.empleado ? `${p.empleado.nombre1} ${p.empleado.apellido1}` : 'Desconocido',
                nombre_area: ((_a = p.area) === null || _a === void 0 ? void 0 : _a.nombre_area) || 'Desconocido'
            });
        });
        const alertas = (0, capa9_deteccionProblemas_1.capa9_detectarProblemas)(asignacionesDia, areasPriorizadas.map(a => ({ id_area: a.id_area, nombre_area: a.nombre_area, prioridad: a.prioridad })), candidatos, necesidadesPorArea, new Date(curr));
        if (alertas.length > 0) {
            alertasTotales.push({ fecha: fechaISO, alertas });
        }
        curr.setUTCDate(curr.getUTCDate() + 1);
    }
    return alertasTotales;
}
