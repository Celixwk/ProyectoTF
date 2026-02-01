import { Router } from 'express';
import { calendarioController } from '../controllers/calendario.controller';

const router = Router();

router.get('/', calendarioController.listar);
router.get('/festivos/:anio', calendarioController.obtenerFestivos);
router.post('/festivos', calendarioController.crearFestivo);

export default router;
