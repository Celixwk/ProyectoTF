"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa7_reglasDuras_1 = require("../../../services/programacion/capa7.reglasDuras");
async function testTurnosSimultaneos() {
    console.log("==================================================");
    console.log("PRUEBA DE REGLAS DURAS: TURNOS SIMULTÁNEOS (CAPA 7)");
    console.log("==================================================");
    // Mock Empleado
    const empleado = {
        id_empleado: 1,
        nombre_completo: "Test User",
        cedula: "123456",
        total_areas: 1,
        clasificacion: 'especialista',
        areas: [{ id_area: 1, nombre_area: "Cajas" }],
        id_estado: 1,
        cargo: { id_cargo: 1, nombre_cargo: "Cajero" }
    };
    const fechaPrueba = new Date(2023, 10, 15); // 15 de Noviembre
    // CASO 1: Sin coincidencias (Mañana vs Noche) - Debe APROBAR
    console.log("\nCASO 1: Turno Nuevo (Mañana) vs Existente (Noche) - NO SOLAPAN");
    console.log("Existente: 20:00 - 04:00 | Nuevo: 08:00 - 16:00");
    // Crear asignaciones con fechas completas para comparar correctamente
    const fechaBase = new Date(fechaPrueba);
    const inicioNoche = new Date(fechaBase);
    inicioNoche.setHours(20, 0, 0);
    const finNoche = new Date(fechaBase);
    finNoche.setHours(4, 0, 0); // Ojo: cruza día, pero para simplificar test usamos mismo día next
    finNoche.setDate(finNoche.getDate() + 1);
    const programacionCaso1 = [{
            id_asignacion: 1, // Mock
            id_empleado: 1,
            fecha: fechaBase, // Misma fecha base para que el filtro lo encuentre
            id_turno: 100, // Mock
            hora_entrada: inicioNoche,
            hora_salida: finNoche
        }];
    const inicioManana = new Date(fechaBase);
    inicioManana.setHours(8, 0, 0);
    const finManana = new Date(fechaBase);
    finManana.setHours(16, 0, 0);
    // Cast manual para evitar conflictos con tipos estrictos si faltan propiedades opcionales
    const turnoNuevo1 = {
        id_turno: 200,
        hora_entrada: inicioManana,
        hora_salida: finManana
    };
    const res1 = (0, capa7_reglasDuras_1.capa7_verificarTurnosSimultaneos)(empleado, turnoNuevo1, fechaBase, programacionCaso1);
    console.log(`Resultado: ${res1.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!res1.valido)
        console.log(`Razón: ${res1.razon}`);
    // CASO 2: Solapamiento Total (Mismo horario) - Debe RECHAZAR
    console.log("\nCASO 2: Turno Nuevo vs Existente (Mismo horario) - SOLAPAN");
    const programacionCaso2 = [{
            id_asignacion: 2,
            id_empleado: 1,
            fecha: fechaBase,
            id_turno: 200,
            hora_entrada: inicioManana,
            hora_salida: finManana
        }];
    const res2 = (0, capa7_reglasDuras_1.capa7_verificarTurnosSimultaneos)(empleado, turnoNuevo1, fechaBase, programacionCaso2);
    console.log(`Resultado: ${res2.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!res2.valido)
        console.log(`Razón: ${res2.razon}`);
    // CASO 3: Solapamiento Parcial - Debe RECHAZAR
    console.log("\nCASO 3: Solapamiento Parcial");
    console.log("Existente: 08:00 - 16:00 | Nuevo: 14:00 - 22:00");
    const inicioTarde = new Date(fechaBase);
    inicioTarde.setHours(14, 0, 0);
    const finTarde = new Date(fechaBase);
    finTarde.setHours(22, 0, 0);
    const turnoNuevo3 = {
        id_turno: 300,
        hora_entrada: inicioTarde,
        hora_salida: finTarde
    };
    const res3 = (0, capa7_reglasDuras_1.capa7_verificarTurnosSimultaneos)(empleado, turnoNuevo3, fechaBase, programacionCaso2); // Usamos el de mañana
    console.log(`Resultado: ${res3.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!res3.valido)
        console.log(`Razón: ${res3.razon}`);
    console.log("\nCASO 4: Igualdad de límites (12:00 exacta)");
    const finExacto = new Date(fechaBase);
    finExacto.setHours(12, 0, 0);
    const inicioExacto = new Date(fechaBase);
    inicioExacto.setHours(12, 0, 0);
    const finTarde2 = new Date(fechaBase);
    finTarde2.setHours(20, 0, 0);
    const programacionCaso4 = [{
            id_asignacion: 4,
            id_empleado: 1,
            fecha: fechaBase,
            hora_entrada: inicioManana,
            hora_salida: finExacto
        }];
    const turnoNuevo4 = {
        id_turno: 400,
        hora_entrada: inicioExacto,
        hora_salida: finTarde2
    };
    const res4 = (0, capa7_reglasDuras_1.capa7_verificarTurnosSimultaneos)(empleado, turnoNuevo4, fechaBase, programacionCaso4);
    console.log(`Resultado: ${res4.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    console.log("\nCASO 5: Formatos Mixtos (Entrada como String ISO)");
    const turnoNuevo5 = {
        id_turno: 500,
        hora_entrada: "2023-11-15T08:30:00.000Z",
        hora_salida: "2023-11-15T15:30:00.000Z"
    };
    const res5 = (0, capa7_reglasDuras_1.capa7_verificarTurnosSimultaneos)(empleado, turnoNuevo5, fechaBase, programacionCaso2);
    console.log(`Resultado: ${res5.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!res5.valido)
        console.log(`Razón: ${res5.razon}`);
    console.log("\nCASO 6: Turno Partido (Nuevo solapa con el segundo bloque)");
    const programacionCaso6 = [{
            id_asignacion: 6,
            id_empleado: 1,
            fecha: fechaBase,
            periodos: [
                { hora_entrada: new Date(2023, 10, 15, 8, 0), hora_salida: new Date(2023, 10, 15, 12, 0) },
                { hora_entrada: new Date(2023, 10, 15, 14, 0), hora_salida: new Date(2023, 10, 15, 18, 0) }
            ]
        }];
    const turnoNuevo6 = {
        id_turno: 600,
        hora_entrada: new Date(2023, 10, 15, 15, 0),
        hora_salida: new Date(2023, 10, 15, 20, 0)
    };
    const res6 = (0, capa7_reglasDuras_1.capa7_verificarTurnosSimultaneos)(empleado, turnoNuevo6, fechaBase, programacionCaso6);
    console.log(`Resultado: ${res6.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!res6.valido)
        console.log(`Razón: ${res6.razon}`);
    console.log("\n==================================================");
}
testTurnosSimultaneos();
