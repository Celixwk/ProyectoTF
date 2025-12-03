const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const calendarioController = require('../controllers/calendario.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
const { validarCampos } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/calendario
 * @desc    Listar calendario
 * @access  Private
 */
router.get('/',
  calendarioController.listarCalendario
);

/**
 * @route   GET /api/calendario/festivos/:anio
 * @desc    Obtener festivos del año
 * @access  Private
 */
router.get('/festivos/:anio',
  calendarioController.obtenerFestivosAnio
);

/**
 * @route   GET /api/calendario/:fecha
 * @desc    Obtener día del calendario
 * @access  Private
 */
router.get('/:fecha',
  calendarioController.obtenerDia
);

/**
 * @route   POST /api/calendario/festivos
 * @desc    Crear festivo
 * @access  Private/Admin
 */
router.post('/festivos',
  esAdmin,
  [
    body('fecha').notEmpty().withMessage('La fecha es requerida'),
    body('nombre_festivo').notEmpty().withMessage('El nombre del festivo es requerido'),
    validarCampos
  ],
  calendarioController.crearFestivo
);

/**
 * @route   POST /api/calendario/sincronizar-domingos
 * @desc    Sincronizar domingos del año
 * @access  Private/Admin
 */
router.post('/sincronizar-domingos',
  esAdmin,
  [
    body('anio').notEmpty().isInt().withMessage('El año es requerido'),
    validarCampos
  ],
  calendarioController.sincronizarDomingos
);

/**
 * @route   DELETE /api/calendario/:fecha
 * @desc    Eliminar festivo
 * @access  Private/Admin
 */
router.delete('/:fecha',
  esAdmin,
  calendarioController.eliminarFestivo
);

module.exports = router;

