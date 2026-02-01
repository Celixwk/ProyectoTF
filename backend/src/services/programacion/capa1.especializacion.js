"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.obtenerClasificacionEmpleado = obtenerClasificacionEmpleado;
exports.capa1_ordenarPorEspecializacion = capa1_ordenarPorEspecializacion;
const cliente_1 = __importDefault(require("../../prisma/cliente"));
function obtenerClasificacionEmpleado(totalAreas) {
    if (totalAreas === 0)
        return "comodín";
    if (totalAreas === 1)
        return "especialista";
    return "flexible";
}
async function capa1_ordenarPorEspecializacion() {
    const empleados = await cliente_1.default.empleado.findMany({
        include: {
            empleado_area: true,
            cargo: true,
        },
    });
    const procesados = empleados.map(empleado => {
        const nombre = [empleado.nombre1, empleado.nombre2, empleado.apellido1, empleado.apellido2]
            .filter(Boolean).join(" ");
        const total_areas = empleado.empleado_area.length;
        const clasificacion = obtenerClasificacionEmpleado(total_areas);
        return {
            id_empleado: empleado.id_empleado,
            nombre,
            total_areas,
            clasificacion
        };
    });
    return {
        especialistas: procesados.filter(e => e.clasificacion === "especialista"),
        flexibles: procesados.filter(e => e.clasificacion === "flexible"),
        comodines: procesados.filter(e => e.clasificacion === "comodín"),
        todos: [...procesados].sort((a, b) => a.total_areas - b.total_areas)
    };
}
