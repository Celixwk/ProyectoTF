"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
router.get('/estadisticas', dashboard_controller_1.dashboardController.obtenerEstadisticas);
router.get('/turnos-hoy', dashboard_controller_1.dashboardController.obtenerTurnosHoy);
exports.default = router;
