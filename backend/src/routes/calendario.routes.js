"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calendario_controller_1 = require("../controllers/calendario.controller");
const router = (0, express_1.Router)();
router.get('/', calendario_controller_1.calendarioController.listar);
router.get('/festivos/:anio', calendario_controller_1.calendarioController.obtenerFestivos);
router.post('/festivos', calendario_controller_1.calendarioController.crearFestivo);
exports.default = router;
