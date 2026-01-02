import { Router } from 'express';

import { vistasController } from '../controllers/empleado.controller';

const router = Router();
router.get('/empleados-completos', vistasController.obtenerEmpleadosCompletos);

export default router;