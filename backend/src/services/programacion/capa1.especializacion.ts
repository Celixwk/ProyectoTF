import prisma from "../../prisma/cliente";

export function obtenerClasificacionEmpleado(totalAreas: number): string {
    if (totalAreas === 0) return "comodín";
    if (totalAreas === 1) return "especialista";
    return "flexible";
}

export async function capa1_ordenarPorEspecializacion() {
    const empleados = await prisma.empleado.findMany({
        include: {
            empleado_area: true,
            cargo: true,
        },
    });

    const procesados = empleados.map(empleado => {
        const nombre = [empleado.nombre1, empleado.nombre2, empleado.apellido1, empleado.apellido2]
            .filter(Boolean).join(" ");
        
        const total_areas = empleado.empleado_area.length;
        const clasificacion = obtenerClasificacionEmpleado(total_areas);

        return {
            id_empleado: empleado.id_empleado,
            nombre,
            total_areas,
            clasificacion
        };
    });

    return {
        especialistas: procesados.filter(e => e.clasificacion === "especialista"),
        flexibles: procesados.filter(e => e.clasificacion === "flexible"),
        comodines: procesados.filter(e => e.clasificacion === "comodín"),
        todos: [...procesados].sort((a, b) => a.total_areas - b.total_areas)
    };
}