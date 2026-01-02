import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/estadisticas', dashboardController.obtenerEstadisticas);
router.get('/turnos-hoy', dashboardController.obtenerTurnosHoy);
router.get('/recargos-por-mes', dashboardController.obtenerRecargosPorMes);
router.get('/empleados-activos', dashboardController.obtenerEmpleadosActivos);

export default router;