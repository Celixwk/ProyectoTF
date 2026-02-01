"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa5_GeneracionAsignacion_1 = require("../../../services/programacion/capa5.GeneracionAsignacion");
function validadorMock() {
    return { valido: true };
}
async function main() {
    console.log("------------------------------------------------------------");
    console.log("=== TEST: CAPA5_SELECCION EMPLEADO PARA AREA ===");
    console.log("------------------------------------------------------------\n");
    const fechaHoy = new Date("2025-12-23");
    const turnoTest = {
        id_turno: 1,
        hora_entrada: new Date("2025-12-23T06:00:00"),
        hora_salida: new Date("2025-12-23T14:00:00")
    };
    const areaTest = {
        id_area: 6,
        nombre_area: "CASETA ENTRADA",
        prioridad: 1
    };
    const historial = [
        { id_empleado: 1, id_area: 6, fecha: new Date("2025-12-22") },
        { id_empleado: 1, id_area: 6, fecha: new Date("2025-12-21") },
        { id_empleado: 1, id_area: 6, fecha: new Date("2025-12-20") },
        { id_empleado: 2, id_area: 6, fecha: new Date("2025-12-19") }
    ];
    const empleados = [
        {
            id_empleado: 1,
            nombre_completo: "JUAN ESPECIALISTA",
            clasificacion: "especialista",
            disponible: true,
            areas: [{ id_area: 6 }]
        },
        {
            id_empleado: 2,
            nombre_completo: "MARIA FLEXIBLE",
            clasificacion: "flexible",
            disponible: true,
            areas: [{ id_area: 6 }]
        }
    ];
    console.log("ESCENARIO DE PRUEBA:");
    console.log("- JUAN: TRABAJO EL 22, 21 Y 20 (3 DIAS CONSECUTIVOS)");
    console.log("- REGLA: MAXIMO 3 DIAS CONSECUTIVOS");
    console.log("- RESULTADO ESPERADO: JUAN DEBE SER DESCARTADO Y ELEGIR A MARIA");
    console.log("------------------------------------------------------------\n");
    const resultado = (0, capa5_GeneracionAsignacion_1.capa5_seleccionarEmpleadoParaArea)(areaTest, empleados, turnoTest, fechaHoy, {
        programacionExistente: historial,
        validarReglasFn: validadorMock,
        maxDiasConsecutivos: 3
    });
    console.log("RESULTADOS DE LA SELECCION:");
    if (resultado.empleado) {
        const tablaResumen = [{
                AREA: areaTest.nombre_area,
                GANADOR: resultado.empleado.nombre_completo,
                SCORE: resultado.score,
                ESTADO: "EXITOSO"
            }];
        console.table(tablaResumen);
        if (resultado.empleado.id_empleado === 2) {
            console.log("VERIFICACION: CORRECTO. EL SISTEMA SALTO A JUAN POR AGOTAMIENTO.");
        }
    }
    else {
        console.log("FALLO: NO SE SELECCIONO NADIE. RAZON:", resultado.razon);
    }
    console.log("------------------------------------------------------------\n");
}
main().catch(err => {
    console.error("ERROR EN EL TEST:", err);
});
