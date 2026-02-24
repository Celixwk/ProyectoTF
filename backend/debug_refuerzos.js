
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Rango detectado por el usuario (aprox)
    const start = new Date('2026-02-16T00:00:00Z');
    const end = new Date('2026-03-03T00:00:00Z');

    console.log(`--- DEBUG MULTI-DAY (${start.toISOString()} - ${end.toISOString()}) ---`);

    // 1. Empleados Activos
    const empleados = await prisma.empleado.findMany({
        where: { id_estado: 1 },
        select: { id_empleado: true, nombre1: true, apellido1: true }
    });
    console.log('Total Empleados Activos:', empleados.length);

    // 2. Fetch Global Asignaciones
    const asignaciones = await prisma.detalleProgramacion.findMany({
        where: { fecha: { gte: start, lte: end } },
        select: { id_empleado: true, fecha: true }
    });
    console.log('Total Asignaciones en Rango:', asignaciones.length);

    // 3. Análisis Día por Día
    const loop = new Date(start);
    while (loop <= end) {
        const fechaStr = loop.toISOString().split('T')[0];
        const rangeStart = new Date(loop);
        const rangeEnd = new Date(loop);
        rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

        const asignadosDia = asignaciones.filter(a => {
            const f = new Date(a.fecha);
            return f >= rangeStart && f < rangeEnd;
        }).map(a => a.id_empleado);

        const setAsignados = new Set(asignadosDia);
        const disponibles = empleados.filter(e => !setAsignados.has(e.id_empleado));

        console.log(`[${fechaStr}] Asignados: ${setAsignados.size} | Disponibles: ${disponibles.length}`);

        if (disponibles.length > 0 && disponibles.length < 5) {
            console.log(`   -> IDs Disponibles: ${disponibles.map(e => e.id_empleado).join(', ')}`);
        }

        loop.setUTCDate(loop.getUTCDate() + 1);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
