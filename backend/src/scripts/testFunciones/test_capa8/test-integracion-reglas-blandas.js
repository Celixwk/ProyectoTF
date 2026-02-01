"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa8_reglasBlandas_1 = require("../../../services/programacion/capa8.reglasBlandas");
async function testIntegracionReglasBlandas() {
    console.log("==================================================");
    console.log("PRUEBA DE INTEGRACIÓN: REGLAS BLANDAS (CAPA 8)");
    console.log("==================================================");
    const empleado = {
        id_empleado: 99,
        nombre_completo: "Integracion User",
        cedula: "000",
        total_areas: 1,
        clasificacion: 'especialista',
        areas: [{ id_area: 1, nombre_area: "Zona" }],
        id_estado: 1,
        cargo: { id_cargo: 1, nombre_cargo: "Jefe" }
    };
    const area = { id_area: 1 };
    const turno = { id_turno: 1, hora_entrada: new Date(), hora_salida: new Date() };
    const fecha = new Date();
    const historial = [];
    // CASO 1: Sin violaciones - Lista limpia
    console.log("\nCASO 1: Asignación limpia (Sin historial conflictivo)");
    const res1 = (0, capa8_reglasBlandas_1.capa8_validarReglasBlandas)(empleado, area, turno, fecha, historial);
    console.log(`Violaciones: ${res1.violaciones.length}`);
    console.log(`Advertencias: ${res1.advertencias.length}`);
    if (res1.advertencias.length === 0)
        console.log("✅ SIN ADVERTENCIAS");
    // CASO 2: Violación múltiple (Repetición + Descanso)
    console.log("\nCASO 2: Violación múltiple (Repetición Área + Día de Descanso)");
    // Configurar repetición
    const fecha1 = new Date(fecha);
    fecha1.setDate(fecha.getDate() - 1);
    const fecha2 = new Date(fecha);
    fecha2.setDate(fecha.getDate() - 2);
    const fecha3 = new Date(fecha);
    fecha3.setDate(fecha.getDate() - 3);
    const historialMalo = [
        { id_empleado: 99, id_area: 1, fecha: fecha1 },
        { id_empleado: 99, id_area: 1, fecha: fecha2 },
        { id_empleado: 99, id_area: 1, fecha: fecha3 }
    ];
    // Configurar descanso
    const mapaDescansos = new Map();
    mapaDescansos.set(99, [fecha.getDate()]); // Descansa hoy
    const res2 = (0, capa8_reglasBlandas_1.capa8_validarReglasBlandas)(empleado, area, turno, fecha, historialMalo, {
        descansosProgramados: mapaDescansos,
        maxDiasConsecutivos: 3
    });
    console.log("Resultados obtenidos:");
    res2.violaciones.forEach(v => console.log(`🛑 VIOLACIÓN: ${v}`));
    res2.advertencias.forEach(a => console.log(`⚠️  ADVERTENCIA: ${a}`));
    // CASO 3: Ignorar reglas blandas
    console.log("\nCASO 3: Opción 'ignorarReglasBlandas' activada");
    const res3 = (0, capa8_reglasBlandas_1.capa8_validarReglasBlandas)(empleado, area, turno, fecha, historialMalo, {
        ignorarReglasBlandas: true
    });
    if (res3.violaciones.length === 0 && res3.advertencias.length === 0) {
        console.log("✅ SE IGNORARON TODAS LAS REGLAS CORRECTAMENTE");
    }
    else {
        console.log("❌ ERROR: No se ignoraron las reglas");
    }
    console.log("\n==================================================");
}
testIntegracionReglasBlandas();
