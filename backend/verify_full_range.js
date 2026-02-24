
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyRange() {
    console.log('--- VERIFY FULL RANGE (Feb 16 - Mar 3) ---');
    // Range: Feb 16 (28 days in Feb?) 2026 is not leap. 28 days.
    // Feb 16 to Feb 28 = 13 days (inclusive) -> 13 records? 
    // 16,17,18,19,20,21,22,23,24,25,26,27,28 = 13 days.
    // Mar 1 to Mar 3 = 3 days.
    // Total 16 days.

    // Check records for Feb 16
    const start = new Date(Date.UTC(2026, 1, 16));
    const end = new Date(Date.UTC(2026, 2, 3, 23, 59, 59));

    const count = await prisma.detalleProgramacion.count({
        where: { fecha: { gte: start, lte: end } }
    });

    console.log(`Total records in range (Feb 16 - Mar 3): ${count}`);

    // Check one specific date in Feb
    const sampleFeb = await prisma.detalleProgramacion.findFirst({
        where: { fecha: new Date(Date.UTC(2026, 1, 16)) }
    });
    if (sampleFeb) {
        console.log('Sample Feb 16:', sampleFeb.fecha.toISOString(), 'Created:', sampleFeb.created_at.toISOString());
    } else {
        console.log('Sample Feb 16: NOT FOUND');
    }

    // Check one specific date in Mar
    const sampleMar = await prisma.detalleProgramacion.findFirst({
        where: { fecha: new Date(Date.UTC(2026, 2, 1)) }
    });
    if (sampleMar) {
        console.log('Sample Mar 1:', sampleMar.fecha.toISOString(), 'Created:', sampleMar.created_at.toISOString());
    } else {
        console.log('Sample Mar 1: NOT FOUND');
    }
}

verifyRange()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
