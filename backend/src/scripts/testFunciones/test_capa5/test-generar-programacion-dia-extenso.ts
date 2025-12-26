import { capa5_generarAsignacionesDia } from "../../../services/programacion/capa5.GeneracionAsignacion";
import type { EmpleadoDisponible, AreaPriorizada, Turno, Asignacion } from "../../../services/programacion/tipos";

async function main() {
    console.log("------------------------------------------------------------");
    console.log("=== TEST EXTENSO: CAPA5_GENERAR_ASIGNACIONES_DIA ===");
    console.log("------------------------------------------------------------\n");

    const fechaHoy = new Date("2025-12-23");

    const areas: AreaPriorizada[] = [
        { id_area: 1, nombre_area: "PUERTA PRINCIPAL", prioridad: 1 },
        { id_area: 2, nombre_area: "PARQUEADERO", prioridad: 2 },
        { id_area: 3, nombre_area: "CASETA POSTERIOR", prioridad: 3 }
    ];

    const maximosPorArea = new Map<number, number>([
        [1, 2], // 2 empleados en PUERTA PRINCIPAL
        [2, 1], // 1 en PARQUEADERO
        [3, 1]  // 1 en CASETA POSTERIOR
    ]);

    const turno: Turno = {
        id_turno: 1,
        hora_entrada: new Date("2025-12-23T06:00:00"),
        hora_salida: new Date("2025-12-23T14:00:00")
    };

    const empleados: EmpleadoDisponible[] = [
        { id_empleado: 1, nombre_completo: "JUAN ESPECIALISTA", clasificacion: "especialista", areas: [{ id_area: 1, nombre_area: "PUERTA PRINCIPAL" }], disponible: true } as any,
        { id_empleado: 2, nombre_completo: "MARIA FLEXIBLE", clasificacion: "flexible", areas: [{ id_area: 1, nombre_area: "PUERTA PRINCIPAL" }, { id_area: 2, nombre_area: "PARQUEADERO" }], disponible: true } as any,
        { id_empleado: 3, nombre_completo: "PEDRO COMODIN", clasificacion: "comodin", areas: [], disponible: true } as any,
        { id_empleado: 4, nombre_completo: "ANA ESPECIALISTA", clasificacion: "especialista", areas: [{ id_area: 3, nombre_area: "CASETA POSTERIOR" }], disponible: true } as any,
        { id_empleado: 5, nombre_completo: "LUIS FLEXIBLE", clasificacion: "flexible", areas: [{ id_area: 2, nombre_area: "PARQUEADERO" }, { id_area: 3, nombre_area: "CASETA POSTERIOR" }], disponible: true } as any
    ];

    const historial: Asignacion[] = [
        { id_empleado: 1, id_area: 1, fecha: new Date("2025-12-22") } as any,
        { id_empleado: 2, id_area: 2, fecha: new Date("2025-12-22") } as any,
        { id_empleado: 2, id_area: 1, fecha: new Date("2025-12-21") } as any
    ];

    console.log("PARAMETROS DE PRUEBA EXTENSA:");
    console.log("- FECHA:", fechaHoy.toISOString().split("T")[0]);
    console.log("- ÁREAS: PUERTA PRINCIPAL (2), PARQUEADERO (1), CASETA POSTERIOR (1)");
    console.log("- EMPLEADOS: 5 disponibles (especialistas, flexibles y comodín)");
    console.log("------------------------------------------------------------\n");

    const resultado = capa5_generarAsignacionesDia(
        empleados,
        empleados,
        areas,
        maximosPorArea,
        turno,
        fechaHoy,
        { programacionExistente: historial }
    );

    console.log("RESULTADOS DE LA GENERACION:");
    console.table(resultado.detalles);

    console.log("ASIGNACIONES COMPLETAS:");
    console.table(resultado.asignaciones.map((a: Asignacion) => ({
        AREA: a.id_area,
        EMPLEADO: a.id_empleado,
        FECHA: a.fecha.toISOString().split("T")[0],
        ENTRADA: a.hora_entrada?.toISOString().split("T")[1],
        SALIDA: a.hora_salida?.toISOString().split("T")[1]
    })));

    console.log("------------------------------------------------------------");
    console.log("HUECOS DETECTADOS:");
    console.table(resultado.huecos);
    console.log("------------------------------------------------------------\n");
}

main().catch(err => {
    console.error("ERROR EN EL TEST EXTENSO:", err);
});
