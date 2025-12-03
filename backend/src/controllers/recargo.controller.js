const prisma = require('../config/database');
const { calcularRecargos } = require('../services/recargos/calculoHoras');

/**
 * LISTAR RECARGOS
 */
const listarRecargos = async (req, res) => {
  try {
    const { 
      id_empleado,
      fecha_inicio,
      fecha_fin,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    // Filtrar por empleado a través de la relación
    if (id_empleado) {
      where.detalle_programacion = {
        labor_mes: {
          id_empleado: parseInt(id_empleado)
        }
      };
    }

    // Filtrar por rango de fechas
    if (fecha_inicio && fecha_fin) {
      where.fecha_inicio = {
        gte: new Date(fecha_inicio),
        lte: new Date(fecha_fin)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [recargos, total] = await Promise.all([
      prisma.recargo.findMany({
        where,
        include: {
          detalle_programacion: {
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
            }
          },
          detalle_recargo: {
            include: {
              tipo_recargo: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          fecha_inicio: 'desc'
        }
      }),
      prisma.recargo.count({ where })
    ]);

    res.json({
      recargos,
      paginacion: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al listar recargos:', error);
    res.status(500).json({ error: 'Error al listar recargos' });
  }
};

/**
 * OBTENER RECARGO POR ID
 */
const obtenerRecargo = async (req, res) => {
  try {
    const { id } = req.params;

    const recargo = await prisma.recargo.findUnique({
      where: { id_recargo: parseInt(id) },
      include: {
        detalle_programacion: {
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
          }
        },
        detalle_recargo: {
          include: {
            tipo_recargo: true
          }
        }
      }
    });

    if (!recargo) {
      return res.status(404).json({ 
        error: 'Recargo no encontrado' 
      });
    }

    res.json(recargo);
  } catch (error) {
    console.error('Error al obtener recargo:', error);
    res.status(500).json({ error: 'Error al obtener recargo' });
  }
};

/**
 * CALCULAR RECARGOS PARA UN TURNO
 */
const calcularRecargoTurno = async (req, res) => {
  try {
    const { id_detalle_turno } = req.params;

    // Obtener el detalle de programación con todos los datos necesarios
    const detalleProgramacion = await prisma.detalleProgramacion.findUnique({
      where: { id_detalle_turno: parseInt(id_detalle_turno) },
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
      }
    });

    if (!detalleProgramacion) {
      return res.status(404).json({ 
        error: 'Turno no encontrado' 
      });
    }

    // Calcular recargos usando el servicio
    const recargosCalculados = await calcularRecargos(detalleProgramacion);

    res.json({
      mensaje: 'Recargos calculados exitosamente',
      recargos: recargosCalculados
    });
  } catch (error) {
    console.error('Error al calcular recargos:', error);
    res.status(500).json({ error: 'Error al calcular recargos' });
  }
};

/**
 * OBTENER RESUMEN DE RECARGOS POR EMPLEADO
 */
const obtenerResumenRecargosPorEmpleado = async (req, res) => {
  try {
    const { id_empleado, fecha_inicio, fecha_fin } = req.query;

    if (!id_empleado || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        error: 'Se requiere id_empleado, fecha_inicio y fecha_fin' 
      });
    }

    // Obtener todos los recargos del empleado en el período
    const recargos = await prisma.recargo.findMany({
      where: {
        detalle_programacion: {
          labor_mes: {
            id_empleado: parseInt(id_empleado)
          }
        },
        fecha_inicio: {
          gte: new Date(fecha_inicio),
          lte: new Date(fecha_fin)
        }
      },
      include: {
        detalle_recargo: {
          include: {
            tipo_recargo: true
          }
        }
      }
    });

    // Calcular totales
    const resumen = {
      total_recargos_dinero: 0,
      total_horas_recargo: 0,
      total_dominicales: 0,
      total_festivos: 0,
      desglose: {
        rno: 0,
        rnf: 0,
        heon: 0,
        heod: 0,
        hefd: 0,
        hefn: 0
      }
    };

    recargos.forEach(recargo => {
      resumen.total_recargos_dinero += parseFloat(recargo.total_dinero || 0);
      resumen.total_horas_recargo += parseFloat(recargo.total_horas || 0);
      resumen.total_dominicales += recargo.dominicales || 0;
      resumen.total_festivos += recargo.festivos || 0;
      
      resumen.desglose.rno += parseFloat(recargo.rno || 0);
      resumen.desglose.rnf += parseFloat(recargo.rnf || 0);
      resumen.desglose.heon += parseFloat(recargo.heon || 0);
      resumen.desglose.heod += parseFloat(recargo.heod || 0);
      resumen.desglose.hefd += parseFloat(recargo.hefd || 0);
      resumen.desglose.hefn += parseFloat(recargo.hefn || 0);
    });

    res.json({
      id_empleado: parseInt(id_empleado),
      periodo: { fecha_inicio, fecha_fin },
      resumen,
      cantidad_turnos: recargos.length
    });
  } catch (error) {
    console.error('Error al obtener resumen de recargos:', error);
    res.status(500).json({ error: 'Error al obtener resumen de recargos' });
  }
};

/**
 * LISTAR TIPOS DE RECARGO
 */
const listarTiposRecargo = async (req, res) => {
  try {
    const tiposRecargo = await prisma.tipoRecargo.findMany({
      orderBy: {
        codigo: 'asc'
      }
    });

    res.json(tiposRecargo);
  } catch (error) {
    console.error('Error al listar tipos de recargo:', error);
    res.status(500).json({ error: 'Error al listar tipos de recargo' });
  }
};

module.exports = {
  listarRecargos,
  obtenerRecargo,
  calcularRecargoTurno,
  obtenerResumenRecargosPorEmpleado,
  listarTiposRecargo
};

