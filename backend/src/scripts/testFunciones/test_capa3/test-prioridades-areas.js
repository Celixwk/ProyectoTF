"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cliente_1 = __importDefault(require("../../../prisma/cliente"));
const capa3_reglasArea_1 = require("../../../services/programacion/capa3.reglasArea");
async function main() {
    var _a, _b, _c, _d;
    console.log("=== 🧪 Test de prioridades de áreas ===\n");
    // 1. Cargar áreas reales desde BD
    const areas = await cliente_1.default.area.findMany({
        select: { id_area: true, nombre_area: true },
    });
    console.log("📌 Áreas cargadas desde BD:");
    console.table(areas);
    // 2. Obtener prioridades desde BD o fallback
    const prioridadesBD = await (0, capa3_reglasArea_1.capa3_obtenerPrioridadAreas)(areas);
    console.log("\n📌 Prioridades obtenidas (BD o fallback):");
    console.table(prioridadesBD.map(a => ({
        id_area: a.id_area,
        nombre_area: a.nombre_area,
        prioridad: a.prioridad,
    })));
    // 3. Probar con prioridades mockeadas (inyección)
    const prioridadesMock = { [(_b = (_a = areas[0]) === null || _a === void 0 ? void 0 : _a.id_area) !== null && _b !== void 0 ? _b : 0]: 1, [(_d = (_c = areas[1]) === null || _c === void 0 ? void 0 : _c.id_area) !== null && _d !== void 0 ? _d : 0]: 2 };
    const prioridadesInyectadas = await (0, capa3_reglasArea_1.capa3_obtenerPrioridadAreas)(areas, { prioridades: prioridadesMock });
    console.log("\n📌 Prioridades obtenidas con mock inyectado:");
    console.table(prioridadesInyectadas.map(a => ({
        id_area: a.id_area,
        nombre_area: a.nombre_area,
        prioridad: a.prioridad,
    })));
    await cliente_1.default.$disconnect();
}
main().catch(err => {
    console.error("❌ Error en test-prioridades-areas:", err);
});
