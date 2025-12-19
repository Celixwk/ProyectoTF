import prisma from "../../prisma/cliente";

export async function capa1_ordenarPorEspecializacion(){
    // NOTA: Si TypeScript muestra error, reinicia el TS Server:
    // Ctrl+Shift+P -> "TypeScript: Restart TS Server"
    const empleados = await prisma.empleado.findMany({
        include: {
            areas: {
                include: {
                    area: true  // Incluir la relación con Area dentro de EmpleadoArea
                }
            },
            cargo: true,
        },
    });

    // Contabilización de las áreas por empleado
    const empleadosConConteo = empleados.map(empleado => ({        
        nombre: `${empleado.nombre1} ${empleado.nombre2 ?? ""} ${empleado.apellido1} ${empleado.apellido2 ?? ""}`.trim(),
        total_areas: empleado.areas.length,
    }));

    // Ordenar los empleados por el total de áreas
    empleadosConConteo.sort((a, b) => a.total_areas - b.total_areas);

    return empleadosConConteo;
}