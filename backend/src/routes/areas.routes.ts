import { Router } from 'express';
import { listarAreas, crearArea, actualizarArea, eliminarArea } from '../controllers/area.controller';

const router = Router();

router.get('/', listarAreas);
router.post('/', crearArea);
router.put('/:id', actualizarArea);
router.delete('/:id', eliminarArea);

export default router;