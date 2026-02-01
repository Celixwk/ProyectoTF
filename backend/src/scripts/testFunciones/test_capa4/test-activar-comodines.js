"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa4_gestionHuecos_1 = require("../../../services/programacion/capa4.gestionHuecos");
function validadorMock(empleado, area, turno, fecha, programacionExistente) {
    return { valido: true };
}
async function main() {
    console.log("=== 🧪 Test: capa4_activarComodines ===\n");
    const fecha = new Date("2025-01-01");
    const turno = {
        id_turno: 1,
        hora_entrada: new Date("2025-01-01T06:00:00"),
        hora_salida: new Date("2025-01-01T14:00:00"),
    };
    const huecos = [
        { id_area: 6, nombre_area: "Caseta de Entrada", deficit: 1, prioridad: 1, trabajadores_actuales: 0, trabajadores_requeridos: 1 },
        { id_area: 9, nombre_area: "Parqueadero 1", deficit: 1, prioridad: 4, trabajadores_actuales: 1, trabajadores_requeridos: 2 },
    ];
    console.log("\n📌 Huecos detectados");
    console.table(huecos);
    const comodines = [
        {
            id_empleado: 20,
            id_estado: 1,
            nombre_completo: "CARLOS COMODÍN",
            clasificacion: "comodin",
            areas: [
                { id_area: 6, nombre_area: "Caseta de Entrada" },
                { id_area: 9, nombre_area: "Parqueadero 1" }
            ],
            cedula: "1234567890",
            total_areas: 2,
            activo: true
        },
        {
            id_empleado: 21,
            id_estado: 1,
            nombre_completo: "LUIS FLEXIBLE",
            clasificacion: "flexible",
            areas: [{ id_area: 9, nombre_area: "Parqueadero 1" }],
            cedula: "987654321",
            total_areas: 1,
            activo: true
        }
    ];
    console.log("\n📌 Comodines disponibles");
    console.table(comodines.map(c => ({
        id_empleado: c.id_empleado,
        nombre_completo: c.nombre_completo,
        areas: c.areas.map(a => a.nombre_area).join(", ")
    })));
    const empleadosAsignados = new Set();
    const programacion = [];
    const empleadosDisponiblesInfo = [
        { id_empleado: 20, disponible: true },
        { id_empleado: 21, disponible: true }
    ];
    const activados = (0, capa4_gestionHuecos_1.capa4_activarComodines)(huecos, comodines, empleadosAsignados, fecha, turno, programacion, empleadosDisponiblesInfo, validadorMock);
    console.log("\n📌 Comodines activados");
    console.table(activados.map(a => ({
        id_empleado: a.empleado.id_empleado,
        nombre: a.empleado.nombre_completo,
        area_cubierta: a.area,
        hueco_en: a.hueco.nombre_area
    })));
}
main().catch(err => {
    console.error("❌ Error en test-activar-comodines:", err);
});
