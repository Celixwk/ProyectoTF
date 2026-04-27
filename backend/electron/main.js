const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const net = require('net');

// Fijar userData en una ruta ASCII sin espacios ni tildes antes de app.ready,
// para evitar problemas con PostgreSQL al procesar rutas con caracteres especiales.
if (app.isPackaged) {
    app.setPath('userData', path.join(app.getPath('appData'), 'SistemaGestionHorarios'));
}

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
const DB_NAME = 'gestion_horarios_db';
const DB_USER = 'postgres';
const DB_INITIALIZED_FLAG = path.join(userDataPath, 'db.initialized');

// Ejecuta un binario de PostgreSQL a través de cmd.exe para evitar el error
// "spawn UNKNOWN" que ocurre cuando Electron intenta lanzar procesos externos
// directamente desde dentro del ASAR en Windows.
function pgExec(exeName, args) {
    const exePath = path.join(pgBinDir, exeName);

    if (!fs.existsSync(exePath)) {
        return Promise.reject(new Error(`${exeName} no encontrado en: ${exePath}`));
    }

    // Construimos la cadena de comando con comillas para manejar espacios en rutas
    const quotedArgs = args.map(arg => {
        if (arg.startsWith('-')) return arg;
        return `"${arg}"`;
    }).join(' ');
    const cmd = `"${exePath}" ${quotedArgs}`;

    console.log(`[pgExec] ${cmd}`);

    return new Promise((resolve) => {
        exec(cmd, {
            cwd: pgBinDir,
            windowsHide: true,
            timeout: 60000,
            env: {
                ...process.env,
                PATH: pgBinDir + ';' + (process.env.PATH || '')
            }
        }, (error, stdout, stderr) => {
            if (stdout) console.log(`[${exeName.toUpperCase().replace('.EXE', '')}-OUT]`, stdout.trim());
            if (stderr) console.log(`[${exeName.toUpperCase().replace('.EXE', '')}-ERR]`, stderr.trim());
            resolve({ error, stdout, stderr });
        });
    });
}

async function initDatabase() {
    console.log('📍 initDatabase - Iniciando...');
    console.log('📍 pgBinDir:', pgBinDir);
    console.log('📍 pgBinDir existe?', fs.existsSync(pgBinDir));

    // Limpiar directorio previo para evitar el error "directory not empty"
    if (fs.existsSync(pgDataDir)) {
        try {
            console.log('📍 initDatabase - Limpiando directorio previo...');
            fs.rmSync(pgDataDir, { recursive: true, force: true });
        } catch (e) {
            console.error('⚠️ No se pudo limpiar el directorio:', e.message);
        }
    }

    const { error } = await pgExec('initdb.exe', [
        '-D', pgDataDir,
        '-U', DB_USER,
        '--encoding=UTF8',
        '--locale=C',
        '--auth=trust',
        '--no-instructions'
    ]);

    if (error) {
        throw new Error(`initdb falló: ${error.message}`);
    }

    // Escribir configuración directamente en postgresql.conf para evitar
    // problemas con el argumento -o de pg_ctl en Windows.
    const pgConf = path.join(pgDataDir, 'postgresql.conf');
    fs.appendFileSync(pgConf,
        `\n# Configuración del sistema embebido\nlisten_addresses = '127.0.0.1'\nport = ${PORT}\n`
    );

    // pg_hba.conf: permitir conexiones locales sin contraseña
    const hbaConf = path.join(pgDataDir, 'pg_hba.conf');
    fs.writeFileSync(hbaConf,
        `# TYPE  DATABASE  USER  ADDRESS        METHOD\nhost  all  all  127.0.0.1/32  trust\n`
    );

    console.log('✅ Cluster PostgreSQL inicializado y configurado');
}

function isPostgresRunning() {
    return new Promise((resolve) => {
        const socket = net.connect({ host: '127.0.0.1', port: PORT });
        socket.setTimeout(1000);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('error', () => resolve(false));
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
    });
}

