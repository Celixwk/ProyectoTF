import { Router } from 'express';
import * as controller from '../controllers/programacion.controller';

const router = Router();

router.post('/generar', controller.generarAutomatica);
router.post('/automatica', controller.generarAutomatica);
router.get('/detalle', controller.obtenerDetalleProgramacion);
router.get('/novedades-periodo', controller.obtenerNovedadesPeriodo);
router.delete('/eliminar', controller.eliminarProgramacion);

router.get('/empleados-no-asignados-por-dia', controller.obtenerEmpleadosNoAsignadosPorDia);
router.patch('/mover-empleado', controller.moverEmpleado);

export default router;