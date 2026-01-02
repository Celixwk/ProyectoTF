import { Router, Request, Response } from 'express';
import prisma from '../prisma/cliente';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
    try {
        const cargos = await prisma.cargo.findMany({
            orderBy: { nombre_cargo: 'asc' }
        });
        res.json({ success: true, data: cargos });
    } catch (error: any) {
        res.status(500).json({ success: false, data: [], error: error.message });
    }
});

export default router;