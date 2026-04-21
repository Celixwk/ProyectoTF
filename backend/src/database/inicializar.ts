import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nomina_db';

export async function verificarEstructuraBD() {
    try {
        // 1. Asegurar que la base de datos existe (conectando a 'postgres')
        await asegurarBaseDeDatosExiste();

        // 2. Verificar si la tabla principal existe
        const tablaExiste = await verificarTabla();
        
        if (!tablaExiste) {
            console.log('⚠️ Estructura de BD no detectada. Inicializando...');
            await ejecutarScriptSQL();
            console.log('✅ Estructura de BD creada exitosamente');
        } else {
            console.log('✅ Estructura de BD verificada');
        }
    } catch (error) {
        console.error('❌ Error fatal en inicialización de BD:', error);
        throw error;
    }
}

async function asegurarBaseDeDatosExiste() {
    // Extraemos los datos de la URL actual para conectar a 'postgres'
    // DATABASE_URL suele ser postgresql://postgres@localhost:5432/gestion_horarios_db
    const baseUri = DATABASE_URL.substring(0, DATABASE_URL.lastIndexOf('/'));
    const targetDb = DATABASE_URL.substring(DATABASE_URL.lastIndexOf('/') + 1);
    
    const client = new Client({ connectionString: `${baseUri}/postgres` });
    
    try {
        await client.connect();
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDb]);
        
        if (res.rowCount === 0) {
            console.log(` Creando base de datos "${targetDb}"...`);
            // CREATE DATABASE no se puede usar con parámetros ($1), hay que concatenar
            await client.query(`CREATE DATABASE "${targetDb}"`);
            console.log(`✅ Base de datos "${targetDb}" creada.`);
        }
    } catch (error) {
        console.error('❌ Error asegurando existencia de BD:', error);
    } finally {
        await client.end();
    }
}

async function verificarTabla(): Promise<boolean> {
    const client = new Client({ connectionString: DATABASE_URL });
    try {
        await client.connect();
        const result = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'estados_empleado'
            );
        `);
        return result.rows[0].exists;
    } catch (error) {
        console.error('Error verificando tabla:', error);
        return false;
    } finally {
        await client.end();
    }
}

async function ejecutarScriptSQL() {
    const client = new Client({ connectionString: DATABASE_URL });
    try {
        const sqlContent = obtenerContenidoSQL();

        await client.connect();

        await client.query(sqlContent);

        console.log('✅ Script SQL ejecutado correctamente');
    } catch (error) {
        console.error('❌ Error ejecutando script SQL:', error);
        throw error;
    } finally {
        await client.end();
    }
}

function obtenerContenidoSQL(): string {
    const appPath = process.env.PORTABLE_EXECUTABLE_DIR || process.cwd();

    const posiblesPaths = [
        path.join(appPath, 'resources', 'app.asar.unpacked', 'dist', 'database', 'init.sql'),
        path.join(appPath, 'resources', 'dist', 'database', 'init.sql'),
        path.join(__dirname, 'init.sql'),
        path.join(__dirname, '..', 'database', 'init.sql'),
        path.join(process.cwd(), 'dist', 'database', 'init.sql'),
        path.join(process.cwd(), 'src', 'database', 'init.sql'),
        path.join(appPath, '..', 'app.asar.unpacked', 'dist', 'database', 'init.sql'),
        path.join(appPath, 'dist', 'database', 'init.sql')
    ];

    for (const sqlPath of posiblesPaths) {
        if (fs.existsSync(sqlPath)) {
            console.log(`📄 Script SQL encontrado en: ${sqlPath}`);
            return fs.readFileSync(sqlPath, 'utf-8');
        }
    }

    throw new Error(`❌ Archivo init.sql no encontrado. Rutas buscadas:\n${posiblesPaths.join('\n')}`);
}