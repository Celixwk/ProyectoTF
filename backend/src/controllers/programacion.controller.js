const prisma = require('../config/database');

/**
 * CONTROLADOR PARA GENERACIÓN AUTOMÁTICA DE PROGRAMACIÓN
 * Usa heurísticas simples para generar programación equitativa
 */

/**
 * ANALIZAR Y BALANCEAR ÁREAS PERMITIDAS
 * Analiza la distribución actual de áreas permitidas y ajusta automáticamente
 * para asegurar que cada área tenga suficiente personal disponible
 */
const analizarYBalancearAreasPermitidas = async (empleados, areas, maximosPorAreaMap, diasDelMes) => {
  console.log(`\n🔍 INICIANDO ANÁLISIS Y BALANCEO DE ÁREAS PERMITIDAS`);
  console.log(`   Total empleados: ${empleados.length}`);
  console.log(`   Total áreas: ${areas.length}`);
  console.log(`   Días del mes: ${diasDelMes}`);
  console.log(`\n📋 ÁREAS QUE SERÁN CONSIDERADAS EN EL BALANCEO:`);
  areas.forEach(area => {
    const maximo = maximosPorAreaMap.get(area.id_area) || 5;
    console.log(`   - ${area.nombre_area} (ID: ${area.id_area}): máximo ${maximo} trabajadores`);
  });
  
  const ajustesRealizados = [];
  const empleadosActualizados = [];
  
  // 1. Analizar distribución actual
  // Mapa: id_area -> [empleados que tienen esta área permitida]
  const empleadosPorArea = new Map();
  areas.forEach(area => {
    empleadosPorArea.set(area.id_area, []);
  });
  
  empleados.forEach(empleado => {
    const areasPermitidas = empleado.areas_permitidas || [];
    if (areasPermitidas.length === 0) {
      // Si no tiene áreas permitidas, puede trabajar en todas
      areas.forEach(area => {
        empleadosPorArea.get(area.id_area).push(empleado.id_empleado);
      });
    } else {
      areasPermitidas.forEach(idArea => {
        if (empleadosPorArea.has(idArea)) {
          empleadosPorArea.get(idArea).push(empleado.id_empleado);
        }
      });
    }
  });
  
  // 2. Calcular necesidades por área
  // Necesitamos al menos (máximo × 1.5) empleados disponibles por área para cubrir rotaciones y descansos
  const necesidadesPorArea = new Map();
  areas.forEach(area => {
    const maximo = maximosPorAreaMap.get(area.id_area) || 5;
    const empleadosDisponibles = empleadosPorArea.get(area.id_area).length;
    // Necesitamos al menos máximo × 1.5 empleados disponibles
    const necesidadMinima = Math.ceil(maximo * 1.5);
    necesidadesPorArea.set(area.id_area, {
      maximo,
      empleadosDisponibles,
      necesidadMinima,
      deficit: Math.max(0, necesidadMinima - empleadosDisponibles)
    });
    
    // Log especial para PERIFERICO SUR (búsqueda flexible)
    const nombreUpper = area.nombre_area.toUpperCase();
    if (nombreUpper.includes('PERIFERICO') && nombreUpper.includes('SUR')) {
      console.log(`\n🔍 PERIFERICO SUR (ID: ${area.id_area}) - Análisis inicial:`);
      console.log(`   Nombre exacto: "${area.nombre_area}"`);
      console.log(`   Máximo configurado: ${maximo}`);
      console.log(`   Empleados disponibles: ${empleadosDisponibles}`);
      console.log(`   Necesidad mínima: ${necesidadMinima}`);
      console.log(`   Déficit: ${Math.max(0, necesidadMinima - empleadosDisponibles)}`);
    }
  });
  
  console.log(`\n📊 ANÁLISIS DE NECESIDADES POR ÁREA:`);
  const areasConDeficit = [];
  necesidadesPorArea.forEach((necesidad, idArea) => {
    const area = areas.find(a => a.id_area === idArea);
    const estado = necesidad.deficit > 0 ? '❌ DEFICIT' : necesidad.empleadosDisponibles === necesidad.necesidadMinima ? '⚠️ JUSTO' : '✅ OK';
    console.log(`  ${estado} ${area?.nombre_area || `Área ${idArea}`}: ${necesidad.empleadosDisponibles} disponibles / ${necesidad.necesidadMinima} necesarios (máximo: ${necesidad.maximo})`);
    if (necesidad.deficit > 0) {
      areasConDeficit.push({ idArea, area: area?.nombre_area || `Área ${idArea}`, deficit: necesidad.deficit });
    }
  });
  
  if (areasConDeficit.length === 0) {
    console.log(`\n✅ No se requieren ajustes: todas las áreas tienen suficiente personal disponible`);
    return { ajustesRealizados: 0, empleadosActualizados: [] };
  }
  
  // 3. Identificar empleados que pueden expandir sus áreas permitidas
  // Priorizar empleados con pocas áreas permitidas
  const empleadosParaExpandir = empleados
    .map(emp => ({
      id: emp.id_empleado,
      nombre: `${emp.nombre1} ${emp.apellido1}`,
      areasActuales: emp.areas_permitidas || [],
      cantidadAreas: (emp.areas_permitidas || []).length
    }))
    .sort((a, b) => a.cantidadAreas - b.cantidadAreas); // Menos áreas primero
  
  console.log(`\n🔄 BALANCEANDO ÁREAS PERMITIDAS:`);
  console.log(`   Áreas con déficit: ${areasConDeficit.length}`);
  console.log(`   Empleados disponibles para expandir: ${empleadosParaExpandir.length}`);
  
  // 4. Ajustar áreas permitidas estratégicamente
  // IMPORTANTE: Asegurar que TODAS las áreas tengan al menos algunos empleados disponibles
  // Incluso si no tienen déficit, si tienen 0 empleados disponibles, agregar al menos 1-2
  console.log(`\n🔍 VERIFICANDO ÁREAS CON 0 EMPLEADOS DISPONIBLES:`);
  for (const area of areas) {
    const idArea = area.id_area;
    const necesidad = necesidadesPorArea.get(idArea);
    if (!necesidad) {
      console.warn(`  ⚠️ Área ${area.nombre_area} (ID: ${idArea}) no tiene necesidad calculada`);
      continue;
    }
    
    // Log para todas las áreas, especialmente PERIFERICO SUR (búsqueda flexible)
    const nombreUpper = area.nombre_area.toUpperCase();
    if (nombreUpper.includes('PERIFERICO') && nombreUpper.includes('SUR')) {
      console.log(`  🎯 PERIFERICO SUR "${area.nombre_area}" (ID: ${idArea}): ${necesidad.empleadosDisponibles} empleados disponibles, necesidad mínima: ${necesidad.necesidadMinima}, máximo: ${necesidad.maximo}`);
    }
    
    // Si el área tiene 0 empleados disponibles, agregar al menos 2 empleados
    if (necesidad.empleadosDisponibles === 0) {
      console.warn(`  ⚠️ Área ${area.nombre_area} (ID: ${idArea}) tiene 0 empleados disponibles. Agregando empleados...`);
      let empleadosAgregados = 0;
      const empleadosNecesarios = Math.max(2, necesidad.necesidadMinima);
      
      for (const empInfo of empleadosParaExpandir) {
        if (empleadosAgregados >= empleadosNecesarios) break;
        
        const empleado = empleados.find(e => e.id_empleado === empInfo.id);
        if (!empleado) continue;
        
        const areasActuales = empleado.areas_permitidas || [];
        
        // Si el empleado ya tiene esta área permitida, saltar
        if (areasActuales.includes(idArea)) continue;
        
        // Agregar esta área a las áreas permitidas del empleado
        const nuevasAreas = [...areasActuales, idArea];
        
        try {
          // Actualizar en la base de datos
          await prisma.empleado.update({
            where: { id_empleado: empleado.id_empleado },
            data: { areas_permitidas: nuevasAreas }
          });
          
          // Actualizar en memoria
          empleado.areas_permitidas = nuevasAreas;
          
          ajustesRealizados.push({
            empleadoId: empleado.id_empleado,
            empleadoNombre: empInfo.nombre,
            areaAgregada: idArea,
            areaNombre: area.nombre_area,
            areasAntes: areasActuales.length,
            areasDespues: nuevasAreas.length
          });
          
          empleadosActualizados.push(empleado.id_empleado);
          empleadosAgregados++;
          
          console.log(`  ✅ Agregada área ${area.nombre_area} a empleado ${empInfo.nombre} (ID: ${empleado.id_empleado})`);
        } catch (error) {
          console.error(`  ❌ Error al actualizar áreas permitidas para empleado ${empInfo.nombre} (ID: ${empleado.id_empleado}):`, error);
        }
      }
      
      if (empleadosAgregados < empleadosNecesarios) {
        console.warn(`  ⚠️ No se pudieron agregar suficientes empleados a ${area.nombre_area}. Necesarios: ${empleadosNecesarios}, Agregados: ${empleadosAgregados}`);
      }
    }
  }
  
  // 5. Ajustar áreas con déficit
  for (const { idArea, area: nombreArea, deficit } of areasConDeficit) {
    let empleadosAgregados = 0;
    const empleadosNecesarios = deficit;
    
    for (const empInfo of empleadosParaExpandir) {
      if (empleadosAgregados >= empleadosNecesarios) break;
      
      const empleado = empleados.find(e => e.id_empleado === empInfo.id);
      if (!empleado) continue;
      
      const areasActuales = empleado.areas_permitidas || [];
      
      // Si el empleado ya tiene esta área permitida, saltar
      if (areasActuales.includes(idArea)) continue;
      
      // Agregar esta área a las áreas permitidas del empleado
      const nuevasAreas = [...areasActuales, idArea];
      
      try {
        // Actualizar en la base de datos
        await prisma.empleado.update({
          where: { id_empleado: empleado.id_empleado },
          data: { areas_permitidas: nuevasAreas }
        });
        
        // Actualizar en memoria
        empleado.areas_permitidas = nuevasAreas;
        
        ajustesRealizados.push({
          empleadoId: empleado.id_empleado,
          empleadoNombre: empInfo.nombre,
          areaAgregada: idArea,
          areaNombre: nombreArea,
          areasAntes: areasActuales.length,
          areasDespues: nuevasAreas.length
        });
        
        empleadosActualizados.push(empleado.id_empleado);
        empleadosAgregados++;
        
        console.log(`  ✅ Agregada área ${nombreArea} a empleado ${empInfo.nombre} (ID: ${empleado.id_empleado})`);
      } catch (error) {
        console.error(`  ❌ Error al actualizar áreas permitidas para empleado ${empInfo.nombre} (ID: ${empleado.id_empleado}):`, error);
      }
    }
    
    if (empleadosAgregados < empleadosNecesarios) {
      console.warn(`  ⚠️ No se pudieron agregar suficientes empleados a ${nombreArea}. Necesarios: ${empleadosNecesarios}, Agregados: ${empleadosAgregados}`);
    }
  }
  
  // 5. Verificar resultado final
  console.log(`\n📊 RESULTADO FINAL DEL BALANCEO:`);
  const empleadosPorAreaFinal = new Map();
  areas.forEach(area => {
    empleadosPorAreaFinal.set(area.id_area, []);
  });
  
  empleados.forEach(empleado => {
    const areasPermitidas = empleado.areas_permitidas || [];
    if (areasPermitidas.length === 0) {
      areas.forEach(area => {
        empleadosPorAreaFinal.get(area.id_area).push(empleado.id_empleado);
      });
    } else {
      areasPermitidas.forEach(idArea => {
        if (empleadosPorAreaFinal.has(idArea)) {
          empleadosPorAreaFinal.get(idArea).push(empleado.id_empleado);
        }
      });
    }
  });
  
  necesidadesPorArea.forEach((necesidad, idArea) => {
    const area = areas.find(a => a.id_area === idArea);
    const empleadosDisponiblesFinal = empleadosPorAreaFinal.get(idArea).length;
    const deficitFinal = Math.max(0, necesidad.necesidadMinima - empleadosDisponiblesFinal);
    const estado = deficitFinal > 0 ? '❌ AÚN DEFICIT' : empleadosDisponiblesFinal === necesidad.necesidadMinima ? '⚠️ JUSTO' : '✅ OK';
    console.log(`  ${estado} ${area?.nombre_area || `Área ${idArea}`}: ${empleadosDisponiblesFinal} disponibles / ${necesidad.necesidadMinima} necesarios`);
  });
  
  console.log(`\n✅ BALANCEO COMPLETADO: ${ajustesRealizados.length} ajustes realizados en ${new Set(empleadosActualizados).size} empleados`);
  
  return {
    ajustesRealizados: ajustesRealizados.length,
    empleadosActualizados: Array.from(new Set(empleadosActualizados)),
    detalles: ajustesRealizados
  };
};

