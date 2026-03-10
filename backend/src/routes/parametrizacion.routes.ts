import { Router } from 'express';
import { parametrizacionController } from '../controllers/parametrizacion.controller';

const router = Router();

router.get('/:nombre', parametrizacionController.obtenerParametro);
router.put('/:nombre', parametrizacionController.upsertParametro);

export default router;
