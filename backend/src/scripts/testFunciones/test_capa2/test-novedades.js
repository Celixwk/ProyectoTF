"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa2_disponibilidad_1 = require("../../../services/programacion/capa2.disponibilidad");
async function main() {
    const fechaPrueba = new Date("2025-01-15");
    const mockNovedades = new Map();
    mockNovedades.set(10, {
        id_empleado: 10,
        tipo_novedad: "Incapacidad",
        codigo: "INCAP",
        fecha_inicio: new Date("2025-01-10"),
        fecha_fin: new Date("2025-01-20")
    });
    const empleadoTest = {
        id_empleado: 10,
        nombre: "Empleado Prueba",
        id_estado: 1,
        puntos: 100
    };
    console.log("--- INICIANDO TEST ---");
    const resultado = await (0, capa2_disponibilidad_1.capa2_verificarDisponibilidad)(empleadoTest, fechaPrueba, mockNovedades);
    console.log("Resultado:", resultado);
    if (!resultado.disponible && resultado.tipoNovedad === 'INCAP') {
        console.log("ESTADO: OK");
    }
    else {
        console.log("ESTADO: ERROR");
    }
}
main();
