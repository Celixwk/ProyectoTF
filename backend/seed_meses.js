
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMeses() {
    console.log('--- SEEDING MES TABLE ---');

    const years = [2025, 2026, 2027];
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    for (const year of years) {
        for (let i = 0; i < months.length; i++) {
            const numero_mes = i + 1;
            const nombre_mes = months[i];

            // Calculate start/end dates
            const fecha_inicio = new Date(Date.UTC(year, i, 1));
            const fecha_fin = new Date(Date.UTC(year, i + 1, 0)); // Last day of month

            // Check if exists
            const existing = await prisma.mes.findFirst({
                where: { numero_mes, anio: year }
            });

            if (!existing) {
                await prisma.mes.create({
                    data: {
                        nombre_mes,
                        numero_mes,
                        anio: year,
                        fecha_inicio,
                        fecha_fin,
                        estado: 'Abierto' // Default to Open
                    }
                });
                console.log(`Created: ${nombre_mes} ${year}`);
            } else {
                console.log(`Exists: ${nombre_mes} ${year}`);
            }
        }
    }
    console.log('--- SEED COMPLETE ---');
}

seedMeses()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
