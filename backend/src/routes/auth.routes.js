const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');
const { validarCampos } = require('../middlewares/validation.middleware');

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login',
  [
    body('usuario').notEmpty().withMessage('El usuario es requerido'),
    body('contrasenia').notEmpty().withMessage('La contraseña es requerida'),
    validarCampos
  ],
  authController.login
);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/perfil',
  verificarToken,
  authController.obtenerPerfil
);

/**
 * @route   PUT /api/auth/cambiar-contrasenia
 * @desc    Cambiar contraseña del usuario
 * @access  Private
 */
router.put('/cambiar-contrasenia',
  verificarToken,
  [
    body('contraseniaActual').notEmpty().withMessage('La contraseña actual es requerida'),
    body('contraseniaNueva')
      .notEmpty().withMessage('La nueva contraseña es requerida')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validarCampos
  ],
  authController.cambiarContrasenia
);

/**
 * @route   POST /api/auth/usuarios
 * @desc    Crear nuevo usuario (solo admin)
 * @access  Private/Admin
 */
router.post('/usuarios',
  verificarToken,
  esAdmin,
  [
    body('usuario').notEmpty().withMessage('El usuario es requerido'),
    body('contrasenia')
      .notEmpty().withMessage('La contraseña es requerida')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('tipo_usuario').notEmpty().withMessage('El tipo de usuario es requerido'),
    body('nombre_completo').notEmpty().withMessage('El nombre completo es requerido'),
    validarCampos
  ],
  authController.crearUsuario
);

/**
 * @route   GET /api/auth/usuarios
 * @desc    Listar usuarios (solo admin)
 * @access  Private/Admin
 */
router.get('/usuarios',
  verificarToken,
  esAdmin,
  authController.listarUsuarios
);

/**
 * @route   PUT /api/auth/usuarios/:id/estado
 * @desc    Actualizar estado de usuario (solo admin)
 * @access  Private/Admin
 */
router.put('/usuarios/:id/estado',
  verificarToken,
  esAdmin,
  [
    body('estado').isBoolean().withMessage('El estado debe ser un valor booleano'),
    validarCampos
  ],
  authController.actualizarEstadoUsuario
);

module.exports = router;

