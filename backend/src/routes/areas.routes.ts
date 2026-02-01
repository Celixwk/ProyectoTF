import { Router, Request, Response } from 'express';
import prisma from '../prisma/cliente';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const areas = await prisma.area.findMany({
            orderBy: { id_area: 'asc' }
        });
        res.json({ success: true, data: areas });
    } catch (error: any) {
        res.status(500).json({ success: false, data: [], error: error.message });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
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
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;