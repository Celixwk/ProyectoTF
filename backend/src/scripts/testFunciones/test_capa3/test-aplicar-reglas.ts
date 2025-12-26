import { capa3_aplicarReglasArea } from "../../../services/programacion/capa3.reglasArea";
import type { EmpleadoDisponible } from "../../../services/programacion/tipos";

async function main() {
    console.log("=== 🧪 Test: capa3_aplicarReglasArea ===\n");


    const empleadosMock: EmpleadoDisponible[] = [
        {
            id_empleado: 1,
            id_estado: 1,
            disponible: true,
            nombre_completo: "ADOLFO LEON MUÑOZ B.",
            cedula: "900000001",
            total_areas: 1,
            clasificacion: "especialista",
            areas: [
                { id_area: 13, nombre_area: "Refuerzos" }
            ]
        },
        {
            id_empleado: 2,
            id_estado: 1,
            disponible: true,
            nombre_completo: "AISNIER LEONARDO CALDERON P.",
            cedula: "900000002",
            total_areas: 6,
            clasificacion: "comodin",
            areas: [
                { id_area: 2, nombre_area: "Puertas y Sala" },
                { id_area: 7, nombre_area: "Caseta de Salida" },
                { id_area: 8, nombre_area: "Conduce" },
                { id_area: 10, nombre_area: "Parqueadero 2" },
                { id_area: 4, nombre_area: "Baños 3" },
                { id_area: 9, nombre_area: "Parqueadero 1" }
            ]
        },
        {
            id_empleado: 3,
            id_estado: 1,
            disponible: true,
            nombre_completo: "ALBEIRO MARIN",
            cedula: "900000003",
            total_areas: 4,
            clasificacion: "flexible",
            areas: [
                { id_area: 8, nombre_area: "Conduce" },
                { id_area: 9, nombre_area: "Parqueadero 1" },
                { id_area: 10, nombre_area: "Parqueadero 2" },
                { id_area: 2, nombre_area: "Puertas y Sala" }
            ]
        },
        {
            id_empleado: 4,
            id_estado: 1,
            disponible: false, // ❌ NO disponible
            nombre_completo: "ALBEIRO PARRA (NO DISPONIBLE)",
            cedula: "900000004",
            total_areas: 2,
            clasificacion: "flexible",
            areas: [
                { id_area: 9, nombre_area: "Parqueadero 1" },
                { id_area: 11, nombre_area: "Periférico Norte" }
            ]
        },
        {
            id_empleado: 5,
            id_estado: 1,
            disponible: true,
            nombre_completo: "ARLEY GOMEZ",
            cedula: "900000005",
            total_areas: 4,
            clasificacion: "flexible",
            areas: [
                { id_area: 11, nombre_area: "Periférico Norte" },
                { id_area: 12, nombre_area: "Periférico Sur" },
                { id_area: 6, nombre_area: "Caseta de Entrada" },
                { id_area: 2, nombre_area: "Puertas y Sala" }
            ]
        },
        {
            id_empleado: 6,
            id_estado: 1,
            disponible: true,
            nombre_completo: "JUAN COMODÍN (SIN ÁREAS = TODAS)",
            cedula: "900000006",
            total_areas: 0,
            clasificacion: "comodin",
            areas: [] // Sin áreas = puede todas
        }
    ];


    const areasPrueba = [
        { id_area: 2, nombre_area: "Puertas y Sala" },
        { id_area: 9, nombre_area: "Parqueadero 1" },
        { id_area: 13, nombre_area: "Refuerzos" },
        { id_area: 1, nombre_area: "Sala Principal" } // Nadie tiene esta
    ];

    console.log("📋 Empleados disponibles:");
    console.table(empleadosMock.map(e => ({
        ID: e.id_empleado,
        Nombre: e.nombre_completo,
        Disponible: e.disponible ? "✅" : "❌",
        "Total Áreas": e.total_areas,
        Clasificación: e.clasificacion
    })));

    console.log("\n" + "=".repeat(80));
    console.log("📌 PRUEBA: Elegibilidad por área");
    console.log("=".repeat(80));

    for (const area of areasPrueba) {
        console.log(`\n🏢 Área: ${area.nombre_area} (ID: ${area.id_area})`);
        
        const elegibles = capa3_aplicarReglasArea(
            area,
            empleadosMock,
            new Map()
        );

        if (elegibles.length === 0) {
            console.log("   ⚠️  No hay empleados elegibles para esta área");
        } else {
            console.table(elegibles.map(e => ({
                ID: e.id_empleado,
                Nombre: e.nombre_completo,
                Clasificación: e.clasificacion,
                "Áreas del Empleado": e.areas.length === 0 
                    ? "(Todas)" 
                    : e.areas.map(a => a.nombre_area).join(", ")
            })));
        }
    }


    console.log("\n" + "=".repeat(80));
    console.log("🔍 VALIDACIONES AUTOMÁTICAS");
    console.log("=".repeat(80) + "\n");

    const tests = [
        {
            nombre: "Puertas y Sala: debe tener 4 elegibles (ids: 2,3,5,6)",
            test: () => {
                const elegibles = capa3_aplicarReglasArea(
                    { id_area: 2, nombre_area: "Puertas y Sala" },
                    empleadosMock,
                    new Map()
                );
                const ids = elegibles.map(e => e.id_empleado).sort();
                return elegibles.length === 4 && 
                       ids.includes(2) && ids.includes(3) && 
                       ids.includes(5) && ids.includes(6);
            }
        },
        {
            nombre: "Parqueadero 1: debe tener 3 elegibles (ids: 2,3,6)",
            test: () => {
                const elegibles = capa3_aplicarReglasArea(
                    { id_area: 9, nombre_area: "Parqueadero 1" },
                    empleadosMock,
                    new Map()
                );
                const ids = elegibles.map(e => e.id_empleado).sort();
                return elegibles.length === 3 && 
                       ids.includes(2) && ids.includes(3) && ids.includes(6);
            }
        },
        {
            nombre: "Refuerzos: debe tener 2 elegibles (ids: 1,6)",
            test: () => {
                const elegibles = capa3_aplicarReglasArea(
                    { id_area: 13, nombre_area: "Refuerzos" },
                    empleadosMock,
                    new Map()
                );
                const ids = elegibles.map(e => e.id_empleado).sort();
                return elegibles.length === 2 && ids.includes(1) && ids.includes(6);
            }
        },
        {
            nombre: "Empleado 4 (no disponible) NO debe aparecer en ninguna área",
            test: () => {
                const todasAreas = [
                    { id_area: 9, nombre_area: "Parqueadero 1" },
                    { id_area: 11, nombre_area: "Periférico Norte" }
                ];
                for (const area of todasAreas) {
                    const elegibles = capa3_aplicarReglasArea(area, empleadosMock, new Map());
                    if (elegibles.some(e => e.id_empleado === 4)) {
                        return false;
                    }
                }
                return true;
            }
        },
        {
            nombre: "Empleado 6 (sin áreas) debe ser elegible para TODAS",
            test: () => {
                const todasAreas = [
                    { id_area: 2, nombre_area: "Puertas y Sala" },
                    { id_area: 9, nombre_area: "Parqueadero 1" },
                    { id_area: 13, nombre_area: "Refuerzos" }
                ];
                for (const area of todasAreas) {
                    const elegibles = capa3_aplicarReglasArea(area, empleadosMock, new Map());
                    if (!elegibles.some(e => e.id_empleado === 6)) {
                        return false;
                    }
                }
                return true;
            }
        },
        {
            nombre: "Sala Principal: debe tener solo 1 elegible (id: 6, el comodín)",
            test: () => {
                const elegibles = capa3_aplicarReglasArea(
                    { id_area: 1, nombre_area: "Sala Principal" },
                    empleadosMock,
                    new Map()
                );
                return elegibles.length === 1 && elegibles[0].id_empleado === 6;
            }
        }
    ];

    tests.forEach((test, i) => {
        const resultado = test.test();
        const icono = resultado ? "✅" : "❌";
        console.log(`${icono} Test ${i + 1}: ${test.nombre}`);
    });

    const todosPasaron = tests.every(t => t.test());
    console.log(todosPasaron ? "\n🎉 TODOS LOS TESTS PASARON" : "\n⚠️  ALGUNOS TESTS FALLARON");
}

main().catch(err => {
    console.error("❌ Error en test:", err);
});