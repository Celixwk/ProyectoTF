"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa5_GeneracionAsignacion_1 = require("../../../services/programacion/capa5.GeneracionAsignacion");
const turnoT6 = {
    id_turno: 9,
    tipo_turno: 'T6',
    hora_entrada: new Date("2025-12-23T08:00:00"),
    hora_salida: new Date("2025-12-23T12:00:00"),
    hora_entrada_2: new Date("2025-12-23T14:00:00"),
    hora_salida_2: new Date("2025-12-23T18:00:00"),
    duracion_horas: 8.00
};
const empleadosDisponibles = [
    {
        id_empleado: 2,
        nombre_completo: "AISNIER LEONARDO CALDERON P.",
        clasificacion: "flexible",
        disponible: true,
        areas: [{ id_area: 2 }, { id_area: 7 }, { id_area: 8 }, { id_area: 10 }, { id_area: 4 }, { id_area: 9 }]
    },
    {
        id_empleado: 1,
        nombre_completo: "ADOLFO LEON MUÑOZ B.",
        clasificacion: "especialista",
        disponible: true,
        areas: [{ id_area: 13 }]
    }
];
const areasPriorizadas = [
    { id_area: 2, nombre_area: "Puertas y Sala", prioridad: 1 },
    { id_area: 13, nombre_area: "Refuerzos", prioridad: 2 }
];
const maximosPorArea = new Map([[2, 1], [13, 1]]);
const fechaTest = new Date('2025-12-23T00:00:00');
const validarReglasFn = () => ({ valido: true });
const resultado = (0, capa5_GeneracionAsignacion_1.capa5_generarAsignacionesDia)(empleadosDisponibles, empleadosDisponibles, areasPriorizadas, maximosPorArea, turnoT6, fechaTest, { validarReglasFn });
console.log("\n--- RESULTADO DE ASIGNACIONES ---");
const tablaAsignaciones = resultado.asignaciones.map(asig => {
    var _a, _b, _c, _d, _e;
    return ({
        Empleado: ((_a = empleadosDisponibles.find(e => e.id_empleado === asig.id_empleado)) === null || _a === void 0 ? void 0 : _a.nombre_completo) || 'N/A',
        Area: ((_b = areasPriorizadas.find(a => a.id_area === asig.id_area)) === null || _b === void 0 ? void 0 : _b.nombre_area) || 'N/A',
        Entrada: ((_c = asig.hora_entrada) === null || _c === void 0 ? void 0 : _c.toLocaleTimeString()) || 'N/A',
        Salida: ((_d = asig.hora_salida) === null || _d === void 0 ? void 0 : _d.toLocaleTimeString()) || 'N/A',
        Bloques: ((_e = asig.periodos) === null || _e === void 0 ? void 0 : _e.length) || 0
    });
});
console.table(tablaAsignaciones);
if (resultado.asignaciones.length === 0) {
    console.error("ERROR: No se generaron asignaciones.");
    process.exit(1);
}
const aisnier = resultado.asignaciones.find(a => a.id_empleado === 2);
if (!aisnier || !aisnier.periodos || aisnier.periodos.length !== 2) {
    console.error("ERROR: Turno T6 no reconocido como partido (se esperaban 2 bloques).");
    console.error("Periodos encontrados:", aisnier === null || aisnier === void 0 ? void 0 : aisnier.periodos);
    process.exit(1);
}
console.log("\n--- DETALLE DE PERIODOS (TURNO T6) ---");
const tablaPeriodos = aisnier.periodos.map((p, i) => {
    var _a, _b;
    return ({
        Bloque: i + 1,
        Inicio: (_a = p.hora_entrada) === null || _a === void 0 ? void 0 : _a.toLocaleTimeString(),
        Fin: (_b = p.hora_salida) === null || _b === void 0 ? void 0 : _b.toLocaleTimeString()
    });
});
console.table(tablaPeriodos);
console.log("\n✅ Test finalizado correctamente - Turno T6 reconocido como PARTIDO");
