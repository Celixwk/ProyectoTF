import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listarAreas = async (_req: Request, res: Response) => {
    try {
        const areas = await prisma.area.findMany({
            orderBy: { id_area: 'asc' }
        });
        res.json(areas);
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
        res.json(area);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar área' });
    }
};