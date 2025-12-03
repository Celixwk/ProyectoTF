/**
 * Script para configurar la base de datos inicial
 * Ejecutar: node src/scripts/setup-database.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setup() {
  try {
    console.log('🔧 Iniciando configuración de la base de datos...\n');

    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a PostgreSQL exitosa\n');

    // 1. Crear tipos de recargo
    console.log('📊 Creando tipos de recargo...');
    const tiposRecargo = [
      { codigo: 'RNO', nombre_recargo: 'Recargo Nocturno Ordinario', porcentaje_recargo: 35.00 },
      { codigo: 'RNF', nombre_recargo: 'Recargo Nocturno Festivo', porcentaje_recargo: 110.00 },
      { codigo: 'D', nombre_recargo: 'Dominical', porcentaje_recargo: 75.00 },
      { codigo: 'F', nombre_recargo: 'Festivo', porcentaje_recargo: 75.00 },
      { codigo: 'HEOD', nombre_recargo: 'Hora Extra Ordinaria Diurna', porcentaje_recargo: 25.00 },
      { codigo: 'HEON', nombre_recargo: 'Hora Extra Ordinaria Nocturna', porcentaje_recargo: 75.00 },
      { codigo: 'HEFD', nombre_recargo: 'Hora Extra Festiva Diurna', porcentaje_recargo: 100.00 },
      { codigo: 'HEFN', nombre_recargo: 'Hora Extra Festiva Nocturna', porcentaje_recargo: 150.00 }
    ];

    for (const tipo of tiposRecargo) {
      await prisma.tipoRecargo.upsert({
        where: { codigo: tipo.codigo },
        update: {},
        create: tipo
      });
    }
    console.log(`✅ ${tiposRecargo.length} tipos de recargo creados\n`);

    // 2. Crear tipos de novedad
    console.log('📋 Creando tipos de novedad...');
    const tiposNovedad = [
      { codigo: 'INCAP', nombre_novedad: 'Incapacidad', afecta_pago: true },
      { codigo: 'VAC', nombre_novedad: 'Vacaciones', afecta_pago: false },
      { codigo: 'PERM', nombre_novedad: 'Permiso', afecta_pago: true },
      { codigo: 'LIC', nombre_novedad: 'Licencia', afecta_pago: false },
      { codigo: 'AUS', nombre_novedad: 'Ausencia', afecta_pago: true },
      { codigo: 'SUSP', nombre_novedad: 'Suspensión', afecta_pago: true }
    ];

    for (const tipo of tiposNovedad) {
      await prisma.tipoNovedad.upsert({
        where: { codigo: tipo.codigo },
        update: {},
        create: tipo
      });
    }
    console.log(`✅ ${tiposNovedad.length} tipos de novedad creados\n`);

    // 3. Crear cargo por defecto
    console.log('👔 Creando cargo por defecto...');
    const cargo = await prisma.cargo.upsert({
      where: { id_cargo: 1 },
      update: {},
      create: {
        nombre_cargo: 'Operario General',
        salario_base: 1300000.00
      }
    });
    console.log('✅ Cargo por defecto creado\n');

    // 4. Crear área por defecto
    console.log('🏢 Creando área por defecto...');
    const area = await prisma.area.upsert({
      where: { id_area: 1 },
      update: {},
      create: {
        nombre_area: 'Producción'
      }
    });
    console.log('✅ Área por defecto creada\n');

    // 5. Crear turnos básicos
    // NOTA: Solo se crean turnos con códigos que empiezan con 'T' (T1, T2, etc.)
    // Los turnos DIA, TARDE, NOCHE, etc. no deben crearse aquí
    // Las novedades (D, DESCANSO, INCAP, etc.) se crean en la sección de tipos de novedad
    console.log('⏰ Creando turnos básicos...');
    const turnos = [
      // Los turnos deben crearse manualmente con códigos T1, T2, T11, etc.
      // Este script ya no crea turnos por defecto
    ];

    if (turnos.length > 0) {
      for (const turno of turnos) {
        await prisma.turno.upsert({
          where: { codigo: turno.codigo },
          update: {},
          create: turno
        });
      }
      console.log(`✅ ${turnos.length} turnos creados\n`);
    } else {
      console.log('ℹ️  No se crean turnos por defecto. Los turnos deben crearse manualmente con códigos T1, T2, T11, etc.\n');
    }

    // 6. Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    const contraseniaHash = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.usuario.upsert({
      where: { usuario: 'admin' },
      update: {},
      create: {
        usuario: 'admin',
        contrasenia: contraseniaHash,
        tipo_usuario: 'administrador',
        nombre_completo: 'Administrador del Sistema',
        estado: true,
        fecha_creacion: new Date()
      }
    });
    console.log('✅ Usuario administrador creado');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123\n');

    // 7. Sincronizar domingos del año actual
    console.log('📅 Sincronizando domingos del año actual...');
    const anio = new Date().getFullYear();
    const domingos = [];

    for (let mes = 0; mes < 12; mes++) {
      const primerDia = new Date(anio, mes, 1);
      const ultimoDia = new Date(anio, mes + 1, 0);

      for (let dia = new Date(primerDia); dia <= ultimoDia; dia.setDate(dia.getDate() + 1)) {
        if (dia.getDay() === 0) {
          domingos.push(new Date(dia));
        }
      }
    }

    for (const domingo of domingos) {
      await prisma.calendario.upsert({
        where: { fecha: domingo },
        update: { es_domingo: true },
        create: {
          fecha: domingo,
          es_domingo: true,
          es_festivo: false
        }
      });
    }
    console.log(`✅ ${domingos.length} domingos sincronizados\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ¡Configuración completada exitosamente!');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Puedes iniciar sesión con:');
    console.log('  Usuario: admin');
    console.log('  Contraseña: admin123\n');
    console.log('Para iniciar el servidor ejecuta: npm run dev\n');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setup();

