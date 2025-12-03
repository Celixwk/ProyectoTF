const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const turnoController = require('../controllers/turno.controller');
const { verificarToken, esAdminOSupervisor } = require('../middlewares/auth.middleware');
const { validarCampos, validarId, validarPaginacion } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/turnos
 * @desc    Listar turnos
 * @access  Private
 */
router.get('/',
  turnoController.listarTurnos
);

/**
 * @route   GET /api/turnos/asignados
 * @desc    Obtener turnos asignados
 * @access  Private
 */
router.get('/asignados',
  validarPaginacion,
  turnoController.obtenerTurnosAsignados
);

/**
 * @route   GET /api/turnos/:id
 * @desc    Obtener turno por ID
 * @access  Private
 */
router.get('/:id',
  validarId('id'),
  turnoController.obtenerTurno
);

/**
 * @route   POST /api/turnos
 * @desc    Crear turno
 * @access  Private/Admin/Supervisor
 */
router.post('/',
  esAdminOSupervisor,
  [
    body('codigo').notEmpty().withMessage('El código es requerido'),
    body('hora_entrada').notEmpty().withMessage('La hora de entrada es requerida'),
    body('hora_salida').notEmpty().withMessage('La hora de salida es requerida'),
    body('tipo_turno').notEmpty().withMessage('El tipo de turno es requerido'),
    validarCampos
  ],
  turnoController.crearTurno
);

/**
 * @route   POST /api/turnos/asignar
 * @desc    Asignar turno a empleado
 * @access  Private/Admin/Supervisor
 */
router.post('/asignar',
  esAdminOSupervisor,
  [
    body('id_empleado').notEmpty().isInt().withMessage('El ID del empleado es requerido'),
    body('id_turno').notEmpty().isInt().withMessage('El ID del turno es requerido'),
    body('id_area').notEmpty().isInt().withMessage('El ID del área es requerida'),
    body('fecha_inicio').notEmpty().withMessage('La fecha de inicio es requerida'),
    body('fecha_fin').notEmpty().withMessage('La fecha de fin es requerida'),
    validarCampos
  ],
  turnoController.asignarTurno
);

/**
 * @route   PUT /api/turnos/:id
 * @desc    Actualizar turno
 * @access  Private/Admin/Supervisor
 */
router.put('/:id',
  esAdminOSupervisor,
  validarId('id'),
  turnoController.actualizarTurno
);

/**
 * @route   DELETE /api/turnos/:id
 * @desc    Eliminar/Desactivar turno
 * @access  Private/Admin
 */
router.delete('/:id',
  esAdminOSupervisor,
  validarId('id'),
  turnoController.eliminarTurno
);

module.exports = router;

