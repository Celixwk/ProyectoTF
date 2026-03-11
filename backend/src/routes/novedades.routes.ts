import { Router } from 'express';
import { novedadController } from '../controllers/novedad.controller';

const router = Router();

router.get('/tipos', novedadController.listarTipos);
router.post('/tipos', novedadController.crearTipo);
router.put('/tipos/:id', novedadController.actualizarTipo);
router.delete('/tipos/:id', novedadController.eliminarTipo);

router.get('/', novedadController.listar);
router.post('/', novedadController.crear);
router.post('/sincronizar', novedadController.sincronizarNovedades);
router.post('/masivo', novedadController.guardarMasivo);
router.delete('/:id', novedadController.eliminar);

export default router;