"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa5_GeneracionAsignacion_1 = require("../../../services/programacion/capa5.GeneracionAsignacion");
async function main() {
    console.log("------------------------------------------------------------");
    console.log("=== TEST: CAPA5_GENERAR_ASIGNACIONES_DIA ===");
    console.log("------------------------------------------------------------\n");
    const fechaHoy = new Date("2025-12-23");
    const areas = [
        { id_area: 1, nombre_area: "PUERTA PRINCIPAL", prioridad: 1 },
        { id_area: 2, nombre_area: "PARQUEADERO", prioridad: 2 }
    ];
    const maximosPorArea = new Map([
        [1, 1],
        [2, 1]
    ]);
    const turno = {
        id_turno: 1,
        hora_entrada: new Date("2025-12-23T06:00:00"),
        hora_salida: new Date("2025-12-23T14:00:00")
    };
    const empleados = [
        {
            id_empleado: 1,
            nombre_completo: "JUAN ESPECIALISTA",
            clasificacion: "especialista",
            areas: [{ id_area: 1, nombre_area: "PUERTA PRINCIPAL" }],
            cedula: "111",
            total_areas: 1,
            disponible: true
        },
        {
            id_empleado: 2,
            nombre_completo: "MARIA FLEXIBLE",
            clasificacion: "flexible",
            areas: [
                { id_area: 1, nombre_area: "PUERTA PRINCIPAL" },
                { id_area: 2, nombre_area: "PARQUEADERO" }
            ],
            cedula: "222",
            total_areas: 2,
            disponible: true
        },
        {
            id_empleado: 3,
            nombre_completo: "PEDRO COMODIN",
            clasificacion: "comodin",
            areas: [],
            cedula: "333",
            total_areas: 5,
            disponible: true
        }
    ];
    console.log("PARAMETROS DE PRUEBA:");
    console.log("- FECHA:", fechaHoy.toISOString().split("T")[0]);
    console.log("- AREAS: PUERTA PRINCIPAL (1), PARQUEADERO (2)");
    console.log("- MAXIMOS: 1 EMPLEADO POR AREA");
    console.log("------------------------------------------------------------\n");
    const resultado = (0, capa5_GeneracionAsignacion_1.capa5_generarAsignacionesDia)(empleados, empleados, areas, maximosPorArea, turno, fechaHoy, { programacionExistente: [] });
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
    console.error("ERROR EN EL TEST DE GENERACION:", err);
});
