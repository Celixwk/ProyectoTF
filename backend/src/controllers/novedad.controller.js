const prisma = require('../config/database');

/**
 * LISTAR NOVEDADES
 */
const listarNovedades = async (req, res) => {
  try {
    const { 
      id_empleado, 
      etapa,
      fecha_inicio,
      fecha_fin,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};
    
    if (id_empleado) {
      where.id_empleado = parseInt(id_empleado);
    }
    
    if (etapa) {
      where.etapa = etapa;
    }

    if (fecha_inicio && fecha_fin) {
      where.fecha_solicitud = {
        gte: new Date(fecha_inicio),
        lte: new Date(fecha_fin)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [novedades, total] = await Promise.all([
      prisma.novedadEmpleado.findMany({
        where,
        include: {
          empleado: {
            include: {
              cargo: true
            }
          },
          usuario: {
            select: {
              nombre_completo: true
            }
          },
          detalle_novedad: {
            include: {
              tipo_novedad: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          fecha_solicitud: 'desc'
        }
      }),
      prisma.novedadEmpleado.count({ where })
    ]);

    res.json({
      novedades,
      paginacion: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al listar novedades:', error);
    res.status(500).json({ error: 'Error al listar novedades' });
  }
};

/**
 * OBTENER NOVEDAD POR ID
 */
const obtenerNovedad = async (req, res) => {
  try {
    const { id } = req.params;

    const novedad = await prisma.novedadEmpleado.findUnique({
      where: { id_novedad_registro: parseInt(id) },
      include: {
        empleado: {
          include: {
            cargo: true
          }
        },
        usuario: {
          select: {
            usuario: true,
            nombre_completo: true
          }
        },
        detalle_novedad: {
          include: {
            tipo_novedad: true
          }
        }
      }
    });

    if (!novedad) {
      return res.status(404).json({ 
        error: 'Novedad no encontrada' 
      });
    }

    res.json(novedad);
  } catch (error) {
    console.error('Error al obtener novedad:', error);
    res.status(500).json({ error: 'Error al obtener novedad' });
  }
};

/**
 * CREAR NOVEDAD
 */
const crearNovedad = async (req, res) => {
  try {
    const {
      id_empleado,
      fecha_solicitud,
      fecha_registro,
      fecha_vencimiento,
      detalles // Array de detalles de la novedad
    } = req.body;

    // Validar datos requeridos
    if (!id_empleado || !fecha_solicitud || !fecha_registro || !detalles || detalles.length === 0) {
      return res.status(400).json({ 
        error: 'Datos incompletos para crear la novedad' 
      });
    }

    // Crear novedad con sus detalles
    const novedad = await prisma.novedadEmpleado.create({
      data: {
        id_empleado: parseInt(id_empleado),
        id_usuario: req.usuario.id_usuario,
        fecha_solicitud: new Date(fecha_solicitud),
        fecha_registro: new Date(fecha_registro),
        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null,
        etapa: 'pendiente',
        detalle_novedad: {
          create: detalles.map(detalle => ({
            id_novedad_tipo: parseInt(detalle.id_novedad_tipo),
            fecha: new Date(detalle.fecha),
            cantidad: detalle.cantidad ? parseFloat(detalle.cantidad) : null,
            observaciones: detalle.observaciones
          }))
        }
      },
      include: {
        empleado: {
          include: {
            cargo: true
          }
        },
        detalle_novedad: {
          include: {
            tipo_novedad: true
          }
        }
      }
    });

    res.status(201).json({
      mensaje: 'Novedad creada exitosamente',
      novedad
    });
  } catch (error) {
    console.error('Error al crear novedad:', error);
    res.status(500).json({ error: 'Error al crear novedad' });
  }
};

/**
 * ACTUALIZAR ESTADO DE NOVEDAD
 */
const actualizarEstadoNovedad = async (req, res) => {
  try {
    const { id } = req.params;
    const { etapa } = req.body;

    // Validar etapa
    const etapasValidas = ['pendiente', 'aprobada', 'rechazada', 'completada'];
    if (!etapasValidas.includes(etapa)) {
      return res.status(400).json({ 
        error: 'Etapa inválida. Debe ser: pendiente, aprobada, rechazada o completada' 
      });
    }

    const novedad = await prisma.novedadEmpleado.update({
      where: { id_novedad_registro: parseInt(id) },
      data: { etapa },
      include: {
        empleado: true,
        detalle_novedad: {
          include: {
            tipo_novedad: true
          }
        }
      }
    });

    res.json({
      mensaje: 'Estado de novedad actualizado exitosamente',
      novedad
    });
  } catch (error) {
    console.error('Error al actualizar estado de novedad:', error);
    res.status(500).json({ error: 'Error al actualizar estado de novedad' });
  }
};

/**
 * ELIMINAR NOVEDAD
 */
const eliminarNovedad = async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar detalles primero
    await prisma.detalleNovedad.deleteMany({
      where: { id_novedad_registro: parseInt(id) }
    });

    // Eliminar novedad
    await prisma.novedadEmpleado.delete({
      where: { id_novedad_registro: parseInt(id) }
    });

    res.json({ mensaje: 'Novedad eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar novedad:', error);
    res.status(500).json({ error: 'Error al eliminar novedad' });
  }
};

/**
 * LISTAR TIPOS DE NOVEDAD
 */
const listarTiposNovedad = async (req, res) => {
  try {
    const tiposNovedad = await prisma.tipoNovedad.findMany({
      orderBy: {
        nombre_novedad: 'asc'
      }
    });

    res.json(tiposNovedad);
  } catch (error) {
    console.error('Error al listar tipos de novedad:', error);
    res.status(500).json({ error: 'Error al listar tipos de novedad' });
  }
};

/**
 * CREAR TIPO DE NOVEDAD
 */
const crearTipoNovedad = async (req, res) => {
  try {
    const { codigo, nombre_novedad, afecta_pago } = req.body;

    // Validar datos requeridos
    if (!codigo || !nombre_novedad || afecta_pago === undefined) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    // Verificar si el código ya existe
    const tipoExistente = await prisma.tipoNovedad.findUnique({
      where: { codigo }
    });

    if (tipoExistente) {
      return res.status(409).json({ 
        error: 'Ya existe un tipo de novedad con este código' 
      });
    }

    // Crear tipo de novedad
    const tipoNovedad = await prisma.tipoNovedad.create({
      data: {
        codigo,
        nombre_novedad,
        afecta_pago: Boolean(afecta_pago)
      }
    });

    res.status(201).json({
      mensaje: 'Tipo de novedad creado exitosamente',
      tipoNovedad
    });
  } catch (error) {
    console.error('Error al crear tipo de novedad:', error);
    res.status(500).json({ error: 'Error al crear tipo de novedad' });
  }
};

/**
 * ACTUALIZAR TIPO DE NOVEDAD
 */
const actualizarTipoNovedad = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre_novedad, afecta_pago } = req.body;

    // Validar que el tipo existe
    const tipoExistente = await prisma.tipoNovedad.findUnique({
      where: { id_novedad_tipo: parseInt(id) }
    });

    if (!tipoExistente) {
      return res.status(404).json({ 
        error: 'Tipo de novedad no encontrado' 
      });
    }

    // Si se está cambiando el código, verificar que no exista otro con ese código
    if (codigo && codigo !== tipoExistente.codigo) {
      const codigoExistente = await prisma.tipoNovedad.findUnique({
        where: { codigo }
      });

      if (codigoExistente) {
        return res.status(409).json({ 
          error: 'Ya existe un tipo de novedad con este código' 
        });
      }
    }

    // Actualizar tipo de novedad (incluyendo código si se proporciona)
    const tipoNovedad = await prisma.tipoNovedad.update({
      where: { id_novedad_tipo: parseInt(id) },
      data: {
        codigo: codigo || tipoExistente.codigo,
        nombre_novedad: nombre_novedad || tipoExistente.nombre_novedad,
        afecta_pago: afecta_pago !== undefined ? Boolean(afecta_pago) : tipoExistente.afecta_pago
      }
    });

    res.json({
      mensaje: 'Tipo de novedad actualizado exitosamente',
      tipoNovedad
    });
  } catch (error) {
    console.error('Error al actualizar tipo de novedad:', error);
    res.status(500).json({ error: 'Error al actualizar tipo de novedad' });
  }
};

/**
 * ELIMINAR TIPO DE NOVEDAD
 */
const eliminarTipoNovedad = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el tipo existe
    const tipoExistente = await prisma.tipoNovedad.findUnique({
      where: { id_novedad_tipo: parseInt(id) },
      include: {
        detalle_novedad: true
      }
    });

    if (!tipoExistente) {
      return res.status(404).json({ 
        error: 'Tipo de novedad no encontrado' 
      });
    }

    // Verificar si hay novedades usando este tipo
    if (tipoExistente.detalle_novedad && tipoExistente.detalle_novedad.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar este tipo de novedad porque está siendo utilizado en registros de novedades' 
      });
    }

    // Eliminar tipo de novedad
    await prisma.tipoNovedad.delete({
      where: { id_novedad_tipo: parseInt(id) }
    });

    res.json({
      mensaje: 'Tipo de novedad eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar tipo de novedad:', error);
    res.status(500).json({ error: 'Error al eliminar tipo de novedad' });
  }
};

module.exports = {
  listarNovedades,
  obtenerNovedad,
  crearNovedad,
  actualizarEstadoNovedad,
  eliminarNovedad,
  listarTiposNovedad,
  crearTipoNovedad,
  actualizarTipoNovedad,
  eliminarTipoNovedad
};

