import { capa5_generarAsignacionesDia } from "../../../services/programacion/capa5.GeneracionAsignacion";
import type { EmpleadoDisponible, AreaPriorizada, Turno } from "../../../services/programacion/tipos";

async function main() {
    console.log("------------------------------------------------------------");
    console.log("=== TEST: EXCLUSIÓN Y FALLBACK DE REFUERZOS (CAPA 5) ===");
    console.log("------------------------------------------------------------\n");

    const fechaHoy = new Date("2025-06-01T00:00:00");

    const areas: AreaPriorizada[] = [
        { id_area: 6, nombre_area: "CASETA ENTRADA", prioridad: 1 },
        { id_area: 13, nombre_area: "REFUERZOS", prioridad: 99 }
    ];

    const maximosPorArea = new Map<number, number>([
        [6, 3],
        [13, 10]
    ]);

    const turno: Turno = {
        id_turno: 1,
        hora_entrada: new Date("2025-06-01T06:00:00"),
        hora_salida: new Date("2025-06-01T14:00:00")
    };

    const empleadosMock: EmpleadoDisponible[] = [
        {
            id_empleado: 6,
            nombre_completo: "CARLOS (ESPECIALISTA)",
            clasificacion: "especialista",
            disponible: true,
            areas: [{ id_area: 6, nombre_area: "CASETA ENTRADA" }],
            cedula: "101", total_areas: 1
        } as any,
        {
            id_empleado: 1,
            nombre_completo: "ADOLFO (REFUERZO)",
            clasificacion: "flexible",
            disponible: true,
            areas: [{ id_area: 13, nombre_area: "REFUERZOS" }],
            cedula: "102", total_areas: 1
        } as any,
        {
            id_empleado: 35,
            nombre_completo: "WILLIAM (REFUERZO)",
            clasificacion: "flexible",
            disponible: true,
            areas: [{ id_area: 13, nombre_area: "REFUERZOS" }],
            cedula: "103", total_areas: 1
        } as any
    ];

    const resultado = capa5_generarAsignacionesDia(
        [],
        empleadosMock,
        areas,
        maximosPorArea,
        turno,
        fechaHoy,
        {
            programacionExistente: [],
            penalizacionRefuerzoFallback: 500
        }
    );

    console.log("RESULTADOS DE LA ASIGNACIÓN:");
    console.table(resultado.detalles.map(d => ({
        AREA: d.area,
        EMPLEADO: d.empleado,
        SCORE: d.score,
        FUENTE: d.fuente
    })));

    console.log("------------------------------------------------------------");
    console.log("ANÁLISIS DE HUECOS (Debe ignorar ID 13):");
    console.table(resultado.huecos);
    console.log("------------------------------------------------------------\n");
}

main().catch(err => {
    console.error("ERROR EN EL TEST DE EXCLUSIÓN:", err);
});