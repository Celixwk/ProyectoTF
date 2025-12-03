const prisma = require('../config/database');

/**
 * CONTROLADOR PARA LAS VISTAS DE BASE DE DATOS
 * Las vistas ya tienen JOINs y datos pre-procesados
 */

/**
 * VISTA: Empleados Completos
 * Empleados con toda su información y cargo
 */
const obtenerEmpleadosCompletos = async (req, res) => {
  try {
    const { estado, busqueda, page = 1, limit = 50 } = req.query;

    // Nota: Las vistas no soportan where directamente en Prisma
    // Usamos queryRaw para filtros complejos
    let query = `
      SELECT * FROM vw_empleados_completos
      WHERE 1=1
    `;
    const params = [];

    if (estado !== undefined) {
      query += ` AND estado = $${params.length + 1}`;
      params.push(estado === 'true');
    }

    if (busqueda) {
      query += ` AND (nombre_completo ILIKE $${params.length + 1} OR cedula ILIKE $${params.length + 1})`;
      params.push(`%${busqueda}%`);
    }

    query += ` ORDER BY nombre_completo ASC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const empleados = await prisma.$queryRawUnsafe(query, ...params);

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM vw_empleados_completos WHERE 1=1';
    const countParams = [];
    
    if (estado !== undefined) {
      countQuery += ` AND estado = $${countParams.length + 1}`;
      countParams.push(estado === 'true');
    }
    
    if (busqueda) {
      countQuery += ` AND (nombre_completo ILIKE $${countParams.length + 1} OR cedula ILIKE $${countParams.length + 1})`;
      countParams.push(`%${busqueda}%`);
    }

    const [{ total }] = await prisma.$queryRawUnsafe(countQuery, ...countParams);

    res.json({
      empleados,
      paginacion: {
        total: Number(total),
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(Number(total) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener empleados completos:', error);
    res.status(500).json({ error: 'Error al obtener empleados completos' });
  }
};

/**
 * VISTA: Turnos Asignados
 * Turnos con empleado, área, y calendario
 */
const obtenerTurnosAsignados = async (req, res) => {
  try {
    const { id_empleado, fecha_inicio, fecha_fin, page = 1, limit = 100 } = req.query;

    // Construir la consulta de forma segura
    let whereConditions = [];
    const queryParams = [];

    if (id_empleado) {
      whereConditions.push(`id_empleado = $${queryParams.length + 1}`);
      queryParams.push(parseInt(id_empleado));
    }

    if (fecha_inicio && fecha_fin) {
      // Asegurar que las fechas se pasen como strings YYYY-MM-DD
      const fechaInicioDate = fecha_inicio.includes('T') ? fecha_inicio.split('T')[0] : fecha_inicio;
      const fechaFinDate = fecha_fin.includes('T') ? fecha_fin.split('T')[0] : fecha_fin;
      
      // Usar CAST para convertir a date de forma segura
      whereConditions.push(`fecha >= CAST($${queryParams.length + 1} AS DATE)`);
      queryParams.push(fechaInicioDate);
      whereConditions.push(`fecha <= CAST($${queryParams.length + 1} AS DATE)`);
      queryParams.push(fechaFinDate);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : 'WHERE 1=1';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitParam = parseInt(limit);

    // Construir la query completa con parámetros
    const query = `
      SELECT * FROM vw_turnos_asignados 
      ${whereClause}
      ORDER BY fecha DESC, hora_entrada ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    queryParams.push(limitParam, offset);

    const turnos = await prisma.$queryRawUnsafe(query, ...queryParams);

    // Debug: Log para verificar qué se está devolviendo
    console.log('📋 Turnos asignados consultados:', {
      total: turnos.length,
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
      primerTurno: turnos[0] || null,
      query: query.substring(0, 200) // Primeros 200 caracteres
    });

    res.json({
      turnos,
      total: turnos.length
    });
  } catch (error) {
    console.error('Error al obtener turnos asignados:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    res.status(400).json({ 
      error: 'Error al obtener turnos asignados',
      detalles: error.message,
      query: query.substring(0, 200) // Solo los primeros 200 caracteres para debug
    });
  }
};

/**
 * VISTA: Novedades Completas
 * Novedades con empleado, tipo y usuario que registró
 */
const obtenerNovedadesCompletas = async (req, res) => {
  try {
    const { id_empleado, etapa, fecha_inicio, fecha_fin, page = 1, limit = 50 } = req.query;

    let query = 'SELECT * FROM vw_novedades_completas WHERE 1=1';
    const params = [];

    if (id_empleado) {
      query += ` AND id_empleado = $${params.length + 1}`;
      params.push(parseInt(id_empleado));
    }

    if (etapa) {
      query += ` AND etapa = $${params.length + 1}`;
      params.push(etapa);
    }

    if (fecha_inicio && fecha_fin) {
      query += ` AND fecha_solicitud >= $${params.length + 1} AND fecha_solicitud <= $${params.length + 2}`;
      params.push(new Date(fecha_inicio), new Date(fecha_fin));
    }

    query += ` ORDER BY fecha_solicitud DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const novedades = await prisma.$queryRawUnsafe(query, ...params);

    res.json({
      novedades,
      total: novedades.length
    });
  } catch (error) {
    console.error('Error al obtener novedades completas:', error);
    res.status(500).json({ error: 'Error al obtener novedades completas' });
  }
};

/**
 * VISTA: Recargos Completos
 * Recargos con empleado, turno, área y cálculos
 */
const obtenerRecargosCompletos = async (req, res) => {
  try {
    const { id_empleado, fecha_inicio, fecha_fin, page = 1, limit = 50 } = req.query;

    let query = 'SELECT * FROM vw_recargos_completos WHERE 1=1';
    const params = [];

    if (id_empleado) {
      query += ` AND id_empleado = $${params.length + 1}`;
      params.push(parseInt(id_empleado));
    }

    if (fecha_inicio && fecha_fin) {
      query += ` AND fecha >= $${params.length + 1} AND fecha <= $${params.length + 2}`;
      params.push(new Date(fecha_inicio), new Date(fecha_fin));
    }

    query += ` ORDER BY fecha DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const recargos = await prisma.$queryRawUnsafe(query, ...params);

    res.json({
      recargos,
      total: recargos.length
    });
  } catch (error) {
    console.error('Error al obtener recargos completos:', error);
    res.status(500).json({ error: 'Error al obtener recargos completos' });
  }
};

