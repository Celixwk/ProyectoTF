import { Request, Response } from 'express';
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

export const listarAreas = async (_req: Request, res: Response) => {
    try {
        const areas = await prisma.area.findMany({
            orderBy: { nombre_area: 'asc' }
        });
        res.json({ success: true, data: areas });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener áreas' });
    }
};

export const actualizarArea = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { max_trabajadores } = req.body;

    try {
        const area = await prisma.area.update({
            where: { id_area: Number(id) },
            data: {
                max_trabajadores: Number(max_trabajadores),
                updated_at: new Date()
            }
        });
        res.json({ success: true, data: area });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar área' });
    }
};

export const crearArea = async (req: Request, res: Response) => {
    const { nombre_area, max_trabajadores, descripcion } = req.body;
    try {
        const area = await prisma.area.create({
            data: {
                nombre_area,
                max_trabajadores: Number(max_trabajadores) || 5,
                descripcion,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        res.json({ success: true, data: area });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const eliminarArea = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.area.delete({
            where: { id_area: Number(id) }
        });
        res.json({ success: true, message: 'Área eliminada correctamente' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
