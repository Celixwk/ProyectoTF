const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;
const isDev = !app.isPackaged;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log('⚠️ Ya hay una instancia de la aplicación corriendo');
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

const userDataPath = app.getPath('userData');
const pgDataDir = path.join(userDataPath, 'pgdata');
const pgBinDir = isDev
    ? path.join(__dirname, '../postgres-portable/bin')
    : path.join(process.resourcesPath, 'postgres-portable', 'bin');

const PORT = 54320;
const DB_NAME = 'nomina_db';
const DB_USER = 'postgres';

async function startPostgres() {
    console.log('📍 startPostgres - Verificando directorio pgData:', pgDataDir);
    console.log('📍 startPostgres - pgData existe?', fs.existsSync(pgDataDir));

    if (!fs.existsSync(pgDataDir)) {
        console.log('📍 startPostgres - Iniciando initDatabase...');
        await initDatabase();
        console.log('📍 startPostgres - initDatabase completado');
    }

    const pgctlPath = path.join(pgBinDir, 'pg_ctl.exe');
    console.log('📍 startPostgres - Ruta pg_ctl:', pgctlPath);
    console.log('📍 startPostgres - pg_ctl existe?', fs.existsSync(pgctlPath));

    return new Promise((resolve) => {
        const pgctl = spawn(pgctlPath, ['start', '-D', pgDataDir, '-o', `-p ${PORT} -k ""`]);

        pgctl.stdout.on('data', (data) => console.log(`[PGCTL-OUT] ${data}`));
        pgctl.stderr.on('data', (data) => console.log(`[PGCTL-ERR] ${data}`));

        setTimeout(() => {
            console.log('✅ PostgreSQL listo (timeout completado)');
            process.env.DATABASE_URL = `postgresql://${DB_USER}:@localhost:${PORT}/${DB_NAME}`;
            console.log('📍 DATABASE_URL establecida:', process.env.DATABASE_URL);
            resolve();
        }, 4000);
    });
}

async function ensureDatabaseExists() {
    console.log('📍 ensureDatabaseExists - Iniciando verificación de BD...');
    const psqlPath = path.join(pgBinDir, 'psql.exe');
    console.log('📍 ensureDatabaseExists - Ruta psql:', psqlPath);

    return new Promise((resolve) => {
        const psql = spawn(psqlPath, [
            '-U', DB_USER,
            '-p', PORT.toString(),
            '-h', 'localhost',
            '-d', 'postgres',
            '-c', `SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`
        ]);

        let output = '';
        psql.stdout.on('data', (data) => {
            output += data.toString();
            console.log(`[PSQL-OUT] ${data}`);
        });
        psql.stderr.on('data', (data) => console.log(`[PSQL-ERR] ${data}`));

        psql.on('close', (code) => {
            console.log('📍 ensureDatabaseExists - psql cerrado con código:', code);
            console.log('📍 ensureDatabaseExists - Output:', output);

            if (output.includes('(1 row)') || output.includes('(1 fila)') || output.includes('1')) {
                console.log(`✅ Base de datos "${DB_NAME}" ya existe`);
                resolve();
            } else {
                console.log('📍 ensureDatabaseExists - BD no existe, creando...');
                createDatabase().then(resolve);
            }
        });
    });
}

async function createDatabase() {
    console.log('📍 createDatabase - Iniciando creación de BD...');
    const createdbPath = path.join(pgBinDir, 'createdb.exe');
    console.log('📍 createDatabase - Ruta createdb:', createdbPath);

    return new Promise((resolve) => {
        const createdb = spawn(createdbPath, [
            '-U', DB_USER,
            '-p', PORT.toString(),
            '-h', 'localhost',
            DB_NAME
        ]);

        createdb.stdout.on('data', (data) => console.log(`[CREATEDB-OUT] ${data}`));
        createdb.stderr.on('data', (data) => console.log(`[CREATEDB-ERR] ${data}`));

        createdb.on('close', (code) => {
            console.log('📍 createDatabase - Cerrado con código:', code);
            console.log(code === 0 ? `✅ Base de datos "${DB_NAME}" creada exitosamente` : `⚠️ La base de datos ya podría existir o hubo un error`);
            resolve();
        });
    });
}

