"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capa3_obtenerPrioridadAreas = capa3_obtenerPrioridadAreas;
exports.capa3_aplicarReglasArea = capa3_aplicarReglasArea;
const cliente_1 = __importDefault(require("../../prisma/cliente"));
async function capa3_obtenerPrioridadAreas(areas, opciones) {
    if (opciones === null || opciones === void 0 ? void 0 : opciones.prioridades) {
        return areas
            .map(area => {
            var _a;
            return ({
                id_area: area.id_area,
                nombre_area: area.nombre_area,
                prioridad: (_a = opciones.prioridades[area.id_area]) !== null && _a !== void 0 ? _a : 999
            });
        })
            .sort((a, b) => a.prioridad - b.prioridad);
    }
    try {
        const parametroPrioridad = await cliente_1.default.$queryRaw `

      SELECT id_parametro, nombre_parametro, valor_texto, activo

      FROM parametrizacion

      WHERE nombre_parametro = 'prioridad_areas'

      AND activo = true

      LIMIT 1

    `;
        if ((parametroPrioridad === null || parametroPrioridad === void 0 ? void 0 : parametroPrioridad.length) > 0 && parametroPrioridad[0].valor_texto) {
            try {
                const prioridades = JSON.parse(parametroPrioridad[0].valor_texto);
                return areas
                    .map(area => {
                    var _a;
                    return ({
                        id_area: area.id_area,
                        nombre_area: area.nombre_area,
                        prioridad: (_a = prioridades[area.id_area]) !== null && _a !== void 0 ? _a : 999
                    });
                })
                    .sort((a, b) => a.prioridad - b.prioridad);
            }
            catch (_a) {
                console.warn("Error al parsear prioridades de áreas desde BD, usando reglas por defecto");
            }
        }
    }
    catch (_b) {
        console.warn("No se pudo obtener prioridades desde BD, usando reglas por defecto");
    }
    return areas
        .map((area, index) => ({
        id_area: area.id_area,
        nombre_area: area.nombre_area,
        prioridad: index + 1
    }))
        .sort((a, b) => a.nombre_area.localeCompare(b.nombre_area));
}
function capa3_aplicarReglasArea(area, empleadosDisponibles, maximosPorArea) {
    const empleadosElegibles = empleadosDisponibles.filter(empleado => {
        if (!empleado.disponible)
            return false;
        if (empleado.areas.length === 0)
            return true;
        return empleado.areas.some(a => a.id_area === area.id_area);
    });
    return empleadosElegibles;
}
