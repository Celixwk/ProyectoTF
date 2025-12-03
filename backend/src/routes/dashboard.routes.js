const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/dashboard/estadisticas
 * @desc    Obtener estadísticas generales
 * @access  Private
 */
router.get('/estadisticas',
  dashboardController.obtenerEstadisticas
);

/**
 * @route   GET /api/dashboard/turnos-hoy
 * @desc    Obtener turnos del día
 * @access  Private
 */
router.get('/turnos-hoy',
  dashboardController.obtenerTurnosHoy
);

/**
 * @route   GET /api/dashboard/recargos-por-mes
 * @desc    Obtener recargos por mes
 * @access  Private
 */
router.get('/recargos-por-mes',
  dashboardController.obtenerRecargosPorMes
);

/**
 * @route   GET /api/dashboard/empleados-activos
 * @desc    Obtener empleados más activos
 * @access  Private
 */
router.get('/empleados-activos',
  dashboardController.obtenerEmpleadosMasActivos
);

/**
 * @route   GET /api/dashboard/distribucion-areas
 * @desc    Obtener distribución de turnos por área
 * @access  Private
 */
router.get('/distribucion-areas',
  dashboardController.obtenerDistribucionPorArea
);

/**
 * @route   GET /api/dashboard/resumen-novedades
 * @desc    Obtener resumen de novedades
 * @access  Private
 */
router.get('/resumen-novedades',
  dashboardController.obtenerResumenNovedades
);

module.exports = router;

