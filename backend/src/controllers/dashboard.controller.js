"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const cliente_1 = __importDefault(require("../prisma/cliente"));
exports.dashboardController = {
    async obtenerEstadisticas(req, res) {
        try {
            const [totalEmpleados, totalAreas, totalTurnos] = await Promise.all([
                cliente_1.default.empleado.count({ where: { id_estado: 1 } }),
                cliente_1.default.area.count(),
                cliente_1.default.turno.count({ where: { estado: 'Activo' } })
            ]);
            res.status(200).json({
                success: true,
                data: {
                    empleadosActivos: totalEmpleados,
                    areasRegistradas: totalAreas,
                    turnosActivos: totalTurnos,
                    novedadesPendientes: 0
                }
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async obtenerTurnosHoy(req, res) {
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const turnos = await cliente_1.default.detalleProgramacion.findMany({
                where: { fecha: hoy },
                include: {
                    empleado: {
                        select: { nombre1: true, apellido1: true }
                    },
                    area: {
                        select: { nombre_area: true }
                    },
                    turno: {
                        select: { tipo_turno: true, hora_entrada: true, hora_salida: true }
                    }
                }
            });
            res.status(200).json({ success: true, data: turnos });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async obtenerRecargosPorMes(req, res) {
        try {
            res.status(200).json({ success: true, data: [] });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async obtenerEmpleadosActivos(req, res) {
        try {
            const empleados = await cliente_1.default.empleado.findMany({
                take: 5,
                where: { id_estado: 1 },
                select: {
                    nombre1: true,
                    apellido1: true,
                    cedula: true,
                    cargo: { select: { nombre_cargo: true } }
                },
                orderBy: { created_at: 'desc' }
            });
            res.status(200).json({ success: true, data: empleados });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
