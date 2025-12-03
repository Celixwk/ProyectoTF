const express = require('express');
const router = express.Router();
const vistasController = require('../controllers/vistas.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarPaginacion } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/vistas/empleados-completos
 * @desc    Obtener empleados con toda la información (usa vista)
 * @access  Private
 */
router.get('/empleados-completos',
  validarPaginacion,
  vistasController.obtenerEmpleadosCompletos
);

/**
 * @route   GET /api/vistas/turnos-asignados
 * @desc    Obtener turnos asignados con información completa (usa vista)
 * @access  Private
 */
router.get('/turnos-asignados',
  validarPaginacion,
  vistasController.obtenerTurnosAsignados
);

/**
 * @route   GET /api/vistas/novedades-completas
 * @desc    Obtener novedades con información completa (usa vista)
 * @access  Private
 */
router.get('/novedades-completas',
  validarPaginacion,
  vistasController.obtenerNovedadesCompletas
);

/**
 * @route   GET /api/vistas/recargos-completos
 * @desc    Obtener recargos con información completa (usa vista)
 * @access  Private
 */
router.get('/recargos-completos',
  validarPaginacion,
  vistasController.obtenerRecargosCompletos
);

/**
 * @route   GET /api/vistas/empleados-activos-areas
 * @desc    Obtener empleados activos con áreas (usa vista)
 * @access  Private
 */
router.get('/empleados-activos-areas',
  vistasController.obtenerEmpleadosActivosAreas
);

/**
 * @route   GET /api/vistas/resumen-labor-mes
 * @desc    Obtener resumen de labor mensual (usa vista)
 * @access  Private
 */
router.get('/resumen-labor-mes',
  vistasController.obtenerResumenLaborMes
);

/**
 * @route   GET /api/vistas/auditoria/labor-mes
 * @desc    Obtener auditoría de labor mes (usa vista)
 * @access  Private
 */
router.get('/auditoria/labor-mes',
  vistasController.obtenerAuditoriaLaborMes
);

/**
 * @route   GET /api/vistas/auditoria/recargos
 * @desc    Obtener auditoría de recargos (usa vista)
 * @access  Private
 */
router.get('/auditoria/recargos',
  vistasController.obtenerAuditoriaRecargos
);

/**
 * @route   GET /api/vistas/auditoria/novedades
 * @desc    Obtener auditoría de novedades (usa vista)
 * @access  Private
 */
router.get('/auditoria/novedades',
  vistasController.obtenerAuditoriaNovedades
);

module.exports = router;

