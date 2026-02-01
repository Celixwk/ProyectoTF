"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuracionController = void 0;
const configuracion_service_1 = require("../services/programacion/configuracion.service");
exports.configuracionController = {
    async obtenerConfiguracion(req, res) {
        try {
            const { mes, anio } = req.query;
            if (!mes || !anio) {
                return res.status(400).json({ error: 'Se requieren mes y anio' });
            }
            const result = await configuracion_service_1.configuracionService.obtenerConfiguracionMes(Number(mes), Number(anio));
            res.json(result);
        }
        catch (error) {
            console.error('Error obtenerConfiguracion:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async actualizarMaximos(req, res) {
        try {
            const { configs } = req.body;
            if (!Array.isArray(configs)) {
                return res.status(400).json({ error: 'Formato incorrecto para configs' });
            }
            const result = await configuracion_service_1.configuracionService.actualizarMaximosAreas(configs);
            res.json(result);
        }
        catch (error) {
            console.error('Error actualizarMaximos:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async guardarDescansos(req, res) {
        try {
            const { id_empleado, mes, anio, dias, observaciones } = req.body;
            if (!id_empleado || !mes || !anio || !dias) {
                return res.status(400).json({ error: 'Datos incompletos' });
            }
            const result = await configuracion_service_1.configuracionService.guardarDescansos(Number(id_empleado), Number(mes), Number(anio), dias, observaciones);
            res.json(result);
        }
        catch (error) {
            console.error('Error guardarDescansos:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async obtenerDescansoEmpleado(req, res) {
        try {
            const { id_empleado, mes, anio } = req.query;
            if (!id_empleado || !mes || !anio) {
                return res.status(400).json({ error: 'Datos incompletos' });
            }
            const result = await configuracion_service_1.configuracionService.obtenerDescansoEmpleado(Number(id_empleado), Number(mes), Number(anio));
            res.json(result);
        }
        catch (error) {
            console.error('Error obtenerDescansoEmpleado:', error);
            res.status(500).json({ error: error.message });
        }
    },
    async obtenerMaestros(req, res) {
        try {
            const data = await configuracion_service_1.configuracionService.obtenerMaestrosConfiguracion();
            res.json({
                success: true,
                data: data
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};
