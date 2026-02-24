
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLifecycle() {
    console.log('--- TEST SCHEDULE LIFECYCLE ---');

    // 1. Define Test Range (safe future dates)
    const fechaInicioStr = '2026-11-01';
    const fechaFinStr = '2026-11-05';
    const [yi, mi, di] = fechaInicioStr.split('-').map(Number);
    const [yf, mf, df] = fechaFinStr.split('-').map(Number);

    // UTC Dates for DB Query
    const inicioUTC = new Date(Date.UTC(yi, mi - 1, di));
    const finUTC = new Date(Date.UTC(yf, mf - 1, df, 23, 59, 59));

    console.log(`Testing Range: ${fechaInicioStr} to ${fechaFinStr}`);

    // 2. Mock Generation (Simulating logic)
    // We'll create dummy records directly to test DB Write
    console.log('1. Testing Creation (Write)...');

    const empleado = await prisma.empleado.findFirst({ where: { id_estado: 1 } });
    if (!empleado) throw new Error('No active employee found for test');

    const turno = await prisma.turno.findFirst();
    if (!turno) throw new Error('No turno found for test');

    const area = await prisma.area.findFirst();

    const dataToCreate = {
        id_empleado: empleado.id_empleado,
        fecha: inicioUTC,
        id_turno: turno.id_turno,
        id_area: area ? area.id_area : 1,
        origen_registro: 'Automatico Test'
    };

    // Clean first just in case
    await prisma.detalleProgramacion.deleteMany({
        where: { fecha: inicioUTC, id_empleado: empleado.id_empleado }
    });

    const created = await prisma.detalleProgramacion.create({
        data: dataToCreate
    });
    console.log(`   Created record ID: ${created.id_detalle_programacion} for ${created.fecha.toISOString()}`);

    // 3. Testing Reading
    console.log('2. Testing Reading...');
    const read = await prisma.detalleProgramacion.findFirst({
        where: { id_detalle_programacion: created.id_detalle_programacion }
    });
    if (!read) throw new Error('Read failed: Record not found');
    console.log('   Read success.');

    // 4. Testing Deletion
    console.log('3. Testing Deletion...');
    await prisma.detalleProgramacion.delete({
        where: { id_detalle_programacion: created.id_detalle_programacion }
    });

    const checkDeleted = await prisma.detalleProgramacion.findFirst({
        where: { id_detalle_programacion: created.id_detalle_programacion }
    });

    if (checkDeleted) throw new Error('Deletion failed: Record still exists');
    console.log('   Deletion success.');

    console.log('--- TEST PASSED: DB CONNECTIVITY OK ---');
}

testLifecycle()
    .catch(e => {
        console.error('--- TEST FAILED ---');
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
