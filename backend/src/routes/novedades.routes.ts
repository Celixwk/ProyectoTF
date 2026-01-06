import { Router } from 'express';
import { novedadController } from '../controllers/novedad.controller';

const router = Router();

router.get('/tipos', novedadController.listarTipos);
router.get('/', novedadController.listar);
router.post('/', novedadController.crear);
router.post('/masivo', novedadController.guardarMasivo);
router.delete('/:id', novedadController.eliminar);

export default router;