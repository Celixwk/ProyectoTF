"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa7_reglasDuras_1 = require("../../../services/programacion/capa7.reglasDuras");
async function testHorasMaximas() {
    console.log("==================================================");
    console.log("PRUEBA DE REGLAS DURAS: HORAS MÁXIMAS (CAPA 7)");
    console.log("==================================================");
    // CASO 1: Turno Normal (8 horas) - Debe APROBAR
    console.log("\nCASO 1: Turno de 8 horas (<= 12)");
    const turnoNormal = { duracion_horas: 8 };
    const resultado1 = (0, capa7_reglasDuras_1.capa7_verificarHorasMaximas)(turnoNormal);
    console.log(`Resultado: ${resultado1.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!resultado1.valido)
        console.log(`Razón: ${resultado1.razon}`);
    // CASO 2: Turno Excesivo (14 horas) - Debe RECHAZAR
    console.log("\nCASO 2: Turno de 14 horas (> 12)");
    const turnoExcesivo = { duracion_horas: 14 };
    const resultado2 = (0, capa7_reglasDuras_1.capa7_verificarHorasMaximas)(turnoExcesivo);
    console.log(`Resultado: ${resultado2.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!resultado2.valido)
        console.log(`Razón: ${resultado2.razon}`);
    // CASO 3: Turno sin duración definida - Debe APROBAR (o manejar graceful)
    console.log("\nCASO 3: Turno sin duración explícita");
    const turnoSinInfo = { duracion_horas: null }; // o undefined
    const resultado3 = (0, capa7_reglasDuras_1.capa7_verificarHorasMaximas)(turnoSinInfo);
    console.log(`Resultado: ${resultado3.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!resultado3.valido)
        console.log(`Razón: ${resultado3.razon}`);
    // CASO 4: Límite personalizado (Ej: max 6 horas)
    console.log("\nCASO 4: Límite personalizado (Máx 6 horas, Turno 8 horas)");
    const resultado4 = (0, capa7_reglasDuras_1.capa7_verificarHorasMaximas)(turnoNormal, 6);
    console.log(`Resultado: ${resultado4.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!resultado4.valido)
        console.log(`Razón: ${resultado4.razon}`);
    console.log("\n==================================================");
    console.log("FIN DE PRUEBAS DE HORAS MÁXIMAS");
}
testHorasMaximas();
