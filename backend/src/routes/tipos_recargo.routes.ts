import { Router } from 'express';
import { tiposRecargoController } from '../controllers/tipos_recargo.controller';

const router = Router();

router.get('/', tiposRecargoController.listar);
router.post('/', tiposRecargoController.crear);
router.put('/:id', tiposRecargoController.actualizar);
router.delete('/:id', tiposRecargoController.eliminar);

export default router;