async function initDatabase() {
    console.log('📍 initDatabase - Iniciando inicialización de cluster...');
    const initdbPath = path.join(pgBinDir, 'initdb.exe');
    console.log('📍 initDatabase - Ruta initdb:', initdbPath);

    return new Promise((resolve, reject) => {
        const initdb = spawn(initdbPath, [
            '-D', pgDataDir,
            '-U', DB_USER,
            '--encoding=UTF8',
            '--locale=C',
            '--auth=trust',
            '--no-instructions'
        ]);

        initdb.stdout.on('data', (data) => console.log(`[INITDB-OUT] ${data}`));
        initdb.stderr.on('data', (data) => console.log(`[INITDB-ERR] ${data}`));

        initdb.on('close', (code) => {
            console.log('📍 initDatabase - Cerrado con código:', code);
            if (code === 0) {
                console.log('✅ Cluster PostgreSQL inicializado');
                resolve();
            } else {
                console.error('❌ initdb falló con código:', code);
                reject(new Error(`initdb falló con código ${code}`));
            }
        });
    });
}

async function stopPostgres() {
    console.log('📍 stopPostgres - Deteniendo PostgreSQL...');
    const pgctlPath = path.join(pgBinDir, 'pg_ctl.exe');

    return new Promise((resolve) => {
        const pgctl = spawn(pgctlPath, ['stop', '-D', pgDataDir, '-m', 'fast', '-w']);

        pgctl.stdout.on('data', (data) => console.log(`[PGCTL-STOP-OUT] ${data}`));
        pgctl.stderr.on('data', (data) => console.log(`[PGCTL-STOP-ERR] ${data}`));

        pgctl.on('close', (code) => {
            console.log('📍 stopPostgres - Cerrado con código:', code);
            console.log('✅ PostgreSQL detenido');
            resolve();
        });

        setTimeout(() => resolve(), 5000);
    });
}

function startExpressServer() {
    console.log('📍 startExpressServer - Iniciando...');
    console.log('📍 startExpressServer - isDev:', isDev);

    let serverPath = isDev
        ? path.join(__dirname, '../dist/server.js')
        : path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'server.js');

    const frontendPath = isDev
        ? path.join(__dirname, '../frontend-build')
        : path.join(process.resourcesPath, 'app.asar.unpacked', 'frontend-build');

    console.log('🚀 Intentando arrancar Express en:', serverPath);
    console.log('📁 Archivo existe?', fs.existsSync(serverPath));
    console.log('📂 Frontend esperado en:', frontendPath);

    if (!fs.existsSync(serverPath)) {
        console.error('❌ ERROR: El archivo server.js no existe');
        return;
    }

    console.log('📍 startExpressServer - Usando Node.js embebido de Electron');
    console.log('📍 startExpressServer - Ejecutable:', process.execPath);

    serverProcess = spawn(process.execPath, [serverPath], {
        env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            NODE_ENV: 'production',
            PORT: '5000',
            DATABASE_URL: process.env.DATABASE_URL,
            FRONTEND_PATH: frontendPath
        },
        cwd: path.dirname(serverPath),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        windowsHide: true
    });

    serverProcess.stdout.on('data', (data) => {
        console.log('[EXPRESS-OUT]', data.toString().trim());
    });

    serverProcess.stderr.on('data', (data) => {
        console.error('[EXPRESS-ERR]', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
        console.error('❌ Error al hacer spawn de node:', err);
    });

    serverProcess.on('spawn', () => {
        console.log('✅ Proceso node spawneado exitosamente');
        console.log('📍 PID:', serverProcess.pid);
    });

    serverProcess.on('exit', (code, signal) => {
        console.log(`📍 Proceso Express terminó - Código: ${code}, Signal: ${signal}`);
    });
}

