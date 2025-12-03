/**
 * Script para eliminar turnos inválidos (que no empiezan con 'T')
 * Ejecutar: node src/scripts/eliminar-turnos-invalidos.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function eliminarTurnosInvalidos() {
  try {
    console.log('🔍 Buscando turnos inválidos (que no empiezan con T)...\n');

    // Buscar todos los turnos que NO empiezan con 'T'
    const turnosInvalidos = await prisma.turno.findMany({
      where: {
        NOT: {
          codigo: {
            startsWith: 'T'
          }
        }
      }
    });

    if (turnosInvalidos.length === 0) {
      console.log('✅ No se encontraron turnos inválidos para eliminar.');
      return;
    }

    console.log(`📋 Se encontraron ${turnosInvalidos.length} turnos inválidos:`);
    turnosInvalidos.forEach(turno => {
      console.log(`  - ${turno.codigo} (ID: ${turno.id_turno})`);
    });

    console.log('\n🗑️  Eliminando turnos inválidos...\n');

    // Eliminar cada turno inválido
    for (const turno of turnosInvalidos) {
      try {
        // Verificar si hay asignaciones usando este turno
        const asignaciones = await prisma.detalleProgramacion.count({
          where: {
            fk_id_turno: turno.id_turno
          }
        });

        if (asignaciones > 0) {
          console.log(`⚠️  No se puede eliminar ${turno.codigo}: tiene ${asignaciones} asignaciones. Desactivando en su lugar...`);
          await prisma.turno.update({
            where: { id_turno: turno.id_turno },
            data: { estado: false }
          });
        } else {
          await prisma.turno.delete({
            where: { id_turno: turno.id_turno }
          });
          console.log(`✅ Eliminado: ${turno.codigo}`);
        }
      } catch (error) {
        console.error(`❌ Error al eliminar ${turno.codigo}:`, error.message);
      }
    }

    console.log('\n✅ Proceso completado.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

eliminarTurnosInvalidos();


