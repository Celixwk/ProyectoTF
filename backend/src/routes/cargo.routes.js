const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const cargoController = require('../controllers/cargo.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
const { validarCampos, validarId } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/cargos
 * @desc    Listar cargos
 * @access  Private
 */
router.get('/',
  cargoController.listarCargos
);

/**
 * @route   GET /api/cargos/:id
 * @desc    Obtener cargo por ID
 * @access  Private
 */
router.get('/:id',
  validarId('id'),
  cargoController.obtenerCargo
);

/**
 * @route   POST /api/cargos
 * @desc    Crear cargo
 * @access  Private/Admin
 */
router.post('/',
  esAdmin,
  [
    body('nombre_cargo').notEmpty().withMessage('El nombre del cargo es requerido'),
    body('salario_base')
      .notEmpty().withMessage('El salario base es requerido')
      .isFloat({ min: 0 }).withMessage('El salario debe ser un número positivo'),
    validarCampos
  ],
  cargoController.crearCargo
);

/**
 * @route   PUT /api/cargos/:id
 * @desc    Actualizar cargo
 * @access  Private/Admin
 */
router.put('/:id',
  esAdmin,
  validarId('id'),
  [
    body('salario_base').optional().isFloat({ min: 0 }).withMessage('El salario debe ser un número positivo'),
    validarCampos
  ],
  cargoController.actualizarCargo
);

/**
 * @route   DELETE /api/cargos/:id
 * @desc    Eliminar cargo
 * @access  Private/Admin
 */
router.delete('/:id',
  esAdmin,
  validarId('id'),
  cargoController.eliminarCargo
);

module.exports = router;

