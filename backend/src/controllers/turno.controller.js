const prisma = require('../config/database');
const { calcularHorasTurno } = require('../services/recargos/calculoHoras');

/**
 * LISTAR TURNOS
 * Solo muestra turnos con códigos que empiezan con 'T' (T1, T2, T11, etc.)
 * Excluye novedades como D, DESCANSO, INCAP, LIC, etc.
 */
const listarTurnos = async (req, res) => {
  try {
    const { estado } = req.query;

    const where = {
      // Solo turnos que empiezan con 'T' seguido de números
      codigo: {
        startsWith: 'T'
      }
    };
    
    if (estado !== undefined) {
      where.estado = estado === 'true';
    }

    const turnos = await prisma.turno.findMany({
      where,
      orderBy: {
        codigo: 'asc'
      }
    });

    res.json(turnos);
  } catch (error) {
    console.error('Error al listar turnos:', error);
    res.status(500).json({ error: 'Error al listar turnos' });
  }
};

/**
 * OBTENER TURNO POR ID
 */
const obtenerTurno = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await prisma.turno.findUnique({
      where: { id_turno: parseInt(id) }
    });

    if (!turno) {
      return res.status(404).json({ 
        error: 'Turno no encontrado' 
      });
    }

    res.json(turno);
  } catch (error) {
    console.error('Error al obtener turno:', error);
    res.status(500).json({ error: 'Error al obtener turno' });
  }
};

/**
 * CREAR TURNO
 */
const crearTurno = async (req, res) => {
  try {
    const {
      codigo,
      hora_entrada,
      hora_salida,
      hora_entrada_2, // Opcional: segundo período para horarios partidos
      hora_salida_2,  // Opcional: segundo período para horarios partidos
      tipo_turno
    } = req.body;

    // Validar datos requeridos
    if (!codigo || !hora_entrada || !hora_salida) {
      return res.status(400).json({ 
        error: 'Código, hora de entrada y hora de salida son requeridos' 
      });
    }
    
    // Validar que el código empiece con 'T' seguido de números
    if (!/^T\d+$/.test(codigo)) {
      return res.status(400).json({ 
        error: 'El código del turno debe empezar con T seguido de números (ej: T1, T2, T11)' 
      });
    }

    // Validar horarios partidos: si se proporciona hora_entrada_2, también debe haber hora_salida_2
    if ((hora_entrada_2 && !hora_salida_2) || (!hora_entrada_2 && hora_salida_2)) {
      return res.status(400).json({ 
        error: 'Si se proporciona un segundo período, deben especificarse tanto hora_entrada_2 como hora_salida_2' 
      });
    }

    // Verificar si el código ya existe
    const turnoExistente = await prisma.turno.findUnique({
      where: { codigo }
    });

    if (turnoExistente) {
      return res.status(409).json({ 
        error: 'Ya existe un turno con este código' 
      });
    }

    // Preparar datos para crear turno
    const datosTurno = {
      codigo,
      hora_entrada: new Date(`1970-01-01T${hora_entrada}`),
      hora_salida: new Date(`1970-01-01T${hora_salida}`),
      tipo_turno: tipo_turno || '', // Opcional, usar string vacío si no se proporciona
      estado: true
    };

    // Agregar segundo período si se proporciona (horarios partidos)
    if (hora_entrada_2 && hora_salida_2) {
      datosTurno.hora_entrada_2 = new Date(`1970-01-01T${hora_entrada_2}`);
      datosTurno.hora_salida_2 = new Date(`1970-01-01T${hora_salida_2}`);
    }

    // Crear turno
    const turno = await prisma.turno.create({
      data: datosTurno
    });

    res.status(201).json({
      mensaje: 'Turno creado exitosamente',
      turno
    });
  } catch (error) {
    console.error('Error al crear turno:', error);
    res.status(500).json({ error: 'Error al crear turno' });
  }
};

/**
 * ACTUALIZAR TURNO
 */
const actualizarTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    // Si se actualiza el código, verificar que no exista
    if (datos.codigo) {
      const turnoConCodigo = await prisma.turno.findFirst({
        where: {
          codigo: datos.codigo,
          NOT: { id_turno: parseInt(id) }
        }
      });

      if (turnoConCodigo) {
        return res.status(409).json({ 
          error: 'Ya existe un turno con este código' 
        });
      }
    }

    // Preparar datos para actualización
    const datosActualizacion = { ...datos };
    if (datos.hora_entrada) {
      datosActualizacion.hora_entrada = new Date(`1970-01-01T${datos.hora_entrada}`);
    }
    if (datos.hora_salida) {
      datosActualizacion.hora_salida = new Date(`1970-01-01T${datos.hora_salida}`);
    }
    // Soporte para horarios partidos (segundo período)
    if (datos.hora_entrada_2) {
      datosActualizacion.hora_entrada_2 = new Date(`1970-01-01T${datos.hora_entrada_2}`);
    }
    if (datos.hora_salida_2) {
      datosActualizacion.hora_salida_2 = new Date(`1970-01-01T${datos.hora_salida_2}`);
    }
    // Permitir eliminar segundo período estableciendo null
    if (datos.hora_entrada_2 === null || datos.hora_entrada_2 === '') {
      datosActualizacion.hora_entrada_2 = null;
    }
    if (datos.hora_salida_2 === null || datos.hora_salida_2 === '') {
      datosActualizacion.hora_salida_2 = null;
    }

    const turno = await prisma.turno.update({
      where: { id_turno: parseInt(id) },
      data: datosActualizacion
    });

    res.json({
      mensaje: 'Turno actualizado exitosamente',
      turno
    });
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    res.status(500).json({ error: 'Error al actualizar turno' });
  }
};

/**
 * ELIMINAR/DESACTIVAR TURNO
 */
const eliminarTurno = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await prisma.turno.findUnique({
      where: { id_turno: parseInt(id) }
    });

    if (!turno) {
      return res.status(404).json({ 
        error: 'Turno no encontrado' 
      });
    }

    // Verificar si hay asignaciones usando este turno
    const asignaciones = await prisma.detalleProgramacion.count({
      where: {
        fk_id_turno: parseInt(id)
      }
    });

    if (asignaciones > 0) {
      // Si tiene asignaciones, solo desactivar
      const turnoDesactivado = await prisma.turno.update({
      where: { id_turno: parseInt(id) },
      data: { estado: false }
      });

      return res.json({
        mensaje: 'Turno desactivado exitosamente (tiene asignaciones activas)',
        turno: turnoDesactivado
      });
    }

    // Si no tiene asignaciones, eliminar completamente
    await prisma.turno.delete({
      where: { id_turno: parseInt(id) }
    });

    res.json({
      mensaje: 'Turno eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    res.status(500).json({ error: 'Error al eliminar turno' });
  }
};

/**
 * ASIGNAR TURNO A EMPLEADO
 */
const asignarTurno = async (req, res) => {
  try {
    const {
      id_empleado,
      id_turno,
      id_area,
      fecha,
      fecha_inicio,
      fecha_fin
    } = req.body;

    // Validar datos requeridos
    if (!id_empleado || !id_turno || !id_area || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    // Obtener o crear labor_mes
    let laborMes = await prisma.laborMes.findFirst({
      where: {
        id_empleado: parseInt(id_empleado),
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin)
      }
    });

    if (!laborMes) {
      laborMes = await prisma.laborMes.create({
        data: {
          id_empleado: parseInt(id_empleado),
          fecha_inicio: new Date(fecha_inicio),
          fecha_fin: new Date(fecha_fin),
          horas_ordinarias: 0,
          total_horas: 0,
          total_recargos: 0
        }
      });
    }

    // Crear detalle de programación
    const detalleProgramacion = await prisma.detalleProgramacion.create({
      data: {
        fecha: new Date(fecha || fecha_inicio),
        id_area: parseInt(id_area),
        fk_id_labor_mes: laborMes.id,
        fk_id_turno: parseInt(id_turno),
        total_horas_laboradas: 0 // Se calculará después
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
      }
    });

    res.status(201).json({
      mensaje: 'Turno asignado exitosamente',
      detalleProgramacion
    });
  } catch (error) {
    console.error('Error al asignar turno:', error);
    res.status(500).json({ error: 'Error al asignar turno' });
  }
};

/**
 * OBTENER TURNOS ASIGNADOS
 */
const obtenerTurnosAsignados = async (req, res) => {
  try {
    const { 
      id_empleado, 
      fecha_inicio, 
      fecha_fin,
      page = 1,
      limit = 100
    } = req.query;

    const where = {};
    
    if (id_empleado) {
      where.labor_mes = {
        id_empleado: parseInt(id_empleado)
      };
    }

    if (fecha_inicio && fecha_fin) {
      where.fecha = {
        gte: new Date(fecha_inicio),
        lte: new Date(fecha_fin)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [turnosAsignados, total] = await Promise.all([
      prisma.detalleProgramacion.findMany({
        where,
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
          },
          recargo: true
        },
        skip,
        take,
        orderBy: {
          fecha: 'desc'
        }
      }),
      prisma.detalleProgramacion.count({ where })
    ]);

    res.json({
      turnosAsignados,
      paginacion: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener turnos asignados:', error);
    res.status(500).json({ error: 'Error al obtener turnos asignados' });
  }
};

module.exports = {
  listarTurnos,
  obtenerTurno,
  crearTurno,
  actualizarTurno,
  eliminarTurno,
  asignarTurno,
  obtenerTurnosAsignados
};

