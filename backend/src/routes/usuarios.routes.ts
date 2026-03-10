import { Router } from 'express';
import { usuariosController } from '../controllers/usuarios.controller';
import { verificarToken, esAdmin } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas de usuarios requieren estar logueado como Admin
router.use(verificarToken, esAdmin);

router.get('/', usuariosController.listar);
router.get('/:id', usuariosController.obtenerPorId);
router.post('/', usuariosController.crear);
router.put('/:id', usuariosController.actualizar);
router.delete('/:id', usuariosController.eliminar);

export default router;
