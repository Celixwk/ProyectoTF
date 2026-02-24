
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMeses() {
    console.log('--- CHECKING MES TABLE ---');
    const meses = await prisma.mes.findMany({
        orderBy: { id_mes: 'desc' },
        take: 10
    });

    if (meses.length === 0) {
        console.log('WARNING: "mes" table is EMPTY. Locking logic will block everything if not handled.');
    } else {
        console.log('Found months:');
        meses.forEach(m => {
            console.log(`  ID:${m.id_mes} Month:${m.nombre_mes} (${m.numero_mes}/${m.anio}) Status:${m.estado}`);
        });
    }
}

checkMeses()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