/**
 * VISTA: Empleados Activos con Áreas
 * Empleados activos con sus áreas permitidas
 */
const obtenerEmpleadosActivosAreas = async (req, res) => {
  try {
    const empleados = await prisma.$queryRaw`
      SELECT * FROM vw_empleados_activos_areas
      ORDER BY nombre_completo ASC
    `;

    res.json(empleados);
  } catch (error) {
    console.error('Error al obtener empleados activos con áreas:', error);
    res.status(500).json({ error: 'Error al obtener empleados activos con áreas' });
  }
};

/**
 * VISTA: Resumen Labor Mes
 * Resumen mensual de trabajo por empleado
 */
const obtenerResumenLaborMes = async (req, res) => {
  try {
    const { id_empleado, fecha_inicio, fecha_fin } = req.query;

    let query = 'SELECT * FROM vw_resumen_labor_mes WHERE 1=1';
    const params = [];

    if (id_empleado) {
      query += ` AND id_empleado = $${params.length + 1}`;
      params.push(parseInt(id_empleado));
    }

    if (fecha_inicio && fecha_fin) {
      query += ` AND fecha_inicio >= $${params.length + 1} AND fecha_fin <= $${params.length + 2}`;
      params.push(new Date(fecha_inicio), new Date(fecha_fin));
    }

    query += ` ORDER BY fecha_inicio DESC`;

    const resumen = await prisma.$queryRawUnsafe(query, ...params);

    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen labor mes:', error);
    res.status(500).json({ error: 'Error al obtener resumen labor mes' });
  }
};

/**
 * VISTA: Auditoría Labor Mes
 * Historial de cambios en labor_mes
 */
const obtenerAuditoriaLaborMes = async (req, res) => {
  try {
    const { id_labor_mes, fecha_inicio, fecha_fin, limit = 100 } = req.query;

    let query = 'SELECT * FROM vw_auditoria_labor_mes WHERE 1=1';
    const params = [];

    if (id_labor_mes) {
      query += ` AND id_labor_mes = $${params.length + 1}`;
      params.push(parseInt(id_labor_mes));
    }

    if (fecha_inicio && fecha_fin) {
      query += ` AND fecha_modificacion >= $${params.length + 1} AND fecha_modificacion <= $${params.length + 2}`;
      params.push(new Date(fecha_inicio), new Date(fecha_fin));
    }

    query += ` ORDER BY fecha_modificacion DESC`;
    query += ` LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const auditoria = await prisma.$queryRawUnsafe(query, ...params);

    res.json(auditoria);
  } catch (error) {
    console.error('Error al obtener auditoría labor mes:', error);
    res.status(500).json({ error: 'Error al obtener auditoría labor mes' });
  }
};

/**
 * VISTA: Auditoría Recargos
 * Historial de cambios en recargos
 */
const obtenerAuditoriaRecargos = async (req, res) => {
  try {
    const { id_recargo, limit = 100 } = req.query;

    let query = 'SELECT * FROM vw_auditoria_recargos WHERE 1=1';
    const params = [];

    if (id_recargo) {
      query += ` AND id_recargo = $${params.length + 1}`;
      params.push(parseInt(id_recargo));
    }

    query += ` ORDER BY fecha_modificacion DESC`;
    query += ` LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const auditoria = await prisma.$queryRawUnsafe(query, ...params);

    res.json(auditoria);
  } catch (error) {
    console.error('Error al obtener auditoría recargos:', error);
    res.status(500).json({ error: 'Error al obtener auditoría recargos' });
  }
};

/**
 * VISTA: Auditoría Novedades
 * Historial de cambios en novedades
 */
const obtenerAuditoriaNovedades = async (req, res) => {
  try {
    const { id_novedad_registro, limit = 100 } = req.query;

    let query = 'SELECT * FROM vw_auditoria_novedades WHERE 1=1';
    const params = [];

    if (id_novedad_registro) {
      query += ` AND id_novedad_registro = $${params.length + 1}`;
      params.push(parseInt(id_novedad_registro));
    }

    query += ` ORDER BY fecha_modificacion DESC`;
    query += ` LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const auditoria = await prisma.$queryRawUnsafe(query, ...params);

    res.json(auditoria);
  } catch (error) {
    console.error('Error al obtener auditoría novedades:', error);
    res.status(500).json({ error: 'Error al obtener auditoría novedades' });
  }
};

module.exports = {
  obtenerEmpleadosCompletos,
  obtenerTurnosAsignados,
  obtenerNovedadesCompletas,
  obtenerRecargosCompletos,
  obtenerEmpleadosActivosAreas,
  obtenerResumenLaborMes,
  obtenerAuditoriaLaborMes,
  obtenerAuditoriaRecargos,
  obtenerAuditoriaNovedades
};

