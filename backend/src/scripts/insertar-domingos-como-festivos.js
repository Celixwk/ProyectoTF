const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script para insertar todos los domingos como festivos en la BD
 * Esto marca los domingos con es_festivo=true y es_domingo=true
 */
async function insertarDomingosComoFestivos() {
  try {
    console.log('🔄 Iniciando inserción de domingos como festivos...');
    
    // Obtener el año actual y el siguiente (para cubrir el año completo)
    const anioActual = new Date().getFullYear();
    const anioSiguiente = anioActual + 1;
    const anios = [anioActual, anioSiguiente];
    
    let totalInsertados = 0;
    let totalActualizados = 0;
    
    for (const anio of anios) {
      console.log(`\n📅 Procesando año ${anio}...`);
      
      // Calcular primer y último día del año
      const primerDia = new Date(anio, 0, 1); // 1 de enero
      const ultimoDia = new Date(anio, 11, 31); // 31 de diciembre
      
      // Iterar por todos los días del año
      for (let d = new Date(primerDia); d <= ultimoDia; d.setDate(d.getDate() + 1)) {
        const diaSemana = d.getDay();
        
        // Si es domingo (0)
        if (diaSemana === 0) {
          const fechaStr = d.toISOString().split('T')[0];
          
          try {
            // Upsert: crear o actualizar
            const resultado = await prisma.calendario.upsert({
              where: { fecha: d },
              update: {
                es_festivo: true,
                es_domingo: true,
                nombre_festivo: 'Domingo',
                tipo_festivo: 'dominical',
                updated_at: new Date()
              },
              create: {
                fecha: d,
                es_festivo: true,
                es_domingo: true,
                nombre_festivo: 'Domingo',
                tipo_festivo: 'dominical'
              }
            });
            
            // Verificar si fue creación o actualización
            const existe = await prisma.calendario.findUnique({
              where: { fecha: d }
            });
            
            if (existe && existe.created_at.getTime() === existe.updated_at.getTime()) {
              totalInsertados++;
            } else {
              totalActualizados++;
            }
            
            console.log(`✓ ${fechaStr} - Domingo marcado como festivo`);
          } catch (error) {
            if (error.code === 'P2002') {
              // Ya existe, intentar actualizar
              try {
                await prisma.calendario.update({
                  where: { fecha: d },
                  data: {
                    es_festivo: true,
                    es_domingo: true,
                    nombre_festivo: 'Domingo',
                    tipo_festivo: 'dominical',
                    updated_at: new Date()
                  }
                });
                totalActualizados++;
                console.log(`✓ ${fechaStr} - Domingo actualizado como festivo`);
              } catch (updateError) {
                console.error(`❌ Error al actualizar ${fechaStr}:`, updateError.message);
              }
            } else {
              console.error(`❌ Error al procesar ${fechaStr}:`, error.message);
            }
          }
        }
      }
    }
    
    console.log(`\n✅ Proceso completado:`);
    console.log(`   - Domingos insertados: ${totalInsertados}`);
    console.log(`   - Domingos actualizados: ${totalActualizados}`);
    console.log(`   - Total procesado: ${totalInsertados + totalActualizados}`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  insertarDomingosComoFestivos()
    .then(() => {
      console.log('\n🎉 Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error al ejecutar script:', error);
      process.exit(1);
    });
}

module.exports = { insertarDomingosComoFestivos };

