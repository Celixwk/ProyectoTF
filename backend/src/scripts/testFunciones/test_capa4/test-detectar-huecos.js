"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa4_gestionHuecos_1 = require("../../../services/programacion/capa4.gestionHuecos");
async function main() {
    console.log("=== 🧪 Test: capa4_detectarHuecos ===\n");
    const fecha = new Date("2025-01-01");
    const areas = [
        { id_area: 1, nombre_area: "Sala Principal", prioridad: 6 },
        { id_area: 2, nombre_area: "Puertas y Sala", prioridad: 7 },
        { id_area: 6, nombre_area: "Caseta de Entrada", prioridad: 1 },
        { id_area: 7, nombre_area: "Caseta de Salida", prioridad: 2 },
        { id_area: 9, nombre_area: "Parqueadero 1", prioridad: 4 }
    ];
    const maximosPorArea = new Map([
        [1, 2],
        [2, 1],
        [6, 1],
        [7, 1],
        [9, 2],
    ]);
    const programacion = [
        { id_empleado: 10, id_area: 6, fecha, id_turno: 1 },
        { id_empleado: 11, id_area: 9, fecha, id_turno: 1 }
    ];
    console.log("\n📌 Programación actual");
    console.table(programacion);
    console.log("\n📌 Máximos por área");
    console.table(Array.from(maximosPorArea.entries()).map(([id_area, maximo]) => ({
        id_area,
        maximo_requerido: maximo
    })));
    const huecos = (0, capa4_gestionHuecos_1.capa4_detectarHuecos)(programacion, areas, fecha, maximosPorArea);
    console.log("\n📌 Huecos detectados");
    console.table(huecos.map(h => ({
        id_area: h.id_area,
        nombre_area: h.nombre_area,
        prioridad: h.prioridad,
        trabajadores_actuales: h.trabajadores_actuales,
        trabajadores_requeridos: h.trabajadores_requeridos,
        deficit: h.deficit
    })));
}
main().catch(err => {
    console.error("❌ Error en test-detectar-huecos:", err);
});
