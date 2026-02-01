"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const alertas_controller_1 = require("../controllers/alertas.controller");
const router = (0, express_1.Router)();
router.post('/', alertas_controller_1.guardarAlertas);
router.get('/', alertas_controller_1.obtenerAlertas);
router.delete('/', alertas_controller_1.eliminarAlertas);
exports.default = router;
