import prisma from "../../../prisma/cliente";
import { EmpleadoDisponible } from "../../../services/programacion";
import { capa3_obtenerPrioridadAreas, capa3_aplicarReglasArea } from "../../../services/programacion/capa3.reglasArea";

async function main() {
    console.log("Test de prioridades de areas");

    const areas = await prisma.area.findMany({
        select: {id_area: true, nombre_area: true},
    });

    console.log("Áreas cargadas:",areas);

    const prioridades = await capa3_obtenerPrioridadAreas(areas);
    console.log("Prioridades de areas:",prioridades);
    
    

    const resultado = capa3_obtenerPrioridadAreas(areas);

    console.table(
        (await resultado).map(a => ({
            id_area: a.id_area,
            nombre_area: a.nombre_area,
            prioridad: a.prioridad
        }))
    );

}

main();