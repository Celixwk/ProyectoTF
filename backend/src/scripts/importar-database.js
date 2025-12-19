/**
 * Script para importar una base de datos PostgreSQL
 * 
 * Opciones de uso:
 * 1. Desde archivo SQL: node importar-database.js --sql ruta/al/archivo.sql
 * 2. Desde archivo dump: node importar-database.js --dump ruta/al/archivo.dump
 * 3. Desde otra base de datos: node importar-database.js --from-db nombre_bd_origen
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const sqlFile = args.find(arg => arg.startsWith('--sql='))?.split('=')[1];
const dumpFile = args.find(arg => arg.startsWith('--dump='))?.split('=')[1];
const fromDb = args.find(arg => arg.startsWith('--from-db='))?.split('=')[1];

// Parsear DATABASE_URL
function parseDatabaseUrl(url) {
  // Formato: postgresql://usuario:contraseña@host:puerto/base_de_datos
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('DATABASE_URL no tiene el formato correcto');
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

async function importFromSQL(sqlFilePath) {
  log('\n📥 Importando desde archivo SQL...', 'blue');
  
  if (!fs.existsSync(sqlFilePath)) {
    log(`❌ Error: El archivo ${sqlFilePath} no existe`, 'red');
    process.exit(1);
  }

  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  // Construir comando psql
  const command = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${sqlFilePath}"`;
  
  log(`\n🔧 Ejecutando: ${command.replace(dbConfig.password, '***')}`, 'yellow');
  log('⚠️  Se te pedirá la contraseña de PostgreSQL\n', 'yellow');

  return new Promise((resolve, reject) => {
    exec(command, { env: { ...process.env, PGPASSWORD: dbConfig.password } }, (error, stdout, stderr) => {
      if (error) {
        log(`\n❌ Error al importar: ${error.message}`, 'red');
        if (stderr) log(`\n${stderr}`, 'red');
        reject(error);
      } else {
        log('\n✅ Base de datos importada correctamente!', 'green');
        if (stdout) log(stdout, 'green');
        resolve();
      }
    });
  });
}

async function importFromDump(dumpFilePath) {
  log('\n📥 Importando desde archivo dump...', 'blue');
  
  if (!fs.existsSync(dumpFilePath)) {
    log(`❌ Error: El archivo ${dumpFilePath} no existe`, 'red');
    process.exit(1);
  }

  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  // Construir comando pg_restore
  const command = `pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -v "${dumpFilePath}"`;
  
  log(`\n🔧 Ejecutando: ${command.replace(dbConfig.password, '***')}`, 'yellow');
  log('⚠️  Se te pedirá la contraseña de PostgreSQL\n', 'yellow');

  return new Promise((resolve, reject) => {
    exec(command, { env: { ...process.env, PGPASSWORD: dbConfig.password } }, (error, stdout, stderr) => {
      if (error) {
        log(`\n❌ Error al importar: ${error.message}`, 'red');
        if (stderr) log(`\n${stderr}`, 'red');
        reject(error);
      } else {
        log('\n✅ Base de datos importada correctamente!', 'green');
        if (stdout) log(stdout, 'green');
        resolve();
      }
    });
  });
}

async function importFromDatabase(sourceDatabase) {
  log(`\n📥 Importando desde base de datos: ${sourceDatabase}...`, 'blue');
  
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  
  // Primero hacer dump de la base de datos origen
  const dumpFile = path.join(__dirname, `temp_dump_${Date.now()}.dump`);
  const dumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -F c -b -v -f "${dumpFile}" "${sourceDatabase}"`;
  
  log(`\n🔧 Creando dump de ${sourceDatabase}...`, 'yellow');
  log('⚠️  Se te pedirá la contraseña de PostgreSQL\n', 'yellow');

  await new Promise((resolve, reject) => {
    exec(dumpCommand, { env: { ...process.env, PGPASSWORD: dbConfig.password } }, (error, stdout, stderr) => {
      if (error) {
        log(`\n❌ Error al crear dump: ${error.message}`, 'red');
        if (stderr) log(`\n${stderr}`, 'red');
        reject(error);
      } else {
        log('✅ Dump creado correctamente', 'green');
        resolve();
      }
    });
  });

  // Luego restaurar en la base de datos destino
  await importFromDump(dumpFile);
  
  // Eliminar archivo temporal
  fs.unlinkSync(dumpFile);
  log(`\n🗑️  Archivo temporal eliminado: ${dumpFile}`, 'yellow');
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════╗', 'blue');
  log('║   Importador de Base de Datos PostgreSQL            ║', 'blue');
  log('╚═══════════════════════════════════════════════════════╝', 'blue');

  // Verificar que DATABASE_URL esté configurado
  if (!process.env.DATABASE_URL) {
    log('\n❌ Error: DATABASE_URL no está configurado en .env', 'red');
    log('   Asegúrate de tener un archivo .env con:', 'yellow');
    log('   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/sistema_nomina"', 'yellow');
    process.exit(1);
  }

  try {
    if (sqlFile) {
      await importFromSQL(sqlFile);
    } else if (dumpFile) {
      await importFromDump(dumpFile);
    } else if (fromDb) {
      await importFromDatabase(fromDb);
    } else {
      log('\n❌ Error: Debes especificar una opción de importación', 'red');
      log('\n📖 Uso:', 'yellow');
      log('   node importar-database.js --sql=ruta/al/archivo.sql', 'yellow');
      log('   node importar-database.js --dump=ruta/al/archivo.dump', 'yellow');
      log('   node importar-database.js --from-db=nombre_bd_origen', 'yellow');
      process.exit(1);
    }

    log('\n✅ Proceso completado exitosamente!', 'green');
    log('\n💡 Siguiente paso: Ejecuta "npm run prisma:generate" para regenerar el cliente Prisma', 'blue');
    
  } catch (error) {
    log('\n❌ Error durante la importación', 'red');
    process.exit(1);
  }
}

main();




