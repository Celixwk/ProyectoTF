import { capa7_validarReglasDuras } from "../../../services/programacion";
import { capa4_activarComodines } from "../../../services/programacion/capa4.gestionHuecos";
import type { EmpleadoOrdenado, Asignacion, Hueco } from "../../../services/programacion/tipos";

async function main() {
    console.log("Test de activación de comodines");

    const fecha = new Date("2025-01-01");
    const turno = {
        id_turno: 1,
        hora_entrada: new Date("2025-01-01T06:00:00"),
        hora_salida: new Date("2025-01-01T14:00:00"),
        tipo_turno: "Diurno"
    }

    const huecos: Hueco[] = [
        {
            id_area: 6, nombre_area: "Caseta de Entrada",
            deficit: 1,
            prioridad: 1,
            trabajadores_actuales: 0,
            trabajadores_requeridos: 1
        },
        {
            id_area: 9, nombre_area: "Parqueadero 1",
            deficit: 1,
            prioridad: 1,
            trabajadores_actuales: 0,
            trabajadores_requeridos: 2
        } 
        
    ];

    console.log("\n=============================="); 
    console.log(" 📌 Huecos detectados"); 
    console.log("==============================");
    console.table(huecos);

    const comodines: EmpleadoOrdenado[] = [
        {
            id_empleado: 20,
            id_estado: 1,
            nombre_completo: "CARLOS COMODÍN",
            clasificacion: "comodin",
            areas: [{ id_area: 6, nombre_area: "Caseta de Entrada" },
            { id_area: 9, nombre_area: "Parqueadero 1" }],
            cedula: "1234567890",
            total_areas: 2,
            activo: true
        }, 
        {
            id_empleado: 21,
            id_estado: 1,
            nombre_completo: "LUIS FLEXIBLE",
            clasificacion: "flexible",
            areas: [{
                id_area: 9,
                nombre_area: "Parqueadero 1"
            }
            ],
            cedula: "",
            total_areas: 1,
            activo: true
        }
    ]

    console.log("\n=============================="); 
    console.log(" 📌 Comodines disponibles"); 
    console.log("==============================");
    console.table(
        comodines.map(c => ({
            id_empleado: c.id_empleado,
            nombre_completo: c.nombre_completo,
            areas: c.areas.map(a => a.nombre_area).join(", ")
        }))
    );

    const empleadosAsignados = new Set<number>();

    const programacion: Asignacion[] = [];

    const empleadosDisponiblesInfo = [
        { id_empleado: 20, disponible: true },
        { id_empleado: 21, disponible: true }
    ]

    console.log("Validación dura de ejemplo:", capa7_validarReglasDuras( comodines[0], { id_area: 6 }, turno, fecha, [] ));
    console.log("Validación dura de ejemplo:", capa7_validarReglasDuras( comodines[0], { id_area: 9 }, turno, fecha, [] ));

    const activados = capa4_activarComodines(
        huecos,
        comodines,
        empleadosAsignados,
        fecha,
        turno,
        programacion,
        empleadosDisponiblesInfo
    );

    console.log("\n=============================="); 
    console.log(" 📌 Comodines activados"); 
    console.log("==============================");
    console.table(
        activados.map(a => ({
            id_empleado: a.empleado.id_empleado,
            nombre: a.empleado.nombre_completo,
            area_cubierta: a.area,
            hueco_en: a.hueco.nombre_area
        }))
    );
}

main();