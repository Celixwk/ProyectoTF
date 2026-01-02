import { Router } from 'express';
import { empleadoController } from '../controllers/empleado.controller';

const router = Router();

router.get('/', empleadoController.listar);
router.get('/:id', empleadoController.obtenerPorId);

export default router;