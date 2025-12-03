const prisma = require('../config/database');

/**
 * OBTENER ESTADÍSTICAS GENERALES DEL DASHBOARD
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    const [
      totalEmpleados,
      empleadosActivos,
      totalCargos,
      totalAreas,
      totalTurnos,
      turnosHoy,
      novedadesPendientes,
      recargosMesActual
    ] = await Promise.all([
      // Total de empleados
      prisma.empleado.count(),
      
      // Empleados activos
      prisma.empleado.count({
        where: { estado: true }
      }),
      
      // Total de cargos
      prisma.cargo.count(),
      
      // Total de áreas
      prisma.area.count(),
      
      // Total de turnos activos
      prisma.turno.count({
        where: { estado: true }
      }),
      
      // Turnos programados para hoy
      prisma.detalleProgramacion.count({
        where: {
          fecha: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      
      // Novedades pendientes
      prisma.novedadEmpleado.count({
        where: {
          etapa: 'pendiente'
        }
      }),
      
      // Recargos del mes actual
      prisma.recargo.aggregate({
        where: {
          fecha_inicio: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: {
          total_dinero: true
        }
      })
    ]);

    res.json({
      empleados: {
        total: totalEmpleados,
        activos: empleadosActivos,
        inactivos: totalEmpleados - empleadosActivos
      },
      configuracion: {
        cargos: totalCargos,
        areas: totalAreas,
        turnos: totalTurnos
      },
      operacion: {
        turnosHoy: turnosHoy,
        novedadesPendientes,
        recargosMesActual: parseFloat(recargosMesActual._sum.total_dinero || 0)
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

/**
 * OBTENER TURNOS DEL DÍA
 */
const obtenerTurnosHoy = async (req, res) => {
  try {
    const hoy = new Date(new Date().setHours(0, 0, 0, 0));

    const turnosHoy = await prisma.detalleProgramacion.findMany({
      where: {
        fecha: hoy
      },
      include: {
        turno: true,
        area: true,
        labor_mes: {
          include: {
            empleado: {
              include: {
                cargo: true
              }
            }
          }
        }
      },
      orderBy: {
        turno: {
          hora_entrada: 'asc'
        }
      }
    });

    res.json(turnosHoy);
  } catch (error) {
    console.error('Error al obtener turnos de hoy:', error);
    res.status(500).json({ error: 'Error al obtener turnos de hoy' });
  }
};

/**
 * OBTENER RECARGOS POR MES (para gráficos)
 */
const obtenerRecargosPorMes = async (req, res) => {
  try {
    const { anio } = req.query;
    const year = parseInt(anio) || new Date().getFullYear();

    const recargosPorMes = [];

    // Para cada mes del año
    for (let mes = 0; mes < 12; mes++) {
      const primerDia = new Date(year, mes, 1);
      const ultimoDia = new Date(year, mes + 1, 0);

      const recargos = await prisma.recargo.aggregate({
        where: {
          fecha_inicio: {
            gte: primerDia,
            lte: ultimoDia
          }
        },
        _sum: {
          total_dinero: true,
          total_horas: true
        },
        _count: true
      });

      recargosPorMes.push({
        mes: mes + 1,
        nombreMes: new Date(year, mes).toLocaleString('es-ES', { month: 'long' }),
        totalDinero: parseFloat(recargos._sum.total_dinero || 0),
        totalHoras: parseFloat(recargos._sum.total_horas || 0),
        cantidadTurnos: recargos._count
      });
    }

    res.json({
      anio: year,
      recargosPorMes
    });
  } catch (error) {
    console.error('Error al obtener recargos por mes:', error);
    res.status(500).json({ error: 'Error al obtener recargos por mes' });
  }
};

/**
 * OBTENER EMPLEADOS MÁS ACTIVOS
 */
