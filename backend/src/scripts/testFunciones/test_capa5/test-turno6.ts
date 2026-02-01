import { capa5_generarAsignacionesDia } from "../../../services/programacion/capa5.GeneracionAsignacion";

const turnoT6 = {
  id_turno: 9,
  tipo_turno: 'T6',
  hora_entrada: new Date("2025-12-23T08:00:00"),
  hora_salida: new Date("2025-12-23T12:00:00"),
  hora_entrada_2: new Date("2025-12-23T14:00:00"),
  hora_salida_2: new Date("2025-12-23T18:00:00"),
  duracion_horas: 8.00
} as any;

const empleadosDisponibles = [
  {
    id_empleado: 2,
    nombre_completo: "AISNIER LEONARDO CALDERON P.",
    clasificacion: "flexible",
    disponible: true,
    areas: [{ id_area: 2 }, { id_area: 7 }, { id_area: 8 }, { id_area: 10 }, { id_area: 4 }, { id_area: 9 }]
  } as any,
  {
    id_empleado: 1,
    nombre_completo: "ADOLFO LEON MUÑOZ B.",
    clasificacion: "especialista",
    disponible: true,
    areas: [{ id_area: 13 }]
  } as any
];

const areasPriorizadas = [
  { id_area: 2, nombre_area: "Puertas y Sala", prioridad: 1 },
  { id_area: 13, nombre_area: "Refuerzos", prioridad: 2 }
] as any[];

const maximosPorArea = new Map<number, number>([[2, 1], [13, 1]]);
const fechaTest = new Date('2025-12-23T00:00:00');
const validarReglasFn = () => ({ valido: true });

const resultado = capa5_generarAsignacionesDia(
  empleadosDisponibles,
  empleadosDisponibles,
  areasPriorizadas,
  maximosPorArea,
  turnoT6,
  fechaTest,
  { validarReglasFn }
);

console.log("\n--- RESULTADO DE ASIGNACIONES ---");
const tablaAsignaciones = resultado.asignaciones.map(asig => ({
  Empleado: empleadosDisponibles.find(e => e.id_empleado === asig.id_empleado)?.nombre_completo || 'N/A',
  Area: areasPriorizadas.find(a => a.id_area === asig.id_area)?.nombre_area || 'N/A',
  Entrada: asig.hora_entrada?.toLocaleTimeString() || 'N/A',
  Salida: asig.hora_salida?.toLocaleTimeString() || 'N/A',
  Bloques: asig.periodos?.length || 0
}));
console.table(tablaAsignaciones);

if (resultado.asignaciones.length === 0) {
  console.error("ERROR: No se generaron asignaciones.");
  process.exit(1);
}

const aisnier = resultado.asignaciones.find(a => a.id_empleado === 2);
if (!aisnier || !aisnier.periodos || aisnier.periodos.length !== 2) {
  console.error("ERROR: Turno T6 no reconocido como partido (se esperaban 2 bloques).");
  console.error("Periodos encontrados:", aisnier?.periodos);
  process.exit(1);
}

console.log("\n--- DETALLE DE PERIODOS (TURNO T6) ---");
const tablaPeriodos = aisnier.periodos.map((p: any, i: number) => ({
  Bloque: i + 1,
  Inicio: p.hora_entrada?.toLocaleTimeString(),
  Fin: p.hora_salida?.toLocaleTimeString()
}));
console.table(tablaPeriodos);

console.log("\n✅ Test finalizado correctamente - Turno T6 reconocido como PARTIDO");