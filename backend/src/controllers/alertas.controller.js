"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarAlertas = exports.obtenerAlertas = exports.guardarAlertas = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const guardarAlertas = async (req, res) => {
    var _a;
    try {
        const { mes, anio, alertas } = req.body;
        console.log('💾 GUARDAR ALERTAS - RECIBIDO:', {
            mes,
            anio,
            cantidadAlertas: Array.isArray(alertas) ? alertas.length : 0,
            timestamp: new Date().toISOString()
        });
        console.log('📋 PRIMERA ALERTA RECIBIDA:', alertas[0]);
        console.log('🔍 ¿TIENE PROPIEDAD alertas?:', ((_a = alertas[0]) === null || _a === void 0 ? void 0 : _a.alertas) !== undefined);
        if (!mes || !anio || !Array.isArray(alertas)) {
            return res.status(400).json({
                success: false,
                message: 'Mes, año y alertas son requeridos'
            });
        }
        const dataParaInsertar = [];
        let iteracionesGrupo = 0;
        let iteracionesAlerta = 0;
        alertas.forEach((grupo) => {
            iteracionesGrupo++;
            if (grupo.alertas && Array.isArray(grupo.alertas)) {
                grupo.alertas.forEach((alerta) => {
                    iteracionesAlerta++;
                    dataParaInsertar.push({
                        mes: Number(mes),
                        anio: Number(anio),
                        fecha: new Date(grupo.fecha),
                        tipo: alerta.tipo,
                        codigo: alerta.codigo || null,
                        mensaje: alerta.mensaje,
                        id_area: alerta.area || null,
                        id_empleado: alerta.empleado || null,
                        datos_completos: alerta
                    });
                });
            }
        });
        console.log('🔄 PROCESAMIENTO:', {
            gruposIterados: iteracionesGrupo,
            alertasIteradas: iteracionesAlerta,
            registrosParaInsertar: dataParaInsertar.length
        });
        const resultado = await prisma.$transaction(async (tx) => {
            const eliminadas = await tx.alertasProgramacion.deleteMany({
                where: { mes: Number(mes), anio: Number(anio) }
            });
            console.log('🗑️ ALERTAS ELIMINADAS:', eliminadas.count);
            if (dataParaInsertar.length > 0) {
                const insertadas = await tx.alertasProgramacion.createMany({
                    data: dataParaInsertar
                });
                console.log('✅ ALERTAS INSERTADAS:', insertadas.count);
                return insertadas;
            }
            console.log('⚠️ NO HAY ALERTAS PARA INSERTAR');
            return { count: 0 };
        });
        res.json({
            success: true,
            message: 'Alertas guardadas exitosamente',
            data: { total: resultado.count }
        });
    }
    catch (error) {
        console.error('❌ ERROR AL GUARDAR ALERTAS:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar las alertas',
            error: error.message
        });
    }
};
exports.guardarAlertas = guardarAlertas;
const obtenerAlertas = async (req, res) => {
    try {
        const { mes, anio } = req.query;
        if (!mes || !anio) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }
        const alertasRaw = await prisma.alertasProgramacion.findMany({
            where: {
                mes: Number(mes),
                anio: Number(anio)
            },
            orderBy: [
                { fecha: 'asc' },
                { id_alerta: 'asc' }
            ]
        });
        const alertasPorFecha = alertasRaw.reduce((acc, alerta) => {
            const fechaKey = alerta.fecha.toISOString().split('T')[0];
            if (!acc[fechaKey]) {
                acc[fechaKey] = { fecha: alerta.fecha, alertas: [] };
            }
            acc[fechaKey].alertas.push({
                tipo: alerta.tipo,
                codigo: alerta.codigo,
                mensaje: alerta.mensaje,
                area: alerta.id_area,
                empleado: alerta.id_empleado,
                ...(alerta.datos_completos || {})
            });
            return acc;
        }, {});
        res.json({
            success: true,
            data: Object.values(alertasPorFecha)
        });
    }
    catch (error) {
        console.error('Error al obtener alertas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las alertas',
            error: error.message
        });
    }
};
exports.obtenerAlertas = obtenerAlertas;
const eliminarAlertas = async (req, res) => {
    try {
        const { mes, anio } = req.body;
        if (!mes || !anio) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }
        const eliminado = await prisma.alertasProgramacion.deleteMany({
            where: {
                mes: Number(mes),
                anio: Number(anio)
            }
        });
        res.json({
            success: true,
            message: 'Alertas eliminadas exitosamente',
            data: { eliminadas: eliminado.count }
        });
    }
    catch (error) {
        console.error('Error al eliminar alertas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar las alertas',
            error: error.message
        });
    }
};
exports.eliminarAlertas = eliminarAlertas;
