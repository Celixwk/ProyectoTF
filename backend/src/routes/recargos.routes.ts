import { Router } from 'express';
import { recargosController } from '../controllers/recargos.controller';

const router = Router();

router.post('/masivo', recargosController.guardarMasivo);

export default router;
