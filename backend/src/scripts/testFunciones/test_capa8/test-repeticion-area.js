"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa8_reglasBlandas_1 = require("../../../services/programacion/capa8.reglasBlandas");
async function testRepeticionArea() {
    console.log("==================================================");
    console.log("PRUEBA DE REGLAS BLANDAS: REPETICIÓN DE ÁREA (CAPA 8)");
    console.log("==================================================");
    // Mock Empleado
    const empleado = {
        id_empleado: 1,
        nombre_completo: "Test User",
        cedula: "123",
        total_areas: 1,
        clasificacion: 'especialista',
        areas: [{ id_area: 1, nombre_area: "Cajas" }],
        id_estado: 1,
        cargo: { id_cargo: 1, nombre_cargo: "Cajero" }
    };
    const area = { id_area: 1 };
    const maxDias = 3;
    const fechaActual = new Date(2023, 10, 15); // 15 Nov
    // CASO 1: Sin historial previo (0 días consecutivos) - OK
    console.log("\nCASO 1: Sin historial previo");
    const historialVacio = [];
    const res1 = (0, capa8_reglasBlandas_1.capa8_verificarRepeticionArea)(empleado, area, fechaActual, historialVacio, maxDias);
    console.log(`Días consecutivos: ${res1.diasConsecutivos}`);
    console.log(`¿Viola regla? ${res1.viola ? "⚠️ SÍ" : "✅ NO"}`);
    // CASO 2: 2 días consecutivos previos (Total con hoy = 3) - DEBERÍA ALERTAR
    console.log("\nCASO 2: 2 días consecutivos previos (Total 3) - Aceptable pero al límite");
    // Fechas: 14 y 13 de Noviembre
    const fecha1 = new Date(fechaActual);
    fecha1.setDate(fechaActual.getDate() - 1);
    const fecha2 = new Date(fechaActual);
    fecha2.setDate(fechaActual.getDate() - 2);
    const historialCaso2 = [
        { id_empleado: 1, id_area: 1, fecha: fecha1 },
        { id_empleado: 1, id_area: 1, fecha: fecha2 }
    ];
    const res2 = (0, capa8_reglasBlandas_1.capa8_verificarRepeticionArea)(empleado, area, fechaActual, historialCaso2, maxDias);
    console.log(`Días consecutivos encontrados: ${res2.diasConsecutivos}`);
    console.log(`¿Viola regla? ${res2.viola ? "⚠️ SÍ" : "✅ NO"}`);
    // Nota: El código cuenta "hacia atrás", si encuentra 2, y max es 3.
    // Si la lógica es "ya lleva 2", hoy sería el 3ro. Depende de si la función cuenta el día actual o solo pasados.
    // Viendo el código: "Contar días consecutivos hacia atrás". 
    // CASO 3: 3 días consecutivos previos (Total con hoy = 4) - VIOLACIÓN
    console.log("\nCASO 3: 3 días consecutivos previos (Total 4) - VIOLACIÓN");
    const fecha3 = new Date(fechaActual);
    fecha3.setDate(fechaActual.getDate() - 3);
    const historialCaso3 = [
        ...historialCaso2,
        { id_empleado: 1, id_area: 1, fecha: fecha3 }
    ];
    const res3 = (0, capa8_reglasBlandas_1.capa8_verificarRepeticionArea)(empleado, area, fechaActual, historialCaso3, maxDias);
    console.log(`Días consecutivos encontrados: ${res3.diasConsecutivos}`);
    console.log(`¿Viola regla? ${res3.viola ? "⚠️ SÍ" : "✅ NO"}`);
    if (res3.viola)
        console.log(`Mensaje: ${res3.mensaje}`);
    // CASO 4: Racha interrumpida
    console.log("\nCASO 4: Racha interrumpida (Trabajó hace 1 día, pero no hace 2)");
    const historialCaso4 = [
        { id_empleado: 1, id_area: 1, fecha: fecha1 },
        // Falta fecha2
        { id_empleado: 1, id_area: 1, fecha: fecha3 }
    ];
    const res4 = (0, capa8_reglasBlandas_1.capa8_verificarRepeticionArea)(empleado, area, fechaActual, historialCaso4, maxDias);
    console.log(`Días consecutivos encontrados: ${res4.diasConsecutivos}`);
    console.log(`¿Viola regla? ${res4.viola ? "⚠️ SÍ" : "✅ NO"}`);
    console.log("\n==================================================");
}
testRepeticionArea();
