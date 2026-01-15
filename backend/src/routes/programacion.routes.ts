import { Router } from 'express';
import * as controller from '../controllers/programacion.controller';

const router = Router();

router.get('/verificar-existente', controller.verificarProgramacionExistente); // <-- Nueva ruta
router.post('/generar', controller.generarAutomatica);
router.post('/automatica', controller.generarAutomatica);
router.get('/detalle', controller.obtenerDetalleProgramacion);
router.get('/novedades-periodo', controller.obtenerNovedadesPeriodo);
router.delete('/eliminar', controller.eliminarProgramacion);
router.get('/validar', controller.validarProgramacion);
router.get('/empleados-no-asignados-por-dia', controller.obtenerEmpleadosNoAsignadosPorDia);
router.post('/regenerar-desde', controller.regenerarDesdeFecha);

export default router;