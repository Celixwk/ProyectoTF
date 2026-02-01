"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa5_GeneracionAsignacion_1 = require("../../../services/programacion/capa5.GeneracionAsignacion");
async function main() {
    console.log("------------------------------------------------------------");
    console.log("=== TEST EXTENSO: CAPA5_GENERAR_ASIGNACIONES_DIA ===");
    console.log("------------------------------------------------------------\n");
    const fechaHoy = new Date("2025-12-23");
    const areas = [
        { id_area: 1, nombre_area: "PUERTA PRINCIPAL", prioridad: 1 },
        { id_area: 2, nombre_area: "PARQUEADERO", prioridad: 2 },
        { id_area: 3, nombre_area: "CASETA POSTERIOR", prioridad: 3 }
    ];
    const maximosPorArea = new Map([
        [1, 2], // 2 empleados en PUERTA PRINCIPAL
        [2, 1], // 1 en PARQUEADERO
        [3, 1] // 1 en CASETA POSTERIOR
    ]);
    const turno = {
        id_turno: 1,
        hora_entrada: new Date("2025-12-23T06:00:00"),
        hora_salida: new Date("2025-12-23T14:00:00")
    };
    const empleados = [
        { id_empleado: 1, nombre_completo: "JUAN ESPECIALISTA", clasificacion: "especialista", areas: [{ id_area: 1, nombre_area: "PUERTA PRINCIPAL" }], disponible: true },
        { id_empleado: 2, nombre_completo: "MARIA FLEXIBLE", clasificacion: "flexible", areas: [{ id_area: 1, nombre_area: "PUERTA PRINCIPAL" }, { id_area: 2, nombre_area: "PARQUEADERO" }], disponible: true },
        { id_empleado: 3, nombre_completo: "PEDRO COMODIN", clasificacion: "comodin", areas: [], disponible: true },
        { id_empleado: 4, nombre_completo: "ANA ESPECIALISTA", clasificacion: "especialista", areas: [{ id_area: 3, nombre_area: "CASETA POSTERIOR" }], disponible: true },
        { id_empleado: 5, nombre_completo: "LUIS FLEXIBLE", clasificacion: "flexible", areas: [{ id_area: 2, nombre_area: "PARQUEADERO" }, { id_area: 3, nombre_area: "CASETA POSTERIOR" }], disponible: true }
    ];
    const historial = [
        { id_empleado: 1, id_area: 1, fecha: new Date("2025-12-22") },
        { id_empleado: 2, id_area: 2, fecha: new Date("2025-12-22") },
        { id_empleado: 2, id_area: 1, fecha: new Date("2025-12-21") }
    ];
    console.log("PARAMETROS DE PRUEBA EXTENSA:");
    console.log("- FECHA:", fechaHoy.toISOString().split("T")[0]);
    console.log("- ÁREAS: PUERTA PRINCIPAL (2), PARQUEADERO (1), CASETA POSTERIOR (1)");
    console.log("- EMPLEADOS: 5 disponibles (especialistas, flexibles y comodín)");
    console.log("------------------------------------------------------------\n");
    const resultado = (0, capa5_GeneracionAsignacion_1.capa5_generarAsignacionesDia)(empleados, empleados, areas, maximosPorArea, turno, fechaHoy, { programacionExistente: historial });
    console.log("RESULTADOS DE LA GENERACION:");
    console.table(resultado.detalles);
    console.log("ASIGNACIONES COMPLETAS:");
    console.table(resultado.asignaciones.map((a) => {
        var _a, _b;
        return ({
            AREA: a.id_area,
            EMPLEADO: a.id_empleado,
            FECHA: a.fecha.toISOString().split("T")[0],
            ENTRADA: (_a = a.hora_entrada) === null || _a === void 0 ? void 0 : _a.toISOString().split("T")[1],
            SALIDA: (_b = a.hora_salida) === null || _b === void 0 ? void 0 : _b.toISOString().split("T")[1]
        });
    }));
    console.log("------------------------------------------------------------");
    console.log("HUECOS DETECTADOS:");
    console.table(resultado.huecos);
    console.log("------------------------------------------------------------\n");
}
main().catch(err => {
    console.error("ERROR EN EL TEST EXTENSO:", err);
});
