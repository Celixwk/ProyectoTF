import { capa5_generarAsignacionesDia, capa5_seleccionarEmpleadoParaArea } from "../../../services/programacion/capa5.GeneracionAsignacion";
import { AreaPriorizada, Turno, EmpleadoDisponible, Asignacion } from "../../../services/programacion/tipos";


function printHeader(title: string) {
    console.log("------------------------------------------------------------");
    console.log(`=== ${title} ===`);
    console.log("------------------------------------------------------------\n");
}

const AREAS_MOCK: AreaPriorizada[] = [
    { id_area: 1, nombre_area: "Sala Principal", prioridad: 1 },
    { id_area: 6, nombre_area: "Caseta de Entrada", prioridad: 2 },
    { id_area: 13, nombre_area: "Refuerzos", prioridad: 99 }
];

const TURN_TEST: Turno = {
    id_turno: 6,
    hora_entrada: new Date("2025-06-01T09:00:00"),
    hora_salida: new Date("2025-06-01T13:00:00"),
    hora_entrada_2: new Date("2025-06-01T17:00:00"),
    hora_salida_2: new Date("2025-06-01T21:00:00")
};

const EMPLEADOS_MOCK: EmpleadoDisponible[] = [
    {
        id_empleado: 6,
        nombre_completo: "CARLOS ROBERTO GOMEZ",
        clasificacion: "especialista",
        areas: [{ id_area: 1, nombre_area: "Sala Principal" }],
        disponible: true
    } as any,
    {
        id_empleado: 1,
        nombre_completo: "ADOLFO LEON MUÑOZ B.",
        clasificacion: "flexible",
        areas: [{ id_area: 13, nombre_area: "Refuerzos" }],
        disponible: true
    } as any,
    {
        id_empleado: 35,
        nombre_completo: "WILLIAM GUTIERREZ",
        clasificacion: "flexible",
        areas: [{ id_area: 13, nombre_area: "Refuerzos" }],
        disponible: true
    } as any
];

async function testEspecialistaVsRefuerzo() {
    printHeader("TEST 1: Especialista vs Refuerzo (pool primario debe ganar)");
    const fecha = new Date("2025-06-01T00:00:00");
    const maximos = new Map<number, number>([[1, 1]]);
    const resultado = capa5_generarAsignacionesDia([], EMPLEADOS_MOCK, AREAS_MOCK, maximos, TURN_TEST, fecha, { penalizacionRefuerzoFallback: 500 });
    console.table(resultado.detalles);
}

async function testFallbackRefuerzoCubreHueco() {
    printHeader("TEST 2: Pool primario vacío -> Refuerzo como fallback");
    const fecha = new Date("2025-06-01T00:00:00");
    const maximos = new Map<number, number>([[6, 1]]);
    const candidatos: EmpleadoDisponible[] = [{ ...EMPLEADOS_MOCK[1] }, { ...EMPLEADOS_MOCK[2] }];
    const resultado = capa5_generarAsignacionesDia([], candidatos, AREAS_MOCK.filter(a => a.id_area === 6 || a.id_area === 13), maximos, TURN_TEST, fecha, { penalizacionRefuerzoFallback: 300, areasQueUsanRefuerzo: new Set<number>([6]) });
    console.table(resultado.detalles);
    console.table(resultado.huecos);
}

async function testFallbackDeshabilitadoProduceHueco() {
    printHeader("TEST 3: Fallback deshabilitado -> debe quedar hueco");
    const fecha = new Date("2025-06-01T00:00:00");
    const maximos = new Map<number, number>([[6, 1]]);
    const candidatos: EmpleadoDisponible[] = [{ ...EMPLEADOS_MOCK[1] }];
    const resultado = capa5_generarAsignacionesDia([], candidatos, AREAS_MOCK.filter(a => a.id_area === 6 || a.id_area === 13), maximos, TURN_TEST, fecha, { permitirRefuerzoComoFallback: false });
    console.table(resultado.detalles);
    console.table(resultado.huecos);
}

async function testSeleccionDirecta() {
    printHeader("TEST 4: Selección directa con días consecutivos");
    const fecha = new Date("2025-12-23T00:00:00");
    const historial: Asignacion[] = [
        { id_empleado: 6, id_area: 6, fecha: new Date("2025-12-22T00:00:00") } as any,
        { id_empleado: 6, id_area: 6, fecha: new Date("2025-12-21T00:00:00") } as any,
        { id_empleado: 6, id_area: 6, fecha: new Date("2025-12-20T00:00:00") } as any
    ];

    const areaTest = AREAS_MOCK.find(a => a.id_area === 6)!;
    const resultado = capa5_seleccionarEmpleadoParaArea(areaTest, [
        { id_empleado: 6, nombre_completo: "CARLOS ROBERTO GOMEZ", clasificacion: "especialista", areas: [{ id_area: 6 }], disponible: true } as any,
        { id_empleado: 2, nombre_completo: "MARIA FLEXIBLE", clasificacion: "flexible", areas: [{ id_area: 6 }], disponible: true } as any
    ], TURN_TEST, fecha, { programacionExistente: historial, maxDiasConsecutivos: 3, validarReglasFn: () => ({ valido: true }) });
    console.table([{ AREA: areaTest.nombre_area, GANADOR: resultado.empleado?.nombre_completo, SCORE: resultado.score, FUENTE: resultado.fuente }]);
}

async function main() {
    await testEspecialistaVsRefuerzo();
    await testFallbackRefuerzoCubreHueco();
    await testFallbackDeshabilitadoProduceHueco();
    await testSeleccionDirecta();
}

main().catch(err => console.error("ERROR EN TEST-EXCLUSION-REFUERZOS-4IN1:", err));
