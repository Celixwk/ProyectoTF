import prisma from "../../../prisma/cliente";
import { EmpleadoDisponible } from "../../../services/programacion";
import { capa3_aplicarReglasArea, capa3_obtenerPrioridadAreas } from "../../../services/programacion/capa3.reglasArea";

async function main() {
    console.log("Test de aplicación de reglas de área");

    const areas = await prisma.area.findMany({
        select: {id_area: true, nombre_area: true},
    });

    const prioridades = await capa3_obtenerPrioridadAreas(areas);

    console.log("\n==============================");
    console.log(" 📌 Prioridades cargadas");
    console.log("==============================");
    console.table(
        prioridades.map(a => ({
            id_area: a.id_area,
            nombre_area: a.nombre_area,
            prioridad: a.prioridad
        }))
    );
    console.log("==============================");

    const empleadosMock: EmpleadoDisponible[] = [
        {
            id_empleado: 1,
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
            disponible: true,
            nombre_completo: "ALBEIRO PARRA",
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
        }
    ];

    console.log("\n==============================");

    console.log("\n==============================");
    console.log(" 📌 Elegibilidad por área");
    console.log("==============================");

    for (const area of prioridades) {
        console.log("\n -> Área: ", area.nombre_area);
        const empleadosElegibles = capa3_aplicarReglasArea(
            {id_area: area.id_area, nombre_area: area.nombre_area},
            empleadosMock, 
            new Map()
        );

        console.table(
            empleadosElegibles.map(e => ({
                id_empleado: e.id_empleado,
                nombre_completo: e.nombre_completo,
                cedula: e.cedula,
                clasificacion: e.clasificacion,
                areas: e.areas.map(a => a.nombre_area).join(", ")
            }))
        );
    }
    await prisma.$disconnect();
}

main();