/**
 * GENERAR PROGRAMACIÓN AUTOMÁTICA
 * Genera una programación automática para un mes usando heurísticas
 */
const generarProgramacionAutomatica = async (req, res) => {
  try {
    // Los descansos se pueden recibir como parámetro opcional en el body
    // Formato: { id_empleado: [días del mes que tiene descanso] }
    // Ejemplo: { "1": [5, 12, 19, 26], "2": [3, 10, 17, 24] }
    // maximos_por_area: { id_area: max_trabajadores }
    // Ejemplo: { "1": 5, "2": 3, "3": 4 }
    const { mes, anio, descansos, maximos_por_area } = req.body; // Cambiar de query a body

    if (!mes || !anio) {
      return res.status(400).json({
        error: 'Mes y año son requeridos'
      });
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    // Validar rango de mes
    if (mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        error: 'Mes inválido (debe ser entre 1 y 12)'
      });
    }

    // Calcular fechas del mes
    const fechaInicio = new Date(anioNum, mesNum - 1, 1);
    const fechaFin = new Date(anioNum, mesNum, 0); // Último día del mes

    // Obtener todos los empleados activos
    const empleados = await prisma.empleado.findMany({
      where: { estado: true },
      include: {
        cargo: true
      },
      orderBy: [
        { apellido1: 'asc' },
        { nombre1: 'asc' }
      ]
    });

    // Obtener todas las áreas
    const areas = await prisma.area.findMany({
      orderBy: { nombre_area: 'asc' }
    });

    // Obtener solo turnos con horarios (T1, T2, T3, etc.) - excluir novedades
    // Los turnos válidos son aquellos que tienen código que empieza con 'T' seguido de números
    const turnos = await prisma.turno.findMany({
      where: { 
        estado: true,
        codigo: {
          startsWith: 'T'
        }
      },
      orderBy: { codigo: 'asc' }
    });

    // Filtrar para asegurar que solo sean turnos con formato T1, T2, T11, etc. (no novedades)
    const turnosConHorarios = turnos.filter(turno => {
      const codigo = turno.codigo.toUpperCase().trim();
      // Verificar que sea formato T seguido de números (ej: T1, T2, T11, T13)
      return /^T\d+$/.test(codigo);
    });

    if (empleados.length === 0 || areas.length === 0 || turnosConHorarios.length === 0) {
      return res.status(400).json({
        error: 'No hay suficientes datos para generar programación (empleados, áreas o turnos con horarios). Asegúrate de tener turnos con código T1, T2, T3, etc.'
      });
    }

    // Verificar si ya existe programación para este mes
    // Usar un rango más específico para evitar problemas con fechas de otros meses
    // Crear fechas explícitamente para el primer y último día del mes
    const primerDiaMes = new Date(anioNum, mesNum - 1, 1);
    primerDiaMes.setHours(0, 0, 0, 0);
    const ultimoDiaMes = new Date(anioNum, mesNum, 0); // Día 0 del mes siguiente = último día del mes actual
    ultimoDiaMes.setHours(23, 59, 59, 999);
    
    // Usar consulta SQL directa para verificar con precisión
    // Usar formato de fecha explícito para evitar problemas de zona horaria
    const fechaInicioStr = `${anioNum}-${String(mesNum).padStart(2, '0')}-01`;
    const ultimoDiaDelMes = new Date(anioNum, mesNum, 0).getDate();
    const fechaFinStr = `${anioNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDiaDelMes).padStart(2, '0')}`;
    
    const programacionExistente = await prisma.$queryRawUnsafe(
      `SELECT id_detalle_turno 
       FROM detalle_programacion 
       WHERE fecha >= $1::date 
         AND fecha <= $2::date
       LIMIT 1`,
      fechaInicioStr,
      fechaFinStr
    );

    if (programacionExistente && programacionExistente.length > 0) {
      // Contar cuántos registros hay para dar información más detallada
      const conteoResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as total
         FROM detalle_programacion 
         WHERE fecha >= $1::date 
           AND fecha <= $2::date`,
        fechaInicioStr,
        fechaFinStr
      );
      const conteoProgramacion = conteoResult[0]?.total || 0;
      
      return res.status(409).json({
        error: 'Ya existe programación para este mes. Elimine la programación existente antes de generar una nueva.',
        existeProgramacion: true,
        registrosExistentes: Number(conteoProgramacion)
      });
    }

    // Generar programación usando heurísticas simples
    // IMPORTANTE: Solo generar turnos para el mes especificado (fechaInicio a fechaFin)
    const asignaciones = [];
    const diasMes = [];
    let fechaActual = new Date(fechaInicio);
    
    // Asegurar que fechaActual esté en el inicio del día
    fechaActual.setHours(0, 0, 0, 0);
    const fechaFinNormalizada = new Date(fechaFin);
    fechaFinNormalizada.setHours(23, 59, 59, 999);

    // Generar array de días SOLO del mes especificado
    while (fechaActual <= fechaFinNormalizada) {
      // Verificar que la fecha esté dentro del mes correcto
      const añoFecha = fechaActual.getFullYear();
      const mesFecha = fechaActual.getMonth() + 1;
      
      if (añoFecha === anioNum && mesFecha === mesNum) {
        diasMes.push(new Date(fechaActual));
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    console.log(`📅 Generando programación para ${diasMes.length} días del mes ${mesNum}/${anioNum}`);

    // Distribuir empleados por área según areas_permitidas
    // Si no hay áreas configuradas, distribuir en todas las áreas disponibles
    const empleadosPorArea = new Map();
    
    areas.forEach(area => {
      empleadosPorArea.set(area.id_area, []);
    });

    // Agrupar empleados por área permitida
    empleados.forEach(empleado => {
      const areasPermitidas = empleado.areas_permitidas || [];
      
      if (areasPermitidas.length === 0) {
        // Si no tiene áreas permitidas configuradas, asignar a TODAS las áreas disponibles
        // para permitir rotación en todas las áreas
        areas.forEach(area => {
          empleadosPorArea.get(area.id_area).push(empleado);
        });
      } else {
        // Si tiene áreas permitidas, asignar solo a esas áreas
        areasPermitidas.forEach(idArea => {
          if (empleadosPorArea.has(idArea)) {
            empleadosPorArea.get(idArea).push(empleado);
          }
        });
      }
    });

    // Crear labor_mes para cada empleado
    const laborMesMap = new Map();

    for (const empleado of empleados) {
      // Verificar si existe labor_mes para este empleado y mes
      let laborMes = await prisma.laborMes.findFirst({
        where: {
          id_empleado: empleado.id_empleado,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        }
      });

      if (!laborMes) {
        laborMes = await prisma.laborMes.create({
          data: {
            id_empleado: empleado.id_empleado,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            horas_ordinarias: 0,
            total_horas: 0,
            total_recargos: 0
          }
        });
        console.log(`✓ Creado labor_mes para empleado ${empleado.id_empleado} (${empleado.nombre_completo})`);
      }
      
      laborMesMap.set(empleado.id_empleado, laborMes);
    }
    
    // Validar que TODOS los empleados tengan laborMes ANTES de empezar a asignar turnos
    const empleadosSinLaborMes = empleados.filter(emp => !laborMesMap.has(emp.id_empleado));
    if (empleadosSinLaborMes.length > 0) {
      console.error(`❌ ${empleadosSinLaborMes.length} empleados sin laborMes. Creando de emergencia...`);
      for (const emp of empleadosSinLaborMes) {
        try {
          const laborMes = await prisma.laborMes.create({
            data: {
              id_empleado: emp.id_empleado,
              fecha_inicio: fechaInicio,
              fecha_fin: fechaFin,
              horas_ordinarias: 0,
              total_horas: 0,
              total_recargos: 0
            }
          });
          laborMesMap.set(emp.id_empleado, laborMes);
          console.log(`✓ Creado labor_mes de emergencia para empleado ${emp.id_empleado} (${emp.nombre_completo})`);
        } catch (error) {
          console.error(`❌ Error al crear labor_mes de emergencia para empleado ${emp.id_empleado}:`, error);
        }
      }
    }

    // Buscar turno de descanso (código "D" o similar)
    const turnoDescanso = await prisma.turno.findFirst({
      where: {
        codigo: { in: ['D', 'DESCANSO'] },
        estado: true
      }
    });

    // Procesar descansos si vienen como parámetro
    // Formato esperado: { "id_empleado": [días del mes] }
    const descansosMap = new Map();
    if (descansos && typeof descansos === 'object') {
      Object.entries(descansos).forEach(([idEmpleado, dias]) => {
        if (Array.isArray(dias)) {
          descansosMap.set(parseInt(idEmpleado), dias);
        }
      });
    }

    // Crear mapa de máximos por área (default: 5 si no se especifica)
    const maximosPorAreaMap = new Map();
    
    // Log de lo que se recibe del frontend
    console.log(`\n📥 MÁXIMOS RECIBIDOS DEL FRONTEND:`, JSON.stringify(maximos_por_area, null, 2));
    console.log(`📥 Tipo de maximos_por_area:`, typeof maximos_por_area);
    console.log(`📥 Es array?:`, Array.isArray(maximos_por_area));
    console.log(`📥 Áreas disponibles en BD:`, areas.map(a => ({ id: a.id_area, nombre: a.nombre_area })));
    
    if (maximos_por_area && typeof maximos_por_area === 'object' && !Array.isArray(maximos_por_area)) {
      // Procesar tanto claves numéricas como strings
      Object.entries(maximos_por_area).forEach(([idArea, max]) => {
        // Intentar parsear la clave como número
        let idAreaNum = parseInt(idArea);
        
        // Si no es un número válido, intentar buscar el área por nombre
        if (isNaN(idAreaNum)) {
          const areaPorNombre = areas.find(a => a.nombre_area === idArea || a.id_area.toString() === idArea);
          if (areaPorNombre) {
            idAreaNum = areaPorNombre.id_area;
            console.log(`  🔄 Clave "${idArea}" convertida a ID numérico: ${idAreaNum}`);
          } else {
            console.error(`❌ ERROR: No se pudo identificar área con clave: "${idArea}"`);
            console.error(`   Áreas disponibles:`, areas.map(a => `${a.id_area} (${a.nombre_area})`).join(', '));
            return;
          }

        }
        
        const maxNum = parseInt(max) || 5;
        maximosPorAreaMap.set(idAreaNum, maxNum);
        const area = areas.find(a => a.id_area === idAreaNum);
        if (!area) {
          console.error(`❌ ERROR: Área con ID ${idAreaNum} no encontrada en BD después de configurar máximo`);
        } else {
          console.log(`✅ Máximo configurado para área ID ${idAreaNum} (${area.nombre_area}): ${maxNum} trabajadores (clave recibida: "${idArea}")`);
        }
      });
    } else {
      console.warn(`⚠️ No se recibieron máximos_por_area o el formato es incorrecto. Tipo: ${typeof maximos_por_area}, Es array: ${Array.isArray(maximos_por_area)}. Usando defaults.`);
    }
    
    // Si no hay configuración, usar default de 5 para todas las áreas
    console.log(`\n📋 RESUMEN DE MÁXIMOS CONFIGURADOS:`);
    areas.forEach(area => {
      if (!maximosPorAreaMap.has(area.id_area)) {
        maximosPorAreaMap.set(area.id_area, 5);
        console.log(`  ⚠️ DEFAULT: Área ID ${area.id_area} (${area.nombre_area}): 5 trabajadores (no configurado)`);
      } else {
        const maximo = maximosPorAreaMap.get(area.id_area);
        console.log(`  ✅ CONFIGURADO: Área ID ${area.id_area} (${area.nombre_area}): ${maximo} trabajadores`);
      }
    });
    
    // Log de todas las áreas disponibles (después de inicializar maximosPorAreaMap)
    console.log(`\n📋 ÁREAS DISPONIBLES EN EL SISTEMA (${areas.length} áreas):`);
    areas.forEach(area => {
      const maximo = maximosPorAreaMap.get(area.id_area);
      const maximoStr = maximo !== undefined ? ` (máximo: ${maximo})` : ' (sin máximo configurado)';
      console.log(`  - ${area.nombre_area} (ID: ${area.id_area})${maximoStr}`);
      
      // Verificación especial para PERIFERICO SUR
      const nombreUpper = area.nombre_area.toUpperCase();
      if (nombreUpper.includes('PERIFERICO') && nombreUpper.includes('SUR')) {
        console.log(`    ⚠️ PERIFERICO SUR DETECTADO: "${area.nombre_area}" (ID: ${area.id_area}) - Máximo: ${maximo || 5}`);
      }
    });
    
    // Calcular días del mes para el balanceo
    const diasDelMes = new Date(anioNum, mesNum, 0).getDate();
    
    // BALANCEAR ÁREAS PERMITIDAS ANTES DE GENERAR PROGRAMACIÓN
    // Esto asegura que cada área tenga suficiente personal disponible
    const resultadoBalanceo = await analizarYBalancearAreasPermitidas(
      empleados,
      areas,
      maximosPorAreaMap,
      diasDelMes
    );
    
    if (resultadoBalanceo.ajustesRealizados > 0) {
      console.log(`\n📝 RESUMEN DE AJUSTES REALIZADOS:`);
      console.log(`   Total ajustes: ${resultadoBalanceo.ajustesRealizados}`);
      console.log(`   Empleados modificados: ${resultadoBalanceo.empleadosActualizados.length}`);
      resultadoBalanceo.detalles.forEach(ajuste => {
        console.log(`   - ${ajuste.empleadoNombre} (ID: ${ajuste.empleadoId}): Agregada área ${ajuste.areaNombre} (${ajuste.areasAntes} → ${ajuste.areasDespues} áreas)`);
      });
      
      // Recargar empleados desde la BD para tener las áreas actualizadas
      const empleadosActualizados = await prisma.empleado.findMany({
        where: { estado: true },
        include: {
          cargo: true
        },
        orderBy: [
          { apellido1: 'asc' },
          { nombre1: 'asc' }
        ]
      });
      
      // Reemplazar el array de empleados con los actualizados
      empleados.length = 0;
      empleados.push(...empleadosActualizados);
      
      // Verificar que PERIFERICO SUR tenga empleados disponibles después del balanceo
      // Búsqueda flexible para encontrar PERIFERICO SUR sin importar mayúsculas/minúsculas
      const areaPerifericoSur = areas.find(a => {
        const nombreUpper = a.nombre_area.toUpperCase();
        return nombreUpper.includes('PERIFERICO') && nombreUpper.includes('SUR');
      });
      
      if (areaPerifericoSur) {
        const empleadosConPerifericoSur = empleados.filter(emp => {
          const areasPermitidas = emp.areas_permitidas || [];
          return areasPermitidas.length === 0 || areasPermitidas.includes(areaPerifericoSur.id_area);
        });
        console.log(`\n🔍 VERIFICACIÓN POST-BALANCEO: PERIFERICO SUR`);
        console.log(`   Nombre exacto: "${areaPerifericoSur.nombre_area}" (ID: ${areaPerifericoSur.id_area})`);
        console.log(`   Máximo configurado: ${maximosPorAreaMap.get(areaPerifericoSur.id_area) || 'NO CONFIGURADO'}`);
        console.log(`   Empleados disponibles: ${empleadosConPerifericoSur.length}`);
        if (empleadosConPerifericoSur.length === 0) {
          console.error(`   ❌ ERROR: PERIFERICO SUR no tiene empleados disponibles después del balanceo`);
          console.error(`   Esto significa que ningún empleado tiene esta área en su lista de áreas permitidas`);
        } else {
          console.log(`   ✅ Empleados con PERIFERICO SUR permitido: ${empleadosConPerifericoSur.map(e => `${e.id_empleado} (${e.nombre1} ${e.apellido1})`).join(', ')}`);
        }
      } else {
        console.error(`\n❌ ERROR CRÍTICO: No se encontró PERIFERICO SUR en la lista de áreas`);
        console.error(`   Áreas disponibles: ${areas.map(a => `"${a.nombre_area}" (ID: ${a.id_area})`).join(', ')}`);
      }
      
      console.log(`\n✅ Empleados recargados desde BD con áreas permitidas actualizadas`);
      
      // Verificación post-balanceo: verificar que ahora hay suficiente personal disponible
      const empleadosPorAreaPostBalanceo = new Map();
      areas.forEach(area => {
        empleadosPorAreaPostBalanceo.set(area.id_area, []);
      });
      
      empleados.forEach(empleado => {
        const areasPermitidas = empleado.areas_permitidas || [];
        if (areasPermitidas.length === 0) {
          areas.forEach(area => {
            empleadosPorAreaPostBalanceo.get(area.id_area).push(empleado.id_empleado);
          });
        } else {
          areasPermitidas.forEach(idArea => {
            if (empleadosPorAreaPostBalanceo.has(idArea)) {
              empleadosPorAreaPostBalanceo.get(idArea).push(empleado.id_empleado);
            }
          });
        }
      });
      
      console.log(`\n🔍 VERIFICACIÓN POST-BALANCEO:`);
      const areasConProblemas = [];
      areas.forEach(area => {
        const maximo = maximosPorAreaMap.get(area.id_area) || 5;
        const necesidadMinima = Math.ceil(maximo * 1.5);
        const empleadosDisponibles = empleadosPorAreaPostBalanceo.get(area.id_area).length;
        const deficit = Math.max(0, necesidadMinima - empleadosDisponibles);
        
        if (deficit > 0) {
          areasConProblemas.push({
            area: area.nombre_area,
            maximo,
            empleadosDisponibles,
            necesidadMinima,
            deficit
          });
          console.error(`  ❌ ${area.nombre_area}: ${empleadosDisponibles} disponibles / ${necesidadMinima} necesarios (déficit: ${deficit})`);
        } else {
          console.log(`  ✅ ${area.nombre_area}: ${empleadosDisponibles} disponibles / ${necesidadMinima} necesarios`);
        }
      });
      
      if (areasConProblemas.length > 0) {
        console.warn(`\n⚠️ ADVERTENCIA: Después del balanceo, ${areasConProblemas.length} área(s) aún tienen déficit de personal:`);
        areasConProblemas.forEach(problema => {
          console.warn(`   - ${problema.area}: Necesita ${problema.necesidadMinima} empleados pero solo tiene ${problema.empleadosDisponibles} disponibles`);
          console.warn(`     Déficit: ${problema.deficit} empleados. La programación puede tener celdas vacías en esta área.`);
        });
        console.warn(`\n   RECOMENDACIÓN: Agregar más empleados o aumentar las áreas permitidas de empleados existentes.`);
      }
    }
    
    // Log resumen de máximos configurados con verificación cruzada
    console.log(`\n📊 RESUMEN DE MÁXIMOS POR ÁREA (FINAL):`);
    areas.forEach(area => {
      const maximo = maximosPorAreaMap.get(area.id_area) || 5;
      const recibido = maximos_por_area && maximos_por_area[area.id_area] ? maximos_por_area[area.id_area] : 'NO RECIBIDO';
      console.log(`  ${area.nombre_area} (ID: ${area.id_area}): ${maximo} trabajadores máximo (recibido: ${recibido})`);
    });

    // Verificación final: todos deben tener laborMes
    const empleadosAunSinLaborMes = empleados.filter(emp => !laborMesMap.has(emp.id_empleado));
    if (empleadosAunSinLaborMes.length > 0) {
      console.error(`❌❌ CRÍTICO: ${empleadosAunSinLaborMes.length} empleados AÚN sin laborMes después de crear de emergencia`);
    } else {
      console.log(`✅ Todos los empleados tienen laborMes (${laborMesMap.size} empleados)`);
    }

    // Generar programación: asignar turnos a TODOS los empleados TODOS los días (24/7)
    for (let indexDia = 0; indexDia < diasMes.length; indexDia++) {
      const dia = diasMes[indexDia];
      const diaDelMes = dia.getDate();
      
      // Log para debugging del día 1
      if (diaDelMes === 1) {
        console.log(`\n=== GENERANDO TURNOS PARA DÍA 1 ===`);
        console.log(`Total empleados: ${empleados.length}`);
        console.log(`Total áreas: ${areas.length}`);
        console.log(`Total turnos con horarios: ${turnosConHorarios.length}`);
        console.log(`Empleados con laborMes: ${laborMesMap.size}`);
        console.log(`Fecha del día: ${dia.toISOString().split('T')[0]}`);
      }
      
      // Contador de trabajadores asignados por área en este día
      const trabajadoresPorAreaHoy = new Map();
      areas.forEach(area => {
        trabajadoresPorAreaHoy.set(area.id_area, 0);
      });
      
      // Función helper para asignar trabajador de forma segura (dentro del loop para acceder al mapa)
      const asignarTrabajadorSeguro = (areaId, maxTrabajadores, areaNombre) => {
        const trabajadoresActuales = trabajadoresPorAreaHoy.get(areaId) || 0;
        
        // Log detallado para día 1
        if (diaDelMes === 1) {
          console.log(`  🔍 asignarTrabajadorSeguro: Área ${areaNombre} (ID: ${areaId}), Actual: ${trabajadoresActuales}, Máximo: ${maxTrabajadores}`);
        }
        
        // Verificar que no exceda el máximo
        if (trabajadoresActuales >= maxTrabajadores) {
          if (diaDelMes === 1) {
            console.error(`  ❌ BLOQUEADO: Área ${areaNombre} ya alcanzó su máximo (${trabajadoresActuales}/${maxTrabajadores})`);
          }
          return { exito: false, trabajadoresActuales, error: `Área ${areaNombre} ya alcanzó su máximo (${trabajadoresActuales}/${maxTrabajadores})` };
        }
        
        // Incrementar contador
        const nuevoContador = trabajadoresActuales + 1;
        trabajadoresPorAreaHoy.set(areaId, nuevoContador);
        
        // Verificar post-incremento
        if (nuevoContador > maxTrabajadores) {
          // Revertir si excedió
          trabajadoresPorAreaHoy.set(areaId, trabajadoresActuales);
          console.error(`  ❌❌ ERROR: Después de incrementar, área ${areaNombre} excede el máximo: ${nuevoContador} > ${maxTrabajadores}`);
          return { exito: false, trabajadoresActuales, error: `Error: después de incrementar, área ${areaNombre} excede el máximo` };
        }
        
        if (diaDelMes === 1) {
          console.log(`  ✅ ASIGNADO: Área ${areaNombre} ahora tiene ${nuevoContador}/${maxTrabajadores} trabajadores`);
        }
        
        return { exito: true, trabajadoresActuales: nuevoContador, trabajadoresAnteriores: trabajadoresActuales };
      };
      
      // Función helper para revertir asignación
      const revertirAsignacion = (areaId, trabajadoresAnteriores) => {
        trabajadoresPorAreaHoy.set(areaId, trabajadoresAnteriores);
      };
      
      // Log para día 1: mostrar máximos configurados y capacidad total
      if (diaDelMes === 1) {
        const capacidadTotal = areas.reduce((sum, area) => {
          const maximo = maximosPorAreaMap.get(area.id_area) || 5;
          return sum + maximo;
        }, 0);
        console.log(`\n📋 MÁXIMOS POR ÁREA PARA DÍA 1 (VERIFICACIÓN CRÍTICA):`);
        areas.forEach(area => {
          const maximo = maximosPorAreaMap.get(area.id_area);
          if (maximo === undefined) {
            console.error(`  ❌ ${area.nombre_area} (ID: ${area.id_area}): NO TIENE MÁXIMO CONFIGURADO - usando default 5`);
          } else {
            console.log(`  ✅ ${area.nombre_area} (ID: ${area.id_area}): máximo ${maximo} trabajadores`);
          }
        });
        console.log(`\n📊 CAPACIDAD DEL SISTEMA:`);
        console.log(`  - Capacidad total: ${capacidadTotal} trabajadores/día`);
        console.log(`  - Total empleados activos: ${empleados.length}`);
        console.log(`  - Diferencia: ${empleados.length - capacidadTotal} empleados`);
        if (empleados.length > capacidadTotal) {
          console.warn(`  ⚠️ ADVERTENCIA: Hay más empleados (${empleados.length}) que capacidad total (${capacidadTotal}). Algunos empleados pueden quedar sin turno.`);
        }
      }

      // Mapa para evitar cruces de turnos: empleado -> ya tiene turno asignado hoy
      const empleadosConTurnoHoy = new Set();
      
      // Mapa para rastrear asignaciones por empleado (para validación de cruces)
      const asignacionesPorEmpleado = new Map(); // id_empleado -> array de asignaciones

      // Primero, identificar qué áreas necesitan cobertura por descansos
      const areasNecesitanCobertura = new Map(); // id_area -> cantidad de empleados con descanso que normalmente trabajan ahí
      areas.forEach(area => {
        let empleadosConDescansoEnArea = 0;
        empleados.forEach(emp => {
          const diasDescanso = descansosMap.get(emp.id_empleado) || [];
          const tieneDescanso = diasDescanso.length > 0 && diasDescanso.includes(diaDelMes);
          if (tieneDescanso) {
            const areasPermitidas = emp.areas_permitidas || [];
            if (areasPermitidas.length === 0 || areasPermitidas.includes(area.id_area)) {
              empleadosConDescansoEnArea++;
            }
          }
        });
        if (empleadosConDescansoEnArea > 0) {
          areasNecesitanCobertura.set(area.id_area, empleadosConDescansoEnArea);
        }
      });

      // Iterar sobre TODOS los empleados para asignarles un turno este día
      // Usar for...of en lugar de forEach para permitir mejor control del flujo
      for (let idxEmpleado = 0; idxEmpleado < empleados.length; idxEmpleado++) {
        const empleado = empleados[idxEmpleado];
        
        // Verificar si el empleado tiene descanso en este día (SOLO si está configurado)
        const diasDescanso = descansosMap.get(empleado.id_empleado) || [];
        const tieneDescanso = diasDescanso.length > 0 && diasDescanso.includes(diaDelMes);

        const laborMes = laborMesMap.get(empleado.id_empleado);
        if (!laborMes) {
          console.error(`ERROR CRÍTICO: No se encontró labor_mes para empleado ${empleado.id_empleado} en día ${diaDelMes}. Esto no debería pasar.`);
          // Intentar crear labor_mes de emergencia (aunque debería existir)
          // Por ahora, saltar este empleado para este día
          return;
        }

        // Verificar si este empleado ya tiene un turno asignado hoy (evitar múltiples turnos)
        if (empleadosConTurnoHoy.has(empleado.id_empleado)) {
          // Para el día 1, log más detallado
          if (diaDelMes === 1) {
            console.warn(`⚠️ DÍA 1: Empleado ${empleado.id_empleado} (${empleado.nombre_completo}) ya tiene turno asignado`);
          }
          continue; // Cambiar return por continue para que el bucle continúe
        }

        // Si tiene descanso configurado, asignar turno de descanso
        if (tieneDescanso && turnoDescanso) {
          // Para descanso, asignar a la primera área permitida del empleado (o primera área del sistema)
          let areaDescanso = areas[0]; // Default: primera área
          const areasPermitidas = empleado.areas_permitidas || [];
          if (areasPermitidas.length > 0) {
            const primeraAreaPermitida = areas.find(a => areasPermitidas.includes(a.id_area));
            if (primeraAreaPermitida) {
              areaDescanso = primeraAreaPermitida;
            }
          }
          
          const asignacionDescanso = {
            fecha: new Date(dia),
            id_area: areaDescanso.id_area,
            fk_id_labor_mes: laborMes.id,
            fk_id_turno: turnoDescanso.id_turno,
            total_horas_laboradas: 0
          };
          
          asignaciones.push(asignacionDescanso);
          empleadosConTurnoHoy.add(empleado.id_empleado);
          
          // Registrar para validación
          if (!asignacionesPorEmpleado.has(empleado.id_empleado)) {
            asignacionesPorEmpleado.set(empleado.id_empleado, []);
          }
          asignacionesPorEmpleado.get(empleado.id_empleado).push({
            ...asignacionDescanso,
            id_empleado: empleado.id_empleado,
            codigo_turno: turnoDescanso.codigo
          });
          
          continue; // Cambiar return por continue para que el bucle continúe
        }

        // Obtener áreas permitidas del empleado
        const areasPermitidas = empleado.areas_permitidas || [];
        let areasDisponibles = [];

        // Paso 1: Filtrar áreas que respetan el máximo configurado
        // CRÍTICO: NUNCA ignorar los máximos, siempre respetarlos
        if (areasPermitidas.length === 0) {
          // Si no tiene áreas permitidas, puede trabajar en todas las que tengan capacidad
          areasDisponibles = areas.filter(area => {
            const maxTrabajadores = maximosPorAreaMap.get(area.id_area);
            // Si no se encuentra el máximo, usar default pero mostrar advertencia
            if (maxTrabajadores === undefined) {
              console.warn(`⚠️ DÍA ${diaDelMes}: No se encontró máximo configurado para área ${area.nombre_area} (ID: ${area.id_area}). Usando default: 5`);
            }
            const maxTrabajadoresFinal = maxTrabajadores !== undefined ? maxTrabajadores : 5;
            const trabajadoresActuales = trabajadoresPorAreaHoy.get(area.id_area) || 0;
            const tieneCapacidad = trabajadoresActuales < maxTrabajadoresFinal;
            
            // Log detallado para día 1 y PERIFERICO SUR
            if (diaDelMes === 1 || area.nombre_area.includes('PERIFERICO SUR')) {
              console.log(`  🔍 Área ${area.nombre_area} (ID: ${area.id_area}): ${trabajadoresActuales}/${maxTrabajadoresFinal} - ${tieneCapacidad ? '✅ Disponible' : '❌ Llena'}`);
            }
            
            return tieneCapacidad; // Solo áreas que NO han alcanzado el máximo
          });
        } else {
          // Filtrar solo áreas permitidas que NO hayan alcanzado el máximo
          areasDisponibles = areas.filter(area => {
            const estaPermitida = areasPermitidas.includes(area.id_area);
            const maxTrabajadores = maximosPorAreaMap.get(area.id_area);
            // Si no se encuentra el máximo, usar default pero mostrar advertencia
            if (maxTrabajadores === undefined && estaPermitida) {
              console.warn(`⚠️ DÍA ${diaDelMes}: No se encontró máximo configurado para área permitida ${area.nombre_area} (ID: ${area.id_area}). Usando default: 5`);
            }
            const maxTrabajadoresFinal = maxTrabajadores !== undefined ? maxTrabajadores : 5;
            const trabajadoresActuales = trabajadoresPorAreaHoy.get(area.id_area) || 0;
            const tieneCapacidad = trabajadoresActuales < maxTrabajadoresFinal;
            
            // Log detallado para día 1 y PERIFERICO SUR
            if ((diaDelMes === 1 || area.nombre_area.includes('PERIFERICO SUR')) && estaPermitida) {
              console.log(`  🔍 Área permitida ${area.nombre_area} (ID: ${area.id_area}) para empleado ${empleado.id_empleado}: ${trabajadoresActuales}/${maxTrabajadoresFinal} - ${tieneCapacidad ? '✅ Disponible' : '❌ Llena'} - ${estaPermitida ? '✅ Permitida' : '❌ No permitida'}`);
            }
            
            return estaPermitida && tieneCapacidad; // Debe ser permitida Y tener capacidad
          });
        }
        
    // Log especial para PERIFERICO SUR
    if (diaDelMes === 1) {
      const areaPerifericoSur = areas.find(a => {
        const nombreUpper = a.nombre_area.toUpperCase();
        return nombreUpper.includes('PERIFERICO') && nombreUpper.includes('SUR');
      });
      if (areaPerifericoSur) {
        const estaEnDisponibles = areasDisponibles.some(a => a.id_area === areaPerifericoSur.id_area);
        const maxTrabajadores = maximosPorAreaMap.get(areaPerifericoSur.id_area) || 1;
        const trabajadoresActuales = trabajadoresPorAreaHoy.get(areaPerifericoSur.id_area) || 0;
        console.log(`  🎯 PERIFERICO SUR "${areaPerifericoSur.nombre_area}" (ID: ${areaPerifericoSur.id_area}) para empleado ${empleado.id_empleado}: ${estaEnDisponibles ? '✅ Disponible' : '❌ No disponible'} - Actual: ${trabajadoresActuales}/${maxTrabajadores} - Empleado tiene área permitida: ${areasPermitidas.length === 0 ? 'TODAS' : areasPermitidas.includes(areaPerifericoSur.id_area) ? 'SÍ' : 'NO'}`);
      } else {
        console.error(`  ❌ PERIFERICO SUR no encontrado en la lista de áreas para empleado ${empleado.id_empleado}`);
      }
    }

        // Paso 2: Priorizar áreas que necesitan cobertura por descansos (pero solo si respetan máximos)
        const areasConCobertura = areasDisponibles.filter(area => 
          areasNecesitanCobertura.has(area.id_area)
        );
        if (areasConCobertura.length > 0) {
          areasDisponibles = areasConCobertura;
        }
        
        // Paso 2.5: Priorizar PERIFERICO SUR si está disponible y tiene capacidad
        const areaPerifericoSur = areasDisponibles.find(a => {
          const nombreUpper = a.nombre_area.toUpperCase();
          return nombreUpper.includes('PERIFERICO') && nombreUpper.includes('SUR');
        });
        if (areaPerifericoSur && areasDisponibles.length > 1) {
          // Mover PERIFERICO SUR al principio de la lista para priorizarlo
          areasDisponibles = areasDisponibles.filter(a => a.id_area !== areaPerifericoSur.id_area);
          areasDisponibles.unshift(areaPerifericoSur);
          
          if (diaDelMes === 1) {
            console.log(`  🎯 PERIFERICO SUR "${areaPerifericoSur.nombre_area}" priorizado para empleado ${empleado.id_empleado} (${empleado.nombre_completo})`);
          }
        }

        // Paso 3: Si no hay áreas disponibles que respeten máximos, este empleado se asignará en segunda pasada
        // NO asignar aquí para evitar exceder máximos
        if (areasDisponibles.length === 0) {
          // Este empleado no puede ser asignado ahora sin exceder máximos
          // Se procesará en la segunda pasada
          if (diaDelMes === 1) {
            console.log(`⚠️ DÍA 1: Empleado ${empleado.id_empleado} (${empleado.nombre_completo}) no puede ser asignado sin exceder máximos. Áreas permitidas: ${areasPermitidas.length > 0 ? areasPermitidas.join(', ') : 'Todas'}`);
          }
          continue; // Saltar este empleado por ahora, se asignará en segunda pasada
        }

        // Paso 4: Seleccionar área usando rotación circular entre las disponibles
        // Priorizar áreas con menos trabajadores asignados para distribución equitativa
        areasDisponibles.sort((a, b) => {
          const trabajadoresA = trabajadoresPorAreaHoy.get(a.id_area) || 0;
          const trabajadoresB = trabajadoresPorAreaHoy.get(b.id_area) || 0;
          return trabajadoresA - trabajadoresB; // Menor cantidad primero
        });

        let areaSeleccionada = null;
        if (areasDisponibles.length > 0) {
          // Usar rotación circular pero priorizando áreas con menos trabajadores
          const areaIndex = (indexDia + idxEmpleado) % areasDisponibles.length;
          areaSeleccionada = areasDisponibles[areaIndex];
        }
        
        if (!areaSeleccionada) {
          // Esto no debería pasar si areasDisponibles.length > 0, pero por seguridad:
          console.error(`ERROR: No se pudo seleccionar área para empleado ${empleado.id_empleado} en día ${diaDelMes}`);
          continue;
        }

        // Verificar UNA VEZ MÁS que el área no exceda el máximo antes de asignar
        // VALIDACIÓN CRÍTICA: Esta es la última verificación antes de asignar
        const maxTrabajadores = maximosPorAreaMap.get(areaSeleccionada.id_area);
        const maxTrabajadoresFinal = maxTrabajadores !== undefined ? maxTrabajadores : 5;
        
        // Log crítico para verificar que el máximo se está obteniendo correctamente
        if (diaDelMes === 1 && maxTrabajadores === undefined) {
          console.warn(`⚠️ DÍA 1: No se encontró máximo configurado para área ${areaSeleccionada.nombre_area} (ID: ${areaSeleccionada.id_area}). Usando default: 5`);
          console.warn(`   Máximos disponibles en mapa:`, Array.from(maximosPorAreaMap.entries()).map(([id, max]) => `ID ${id}: ${max}`).join(', '));
        }
        
        // Usar función helper para asignar de forma segura
        const resultadoAsignacion = asignarTrabajadorSeguro(
          areaSeleccionada.id_area,
          maxTrabajadoresFinal,
          areaSeleccionada.nombre_area
        );
        
        if (!resultadoAsignacion.exito) {
          console.error(`❌ DÍA ${diaDelMes}: ${resultadoAsignacion.error} - Empleado ${empleado.id_empleado} (${empleado.nombre_completo}) NO asignado`);
          // Mostrar estado actual de todas las áreas para debugging (solo día 1)
          if (diaDelMes === 1) {
            console.log(`   Estado actual de áreas:`);
            areas.forEach(a => {
              const actual = trabajadoresPorAreaHoy.get(a.id_area) || 0;
              const max = maximosPorAreaMap.get(a.id_area) || 5;
              console.log(`     ${a.nombre_area}: ${actual}/${max}`);
            });
          }
          continue;
        }
        
        const nuevoContador = resultadoAsignacion.trabajadoresActuales;
        
        // Log detallado de cada asignación exitosa
        if (diaDelMes === 1 || diaDelMes <= 3) {
          console.log(`✓ DÍA ${diaDelMes}: Asignado empleado ${empleado.id_empleado} (${empleado.nombre_completo}) a área ${areaSeleccionada.nombre_area}: ${nuevoContador}/${maxTrabajadores}`);
        }
        
        // Log detallado para día 1
        if (diaDelMes === 1) {
          console.log(`  ✓ Asignado empleado ${empleado.id_empleado} (${empleado.nombre_completo}) a área ${areaSeleccionada.nombre_area}: ${nuevoContador}/${maxTrabajadores}`);
        }

        // Seleccionar turno usando rotación - SIEMPRE debe haber al menos un turno
        if (turnosConHorarios.length === 0) {
          console.error(`ERROR CRÍTICO: No hay turnos con horarios disponibles para empleado ${empleado.id_empleado} en día ${diaDelMes}`);
          continue; // Cambiar return por continue para que el bucle continúe con el siguiente empleado
        }

        const turnoIndex = (indexDia + areaSeleccionada.id_area + idxEmpleado) % turnosConHorarios.length;
        const turno = turnosConHorarios[turnoIndex];

        if (!turno) {
          // Fallback: usar el primer turno disponible
          const turnoFallback = turnosConHorarios[0];
          console.warn(`Fallback: usando primer turno disponible para empleado ${empleado.id_empleado} en día ${diaDelMes}`);
          if (!turnoFallback) {
            console.error(`ERROR CRÍTICO: No se pudo seleccionar ningún turno para empleado ${empleado.id_empleado} en día ${diaDelMes}`);
            // El contador aún no se ha incrementado aquí, así que no hay nada que revertir
            continue; // Cambiar return por continue para que el bucle continúe con el siguiente empleado
          }
          
          // Obtener máximo para fallback
          const maxTrabajadoresFallback = maximosPorAreaMap.get(areaSeleccionada.id_area);
          const maxTrabajadoresFallbackFinal = maxTrabajadoresFallback !== undefined ? maxTrabajadoresFallback : 5;
          
          if (diaDelMes === 1 && maxTrabajadoresFallback === undefined) {
            console.warn(`⚠️ DÍA 1 (fallback): No se encontró máximo configurado para área ${areaSeleccionada.nombre_area} (ID: ${areaSeleccionada.id_area}). Usando default: 5`);
          }
          
          // Usar función helper para asignar de forma segura (fallback)
          const resultadoAsignacionFallback = asignarTrabajadorSeguro(
            areaSeleccionada.id_area,
            maxTrabajadoresFallbackFinal,
            areaSeleccionada.nombre_area
          );
          
          if (!resultadoAsignacionFallback.exito) {
            console.error(`❌ DÍA ${diaDelMes} (fallback): ${resultadoAsignacionFallback.error}`);
            continue;
          }
          
          // Continuar con turnoFallback
          const asignacion = {
            fecha: new Date(dia),
            id_area: areaSeleccionada.id_area,
            fk_id_labor_mes: laborMes.id,
            fk_id_turno: turnoFallback.id_turno,
            total_horas_laboradas: 0
          };

          asignaciones.push(asignacion);
          empleadosConTurnoHoy.add(empleado.id_empleado);
          
          // Registrar para validación
          if (!asignacionesPorEmpleado.has(empleado.id_empleado)) {
            asignacionesPorEmpleado.set(empleado.id_empleado, []);
          }
          asignacionesPorEmpleado.get(empleado.id_empleado).push({
            ...asignacion,
            id_empleado: empleado.id_empleado,
            codigo_turno: turnoFallback.codigo,
            hora_entrada: turnoFallback.hora_entrada,
            hora_salida: turnoFallback.hora_salida
          });
          continue; // Cambiar return por continue
        }

        // La función helper ya validó e incrementó el contador, solo agregar la asignación
        const asignacion = {
          fecha: new Date(dia),
          id_area: areaSeleccionada.id_area,
          fk_id_labor_mes: laborMes.id,
          fk_id_turno: turno.id_turno,
          total_horas_laboradas: 0
        };

        asignaciones.push(asignacion);
        empleadosConTurnoHoy.add(empleado.id_empleado);
        
        // Verificación final de seguridad (no debería pasar porque asignarTrabajadorSeguro ya validó)
        const contadorPostAgregacion = trabajadoresPorAreaHoy.get(areaSeleccionada.id_area) || 0;
        if (contadorPostAgregacion > maxTrabajadores) {
          console.error(`❌❌ ERROR CRÍTICO: Después de agregar asignación, área ${areaSeleccionada.nombre_area} excede el máximo: ${contadorPostAgregacion} > ${maxTrabajadores}`);
          // Revertir todo usando la función helper
          revertirAsignacion(areaSeleccionada.id_area, resultadoAsignacion.trabajadoresAnteriores);
          asignaciones.pop();
          empleadosConTurnoHoy.delete(empleado.id_empleado);
          continue;
        }
        
        // Log detallado ya se hizo arriba, solo agregar info del turno
        if (diaDelMes === 1 || diaDelMes <= 3) {
          console.log(`  → Turno asignado: ${turno.codigo}`);
        }
        
        // Registrar para validación
        if (!asignacionesPorEmpleado.has(empleado.id_empleado)) {
          asignacionesPorEmpleado.set(empleado.id_empleado, []);
        }
          asignacionesPorEmpleado.get(empleado.id_empleado).push({
            ...asignacion,
            id_empleado: empleado.id_empleado,
            codigo_turno: turno.codigo,
            hora_entrada: turno.hora_entrada,
            hora_salida: turno.hora_salida
          });
      }
      
      // Validar que todos los empleados recibieron un turno este día
      const empleadosSinTurno = empleados.filter(emp => !empleadosConTurnoHoy.has(emp.id_empleado));
      if (empleadosSinTurno.length > 0) {
        const capacidadTotal = areas.reduce((sum, area) => {
          const maximo = maximosPorAreaMap.get(area.id_area) || 5;
          return sum + maximo;
        }, 0);
        const trabajadoresAsignados = empleadosConTurnoHoy.size;
        
        console.warn(`\n⚠️ DÍA ${diaDelMes}: ${empleadosSinTurno.length} empleados sin turno asignado`);
        console.warn(`   - Empleados asignados: ${trabajadoresAsignados}/${empleados.length}`);
        console.warn(`   - Capacidad total del sistema: ${capacidadTotal} trabajadores`);
        console.warn(`   - Empleados sin turno: ${empleadosSinTurno.map(e => `${e.id_empleado} (${e.nombre_completo})`).join(', ')}`);
        
        // Para el día 1, asignación MÁS agresiva
        if (diaDelMes === 1) {
          console.log(`🔴 DÍA 1: Iniciando asignación de emergencia para ${empleadosSinTurno.length} empleados (respetando máximos)`);
        }
        
        // Segunda pasada: Intentar asignar turnos a los empleados que no recibieron uno
        // IMPORTANTE: Aún debemos respetar los máximos por área
        for (const empleado of empleadosSinTurno) {
          const laborMes = laborMesMap.get(empleado.id_empleado);
          if (!laborMes) {
            console.error(`❌ No se puede asignar turno a empleado ${empleado.id_empleado}: no tiene labor_mes`);
            continue;
          }
          
          // Verificar si el empleado tiene descanso configurado para este día
          const diasDescanso = descansosMap.get(empleado.id_empleado) || [];
          const tieneDescanso = diasDescanso.length > 0 && diasDescanso.includes(diaDelMes);
          
          // Si tiene descanso, asignar turno de descanso (los descansos no cuentan para el máximo)
          if (tieneDescanso && turnoDescanso) {
            let areaDescanso = areas[0];
            const areasPermitidas = empleado.areas_permitidas || [];
            if (areasPermitidas.length > 0) {
              const primeraAreaPermitida = areas.find(a => areasPermitidas.includes(a.id_area));
              if (primeraAreaPermitida) {
                areaDescanso = primeraAreaPermitida;
              }
            }
            
            const asignacion = {
              fecha: new Date(dia),
              id_area: areaDescanso.id_area,
              fk_id_labor_mes: laborMes.id,
              fk_id_turno: turnoDescanso.id_turno,
              total_horas_laboradas: 0
            };
            
            asignaciones.push(asignacion);
            empleadosConTurnoHoy.add(empleado.id_empleado);
            // NOTA: Los descansos NO incrementan el contador de trabajadores por área
            console.log(`✓ Asignado turno de descanso para empleado ${empleado.id_empleado} (${empleado.nombre_completo}) en día ${diaDelMes}`);
            continue;
          }
          
          // Obtener áreas permitidas del empleado
          const areasPermitidas = empleado.areas_permitidas || [];
          let areasDisponiblesSegundaPasada = [];
          
          // Buscar áreas que aún tengan capacidad (respetando máximos)
          if (areasPermitidas.length === 0) {
            // Si no tiene áreas permitidas, buscar en todas las áreas que tengan capacidad
            areasDisponiblesSegundaPasada = areas.filter(area => {
              const maxTrabajadores = maximosPorAreaMap.get(area.id_area) || 5;
              const trabajadoresActuales = trabajadoresPorAreaHoy.get(area.id_area) || 0;
              return trabajadoresActuales < maxTrabajadores; // Solo áreas con capacidad
            });
          } else {
            // Buscar solo en áreas permitidas que tengan capacidad
            areasDisponiblesSegundaPasada = areas.filter(area => {
              const estaPermitida = areasPermitidas.includes(area.id_area);
              const maxTrabajadores = maximosPorAreaMap.get(area.id_area) || 5;
              const trabajadoresActuales = trabajadoresPorAreaHoy.get(area.id_area) || 0;
              return estaPermitida && trabajadoresActuales < maxTrabajadores;
            });
          }
          
          // Si aún no hay áreas disponibles, este empleado no puede ser asignado sin exceder máximos
          if (areasDisponiblesSegundaPasada.length === 0) {
            console.warn(`⚠️ DÍA ${diaDelMes}: Empleado ${empleado.id_empleado} (${empleado.nombre_completo}) no puede ser asignado: todas sus áreas permitidas han alcanzado el máximo`);
            continue; // Este empleado quedará sin turno para este día (no se puede exceder máximos)
          }
          
          // Seleccionar área con menos trabajadores asignados para distribución equitativa
          areasDisponiblesSegundaPasada.sort((a, b) => {
            const trabajadoresA = trabajadoresPorAreaHoy.get(a.id_area) || 0;
            const trabajadoresB = trabajadoresPorAreaHoy.get(b.id_area) || 0;
            return trabajadoresA - trabajadoresB;
          });
          
          const areaSeleccionada = areasDisponiblesSegundaPasada[0];
          
          // Verificar una vez más que no exceda el máximo
          // VALIDACIÓN CRÍTICA SEGUNDA PASADA
          const maxTrabajadores2 = maximosPorAreaMap.get(areaSeleccionada.id_area);
          const maxTrabajadores2Final = maxTrabajadores2 !== undefined ? maxTrabajadores2 : 5;
          const trabajadoresActuales = trabajadoresPorAreaHoy.get(areaSeleccionada.id_area) || 0;
          
          if (diaDelMes === 1 && maxTrabajadores2 === undefined) {
            console.warn(`⚠️ DÍA 1 (2da pasada): No se encontró máximo configurado para área ${areaSeleccionada.nombre_area} (ID: ${areaSeleccionada.id_area}). Usando default: 5`);
          }
          
          if (trabajadoresActuales >= maxTrabajadores2Final) {
            console.error(`❌ DÍA ${diaDelMes} (2da pasada): BLOQUEADO - Área ${areaSeleccionada.nombre_area} ya alcanzó su máximo (${trabajadoresActuales}/${maxTrabajadores2Final}). Empleado ${empleado.id_empleado} NO será asignado.`);
            continue;
          }
          
          // Seleccionar turno (usar el primero disponible)
          const turno = turnosConHorarios[0];
          if (!turno) {
            console.error(`❌ No hay turnos disponibles para asignar a empleado ${empleado.id_empleado}`);
            continue;
          }
          
          const asignacion = {
            fecha: new Date(dia),
            id_area: areaSeleccionada.id_area,
            fk_id_labor_mes: laborMes.id,
            fk_id_turno: turno.id_turno,
            total_horas_laboradas: 0
          };
          
          // Usar función helper para asignar de forma segura
          const resultadoAsignacion2 = asignarTrabajadorSeguro(
            areaSeleccionada.id_area,
            maxTrabajadores2Final,
            areaSeleccionada.nombre_area
          );
          
          if (!resultadoAsignacion2.exito) {
            console.error(`❌ DÍA ${diaDelMes} (2da pasada): ${resultadoAsignacion2.error}`);
            continue;
          }
          
          asignaciones.push(asignacion);
          empleadosConTurnoHoy.add(empleado.id_empleado);
          
          console.log(`✓ Segunda pasada: Asignado turno ${turno.codigo} en área ${areaSeleccionada.nombre_area} para empleado ${empleado.id_empleado} (${empleado.nombre_completo}) en día ${diaDelMes}`);
        }
        
        // Verificar nuevamente después de asignaciones de emergencia
        // Usar empleadosConTurnoHoy que es más confiable
        const empleadosAunSinTurno = empleados.filter(emp => !empleadosConTurnoHoy.has(emp.id_empleado));
        
        if (empleadosAunSinTurno.length > 0) {
          console.error(`❌ DÍA ${diaDelMes}: AÚN HAY ${empleadosAunSinTurno.length} empleados sin turno después de asignación de emergencia:`, 
            empleadosAunSinTurno.map(e => `${e.id_empleado} (${e.nombre_completo})`).join(', '));
          
          // Tercera pasada: Intentar asignar empleados restantes
          // IMPORTANTE: Aún debemos respetar los máximos, pero podemos ser más flexibles con áreas permitidas
          console.log(`⚠️ DÍA ${diaDelMes}: Tercera pasada para ${empleadosAunSinTurno.length} empleados restantes (respetando máximos)...`);
          
          for (const empleado of empleadosAunSinTurno) {
              let laborMes = laborMesMap.get(empleado.id_empleado);
              if (!laborMes) {
                console.error(`❌ No se puede asignar turno a empleado ${empleado.id_empleado}: no tiene labor_mes`);
                // Intentar crear laborMes de emergencia
                try {
                  laborMes = await prisma.laborMes.create({
                    data: {
                      id_empleado: empleado.id_empleado,
                      fecha_inicio: fechaInicio,
                      fecha_fin: fechaFin,
                      horas_ordinarias: 0,
                      total_horas: 0,
                      total_recargos: 0
                    }
                  });
                  laborMesMap.set(empleado.id_empleado, laborMes);
                  console.log(`✓✓ Creado laborMes de emergencia para empleado ${empleado.id_empleado} en día 1`);
                } catch (error) {
                  console.error(`❌ Error crítico al crear laborMes para empleado ${empleado.id_empleado}:`, error);
                  continue;
                }
              }
              
              if (!laborMes) {
                console.error(`❌ Aún no se pudo obtener laborMes para empleado ${empleado.id_empleado}`);
                continue;
              }
              
              // Obtener áreas permitidas del empleado
              const areasPermitidas = empleado.areas_permitidas || [];
              let areasDisponiblesTerceraPasada = [];
              
              // Buscar áreas que aún tengan capacidad (respetando máximos)
              // En tercera pasada, si no tiene áreas permitidas, buscar en todas las áreas
              if (areasPermitidas.length === 0) {
                areasDisponiblesTerceraPasada = areas.filter(area => {
                  const maxTrabajadores = maximosPorAreaMap.get(area.id_area) || 5;
                  const trabajadoresActuales = trabajadoresPorAreaHoy.get(area.id_area) || 0;
                  return trabajadoresActuales < maxTrabajadores;
                });
              } else {
                // Buscar solo en áreas permitidas que tengan capacidad
                areasDisponiblesTerceraPasada = areas.filter(area => {
                  const estaPermitida = areasPermitidas.includes(area.id_area);
                  const maxTrabajadores = maximosPorAreaMap.get(area.id_area) || 5;
                  const trabajadoresActuales = trabajadoresPorAreaHoy.get(area.id_area) || 0;
                  return estaPermitida && trabajadoresActuales < maxTrabajadores;
                });
              }
              
              // Si aún no hay áreas disponibles, este empleado no puede ser asignado sin exceder máximos
              if (areasDisponiblesTerceraPasada.length === 0) {
                const areasPermitidas = empleado.areas_permitidas || [];
                const totalCapacidad = areas.reduce((sum, area) => {
                  const max = maximosPorAreaMap.get(area.id_area) || 5;
                  return sum + max;
                }, 0);
                
                console.warn(`⚠️ DÍA ${diaDelMes}: Empleado ${empleado.id_empleado} (${empleado.nombre_completo}) no puede ser asignado sin exceder máximos.`);
                console.warn(`   - Áreas permitidas: ${areasPermitidas.length > 0 ? areasPermitidas.join(', ') : 'Todas'}`);
                console.warn(`   - Capacidad total del sistema: ${totalCapacidad} trabajadores`);
                console.warn(`   - Total de empleados activos: ${empleados.length}`);
                console.warn(`   - Este empleado quedará sin turno para este día (respetando máximos configurados)`);
                continue; // Este empleado quedará sin turno (no se puede exceder máximos)
              }
              
              // Seleccionar área con menos trabajadores asignados
              areasDisponiblesTerceraPasada.sort((a, b) => {
                const trabajadoresA = trabajadoresPorAreaHoy.get(a.id_area) || 0;
                const trabajadoresB = trabajadoresPorAreaHoy.get(b.id_area) || 0;
                return trabajadoresA - trabajadoresB;
              });
              
              const areaSeleccionada = areasDisponiblesTerceraPasada[0];
              
              // Verificar una vez más que no exceda el máximo
              // VALIDACIÓN CRÍTICA TERCERA PASADA
              const maxTrabajadores3 = maximosPorAreaMap.get(areaSeleccionada.id_area);
              const maxTrabajadores3Final = maxTrabajadores3 !== undefined ? maxTrabajadores3 : 5;
              const trabajadoresActuales = trabajadoresPorAreaHoy.get(areaSeleccionada.id_area) || 0;
              
              if (diaDelMes === 1 && maxTrabajadores3 === undefined) {
                console.warn(`⚠️ DÍA 1 (3ra pasada): No se encontró máximo configurado para área ${areaSeleccionada.nombre_area} (ID: ${areaSeleccionada.id_area}). Usando default: 5`);
              }
              
              if (trabajadoresActuales >= maxTrabajadores3Final) {
                console.error(`❌ DÍA ${diaDelMes} (3ra pasada): BLOQUEADO - Área ${areaSeleccionada.nombre_area} ya alcanzó su máximo (${trabajadoresActuales}/${maxTrabajadores3Final}). Empleado ${empleado.id_empleado} NO será asignado.`);
                continue;
              }
              
              // Seleccionar primer turno disponible
              const turno = turnosConHorarios[0];
              if (!turno) {
                console.error(`❌ No hay turnos disponibles para asignar a empleado ${empleado.id_empleado}`);
                continue;
              }
              
              const asignacion = {
                fecha: new Date(dia),
                id_area: areaSeleccionada.id_area,
                fk_id_labor_mes: laborMes.id,
                fk_id_turno: turno.id_turno,
                total_horas_laboradas: 0
              };
              
              // Usar función helper para asignar de forma segura
              const resultadoAsignacion3 = asignarTrabajadorSeguro(
                areaSeleccionada.id_area,
                maxTrabajadores3Final,
                areaSeleccionada.nombre_area
              );
              
              if (!resultadoAsignacion3.exito) {
                console.error(`❌ DÍA ${diaDelMes} (3ra pasada): ${resultadoAsignacion3.error}`);
                continue;
              }
              
              asignaciones.push(asignacion);
              empleadosConTurnoHoy.add(empleado.id_empleado);
              
              console.log(`✓✓ Tercera pasada día ${diaDelMes}: Asignado turno ${turno.codigo} en área ${areaSeleccionada.nombre_area} para empleado ${empleado.id_empleado} (${empleado.nombre_completo})`);
          }
          
          // Verificación final
          const empleadosFinalSinTurno = empleados.filter(emp => !empleadosConTurnoHoy.has(emp.id_empleado));
          
          if (empleadosFinalSinTurno.length > 0) {
            const capacidadTotal = areas.reduce((sum, area) => {
              const maximo = maximosPorAreaMap.get(area.id_area) || 5;
              return sum + maximo;
            }, 0);
            const trabajadoresAsignados = empleadosConTurnoHoy.size;
            
            console.error(`\n❌❌ DÍA ${diaDelMes} CRÍTICO: ${empleadosFinalSinTurno.length} empleados AÚN sin turno después de todas las pasadas`);
            console.error(`   - Empleados asignados: ${trabajadoresAsignados}/${empleados.length}`);
            console.error(`   - Capacidad total: ${capacidadTotal} trabajadores`);
            console.error(`   - Empleados sin turno: ${empleadosFinalSinTurno.map(e => `${e.id_empleado} (${e.nombre_completo})`).join(', ')}`);
            console.error(`   - RAZÓN: La capacidad total del sistema (${capacidadTotal}) es menor que el número de empleados (${empleados.length})`);
            console.error(`   - SOLUCIÓN: Aumentar los máximos por área o reducir el número de empleados activos`);
          } else {
            console.log(`✅ DÍA ${diaDelMes}: Todos los empleados tienen turno asignado`);
          }
        } else {
          console.log(`✅ DÍA ${diaDelMes}: Todos los empleados tienen turno asignado`);
        }
        
        // Log final del día: Estado de cada área
        console.log(`\n📊 ESTADO FINAL DÍA ${diaDelMes} - TRABAJADORES POR ÁREA:`);
        let hayViolaciones = false;
        areas.forEach(area => {
          const trabajadoresActuales = trabajadoresPorAreaHoy.get(area.id_area) || 0;
          const maximo = maximosPorAreaMap.get(area.id_area) || 5;
          const estado = trabajadoresActuales > maximo ? '❌ EXCEDE' : trabajadoresActuales === maximo ? '✅ LLENO' : trabajadoresActuales === 0 ? '⚠️ VACÍO' : '✓ OK';
          console.log(`  ${estado} ${area.nombre_area}: ${trabajadoresActuales}/${maximo} trabajadores`);
          
          if (trabajadoresActuales > maximo) {
            hayViolaciones = true;
            console.error(`    ❌❌ VIOLACIÓN: ${area.nombre_area} tiene ${trabajadoresActuales} trabajadores pero el máximo es ${maximo} (exceso: ${trabajadoresActuales - maximo})`);
          }
        });
        
        if (hayViolaciones) {
          console.error(`\n❌❌ DÍA ${diaDelMes}: SE DETECTARON VIOLACIONES DE MÁXIMOS EN ESTE DÍA`);
        } else {
          console.log(`\n✅ DÍA ${diaDelMes}: Todas las áreas respetan sus máximos configurados`);
        }
      }
    }

    // Validar cruces de turnos antes de insertar
    const crucesDetectados = [];
    const asignacionesPorDiaYEmpleado = new Map(); // "dia-labor_mes" -> array de asignaciones
    
    asignaciones.forEach(asig => {
      const fechaStr = asig.fecha.toISOString().split('T')[0];
      const key = `${fechaStr}-${asig.fk_id_labor_mes}`;
      
      if (!asignacionesPorDiaYEmpleado.has(key)) {
        asignacionesPorDiaYEmpleado.set(key, []);
      }
      asignacionesPorDiaYEmpleado.get(key).push(asig);
    });
    
    // Detectar cruces: mismo empleado, mismo día, múltiples turnos
    asignacionesPorDiaYEmpleado.forEach((asigs, key) => {
      if (asigs.length > 1) {
        const [fechaStr, laborMesId] = key.split('-');
        const empleado = empleados.find(e => {
          const lm = laborMesMap.get(e.id_empleado);
          return lm && lm.id === parseInt(laborMesId);
        });
        
        crucesDetectados.push({
          fecha: fechaStr,
          id_empleado: empleado?.id_empleado || null,
          nombre_empleado: empleado?.nombre_completo || 'Desconocido',
          cantidad_turnos: asigs.length,
          turnos: asigs.map(a => {
            const turno = turnosConHorarios.find(t => t.id_turno === a.fk_id_turno) || turnoDescanso;
            return turno ? turno.codigo : 'Desconocido';
          })
        });
      }
    });
    
    // Validar solapamiento de horarios (mismo empleado, mismo día, turnos que se solapan)
    const solapamientosDetectados = [];
    asignacionesPorDiaYEmpleado.forEach((asigs, key) => {
      if (asigs.length > 1) {
        // Comparar cada par de turnos
        for (let i = 0; i < asigs.length; i++) {
          for (let j = i + 1; j < asigs.length; j++) {
            const turno1 = turnosConHorarios.find(t => t.id_turno === asigs[i].fk_id_turno);
            const turno2 = turnosConHorarios.find(t => t.id_turno === asigs[j].fk_id_turno);
            
            if (turno1 && turno2) {
              // Convertir horas a minutos para comparar
              const horaEntrada1 = new Date(turno1.hora_entrada);
              const horaSalida1 = new Date(turno1.hora_salida);
              const horaEntrada2 = new Date(turno2.hora_entrada);
              const horaSalida2 = new Date(turno2.hora_salida);
              
              const minutosEntrada1 = horaEntrada1.getHours() * 60 + horaEntrada1.getMinutes();
              const minutosSalida1 = horaSalida1.getHours() * 60 + horaSalida1.getMinutes();
              const minutosEntrada2 = horaEntrada2.getHours() * 60 + horaEntrada2.getMinutes();
              const minutosSalida2 = horaSalida2.getHours() * 60 + horaSalida2.getMinutes();
              
              // Verificar solapamiento: si las horas se cruzan
              const haySolapamiento = !(
                minutosSalida1 <= minutosEntrada2 || 
                minutosSalida2 <= minutosEntrada1
              );
              
              if (haySolapamiento) {
                const [fechaStr] = key.split('-');
                const empleado = empleados.find(e => {
                  const lm = laborMesMap.get(e.id_empleado);
                  return lm && lm.id === asigs[i].fk_id_labor_mes;
                });
                
                solapamientosDetectados.push({
                  fecha: fechaStr,
                  id_empleado: empleado?.id_empleado || null,
                  nombre_empleado: empleado?.nombre_completo || 'Desconocido',
                  turno1: turno1.codigo,
                  turno2: turno2.codigo,
                  horario1: `${horaEntrada1.toTimeString().substring(0, 5)} - ${horaSalida1.toTimeString().substring(0, 5)}`,
                  horario2: `${horaEntrada2.toTimeString().substring(0, 5)} - ${horaSalida2.toTimeString().substring(0, 5)}`
                });
              }
            }
          }
        }
      }
    });

    // Validación final: Verificar que no se excedan los máximos por área antes de insertar
    // Agrupar asignaciones por área y fecha para verificar máximos
    // IMPORTANTE: Los turnos de descanso NO cuentan para el máximo de trabajadores por área
    const asignacionesPorAreaYFecha = new Map(); // "id_area-fecha" -> cantidad
    const violacionesMaximos = [];
    let totalDescansosFiltrados = 0;
    
    asignaciones.forEach(asig => {
      // Saltar si es turno de descanso (los descansos no cuentan para el máximo)
      if (turnoDescanso && asig.fk_id_turno === turnoDescanso.id_turno) {
        totalDescansosFiltrados++;
        return; // No contar descansos en la validación de máximos
      }
      
      // Normalizar fecha: puede ser Date o string
      let fechaStr;
      if (asig.fecha instanceof Date) {
        fechaStr = asig.fecha.toISOString().split('T')[0];
      } else if (typeof asig.fecha === 'string') {
        fechaStr = asig.fecha.split('T')[0].split(' ')[0];
      } else {
        console.error('Error: fecha inválida en asignación:', asig);
        return;
      }
      
      const key = `${asig.id_area}-${fechaStr}`;
      const cantidad = asignacionesPorAreaYFecha.get(key) || 0;
      asignacionesPorAreaYFecha.set(key, cantidad + 1);
    });
    
    // Log de descansos filtrados
    if (totalDescansosFiltrados > 0) {
      console.log(`\n📋 VALIDACIÓN DE MÁXIMOS: Se filtraron ${totalDescansosFiltrados} turnos de descanso (no cuentan para máximos por área)`);
    }
    
    // Verificar qué áreas se están usando en la programación
    const areasUsadas = new Set();
    asignacionesPorAreaYFecha.forEach((cantidad, key) => {
      const [idAreaStr] = key.split('-');
      const idArea = parseInt(idAreaStr);
      areasUsadas.add(idArea);
    });
    
    console.log(`\n📊 ÁREAS USADAS EN LA PROGRAMACIÓN (${areasUsadas.size} áreas):`);
    areasUsadas.forEach(idArea => {
      const area = areas.find(a => a.id_area === idArea);
      if (area) {
        console.log(`  ✅ ${area.nombre_area} (ID: ${idArea})`);
      }
    });
    
    // Verificar qué áreas NO se están usando
    const areasNoUsadas = areas.filter(area => !areasUsadas.has(area.id_area));
    if (areasNoUsadas.length > 0) {
      console.log(`\n⚠️ ÁREAS NO USADAS EN LA PROGRAMACIÓN (${areasNoUsadas.length} áreas):`);
      areasNoUsadas.forEach(area => {
        const maximo = maximosPorAreaMap.get(area.id_area) || 5;
        console.warn(`  ⚠️ ${area.nombre_area} (ID: ${area.id_area}): máximo ${maximo} trabajadores - NO SE ASIGNÓ NINGÚN EMPLEADO`);
        console.warn(`     Razón probable: Ningún empleado tiene esta área en su lista de áreas permitidas`);
      });
    }
    
    // Verificar cada combinación área-fecha
    console.log(`\n🔍 VALIDACIÓN FINAL: Verificando ${asignacionesPorAreaYFecha.size} combinaciones área-fecha`);
    asignacionesPorAreaYFecha.forEach((cantidad, key) => {
      const [idAreaStr, fechaStr] = key.split('-');
      const idArea = parseInt(idAreaStr);
      const maxTrabajadores = maximosPorAreaMap.get(idArea) || 5;
      const area = areas.find(a => a.id_area === idArea);
      
      const estado = cantidad > maxTrabajadores ? '❌ EXCEDE' : cantidad === maxTrabajadores ? '✅ LLENO' : '✓ OK';
      console.log(`  ${estado} ${area?.nombre_area || `Área ${idArea}`} (${fechaStr}): ${cantidad} trabajadores asignados / ${maxTrabajadores} máximo`);
      
      if (cantidad > maxTrabajadores) {
        console.error(`  ❌❌ VIOLACIÓN CRÍTICA: ${area?.nombre_area || `Área ${idArea}`} el ${fechaStr} tiene ${cantidad} trabajadores pero el máximo es ${maxTrabajadores} (exceso: ${cantidad - maxTrabajadores})`);
        violacionesMaximos.push({
          area: area?.nombre_area || `Área ${idArea}`,
          fecha: fechaStr,
          asignados: cantidad,
          maximo: maxTrabajadores,
          exceso: cantidad - maxTrabajadores
        });
      }
    });
    
    if (violacionesMaximos.length > 0) {
      console.error('\n❌❌ VIOLACIONES DE MÁXIMOS DETECTADAS:');
      console.error(`   Total descansos filtrados (no contados): ${totalDescansosFiltrados}`);
      console.error(`   Total violaciones: ${violacionesMaximos.length}`);
      console.error(`   Total asignaciones (sin descansos): ${asignaciones.length - totalDescansosFiltrados}`);
      
      violacionesMaximos.forEach(v => {
        console.error(`\n  ❌ ${v.area} el ${v.fecha}:`);
        console.error(`     - Asignados: ${v.asignados} trabajadores`);
        console.error(`     - Máximo configurado: ${v.maximo} trabajadores`);
        console.error(`     - Exceso: ${v.exceso} trabajadores`);
        
        // Mostrar las asignaciones que causan la violación
        const areaViolacion = areas.find(a => a.nombre_area === v.area);
        const asignacionesViolacion = asignaciones.filter(asig => {
          if (turnoDescanso && asig.fk_id_turno === turnoDescanso.id_turno) return false;
          
          // Normalizar fecha: puede ser Date o string
          let fechaStr;
          if (asig.fecha instanceof Date) {
            fechaStr = asig.fecha.toISOString().split('T')[0];
          } else if (typeof asig.fecha === 'string') {
            fechaStr = asig.fecha.split('T')[0].split(' ')[0];
          } else {
            return false;
          }
          
          return areaViolacion && asig.id_area === areaViolacion.id_area && fechaStr === v.fecha;
        });
        
        if (asignacionesViolacion.length > 0) {
          console.error(`     - Asignaciones encontradas: ${asignacionesViolacion.length}`);
          asignacionesViolacion.forEach((asig, idx) => {
            const empleado = empleados.find(e => {
              const lm = laborMesMap.get(e.id_empleado);
              return lm && lm.id === asig.fk_id_labor_mes;
            });
            const turno = turnosConHorarios.find(t => t.id_turno === asig.fk_id_turno) || turnoDescanso;
            console.error(`       ${idx + 1}. Empleado ${empleado?.id_empleado || 'N/A'} (${empleado?.nombre_completo || 'Desconocido'}) - Turno: ${turno?.codigo || 'N/A'}`);
          });
        }
      });
      
      console.error('\n   NOTA: Los turnos de descanso NO se cuentan en estos números.');
      console.error('   Si ve violaciones, significa que hay más trabajadores activos asignados que el máximo configurado.');
      console.error('   Revise los logs anteriores para ver dónde se asignaron trabajadores de más.');
      
      return res.status(400).json({
        error: 'Se detectaron violaciones de máximos por área. La programación no se puede generar.',
        violaciones: violacionesMaximos,
        descansosFiltrados: totalDescansosFiltrados,
        detalles: `Algunas áreas tienen más trabajadores asignados que el máximo configurado. Los turnos de descanso (${totalDescansosFiltrados} en total) no se cuentan en estos límites. Revise la configuración de máximos por área y los logs del servidor para más detalles.`
      });
    }
    
    // Log resumen de asignaciones por área para TODOS los días
    // NOTA: Este resumen excluye descansos (solo cuenta trabajadores activos)
    console.log(`\n📊 RESUMEN DE ASIGNACIONES POR ÁREA Y DÍA (excluyendo descansos):`);
    if (totalDescansosFiltrados > 0) {
      console.log(`   ℹ️  ${totalDescansosFiltrados} turnos de descanso fueron excluidos de este conteo`);
    }
    diasMes.forEach(dia => {
      const fechaStr = dia.toISOString().split('T')[0];
      const diaDelMes = dia.getDate();
      console.log(`\n  📅 DÍA ${diaDelMes} (${fechaStr}):`);
      areas.forEach(area => {
        const key = `${area.id_area}-${fechaStr}`;
        const asignados = asignacionesPorAreaYFecha.get(key) || 0;
        const maximo = maximosPorAreaMap.get(area.id_area) || 5;
        const porcentaje = maximo > 0 ? ((asignados / maximo) * 100).toFixed(1) : '0';
        const estado = asignados > maximo ? '❌ EXCEDE' : asignados === maximo ? '✅ LLENO' : asignados === 0 ? '⚠️ VACÍO' : '✓ OK';
        console.log(`    ${estado} ${area.nombre_area}: ${asignados}/${maximo} trabajadores activos (${porcentaje}%)`);
        
        // Alerta si excede el máximo
        if (asignados > maximo) {
          console.error(`    ❌❌ ERROR: ${area.nombre_area} tiene ${asignados} trabajadores activos pero el máximo es ${maximo}`);
        }
      });
    });
    
    // VERIFICACIÓN FINAL CRÍTICA: Re-verificar que no haya violaciones antes de insertar
    // Esta es la última oportunidad de detectar violaciones antes de guardar en BD
    const verificacionFinalViolaciones = [];
    const asignacionesPorAreaYFechaFinal = new Map();
    
    asignaciones.forEach(asig => {
      // Saltar descansos
      if (turnoDescanso && asig.fk_id_turno === turnoDescanso.id_turno) {
        return;
      }
      
      let fechaStr;
      if (asig.fecha instanceof Date) {
        fechaStr = asig.fecha.toISOString().split('T')[0];
      } else if (typeof asig.fecha === 'string') {
        fechaStr = asig.fecha.split('T')[0].split(' ')[0];
      } else {
        return;
      }
      
      const key = `${asig.id_area}-${fechaStr}`;
      const cantidad = asignacionesPorAreaYFechaFinal.get(key) || 0;
      asignacionesPorAreaYFechaFinal.set(key, cantidad + 1);
    });
    
    console.log(`\n🔍 VERIFICACIÓN FINAL CRÍTICA: Analizando ${asignacionesPorAreaYFechaFinal.size} combinaciones área-fecha`);
    asignacionesPorAreaYFechaFinal.forEach((cantidad, key) => {
      const [idAreaStr, fechaStr] = key.split('-');
      const idArea = parseInt(idAreaStr);
      const maxTrabajadores = maximosPorAreaMap.get(idArea);
      const maxTrabajadoresFinal = maxTrabajadores !== undefined ? maxTrabajadores : 5;
      const area = areas.find(a => a.id_area === idArea);
      
      console.log(`  📊 ${area?.nombre_area || `Área ${idArea}`} (ID: ${idArea}) el ${fechaStr}: ${cantidad} trabajadores / máximo: ${maxTrabajadoresFinal} (${maxTrabajadores !== undefined ? 'configurado' : 'DEFAULT'})`);
      
      if (cantidad > maxTrabajadoresFinal) {
        console.error(`  ❌ VIOLACIÓN DETECTADA: ${area?.nombre_area || `Área ${idArea}`} el ${fechaStr} tiene ${cantidad} trabajadores pero el máximo es ${maxTrabajadoresFinal}`);
        verificacionFinalViolaciones.push({
          area: area?.nombre_area || `Área ${idArea}`,
          fecha: fechaStr,
          asignados: cantidad,
          maximo: maxTrabajadoresFinal,
          exceso: cantidad - maxTrabajadoresFinal
        });
      } else if (cantidad === maxTrabajadoresFinal) {
        console.log(`  ✅ ${area?.nombre_area || `Área ${idArea}`} el ${fechaStr}: LLENO (${cantidad}/${maxTrabajadoresFinal})`);
      } else {
        console.log(`  ✓ ${area?.nombre_area || `Área ${idArea}`} el ${fechaStr}: OK (${cantidad}/${maxTrabajadoresFinal})`);
      }
    });
    
    if (verificacionFinalViolaciones.length > 0) {
      console.error('\n❌❌❌ VERIFICACIÓN FINAL CRÍTICA: SE DETECTARON VIOLACIONES JUSTO ANTES DE INSERTAR');
      console.error(`   Esto NO debería pasar si la validación anterior funcionó correctamente.`);
      verificacionFinalViolaciones.forEach(v => {
        console.error(`  - ${v.area} el ${v.fecha}: ${v.asignados} trabajadores (máximo: ${v.maximo}, exceso: ${v.exceso})`);
      });
      return res.status(400).json({
        error: 'Se detectaron violaciones de máximos por área en la verificación final. La programación no se puede generar.',
        violaciones: verificacionFinalViolaciones,
        detalles: 'Se detectaron violaciones justo antes de insertar en la base de datos. Esto indica un problema en la lógica de asignación.'
      });
    }
    
    // Insertar todas las asignaciones en batch
    if (asignaciones.length > 0) {
      console.log(`\n✅ VERIFICACIÓN FINAL EXITOSA: No se detectaron violaciones. Insertando ${asignaciones.length} asignaciones en la base de datos...`);
      await prisma.detalleProgramacion.createMany({
        data: asignaciones
      });
      console.log(`✅ ${asignaciones.length} asignaciones insertadas exitosamente en la base de datos`);
    }

    // Calcular estadísticas
    const totalDias = diasMes.length;
    const totalEmpleados = empleados.length;
    const asignacionesEsperadas = totalDias * totalEmpleados;
    const espaciosVacios = asignacionesEsperadas - asignaciones.length;
    
    // Calcular capacidad total disponible por día
    let capacidadTotalPorDia = 0;
    areas.forEach(area => {
      const maximo = maximosPorAreaMap.get(area.id_area) || 5;
      capacidadTotalPorDia += maximo;
    });
    const capacidadTotalMes = capacidadTotalPorDia * totalDias;
    
    // Log resumen final
    console.log(`\n📊 RESUMEN FINAL DE PROGRAMACIÓN:`);
    console.log(`  Total empleados: ${totalEmpleados}`);
    console.log(`  Total días: ${totalDias}`);
    console.log(`  Capacidad total por día: ${capacidadTotalPorDia} trabajadores`);
    console.log(`  Capacidad total del mes: ${capacidadTotalMes} asignaciones posibles`);
    console.log(`  Asignaciones realizadas: ${asignaciones.length}`);
    console.log(`  Asignaciones esperadas: ${asignacionesEsperadas}`);
    console.log(`  Espacios vacíos: ${espaciosVacios}`);
    if (capacidadTotalMes < asignacionesEsperadas) {
      console.warn(`  ⚠️ ADVERTENCIA: La capacidad total (${capacidadTotalMes}) es menor que las asignaciones esperadas (${asignacionesEsperadas}).`);
      console.warn(`     Esto significa que algunos empleados quedarán sin turno para respetar los máximos por área.`);
    }

    res.json({
      mensaje: `Programación generada exitosamente para ${mes}/${anio}`,
      totalAsignaciones: asignaciones.length,
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFin: fechaFin.toISOString().split('T')[0],
      empleados: empleados.length,
      areas: areas.length,
      turnos: turnosConHorarios.length,
      turnosUsados: turnosConHorarios.map(t => t.codigo),
      estadisticas: {
        diasDelMes: totalDias,
        asignacionesEsperadas,
        espaciosVacios,
        capacidadTotalPorDia,
        capacidadTotalMes,
        porcentajeCompletitud: asignacionesEsperadas > 0 
          ? ((asignaciones.length / asignacionesEsperadas) * 100).toFixed(2) + '%'
          : '0%',
        porcentajeCapacidad: capacidadTotalMes > 0
          ? ((asignaciones.length / capacidadTotalMes) * 100).toFixed(2) + '%'
          : '0%'
      },
      validaciones: {
        crucesDetectados: crucesDetectados.length,
        cruces: crucesDetectados,
        solapamientosDetectados: solapamientosDetectados.length,
        solapamientos: solapamientosDetectados
      }
    });

  } catch (error) {
    console.error('Error al generar programación automática:', error);
    res.status(500).json({
      error: 'Error al generar programación automática',
      detalles: error.message
    });
  }
};

/**
 * ELIMINAR PROGRAMACIÓN DE UN MES
 * Elimina toda la programación de un mes específico
 */
const eliminarProgramacionMes = async (req, res) => {
  try {
    const { mes, anio } = req.query;

    if (!mes || !anio) {
      return res.status(400).json({
        error: 'Mes y año son requeridos'
      });
    }

    const mesNum = parseInt(mes);
    const anioNum = parseInt(anio);

    const fechaInicio = new Date(anioNum, mesNum - 1, 1);
    const fechaFin = new Date(anioNum, mesNum, 0);

    // Eliminar detalle_programacion
    const eliminados = await prisma.detalleProgramacion.deleteMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin
        }
      }
    });

    res.json({
      mensaje: `Programación eliminada para ${mes}/${anio}`,
      eliminados: eliminados.count
    });

  } catch (error) {
    console.error('Error al eliminar programación:', error);
    res.status(500).json({
      error: 'Error al eliminar programación',
      detalles: error.message
    });
  }
};

module.exports = {
  generarProgramacionAutomatica,
  eliminarProgramacionMes
};


