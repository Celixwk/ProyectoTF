
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function closeMonth() {
    console.log('--- CLOSING MONTH JAN 2026 ---');
    const updated = await prisma.mes.updateMany({
        where: { numero_mes: 1, anio: 2026 },
        data: { estado: 'Cerrado' }
    });
    console.log(`Updated ${updated.count} month(s) to "Cerrado".`);
}

closeMonth()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
