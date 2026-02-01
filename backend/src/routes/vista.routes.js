"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const empleado_controller_1 = require("../controllers/empleado.controller");
const router = (0, express_1.Router)();
router.get('/empleados-completos', empleado_controller_1.vistasController.obtenerEmpleadosCompletos);
exports.default = router;
