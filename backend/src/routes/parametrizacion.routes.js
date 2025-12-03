const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const parametrizacionController = require('../controllers/parametrizacion.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
const { validarCampos, validarId } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/parametrizacion
 * @desc    Listar parámetros
 * @access  Private
 */
router.get('/',
  parametrizacionController.listarParametros
);

/**
 * @route   GET /api/parametrizacion/categoria/:categoria
 * @desc    Obtener parámetros por categoría
 * @access  Private
 */
router.get('/categoria/:categoria',
  parametrizacionController.obtenerParametrosPorCategoria
);

/**
 * @route   GET /api/parametrizacion/nombre/:nombre
 * @desc    Obtener parámetro por nombre
 * @access  Private
 */
router.get('/nombre/:nombre',
  parametrizacionController.obtenerParametroPorNombre
);

/**
 * @route   GET /api/parametrizacion/:id
 * @desc    Obtener parámetro por ID
 * @access  Private
 */
router.get('/:id',
  validarId('id'),
  parametrizacionController.obtenerParametro
);

/**
 * @route   POST /api/parametrizacion
 * @desc    Crear parámetro
 * @access  Private/Admin
 */
router.post('/',
  esAdmin,
  [
    body('nombre_parametro').notEmpty().withMessage('El nombre del parámetro es requerido'),
    body('tipo_parametro').notEmpty().withMessage('El tipo de parámetro es requerido'),
    validarCampos
  ],
  parametrizacionController.crearParametro
);

/**
 * @route   PUT /api/parametrizacion/:id
 * @desc    Actualizar parámetro
 * @access  Private/Admin
 */
router.put('/:id',
  esAdmin,
  validarId('id'),
  parametrizacionController.actualizarParametro
);

/**
 * @route   PUT /api/parametrizacion/:id/toggle
 * @desc    Activar/Desactivar parámetro
 * @access  Private/Admin
 */
router.put('/:id/toggle',
  esAdmin,
  validarId('id'),
  parametrizacionController.toggleEstadoParametro
);

/**
 * @route   DELETE /api/parametrizacion/:id
 * @desc    Eliminar parámetro
 * @access  Private/Admin
 */
router.delete('/:id',
  esAdmin,
  validarId('id'),
  parametrizacionController.eliminarParametro
);

module.exports = router;

