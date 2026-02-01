"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cliente_1 = __importDefault(require("../prisma/cliente"));
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const cargos = await cliente_1.default.cargo.findMany({
            orderBy: { nombre_cargo: 'asc' }
        });
        res.json({ success: true, data: cargos });
    }
    catch (error) {
        res.status(500).json({ success: false, data: [], error: error.message });
    }
});
exports.default = router;
