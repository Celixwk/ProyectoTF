"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log("✅ Probando capa2_verificarDisponibilidad con MOCK...");
const capa2_disponibilidad_1 = require("../../../services/programacion/capa2.disponibilidad");
const novedadesMock = new Map();
novedadesMock.set(10, {
    id_empleado: 10,
    tipo_novedad: "Incapacidad",
    codigo: "INCAP",
    fecha_inicio: new Date("2025-01-10"),
    fecha_fin: new Date("2025-01-20")
});
const empleadoMock = {
    id_empleado: 10,
    cedula: "1234567890",
    id_estado: 1,
    nombre_completo: "Empleado de prueba",
    total_areas: 2,
    clasificacion: "flexible",
    areas: []
};
const fecha = new Date("2025-01-15");
async function main() {
    const resultado = await (0, capa2_disponibilidad_1.capa2_verificarDisponibilidad)(empleadoMock, fecha, novedadesMock);
    console.log("Resultado:", resultado);
}
main();
