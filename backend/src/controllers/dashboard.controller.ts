import { Request, Response } from 'express';
import prisma from '../prisma/cliente';

export const dashboardController = {
    async obtenerEstadisticas(req: Request, res: Response) {
        try {
            const [totalEmpleados, totalAreas, totalTurnos] = await Promise.all([
                prisma.empleado.count({ where: { id_estado: 1 } }),
                prisma.area.count(),
                prisma.turno.count({ where: { estado: 'Activo' } })
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
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async obtenerTurnosHoy(req: Request, res: Response) {
        try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const turnos = await prisma.detalleProgramacion.findMany({
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
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async obtenerRecargosPorMes(req: Request, res: Response) {
        try {
            res.status(200).json({ success: true, data: [] });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async obtenerEmpleadosActivos(req: Request, res: Response) {
        try {
            const empleados = await prisma.empleado.findMany({
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
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};