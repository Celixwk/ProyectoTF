"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarArea = exports.listarAreas = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const listarAreas = async (_req, res) => {
    try {
        const areas = await prisma.area.findMany({
            orderBy: { id_area: 'asc' }
        });
        res.json(areas);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al obtener áreas' });
    }
};
exports.listarAreas = listarAreas;
const actualizarArea = async (req, res) => {
    const { id } = req.params;
    const { max_trabajadores } = req.body;
    try {
        const area = await prisma.area.update({
            where: { id_area: Number(id) },
            data: {
                max_trabajadores: Number(max_trabajadores),
                updated_at: new Date()
            }
        });
        res.json(area);
    }
    catch (error) {
        res.status(500).json({ error: 'Error al actualizar área' });
    }
};
exports.actualizarArea = actualizarArea;