async function startPostgres() {
    console.log('📍 startPostgres - pgData existe?', fs.existsSync(pgDataDir));

    // Verificación rápida: si PostgreSQL ya está escuchando, no hacer nada
    const alreadyRunning = await isPostgresRunning();
    if (alreadyRunning) {
        console.log(`✅ PostgreSQL ya está corriendo en el puerto ${PORT}, omitiendo pg_ctl start`);
        process.env.DATABASE_URL = `postgresql://${DB_USER}@127.0.0.1:${PORT}/${DB_NAME}`;
        return;
    }

    // Si existe pgdata pero no tiene nuestra configuración de puerto, reinicializar
    const pgConf = path.join(pgDataDir, 'postgresql.conf');
    if (fs.existsSync(pgDataDir) && fs.existsSync(pgConf)) {
        const confContent = fs.readFileSync(pgConf, 'utf8');
        if (!confContent.includes(`port = ${PORT}`)) {
            console.log('⚠️ pgdata sin configuración de puerto correcta, reinicializando...');
            fs.rmSync(pgDataDir, { recursive: true, force: true });
            try { fs.unlinkSync(DB_INITIALIZED_FLAG); } catch (e) { }
        }
    }

    if (!fs.existsSync(pgDataDir)) {
        await initDatabase();
    }

    // Lanzar pg_ctl sin -w (no bloqueante) y detectar cuando esté listo por TCP.
    // Esto es 2-3s más rápido que -w porque responde en cuanto acepta conexiones.
    pgExec('pg_ctl.exe', ['start', '-D', pgDataDir]);

    console.log('⏳ Esperando que PostgreSQL acepte conexiones...');
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
        if (await isPostgresRunning()) break;
        await new Promise(r => setTimeout(r, 200));
    }
    if (!await isPostgresRunning()) {
        throw new Error('PostgreSQL no inició en 30 segundos');
    }

    process.env.DATABASE_URL = `postgresql://${DB_USER}@127.0.0.1:${PORT}/${DB_NAME}`;
    console.log('✅ PostgreSQL listo. DATABASE_URL:', process.env.DATABASE_URL);
}

async function ensureDatabaseExists() {
    console.log('📍 ensureDatabaseExists - Verificando base de datos...');

    const { stdout } = await pgExec('psql.exe', [
        '-U', DB_USER,
        '-p', PORT.toString(),
        '-h', '127.0.0.1',
        '-d', 'postgres',
        '-c', `SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`
    ]);

    const exists = (stdout || '').includes('(1 row)') ||
                   (stdout || '').includes('(1 fila)');

    if (exists) {
        console.log(`✅ Base de datos "${DB_NAME}" ya existe`);
    } else {
        console.log(`📍 Creando base de datos "${DB_NAME}"...`);
        await pgExec('createdb.exe', [
            '-U', DB_USER,
            '-p', PORT.toString(),
            '-h', '127.0.0.1',
            DB_NAME
        ]);
        console.log(`✅ Base de datos "${DB_NAME}" creada`);
    }
}

async function stopPostgres() {
    console.log('📍 stopPostgres - Deteniendo PostgreSQL...');
    const pgctlPath = path.join(pgBinDir, 'pg_ctl.exe');
    if (!fs.existsSync(pgctlPath)) return;

    await pgExec('pg_ctl.exe', ['stop', '-D', pgDataDir, '-m', 'fast', '-w']);
    console.log('✅ PostgreSQL detenido');
}

function startExpressServer() {
    const serverPath = isDev
        ? path.join(__dirname, '../dist/server.js')
        : path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'server.js');

    const frontendPath = isDev
        ? path.join(__dirname, '../frontend-build')
        : path.join(process.resourcesPath, 'app.asar.unpacked', 'frontend-build');

    console.log('🚀 Arrancando Express en:', serverPath);
    console.log('📁 Existe?', fs.existsSync(serverPath));

    if (!fs.existsSync(serverPath)) {
        console.error('❌ server.js no existe');
        return;
    }

    serverProcess = spawn(process.execPath, [serverPath], {
        env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            NODE_ENV: 'production',
            PORT: '5000',
            DATABASE_URL: process.env.DATABASE_URL,
            FRONTEND_PATH: frontendPath,
            DB_ALREADY_INITIALIZED: fs.existsSync(DB_INITIALIZED_FLAG) ? '1' : '0'
        },
        cwd: path.dirname(serverPath),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        windowsHide: true
    });

    serverProcess.stdout.on('data', (data) => {
        const msg = data.toString().trim();
        console.log('[EXPRESS-OUT]', msg);
        fs.appendFileSync(path.join(app.getPath('userData'), 'express.log'), '[OUT] ' + msg + '\n');
    });

    serverProcess.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        console.error('[EXPRESS-ERR]', msg);
        fs.appendFileSync(path.join(app.getPath('userData'), 'express.log'), '[ERR] ' + msg + '\n');
    });

    serverProcess.on('error', (err) => console.error('❌ Error al hacer spawn de node:', err));
    serverProcess.on('spawn', () => console.log('✅ Servidor Express iniciado, PID:', serverProcess.pid));
    serverProcess.on('exit', (code, signal) => console.log(`📍 Express terminó - código: ${code}, signal: ${signal}`));
}

