"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa8_reglasBlandas_1 = require("../../../services/programacion/capa8.reglasBlandas");
async function testDistribucion() {
    console.log("==================================================");
    console.log("PRUEBA DE REGLAS BLANDAS: DISTRIBUCIÓN EQUITATIVA (CAPA 8)");
    console.log("==================================================");
    const empleado = {
        id_empleado: 50,
        nombre_completo: "Distribucion User",
        cedula: "999",
        total_areas: 1,
        clasificacion: 'comodin',
        areas: [],
        id_estado: 1,
        cargo: { id_cargo: 1, nombre_cargo: "Auxiliar" }
    };
    const promedioGlobal = 10; // Digamos que el promedio de turnos es 10 por persona
    // CASO 1: Empleado dentro del promedio (Tiene 10 turnos) - OK
    console.log("\nCASO 1: Empleado con 10 asignaciones (Promedio 10) - OK");
    // Simulamos 10 asignaciones
    const historialCaso1 = Array(10).fill({ id_empleado: 50 });
    const res1 = (0, capa8_reglasBlandas_1.capa8_verificarDistribucionEquitativa)(empleado, historialCaso1, promedioGlobal);
    console.log(`Diferencia: ${res1.diferencia}`);
    console.log(`¿Viola regla? ${res1.viola ? "⚠️ SÍ" : "✅ NO"}`);
    // CASO 2: Empleado sobrecargado (Tiene 15 turnos, > 20% de 10 que es 12) - VIOLACIÓN
    console.log("\nCASO 2: Empleado con 15 asignaciones (Promedio 10) - VIOLACIÓN");
    const historialCaso2 = Array(15).fill({ id_empleado: 50 });
    const res2 = (0, capa8_reglasBlandas_1.capa8_verificarDistribucionEquitativa)(empleado, historialCaso2, promedioGlobal);
    console.log(`Diferencia: ${res2.diferencia}`);
    console.log(`¿Viola regla? ${res2.viola ? "⚠️ SÍ" : "✅ NO"}`);
    if (res2.viola)
        console.log(`Mensaje: ${res2.mensaje}`);
    // CASO 3: Empleado con pocas asignaciones (Tiene 5 turnos) - OK (La regla solo checa exceso por ahora)
    console.log("\nCASO 3: Empleado con 5 asignaciones (Subcarga) - OK (Regla solo alerta exceso)");
    const historialCaso3 = Array(5).fill({ id_empleado: 50 });
    const res3 = (0, capa8_reglasBlandas_1.capa8_verificarDistribucionEquitativa)(empleado, historialCaso3, promedioGlobal);
    console.log(`Diferencia: ${res3.diferencia}`);
    console.log(`¿Viola regla? ${res3.viola ? "⚠️ SÍ" : "✅ NO"}`);
    console.log("\n==================================================");
}
testDistribucion();
