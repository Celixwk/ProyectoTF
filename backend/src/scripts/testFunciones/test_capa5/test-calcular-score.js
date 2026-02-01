"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa5_GeneracionAsignacion_1 = require("../../../services/programacion/capa5.GeneracionAsignacion");
async function main() {
    console.log("------------------------------------------------------------");
    console.log("=== TEST: CAPA5_CALCULAR SCORE (LOGICA REAL SINCRONIZADA) ===");
    console.log("------------------------------------------------------------\n");
    const fechaHoy = new Date("2025-12-23");
    const historial = [
        { id_empleado: 1, id_area: 2, fecha: new Date("2025-12-20") },
        { id_empleado: 1, id_area: 3, fecha: new Date("2025-12-21") },
        { id_empleado: 2, id_area: 2, fecha: new Date("2025-12-22") },
        { id_empleado: 2, id_area: 2, fecha: new Date("2025-12-21") },
        { id_empleado: 2, id_area: 3, fecha: new Date("2025-12-20") }
    ];
    const empleados = [
        { id_empleado: 1, nombre_completo: "JUAN ESPECIALISTA", clasificacion: "especialista", areas: [] },
        { id_empleado: 2, nombre_completo: "MARIA FLEXIBLE", clasificacion: "flexible", areas: [] },
        { id_empleado: 3, nombre_completo: "PEDRO COMODIN", clasificacion: "comodin", areas: [] }
    ];
    console.log("PARAMETROS DE PRUEBA:");
    console.log("- AREA DE EVALUACION: 2");
    console.log("- REGLA APLICADA: BASE + (TOTAL * 10) + (REPETICIONES * 5) + (CONSECUTIVOS * 50)");
    console.log("------------------------------------------------------------\n");
    const resultados = empleados.map(emp => {
        const score = (0, capa5_GeneracionAsignacion_1.capa5_calcularScore)(emp, 2, historial, fechaHoy);
        let detalle = "";
        if (emp.clasificacion === "especialista") {
            detalle = "0 (BASE) + 20 (CARGA) + 5 (REP) + 0 (CONS) = 25";
        }
        if (emp.clasificacion === "flexible") {
            detalle = "50 (BASE) + 30 (CARGA) + 10 (REP) + 100 (2 DIAS CONS) = 190";
        }
        if (emp.clasificacion === "comodin") {
            detalle = "100 (BASE) + 0 (CARGA) + 0 (REP) + 0 (CONS) = 100";
        }
        return {
            ID: emp.id_empleado,
            NOMBRE: emp.nombre_completo,
            CLASIFICACION: emp.clasificacion.toUpperCase(),
            SCORE: score,
            DETALLE_CALCULO: detalle
        };
    });
    console.table(resultados);
    console.log("------------------------------------------------------------");
    console.log("ANALISIS DE RESULTADOS:");
    const ganador = [...resultados].sort((a, b) => a.SCORE - b.SCORE)[0];
    console.log("> GANADOR ACTUAL: ", ganador.NOMBRE);
    console.log("> MOTIVO: TIENE EL SCORE MAS BAJO (", ganador.SCORE, ")");
    console.log("------------------------------------------------------------\n");
}
main().catch(err => {
    console.error("ERROR EN EL TEST:", err);
});
