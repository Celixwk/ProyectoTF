const prisma = require('../config/database');

/**
 * LISTAR CARGOS
 */
const listarCargos = async (req, res) => {
  try {
    const cargos = await prisma.cargo.findMany({
      include: {
        _count: {
          select: { empleados: true }
        }
      },
      orderBy: {
        nombre_cargo: 'asc'
      }
    });

    res.json(cargos);
  } catch (error) {
    console.error('Error al listar cargos:', error);
    res.status(500).json({ error: 'Error al listar cargos' });
  }
};

/**
 * OBTENER CARGO POR ID
 */
const obtenerCargo = async (req, res) => {
  try {
    const { id } = req.params;

    const cargo = await prisma.cargo.findUnique({
      where: { id_cargo: parseInt(id) },
      include: {
        empleados: {
          where: { estado: true },
          select: {
            id_empleado: true,
            nombre1: true,
            apellido1: true,
            cedula: true
          }
        }
      }
    });

    if (!cargo) {
      return res.status(404).json({ 
        error: 'Cargo no encontrado' 
      });
    }

    res.json(cargo);
  } catch (error) {
    console.error('Error al obtener cargo:', error);
    res.status(500).json({ error: 'Error al obtener cargo' });
  }
};

/**
 * CREAR CARGO
 */
const crearCargo = async (req, res) => {
  try {
    const { nombre_cargo, salario_base } = req.body;

    // Validar datos
    if (!nombre_cargo || !salario_base) {
      return res.status(400).json({ 
        error: 'Nombre y salario base son requeridos' 
      });
    }

    // Crear cargo
    const cargo = await prisma.cargo.create({
      data: {
        nombre_cargo,
        salario_base: parseFloat(salario_base)
      }
    });

    res.status(201).json({
      mensaje: 'Cargo creado exitosamente',
      cargo
    });
  } catch (error) {
    console.error('Error al crear cargo:', error);
    res.status(500).json({ error: 'Error al crear cargo' });
  }
};

/**
 * ACTUALIZAR CARGO
 */
const actualizarCargo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_cargo, salario_base } = req.body;

    const cargo = await prisma.cargo.update({
      where: { id_cargo: parseInt(id) },
      data: {
        ...(nombre_cargo && { nombre_cargo }),
        ...(salario_base && { salario_base: parseFloat(salario_base) })
      }
    });

    res.json({
      mensaje: 'Cargo actualizado exitosamente',
      cargo
    });
  } catch (error) {
    console.error('Error al actualizar cargo:', error);
    res.status(500).json({ error: 'Error al actualizar cargo' });
  }
};

/**
 * ELIMINAR CARGO
 */
const eliminarCargo = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay empleados con este cargo
    const empleadosConCargo = await prisma.empleado.count({
      where: { id_cargo: parseInt(id) }
    });

    if (empleadosConCargo > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar. Hay ${empleadosConCargo} empleado(s) con este cargo` 
      });
    }

    await prisma.cargo.delete({
      where: { id_cargo: parseInt(id) }
    });

    res.json({ mensaje: 'Cargo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cargo:', error);
    res.status(500).json({ error: 'Error al eliminar cargo' });
  }
};

module.exports = {
  listarCargos,
  obtenerCargo,
  crearCargo,
  actualizarCargo,
  eliminarCargo
};

