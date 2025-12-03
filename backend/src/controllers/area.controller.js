const prisma = require('../config/database');

/**
 * LISTAR ÁREAS
 */
const listarAreas = async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      orderBy: {
        nombre_area: 'asc'
      }
    });

    res.json(areas);
  } catch (error) {
    console.error('Error al listar áreas:', error);
    res.status(500).json({ error: 'Error al listar áreas' });
  }
};

/**
 * OBTENER ÁREA POR ID
 */
const obtenerArea = async (req, res) => {
  try {
    const { id } = req.params;

    const area = await prisma.area.findUnique({
      where: { id_area: parseInt(id) }
    });

    if (!area) {
      return res.status(404).json({ 
        error: 'Área no encontrada' 
      });
    }

    res.json(area);
  } catch (error) {
    console.error('Error al obtener área:', error);
    res.status(500).json({ error: 'Error al obtener área' });
  }
};

/**
 * CREAR ÁREA
 */
const crearArea = async (req, res) => {
  try {
    const { nombre_area } = req.body;

    if (!nombre_area) {
      return res.status(400).json({ 
        error: 'El nombre del área es requerido' 
      });
    }

    const area = await prisma.area.create({
      data: { nombre_area }
    });

    res.status(201).json({
      mensaje: 'Área creada exitosamente',
      area
    });
  } catch (error) {
    console.error('Error al crear área:', error);
    res.status(500).json({ error: 'Error al crear área' });
  }
};

/**
 * ACTUALIZAR ÁREA
 */
const actualizarArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_area } = req.body;

    const area = await prisma.area.update({
      where: { id_area: parseInt(id) },
      data: { nombre_area }
    });

    res.json({
      mensaje: 'Área actualizada exitosamente',
      area
    });
  } catch (error) {
    console.error('Error al actualizar área:', error);
    res.status(500).json({ error: 'Error al actualizar área' });
  }
};

/**
 * ELIMINAR ÁREA
 */
const eliminarArea = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay turnos asignados a esta área
    const turnosEnArea = await prisma.detalleProgramacion.count({
      where: { id_area: parseInt(id) }
    });

    if (turnosEnArea > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar. Hay ${turnosEnArea} turno(s) asignado(s) a esta área` 
      });
    }

    await prisma.area.delete({
      where: { id_area: parseInt(id) }
    });

    res.json({ mensaje: 'Área eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar área:', error);
    res.status(500).json({ error: 'Error al eliminar área' });
  }
};

module.exports = {
  listarAreas,
  obtenerArea,
  crearArea,
  actualizarArea,
  eliminarArea
};

