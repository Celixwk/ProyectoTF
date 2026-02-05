import { Router } from 'express';
import { estadosController } from '../controllers/estados.controller';

const router = Router();

router.get('/', estadosController.obtenerEstados);
router.post('/', estadosController.crearEstado);
router.put('/:id', estadosController.actualizarEstado);
router.delete('/:id', estadosController.eliminarEstado);

export default router;
