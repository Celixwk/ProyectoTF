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