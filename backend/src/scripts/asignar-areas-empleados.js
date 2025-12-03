/**
 * Script para asignar áreas permitidas a empleados
 * Asigna 2-3 áreas aleatoriamente a cada empleado activo
 */

const prisma = require('../config/database');

// Máximos de trabajadores por área (según la configuración mostrada)
const maximosPorArea = {
  'BANO 1 (BNO1)': 2,
  'BANOS 3 (BNO3)': 2,
  'CASETA DE ENTRADA (CTE)': 3,
  'CASETA DE SALIDA (CTS)': 3,
  'CONDUCE (C)': 3,
  'PARQUEADERO 1 (PQA1)': 3,
  'PARQUEADERO 2 (PQA2)': 2,
  'PERIFERICO NORTE': 2,
  'PERIFERICO SUR': 1,
  'PUERTAS Y SALA (PTA1/PTA2)': 4,
  'Refuerzos': 5,
  'SALA PRINCIPAL (C5)': 2,
  'SALA TAXIS': 2,
};

async function asignarAreas() {
  try {
    console.log('🔄 Iniciando asignación de áreas a empleados...\n');

    // Obtener todos los empleados activos
    const empleados = await prisma.empleado.findMany({
      where: { estado: true },
      orderBy: { id_empleado: 'asc' }
    });

    // Obtener todas las áreas
    const areas = await prisma.area.findMany({
      orderBy: { nombre_area: 'asc' }
    });

    console.log(`📊 Empleados activos: ${empleados.length}`);
    console.log(`📊 Áreas disponibles: ${areas.length}\n`);

    if (empleados.length === 0) {
      console.log('❌ No hay empleados activos');
      return;
    }

    if (areas.length === 0) {
      console.log('❌ No hay áreas disponibles');
      return;
    }

    // Crear mapa de áreas por nombre para facilitar búsqueda
    const areasMap = new Map();
    areas.forEach(area => {
      areasMap.set(area.nombre_area, area);
    });

    // Contador de empleados asignados por área
    const contadorPorArea = new Map();
    areas.forEach(area => {
      contadorPorArea.set(area.id_area, 0);
    });

    // Función para obtener áreas disponibles (que no hayan alcanzado su máximo)
    function obtenerAreasDisponibles(areasDisponibles) {
      return areasDisponibles.filter(area => {
        const max = maximosPorArea[area.nombre_area] || 5; // Default 5 si no está en la lista
        const actual = contadorPorArea.get(area.id_area) || 0;
        return actual < max;
      });
    }

    // Función para mezclar array (Fisher-Yates)
    function shuffle(array) {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // Asignar áreas a cada empleado
    const resultados = [];
    const empleadosMezclados = shuffle(empleados);

    for (const empleado of empleadosMezclados) {
      // Determinar cuántas áreas asignar (2 o 3)
      const numAreas = Math.random() < 0.5 ? 2 : 3;
      
      // Obtener todas las áreas disponibles
      let areasDisponibles = obtenerAreasDisponibles(areas);
      
      // Si no hay suficientes áreas disponibles, usar todas
      if (areasDisponibles.length < numAreas) {
        areasDisponibles = areas;
      }

      // Mezclar y seleccionar áreas
      const areasSeleccionadas = shuffle(areasDisponibles).slice(0, numAreas);
      const idsAreas = areasSeleccionadas.map(a => a.id_area);

      // Actualizar contadores
      idsAreas.forEach(idArea => {
        const actual = contadorPorArea.get(idArea) || 0;
        contadorPorArea.set(idArea, actual + 1);
      });

      // Actualizar empleado en la base de datos
      await prisma.empleado.update({
        where: { id_empleado: empleado.id_empleado },
        data: {
          areas_permitidas: idsAreas
        }
      });

      const nombresAreas = areasSeleccionadas.map(a => a.nombre_area).join(', ');
      resultados.push({
        empleado: `${empleado.nombre1} ${empleado.apellido1}`,
        areas: nombresAreas,
        numAreas: idsAreas.length
      });

      console.log(`✅ ${empleado.nombre1} ${empleado.apellido1}: ${nombresAreas}`);
    }

    console.log('\n📈 Resumen de asignaciones por área:');
    areas.forEach(area => {
      const asignados = contadorPorArea.get(area.id_area) || 0;
      const max = maximosPorArea[area.nombre_area] || 5;
      const porcentaje = ((asignados / max) * 100).toFixed(1);
      console.log(`   ${area.nombre_area}: ${asignados}/${max} (${porcentaje}%)`);
    });

    console.log(`\n✅ Asignación completada: ${resultados.length} empleados actualizados`);
    console.log(`   - Empleados con 2 áreas: ${resultados.filter(r => r.numAreas === 2).length}`);
    console.log(`   - Empleados con 3 áreas: ${resultados.filter(r => r.numAreas === 3).length}`);

  } catch (error) {
    console.error('❌ Error al asignar áreas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
if (require.main === module) {
  asignarAreas()
    .then(() => {
      console.log('\n✨ Script ejecutado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en el script:', error);
      process.exit(1);
    });
}

module.exports = { asignarAreas };

