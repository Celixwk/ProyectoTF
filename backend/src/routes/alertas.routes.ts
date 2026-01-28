import { Router } from 'express';
import { guardarAlertas, obtenerAlertas, eliminarAlertas } from '../controllers/alertas.controller';

const router = Router();

router.post('/', guardarAlertas);
router.get('/', obtenerAlertas);
router.delete('/', eliminarAlertas);

export default router;