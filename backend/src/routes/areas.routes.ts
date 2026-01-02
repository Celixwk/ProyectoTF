import { Router, Request, Response } from 'express';
import prisma from '../prisma/cliente';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const areas = await prisma.area.findMany({
            orderBy: { nombre_area: 'asc' }
        });
        res.json({ success: true, data: areas });
    } catch (error: any) {
        res.status(500).json({ success: false, data: [], error: error.message });
    }
});

export default router;