const prisma = require('../config/database');

/**
 * LISTAR PARÁMETROS
 */
const listarParametros = async (req, res) => {
  try {
    const { categoria, activo } = req.query;

    const where = {};
    
    if (categoria) {
      where.categoria = categoria;
    }
    
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const parametros = await prisma.parametrizacion.findMany({
      where,
      orderBy: [
        { categoria: 'asc' },
        { nombre_parametro: 'asc' }
      ]
    });

    res.json(parametros);
  } catch (error) {
    console.error('Error al listar parámetros:', error);
    res.status(500).json({ error: 'Error al listar parámetros' });
  }
};

/**
 * OBTENER PARÁMETRO POR ID
 */
const obtenerParametro = async (req, res) => {
  try {
    const { id } = req.params;

    const parametro = await prisma.parametrizacion.findUnique({
      where: { id_parametro: parseInt(id) }
    });

    if (!parametro) {
      return res.status(404).json({ 
        error: 'Parámetro no encontrado' 
      });
    }

    res.json(parametro);
  } catch (error) {
    console.error('Error al obtener parámetro:', error);
    res.status(500).json({ error: 'Error al obtener parámetro' });
  }
};

/**
 * OBTENER PARÁMETRO POR NOMBRE
 */
const obtenerParametroPorNombre = async (req, res) => {
  try {
    const { nombre } = req.params;

    const parametro = await prisma.parametrizacion.findUnique({
      where: { nombre_parametro: nombre }
    });

    if (!parametro) {
      return res.status(404).json({ 
        error: 'Parámetro no encontrado' 
      });
    }

    res.json(parametro);
  } catch (error) {
    console.error('Error al obtener parámetro:', error);
    res.status(500).json({ error: 'Error al obtener parámetro' });
  }
};

/**
 * CREAR PARÁMETRO
 */
const crearParametro = async (req, res) => {
  try {
    const {
      nombre_parametro,
      valor_numerico,
      valor_texto,
      descripcion,
      tipo_parametro,
      categoria,
      fecha_vigencia_inicio,
      fecha_vigencia_fin
    } = req.body;

    // Validar datos requeridos
    if (!nombre_parametro || !tipo_parametro) {
      return res.status(400).json({ 
        error: 'Nombre y tipo de parámetro son requeridos' 
      });
    }

    // Verificar si ya existe
    const parametroExistente = await prisma.parametrizacion.findUnique({
      where: { nombre_parametro }
    });

    if (parametroExistente) {
      return res.status(409).json({ 
        error: 'Ya existe un parámetro con este nombre' 
      });
    }

    // Crear parámetro
    const parametro = await prisma.parametrizacion.create({
      data: {
        nombre_parametro,
        valor_numerico: valor_numerico ? parseFloat(valor_numerico) : null,
        valor_texto,
        descripcion,
        tipo_parametro,
        categoria,
        activo: true,
        fecha_vigencia_inicio: fecha_vigencia_inicio ? new Date(fecha_vigencia_inicio) : null,
        fecha_vigencia_fin: fecha_vigencia_fin ? new Date(fecha_vigencia_fin) : null
      }
    });

    res.status(201).json({
      mensaje: 'Parámetro creado exitosamente',
      parametro
    });
  } catch (error) {
    console.error('Error al crear parámetro:', error);
    res.status(500).json({ error: 'Error al crear parámetro' });
  }
};

/**
 * ACTUALIZAR PARÁMETRO
 */
const actualizarParametro = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    // Preparar datos para actualización
    const datosActualizacion = { ...datos };
    
    if (datos.valor_numerico !== undefined) {
      datosActualizacion.valor_numerico = datos.valor_numerico ? parseFloat(datos.valor_numerico) : null;
    }
    
    if (datos.fecha_vigencia_inicio) {
      datosActualizacion.fecha_vigencia_inicio = new Date(datos.fecha_vigencia_inicio);
    }
    
    if (datos.fecha_vigencia_fin) {
      datosActualizacion.fecha_vigencia_fin = new Date(datos.fecha_vigencia_fin);
    }

    const parametro = await prisma.parametrizacion.update({
      where: { id_parametro: parseInt(id) },
      data: datosActualizacion
    });

    res.json({
      mensaje: 'Parámetro actualizado exitosamente',
      parametro
    });
  } catch (error) {
    console.error('Error al actualizar parámetro:', error);
    res.status(500).json({ error: 'Error al actualizar parámetro' });
  }
};

/**
 * ELIMINAR PARÁMETRO
 */
const eliminarParametro = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.parametrizacion.delete({
      where: { id_parametro: parseInt(id) }
    });

    res.json({ mensaje: 'Parámetro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar parámetro:', error);
    res.status(500).json({ error: 'Error al eliminar parámetro' });
  }
};

/**
 * OBTENER PARÁMETROS POR CATEGORÍA
 */
const obtenerParametrosPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;

    const parametros = await prisma.parametrizacion.findMany({
      where: { 
        categoria,
        activo: true
      },
      orderBy: {
        nombre_parametro: 'asc'
      }
    });

    res.json(parametros);
  } catch (error) {
    console.error('Error al obtener parámetros por categoría:', error);
    res.status(500).json({ error: 'Error al obtener parámetros por categoría' });
  }
};

/**
 * ACTIVAR/DESACTIVAR PARÁMETRO
 */
const toggleEstadoParametro = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener estado actual
    const parametroActual = await prisma.parametrizacion.findUnique({
      where: { id_parametro: parseInt(id) }
    });

    if (!parametroActual) {
      return res.status(404).json({ 
        error: 'Parámetro no encontrado' 
      });
    }

    // Cambiar estado
    const parametro = await prisma.parametrizacion.update({
      where: { id_parametro: parseInt(id) },
      data: { activo: !parametroActual.activo }
    });

    res.json({
      mensaje: `Parámetro ${parametro.activo ? 'activado' : 'desactivado'} exitosamente`,
      parametro
    });
  } catch (error) {
    console.error('Error al cambiar estado de parámetro:', error);
    res.status(500).json({ error: 'Error al cambiar estado de parámetro' });
  }
};

module.exports = {
  listarParametros,
  obtenerParametro,
  obtenerParametroPorNombre,
  crearParametro,
  actualizarParametro,
  eliminarParametro,
  obtenerParametrosPorCategoria,
  toggleEstadoParametro
};

