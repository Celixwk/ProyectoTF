import { Router } from 'express';
import { empleadoController } from '../controllers/empleado.controller';

const router = Router();

router.get('/', empleadoController.listar);
router.get('/:id', empleadoController.obtenerPorId);
router.post('/', empleadoController.crear);
router.put('/:id', empleadoController.actualizar);
router.delete('/:id', empleadoController.eliminar);

export default router;