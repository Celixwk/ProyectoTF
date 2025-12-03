const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const empleadoController = require('../controllers/empleado.controller');
const { verificarToken, esAdminOSupervisor } = require('../middlewares/auth.middleware');
const { validarCampos, validarId, validarPaginacion } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   GET /api/empleados
 * @desc    Listar empleados
 * @access  Private
 */
router.get('/',
  validarPaginacion,
  empleadoController.listarEmpleados
);

/**
 * @route   GET /api/empleados/activos
 * @desc    Obtener empleados activos
 * @access  Private
 */
router.get('/activos',
  empleadoController.obtenerEmpleadosActivos
);

/**
 * @route   GET /api/empleados/:id
 * @desc    Obtener empleado por ID
 * @access  Private
 */
router.get('/:id',
  validarId('id'),
  empleadoController.obtenerEmpleado
);

/**
 * @route   POST /api/empleados
 * @desc    Crear empleado
 * @access  Private/Admin/Supervisor
 */
router.post('/',
  esAdminOSupervisor,
  [
    body('nombre1').notEmpty().withMessage('El primer nombre es requerido'),
    body('apellido1').notEmpty().withMessage('El primer apellido es requerido'),
    body('cedula')
      .notEmpty().withMessage('La cédula es requerida')
      .isLength({ min: 5 }).withMessage('La cédula debe tener al menos 5 caracteres'),
    body('id_cargo')
      .notEmpty().withMessage('El cargo es requerido')
      .isInt().withMessage('El cargo debe ser un número válido'),
    body('edad').optional().isInt({ min: 18, max: 100 }).withMessage('La edad debe estar entre 18 y 100'),
    body('sexo').optional().isIn(['M', 'F']).withMessage('El sexo debe ser M o F'),
    validarCampos
  ],
  empleadoController.crearEmpleado
);

/**
 * @route   PUT /api/empleados/:id
 * @desc    Actualizar empleado
 * @access  Private/Admin/Supervisor
 */
router.put('/:id',
  esAdminOSupervisor,
  validarId('id'),
  [
    body('cedula').optional().isLength({ min: 5 }).withMessage('La cédula debe tener al menos 5 caracteres'),
    body('edad').optional().isInt({ min: 18, max: 100 }).withMessage('La edad debe estar entre 18 y 100'),
    body('sexo').optional().isIn(['M', 'F']).withMessage('El sexo debe ser M o F'),
    validarCampos
  ],
  empleadoController.actualizarEmpleado
);

/**
 * @route   DELETE /api/empleados/:id
 * @desc    Eliminar/Desactivar empleado
 * @access  Private/Admin
 */
router.delete('/:id',
  esAdminOSupervisor,
  validarId('id'),
  empleadoController.eliminarEmpleado
);

module.exports = router;

