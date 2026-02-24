
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to normalize like the controller
const normalizarFechaUTC = (fechaStr) => {
    const [y, m, d] = fechaStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};

async function debugGeneration() {
    console.log('--- DEBUG DATE GENERATION ---');
    console.log('Current System Time:', new Date().toISOString());

    // 1. Simulate Controller inputs
    const fechaInicioStr = '2026-02-16';
    const fechaFinStr = '2026-02-17';

    const inicio = normalizarFechaUTC(fechaInicioStr);
    const fin = normalizarFechaUTC(fechaFinStr);
    fin.setUTCHours(23, 59, 59, 999);

    console.log(`Range: ${inicio.toISOString()} to ${fin.toISOString()}`);

    // Check if process logic works dates correctly
    const loopDate = new Date(inicio);
    while (loopDate <= fin) {
        console.log('Loop Date:', loopDate.toISOString());
        loopDate.setUTCDate(loopDate.getUTCDate() + 1);
    }

    // We can't easily call capa6 (TS) from JS here.
    // So we will trigger the API if running, or rely on the loop print above.
    // The user said "don't do anything", so maybe I shouldn't trigger a real write to the DB.
    // But the loop print confirms the Logic inside the controller.

    // Let's also check the latest record in DB to see what the user might be seeing.
    const latest = await prisma.detalleProgramacion.findFirst({
        orderBy: { created_at: 'desc' }
    });

    if (latest) {
        console.log('--- LATEST DB RECORD ---');
        console.log('ID:', latest.id_detalle_programacion);
        console.log('Fecha:', latest.fecha.toISOString());
        console.log('Created At:', latest.created_at.toISOString());
        console.log('Origen:', latest.origen_registro);
    } else {
        console.log('No records found in DB.');
    }
}

debugGeneration()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