const obtenerEmpleadosMasActivos = async (req, res) => {
  try {
    const { limite = 10, mes, anio } = req.query;

    // Construir filtro de fechas
    const where = {};
    if (mes && anio) {
      const primerDia = new Date(parseInt(anio), parseInt(mes) - 1, 1);
      const ultimoDia = new Date(parseInt(anio), parseInt(mes), 0);
      where.fecha_inicio = {
        gte: primerDia,
        lte: ultimoDia
      };
    }

    // Obtener empleados con más turnos
    const empleadosActivos = await prisma.$queryRaw`
      SELECT 
        e.id_empleado,
        CONCAT(e.nombre1, ' ', e.apellido1) as nombre_completo,
        c.nombre_cargo,
        COUNT(DISTINCT dp.id_detalle_turno) as total_turnos,
        SUM(r.total_horas) as total_horas,
        SUM(r.total_dinero) as total_recargos
      FROM empleado e
      INNER JOIN cargo c ON e.id_cargo = c.id_cargo
      INNER JOIN labor_mes lm ON lm.id_empleado = e.id_empleado
      INNER JOIN detalle_programacion dp ON dp.fk_id_labor_mes = lm.id
      LEFT JOIN recargo r ON r.fk_id_detalle_turno = dp.id_detalle_turno
      WHERE e.estado = true
      GROUP BY e.id_empleado, e.nombre1, e.apellido1, c.nombre_cargo
      ORDER BY total_turnos DESC
      LIMIT ${parseInt(limite)}
    `;

    res.json(empleadosActivos);
  } catch (error) {
    console.error('Error al obtener empleados más activos:', error);
    res.status(500).json({ error: 'Error al obtener empleados más activos' });
  }
};

/**
 * OBTENER DISTRIBUCIÓN DE TURNOS POR ÁREA
 */
const obtenerDistribucionPorArea = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const mesActual = mes ? parseInt(mes) : new Date().getMonth() + 1;
    const anioActual = anio ? parseInt(anio) : new Date().getFullYear();

    const primerDia = new Date(anioActual, mesActual - 1, 1);
    const ultimoDia = new Date(anioActual, mesActual, 0);

    const distribucion = await prisma.$queryRaw`
      SELECT 
        a.id_area,
        a.nombre_area,
        COUNT(dp.id_detalle_turno) as total_turnos,
        COUNT(DISTINCT lm.id_empleado) as empleados_unicos
      FROM area a
      LEFT JOIN detalle_programacion dp ON dp.id_area = a.id_area
      LEFT JOIN labor_mes lm ON dp.fk_id_labor_mes = lm.id
      WHERE dp.fecha >= ${primerDia} AND dp.fecha <= ${ultimoDia}
      GROUP BY a.id_area, a.nombre_area
      ORDER BY total_turnos DESC
    `;

    res.json(distribucion);
  } catch (error) {
    console.error('Error al obtener distribución por área:', error);
    res.status(500).json({ error: 'Error al obtener distribución por área' });
  }
};

/**
 * OBTENER RESUMEN DE NOVEDADES
 */
const obtenerResumenNovedades = async (req, res) => {
  try {
    const { mes, anio } = req.query;
    
    const where = {};
    if (mes && anio) {
      const primerDia = new Date(parseInt(anio), parseInt(mes) - 1, 1);
      const ultimoDia = new Date(parseInt(anio), parseInt(mes), 0);
      where.fecha_solicitud = {
        gte: primerDia,
        lte: ultimoDia
      };
    }

    const [
      totalNovedades,
      pendientes,
      aprobadas,
      rechazadas
    ] = await Promise.all([
      prisma.novedadEmpleado.count({ where }),
      prisma.novedadEmpleado.count({ 
        where: { ...where, etapa: 'pendiente' } 
      }),
      prisma.novedadEmpleado.count({ 
        where: { ...where, etapa: 'aprobada' } 
      }),
      prisma.novedadEmpleado.count({ 
        where: { ...where, etapa: 'rechazada' } 
      })
    ]);

    res.json({
      total: totalNovedades,
      pendientes,
      aprobadas,
      rechazadas,
      completadas: totalNovedades - pendientes - aprobadas - rechazadas
    });
  } catch (error) {
    console.error('Error al obtener resumen de novedades:', error);
    res.status(500).json({ error: 'Error al obtener resumen de novedades' });
  }
};

module.exports = {
  obtenerEstadisticas,
  obtenerTurnosHoy,
  obtenerRecargosPorMes,
  obtenerEmpleadosMasActivos,
  obtenerDistribucionPorArea,
  obtenerResumenNovedades
};

