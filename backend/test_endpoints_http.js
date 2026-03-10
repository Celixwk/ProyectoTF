
const http = require('http');

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/api/programacion' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

function getRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/api/programacion' + path,
            method: 'GET'
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', (e) => reject(e));
        req.end();
    });
}

function deleteRequest(path, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5000,
            path: '/api/programacion' + path,
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function testEndpointsHttp() {
    console.log('--- TEST CONTROLLER LOGIC (VIA NATIVE HTTP) ---');

    // 1. Generate for a specific future range
    const start = '2026-12-01';
    const end = '2026-12-05';

    console.log(`1. Calling GENERATE for ${start} to ${end}...`);
    try {
        const dataGen = await postRequest('/generar', JSON.stringify({
            fechaInicio: start,
            fechaFin: end,
            id_usuario_registro: 1,
            balancearHoras: true
        }));
        console.log('   Generate Response:', dataGen);
        if (!dataGen.success) throw new Error('Generation failed via API');
    } catch (e) {
        console.error('   API Error (Generate):', e.message);
        return;
    }

    // 2. Check existence via API
    console.log('2. Verifying existence...');
    try {
        const dataCheck = await getRequest('/verificar-existente?mes=12&anio=2026');
        console.log('   Check Response:', dataCheck);
        if (!dataCheck.existe) console.warn('WARNING: API says no records found, but Generation said success?');
    } catch (e) {
        console.error('   API Error (Check):', e.message);
    }

    // 3. Delete via API
    console.log('3. Calling DELETE...');
    try {
        const dataDel = await deleteRequest('/eliminar', JSON.stringify({
            mes: 12,
            anio: 2026
        }));
        console.log('   Delete Response:', dataDel);
    } catch (e) {
        console.error('   API Error (Delete):', e.message);
    }

    console.log('--- TEST ENDPOINT LOGIC COMPLETE ---');
}

testEndpointsHttp();
