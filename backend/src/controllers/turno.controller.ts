import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTurnos = async (req: Request, res: Response) => {
    try {
        const { estado } = req.query;
        const turnos = await prisma.turno.findMany({
            where: estado !== undefined ? {
                estado: estado === 'true' ? 'Activo' : 'Inactivo'
            } : {},
            orderBy: { tipo_turno: 'asc' }
        });
        res.json({ success: true, data: turnos });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener turnos' });
    }
};

export const obtenerTurnosAsignados = async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, fecha_fin, id_empleado } = req.query;

        const where: any = {};

        if (fecha_inicio) {
            where.fecha = { ...where.fecha, gte: new Date(String(fecha_inicio)) };
        }
        if (fecha_fin) {
            where.fecha = { ...where.fecha, lte: new Date(String(fecha_fin)) };
        }
        if (id_empleado) {
            where.id_empleado = Number(id_empleado);
        }

        const turnos = await prisma.vw_turnos_asignados.findMany({
            where,
            orderBy: { fecha: 'asc' }
        });

        res.json({ success: true, data: { turnos } });
    } catch (error: any) {
        console.error('Error getting turnos asignados:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getTurnoById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const turno = await prisma.turno.findUnique({
            where: { id_turno: Number(id) }
        });
        if (!turno) return res.status(404).json({ success: false, error: 'No encontrado' });
        res.json({ success: true, data: turno });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener turno' });
    }
};

export const createTurno = async (req: Request, res: Response) => {
    try {
        const nuevoTurno = await prisma.turno.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: nuevoTurno });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al crear turno' });
    }
};

export const updateTurno = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const turnoActualizado = await prisma.turno.update({
            where: { id_turno: Number(id) },
            data: req.body
        });
        res.json({ success: true, data: turnoActualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al actualizar turno' });
    }
};

export const deleteTurno = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.turno.delete({
            where: { id_turno: Number(id) }
        });
        res.json({ success: true, message: 'Turno eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al eliminar turno' });
    }
};

export const asignarTurno = async (req: Request, res: Response) => {
    try {
        const { id_empleado, fecha, id_turno, id_area, id_usuario_registro } = req.body;

        // Convert string date to Date object
        const fechaDate = new Date(fecha);

        // Buscar LaborMes activo para la fecha
        const laborMes = await prisma.laborMes.findFirst({
            where: {
                id_empleado: Number(id_empleado),
                fecha_inicio: { lte: fechaDate },
                fecha_fin: { gte: fechaDate },
                estado: 'Abierto'
            }
        });

        if (!laborMes) {
            return res.status(400).json({ success: false, error: 'No existe periodo laboral abierto para esta fecha.' });
        }

        const asignacion = await prisma.detalleProgramacion.upsert({
            where: {
                uq_empleado_fecha: {
                    id_empleado: Number(id_empleado),
                    fecha: fechaDate
                }
            },
            update: {
                id_area: Number(id_area),
                id_turno: Number(id_turno),
                id_labor_mes: laborMes.id_labor_mes,
                updated_at: new Date(),
                tipo_dia: "Laborado",
                id_usuario_registro: id_usuario_registro ? Number(id_usuario_registro) : null,
                origen_registro: "Manual"
            },
            create: {
                id_empleado: Number(id_empleado),
                fecha: fechaDate,
                id_area: Number(id_area),
                id_turno: Number(id_turno),
                id_labor_mes: laborMes.id_labor_mes,
                tipo_dia: "Laborado",
                estado: "Activo",
                id_usuario_registro: id_usuario_registro ? Number(id_usuario_registro) : null,
                origen_registro: "Manual"
            }
        });

        res.json({ success: true, data: asignacion });
    } catch (error: any) {
        console.error("Error asignando turno:", error);
        res.status(500).json({ success: false, error: 'Error al asignar turno: ' + error.message });
    }
};