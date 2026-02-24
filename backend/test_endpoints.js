
const { PrismaClient } = require('@prisma/client');
// Using native fetch in Node 18+

async function testEndpoints() {
    console.log('--- TEST CONTROLLER LOGIC (VIA API) ---');
    const BASE_URL = 'http://127.0.0.1:4000/api/programacion';

    // 1. Generate for a specific future range
    const start = '2026-12-01';
    const end = '2026-12-05';

    console.log(`1. Calling GENERATE for ${start} to ${end}...`);
    try {
        const resGen = await fetch(`${BASE_URL}/generar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fechaInicio: start,
                fechaFin: end,
                id_usuario_registro: 1
            })
        });
        const dataGen = await resGen.json();
        console.log('   Generate Response:', dataGen);
        if (!dataGen.success) throw new Error('Generation failed via API');
    } catch (e) {
        console.error('   API Error (Generate):', e.message);
        // If fetch fails (e.g., server not running), we can't test this way. Use Prisma direct check instead?
        // But the user asked if "connection is working". The previous script confirmed DB connection.
        // This script confirms HTTP + Logic connection.
        return;
    }

    // 2. Check existence via API
    console.log('2. Verifying existence...');
    const resCheck = await fetch(`${BASE_URL}/verificar-existente?mes=12&anio=2026`);
    const dataCheck = await resCheck.json();
    console.log('   Check Response:', dataCheck);
    if (!dataCheck.existe) console.warn('WARNING: API says no records found, but Generation said success?');

    // 3. Delete via API
    console.log('3. Calling DELETE...');
    const resDel = await fetch(`${BASE_URL}/eliminar`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mes: 12,
            anio: 2026
        })
    });
    const dataDel = await resDel.json();
    console.log('   Delete Response:', dataDel);

    console.log('--- TEST ENDPOINT LOGIC COMPLETE ---');
}

testEndpoints();
