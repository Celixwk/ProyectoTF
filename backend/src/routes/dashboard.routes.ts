import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/estadisticas', dashboardController.obtenerEstadisticas);
router.get('/turnos-hoy', dashboardController.obtenerTurnosHoy);

export default router;