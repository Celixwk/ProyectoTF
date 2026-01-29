import { Router } from 'express';
import * as controller from '../controllers/programacion.controller';

const router = Router();

router.get('/verificar-existente', controller.verificarProgramacionExistente);
router.post('/generar', controller.generarAutomatica);
router.post('/automatica', controller.generarAutomatica);
router.post('/regenerar-desde', controller.regenerarDesdeFecha);
router.post('/guardar-cambios', controller.guardarCambiosManuales);
router.get('/detalle', controller.obtenerDetalleProgramacion);
router.get('/novedades-periodo', controller.obtenerNovedadesPeriodo);
router.get('/validar', controller.validarProgramacion);
router.get('/empleados-no-asignados-por-dia', controller.obtenerEmpleadosNoAsignadosPorDia);
router.delete('/eliminar', controller.eliminarProgramacion);
router.get('/empleados-con-areas', controller.obtenerEmpleadosConAreas);

export default router;