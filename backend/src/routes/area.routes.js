const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const areaController = require('../controllers/area.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
const { validarCampos, validarId } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/areas
 * @desc    Listar áreas
 * @access  Private
 */
router.get('/',
  areaController.listarAreas
);

/**
 * @route   GET /api/areas/:id
 * @desc    Obtener área por ID
 * @access  Private
 */
router.get('/:id',
  validarId('id'),
  areaController.obtenerArea
);

/**
 * @route   POST /api/areas
 * @desc    Crear área
 * @access  Private/Admin
 */
router.post('/',
  esAdmin,
  [
    body('nombre_area').notEmpty().withMessage('El nombre del área es requerido'),
    validarCampos
  ],
  areaController.crearArea
);

/**
 * @route   PUT /api/areas/:id
 * @desc    Actualizar área
 * @access  Private/Admin
 */
router.put('/:id',
  esAdmin,
  validarId('id'),
  [
    body('nombre_area').notEmpty().withMessage('El nombre del área es requerido'),
    validarCampos
  ],
  areaController.actualizarArea
);

/**
 * @route   DELETE /api/areas/:id
 * @desc    Eliminar área
 * @access  Private/Admin
 */
router.delete('/:id',
  esAdmin,
  validarId('id'),
  areaController.eliminarArea
);

module.exports = router;

