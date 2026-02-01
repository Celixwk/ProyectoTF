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
        const areas = await cliente_1.default.area.findMany({
            orderBy: { id_area: 'asc' }
        });
        res.json({ success: true, data: areas });
    }
    catch (error) {
        res.status(500).json({ success: false, data: [], error: error.message });
    }
});
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { max_trabajadores } = req.body;
    try {
        const area = await cliente_1.default.area.update({
            where: { id_area: Number(id) },
            data: {
                max_trabajadores: Number(max_trabajadores),
                updated_at: new Date()
            }
        });
        res.json({ success: true, data: area });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
