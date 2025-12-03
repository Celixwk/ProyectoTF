const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const novedadController = require('../controllers/novedad.controller');
const { verificarToken, esAdminOSupervisor } = require('../middlewares/auth.middleware');
const { validarCampos, validarId, validarPaginacion } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/novedades
 * @desc    Listar novedades
 * @access  Private
 */
router.get('/',
  validarPaginacion,
  novedadController.listarNovedades
);

/**
 * @route   GET /api/novedades/tipos
 * @desc    Listar tipos de novedad
 * @access  Private
 */
router.get('/tipos',
  novedadController.listarTiposNovedad
);

/**
 * @route   POST /api/novedades/tipos
 * @desc    Crear tipo de novedad
 * @access  Private/Admin
 */
router.post('/tipos',
  esAdminOSupervisor,
  [
    body('codigo').notEmpty().withMessage('El código es requerido'),
    body('nombre_novedad').notEmpty().withMessage('El nombre es requerido'),
    body('afecta_pago').isBoolean().withMessage('afecta_pago debe ser un booleano'),
    validarCampos
  ],
  novedadController.crearTipoNovedad
);

/**
 * @route   PUT /api/novedades/tipos/:id
 * @desc    Actualizar tipo de novedad
 * @access  Private/Admin
 */
router.put('/tipos/:id',
  esAdminOSupervisor,
  validarId('id'),
  [
    body('codigo').optional().notEmpty().withMessage('El código no puede estar vacío'),
    body('nombre_novedad').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('afecta_pago').optional().isBoolean().withMessage('afecta_pago debe ser un booleano'),
    validarCampos
  ],
  novedadController.actualizarTipoNovedad
);

/**
 * @route   DELETE /api/novedades/tipos/:id
 * @desc    Eliminar tipo de novedad
 * @access  Private/Admin
 */
router.delete('/tipos/:id',
  esAdminOSupervisor,
  validarId('id'),
  novedadController.eliminarTipoNovedad
);

/**
 * @route   GET /api/novedades/:id
 * @desc    Obtener novedad por ID
 * @access  Private
 */
router.get('/:id',
  validarId('id'),
  novedadController.obtenerNovedad
);

/**
 * @route   POST /api/novedades
 * @desc    Crear novedad
 * @access  Private/Admin/Supervisor
 */
router.post('/',
  esAdminOSupervisor,
  [
    body('id_empleado').notEmpty().isInt().withMessage('El ID del empleado es requerido'),
    body('fecha_solicitud').notEmpty().withMessage('La fecha de solicitud es requerida'),
    body('fecha_registro').notEmpty().withMessage('La fecha de registro es requerida'),
    body('detalles').isArray({ min: 1 }).withMessage('Debe incluir al menos un detalle de novedad'),
    validarCampos
  ],
  novedadController.crearNovedad
);

/**
 * @route   PUT /api/novedades/:id/estado
 * @desc    Actualizar estado de novedad
 * @access  Private/Admin/Supervisor
 */
router.put('/:id/estado',
  esAdminOSupervisor,
  validarId('id'),
  [
    body('etapa')
      .notEmpty().withMessage('La etapa es requerida')
      .isIn(['pendiente', 'aprobada', 'rechazada', 'completada'])
      .withMessage('Etapa inválida'),
    validarCampos
  ],
  novedadController.actualizarEstadoNovedad
);

/**
 * @route   DELETE /api/novedades/:id
 * @desc    Eliminar novedad
 * @access  Private/Admin
 */
router.delete('/:id',
  esAdminOSupervisor,
  validarId('id'),
  novedadController.eliminarNovedad
);

module.exports = router;