async function waitForServer(url, timeout) {
    const startTime = Date.now();
    let attempts = 0;
    const http = require('http');

    while (Date.now() - startTime < timeout) {
        attempts++;
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(url, (res) => {
                    res.on('data', () => { });
                    res.on('end', () => {
                        (res.statusCode === 200 || res.statusCode === 304) ? resolve() : reject(new Error(`Status: ${res.statusCode}`));
                    });
                });
                req.on('error', reject);
                req.setTimeout(1000, () => { req.destroy(); reject(new Error('timeout')); });
                req.end();
            });
            console.log(`✅ Servidor listo (intento ${attempts})`);
            return;
        } catch {
            if (attempts % 10 === 0) console.log(`⏳ Esperando servidor... (${Math.floor((Date.now() - startTime) / 1000)}s)`);
            await new Promise(r => setTimeout(r, 200));
        }
    }
    throw new Error('Timeout: el servidor no respondió');
}

async function createWindow() {
    try {
        console.log('═══════════════════════════════════════');
        console.log('🚀 INICIANDO APLICACIÓN');
        console.log('═══════════════════════════════════════');
        console.log('📍 Modo:', isDev ? 'DESARROLLO' : 'PRODUCCIÓN');
        console.log('📍 resourcesPath:', process.resourcesPath);
        console.log('📍 userDataPath:', userDataPath);
        console.log('📍 pgBinDir:', pgBinDir);

        try { fs.writeFileSync(path.join(app.getPath('userData'), 'express.log'), ''); } catch (e) { }

        // Mostrar ventana de carga inmediatamente para que el usuario vea algo al instante
        mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            webPreferences: { nodeIntegration: false, contextIsolation: true },
            show: true,
            backgroundColor: '#0f172a'
        });
        mainWindow.loadURL('data:text/html,' + encodeURIComponent(`
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><style>
                body { margin:0; background:#0f172a; display:flex; align-items:center;
                       justify-content:center; height:100vh; font-family:sans-serif; color:white; }
                .container { text-align:center; }
                h1 { font-size:28px; font-weight:700; color:#3b82f6; margin-bottom:8px; }
                p  { color:#94a3b8; font-size:15px; margin-bottom:32px; }
                .spinner { width:40px; height:40px; border:3px solid #1e3a5f;
                           border-top-color:#3b82f6; border-radius:50%;
                           animation:spin 0.8s linear infinite; margin:0 auto; }
                @keyframes spin { to { transform:rotate(360deg); } }
            </style></head>
            <body><div class="container">
                <h1>Gestión de Horarios</h1>
                <p>Iniciando base de datos...</p>
                <div class="spinner"></div>
            </div></body>
            </html>
        `));
        mainWindow.on('closed', () => { mainWindow = null; });

        console.log('\n1️⃣ Iniciando PostgreSQL...');
        await startPostgres();

        console.log('\n2️⃣ Verificando base de datos...');
        if (fs.existsSync(DB_INITIALIZED_FLAG)) {
            console.log('✅ Base de datos ya inicializada previamente, omitiendo verificación');
        } else {
            await ensureDatabaseExists();
            try { fs.writeFileSync(DB_INITIALIZED_FLAG, new Date().toISOString()); } catch (e) { }
        }

        console.log('\n3️⃣ Iniciando servidor Express...');
        startExpressServer();

        console.log('\n4️⃣ Esperando respuesta del servidor...');
        await waitForServer('http://127.0.0.1:5000/health', 30000);

        console.log('✅ Navegando a la aplicación...');
        mainWindow.loadURL('http://127.0.0.1:5000');
        console.log('✅ APLICACIÓN INICIADA EXITOSAMENTE');

    } catch (error) {
        console.error('❌ ERROR FATAL:', error.message);
        console.error(error.stack);

        let dump = '';
        try {
            const logPath = path.join(app.getPath('userData'), 'express.log');
            if (fs.existsSync(logPath)) dump = '\n\nLog interno:\n' + fs.readFileSync(logPath, 'utf8');
        } catch (e) { }

        dialog.showErrorBox(
            'Error de Inicio',
            `No se pudo iniciar la aplicación:\n\n${error.message}\n\nDetalles:\n${error.stack}${dump}`
        );
        app.quit();
    }
}

app.whenReady().then(createWindow);

app.on('before-quit', async (e) => {
    e.preventDefault();
    if (serverProcess) serverProcess.kill();
    // PostgreSQL queda corriendo: el próximo arranque lo detecta en ~1ms
    // y salta pg_ctl start por completo (ahorra 8-10s de inicio)
    app.exit(0);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
