const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const programacionController = require('../controllers/programacion.controller');
const { verificarToken, esAdminOSupervisor } = require('../middlewares/auth.middleware');
const { validarCampos } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   POST /api/programacion/generar
 * @desc    Generar programación automática para un mes
 * @access  Private/Admin/Supervisor
 * @body    { mes: number, anio: number, descansos?: object }
 *          descansos formato: { "id_empleado": [días del mes] }
 */
router.post('/generar',
  esAdminOSupervisor,
  [
    body('mes').isInt({ min: 1, max: 12 }).withMessage('El mes debe ser un número entre 1 y 12'),
    body('anio').isInt({ min: 2000, max: 2100 }).withMessage('El año debe ser un número válido'),
    body('descansos').optional().isObject().withMessage('Descansos debe ser un objeto'),
    validarCampos
  ],
  programacionController.generarProgramacionAutomatica
);

/**
 * @route   DELETE /api/programacion/eliminar
 * @desc    Eliminar programación de un mes
 * @access  Private/Admin/Supervisor
 */
router.delete('/eliminar',
  esAdminOSupervisor,
  programacionController.eliminarProgramacionMes
);

module.exports = router;