async function waitForServer(url, timeout) {
    console.log('📍 waitForServer - Esperando servidor en:', url);
    console.log('📍 waitForServer - Timeout:', timeout, 'ms');

    const startTime = Date.now();
    let attempts = 0;

    while (Date.now() - startTime < timeout) {
        attempts++;
        try {
            const http = require('http');
            const result = await new Promise((resolve, reject) => {
                const req = http.get(url, (res) => {
                    console.log(`📍 waitForServer - Intento ${attempts}: Status ${res.statusCode}`);

                    res.on('data', () => { });
                    res.on('end', () => {
                        if (res.statusCode === 200 || res.statusCode === 304) {
                            resolve(true);
                        } else {
                            reject(new Error(`Status inesperado: ${res.statusCode}`));
                        }
                    });
                });

                req.on('error', (err) => {
                    console.log(`📍 waitForServer - Intento ${attempts}: Error - ${err.message}`);
                    reject(err);
                });

                req.setTimeout(2000, () => {
                    req.destroy();
                    reject(new Error('Timeout en petición'));
                });

                req.end();
            });

            if (result) {
                console.log('✅ Servidor detectado y respondiendo');
                return;
            }
        } catch (err) {
            if (attempts % 3 === 0) {
                console.log(`📍 waitForServer - Esperando... Intento ${attempts} (${Math.floor((Date.now() - startTime) / 1000)}s)`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.error('❌ Timeout alcanzado - El servidor no respondió después de', attempts, 'intentos');
    throw new Error('Timeout: El servidor no respondió');
}

async function createWindow() {
    try {
        console.log('═══════════════════════════════════════');
        console.log('🚀 INICIANDO APLICACIÓN');
        console.log('═══════════════════════════════════════');
        console.log('📍 Modo:', isDev ? 'DESARROLLO' : 'PRODUCCIÓN');
        console.log('📍 userDataPath:', userDataPath);

        console.log('\n1️⃣ Iniciando PostgreSQL...');
        await startPostgres();

        console.log('\n2️⃣ Verificando/creando base de datos...');
        await ensureDatabaseExists();

        console.log('\n3️⃣ Iniciando servidor Express...');
        startExpressServer();

        console.log('\n4️⃣ Esperando respuesta del servidor...');
        try {
            await waitForServer('http://127.0.0.1:5000/health', 45000);
        } catch (err) {
            console.log('⚠️ /health no responde, probando ruta raíz...');
            await waitForServer('http://127.0.0.1:5000/', 45000);
        }

        console.log('\n5️⃣ Creando ventana de Electron...');
        mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            },
            show: false
        });

        console.log('📍 Cargando URL: http://127.0.0.1:5000');
        mainWindow.loadURL('http://127.0.0.1:5000');

        mainWindow.once('ready-to-show', () => {
            console.log('✅ Ventana lista para mostrar');
            mainWindow.show();
            mainWindow.focus();
            console.log('═══════════════════════════════════════');
            console.log('✅ APLICACIÓN INICIADA EXITOSAMENTE');
            console.log('═══════════════════════════════════════');
        });

        mainWindow.on('closed', () => {
            mainWindow = null;
        });

    } catch (error) {
        console.error('═══════════════════════════════════════');
        console.error('❌ ERROR FATAL EN createWindow');
        console.error('═══════════════════════════════════════');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        dialog.showErrorBox('Error de Inicio', `No se pudo iniciar la aplicación:\n\n${error.message}`);
        app.quit();
    }
}

app.whenReady().then(createWindow);

app.on('before-quit', async (e) => {
    console.log('📍 Evento before-quit recibido');
    e.preventDefault();
    if (serverProcess) serverProcess.kill();
    await stopPostgres();
    app.exit(0);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});