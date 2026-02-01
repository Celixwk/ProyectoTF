"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa8_reglasBlandas_1 = require("../../../services/programacion/capa8.reglasBlandas");
async function testDescansos() {
    console.log("==================================================");
    console.log("PRUEBA DE REGLAS BLANDAS: DESCANSOS PROGRAMADOS (CAPA 8)");
    console.log("==================================================");
    const empleado = {
        id_empleado: 10,
        nombre_completo: "Descanso User",
        cedula: "555",
        total_areas: 1,
        clasificacion: 'flexible',
        areas: [{ id_area: 2, nombre_area: "Piso" }],
        id_estado: 1,
        cargo: { id_cargo: 1, nombre_cargo: "Vendedor" }
    };
    const fechaPrueba = new Date(2023, 10, 20); // 20 de Nov
    const diaPrueba = 20;
    // Mapa de descansos: ID Empleado -> Array de días
    const mapaDescansos = new Map();
    mapaDescansos.set(10, [5, 12, 20, 26]); // El empleado 10 descansa los días 5, 12, 20 y 26
    // CASO 1: Día con descanso programado (Día 20) - DEBE ALERTAR
    console.log(`\nCASO 1: Verificando día ${diaPrueba} (Descanso programado)`);
    const res1 = (0, capa8_reglasBlandas_1.capa8_verificarDescansos)(empleado, fechaPrueba, mapaDescansos);
    console.log(`¿Viola regla? ${res1.viola ? "⚠️ SÍ" : "✅ NO"}`);
    if (res1.viola)
        console.log(`Mensaje: ${res1.mensaje}`);
    // CASO 2: Día laborable (Día 21) - OK
    console.log("\nCASO 2: Verificando día 21 (Día laborable)");
    const fechaLaborable = new Date(2023, 10, 21);
    const res2 = (0, capa8_reglasBlandas_1.capa8_verificarDescansos)(empleado, fechaLaborable, mapaDescansos);
    console.log(`¿Viola regla? ${res2.viola ? "⚠️ SÍ" : "✅ NO"}`);
    // CASO 3: Sin mapa de descansos - OK
    console.log("\nCASO 3: Sin configuración de descansos");
    const res3 = (0, capa8_reglasBlandas_1.capa8_verificarDescansos)(empleado, fechaPrueba, undefined);
    console.log(`¿Viola regla? ${res3.viola ? "⚠️ SÍ" : "✅ NO"}`);
    console.log("\n==================================================");
}
testDescansos();
