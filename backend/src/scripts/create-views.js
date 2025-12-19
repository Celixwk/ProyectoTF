/**
 * Script para crear las vistas de la base de datos
 * Ejecutar: node src/scripts/create-views.js
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createViews() {
  try {
    console.log('📋 Leyendo script SQL de vistas...');
    
    const sqlPath = path.join(__dirname, '../prisma/create_views.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Extraer cada vista individualmente usando regex
    const viewRegex = /CREATE\s+OR\s+REPLACE\s+VIEW\s+(\w+)[\s\S]*?(?=CREATE\s+OR\s+REPLACE\s+VIEW|--\s*FIN|$)/gi;
    const views = [];
    let match;
    
    while ((match = viewRegex.exec(sql)) !== null) {
      const viewName = match[1];
      const viewSQL = match[0].trim();
      views.push({ name: viewName, sql: viewSQL });
    }
    
    console.log(`📝 Encontradas ${views.length} vistas para crear\n`);
    
    for (const view of views) {
      try {
        console.log(`⏳ Creando: ${view.name}...`);
        await prisma.$executeRawUnsafe(view.sql);
        console.log(`✅ Vista ${view.name} creada exitosamente\n`);
      } catch (error) {
        console.error(`❌ Error al crear ${view.name}:`, error.message);
        // Mostrar solo las primeras líneas del error para no saturar
        if (error.message.length > 200) {
          console.error(`   Detalles: ${error.message.substring(0, 200)}...`);
        }
        console.log(''); // Línea en blanco
      }
    }
    
    console.log('\n✨ Proceso completado!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createViews();

