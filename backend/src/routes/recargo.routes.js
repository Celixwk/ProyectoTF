const express = require('express');
const router = express.Router();
const recargoController = require('../controllers/recargo.controller');
const { verificarToken } = require('../middlewares/auth.middleware');
const { validarId, validarPaginacion } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/recargos
 * @desc    Listar recargos
 * @access  Private
 */
router.get('/',
  validarPaginacion,
  recargoController.listarRecargos
);

/**
 * @route   GET /api/recargos/tipos
 * @desc    Listar tipos de recargo
 * @access  Private
 */
router.get('/tipos',
  recargoController.listarTiposRecargo
);

/**
 * @route   GET /api/recargos/resumen
 * @desc    Obtener resumen de recargos por empleado
 * @access  Private
 */
router.get('/resumen',
  recargoController.obtenerResumenRecargosPorEmpleado
);

/**
 * @route   GET /api/recargos/:id
 * @desc    Obtener recargo por ID
 * @access  Private
 */
router.get('/:id',
  validarId('id'),
  recargoController.obtenerRecargo
);

/**
 * @route   POST /api/recargos/calcular/:id_detalle_turno
 * @desc    Calcular recargos para un turno
 * @access  Private
 */
router.post('/calcular/:id_detalle_turno',
  validarId('id_detalle_turno'),
  recargoController.calcularRecargoTurno
);

module.exports = router;

