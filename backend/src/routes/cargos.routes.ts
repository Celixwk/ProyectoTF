import { Router } from 'express';
import { cargosController } from '../controllers/cargos.controller';

const router = Router();

router.get('/', cargosController.obtenerCargos);
router.post('/', cargosController.crearCargo);
router.put('/:id', cargosController.actualizarCargo);
router.delete('/:id', cargosController.eliminarCargo);

export default router;