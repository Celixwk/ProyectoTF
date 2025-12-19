import { capa4_detectarHuecos } from "../../../services/programacion/capa4.gestionHuecos";
import type { Asignacion } from "../../../services/programacion/tipos";

async function main() {
    console.log("Test de detección de huecos");

    const fecha = new Date("2025-01-01");
    
    const areas = [
        { id_area: 1, nombre_area: "Sala Principal" },
        { id_area: 2, nombre_area: "Puertas y Sala" },
        { id_area: 6, nombre_area: "Caseta de Entrada" },
        { id_area: 7, nombre_area: "Caseta de Salida" },
        { id_area: 9, nombre_area: "Parqueadero 1" } 
    ];

    const maximosPorArea = new Map<number, number>([
        [  areas[0].id_area, 2 ],
        [  areas[1].id_area, 1 ],
        [  areas[2].id_area, 1 ],
        [  areas[3].id_area, 1 ],
        [  areas[4].id_area, 2 ],
    ])

    const programacion: Asignacion[] = [
        { 
            id_empleado: 10,
            id_area: 6,
            fecha,
            id_turno: 1 },
        { 
            id_empleado: 11, 
            id_area: 9, 
            fecha, 
            id_turno: 1 }
    ];

    console.log("\n=============================="); 
    console.log(" 📌 Programación actual"); 
    console.log("==============================");
    console.table(programacion)

    console.log("\n=============================="); 
    console.log(" 📌 Máximos por área"); 
    console.log("==============================");

    console.table(Array.from(maximosPorArea.entries()).map(([id_area, maximo]) => ({
        id_area,
        maximo_requerido: maximo
    })));

    const huecos = capa4_detectarHuecos(programacion, areas, fecha, maximosPorArea);

    console.log("\n=============================="); 
    console.log(" 📌 Huecos detectados"); 
    console.log("==============================");
    console.table(huecos);
}

main();