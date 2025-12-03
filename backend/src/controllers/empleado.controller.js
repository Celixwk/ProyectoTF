const prisma = require('../config/database');

/**
 * LISTAR EMPLEADOS
 */
const listarEmpleados = async (req, res) => {
  try {
    const { estado, id_cargo, busqueda, page = 1, limit = 50 } = req.query;

    // Construir filtros
    const where = {};
    
    if (estado !== undefined) {
      where.estado = estado === 'true';
    }
    
    if (id_cargo) {
      where.id_cargo = parseInt(id_cargo);
    }
    
    if (busqueda) {
      where.OR = [
        { nombre1: { contains: busqueda, mode: 'insensitive' } },
        { nombre2: { contains: busqueda, mode: 'insensitive' } },
        { apellido1: { contains: busqueda, mode: 'insensitive' } },
        { apellido2: { contains: busqueda, mode: 'insensitive' } },
        { cedula: { contains: busqueda } }
      ];
    }

    // Paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Consultar empleados
    const [empleados, total] = await Promise.all([
      prisma.empleado.findMany({
        where,
        include: {
          cargo: true
        },
        skip,
        take,
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.empleado.count({ where })
    ]);

    res.json({
      empleados,
      paginacion: {
        total,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al listar empleados:', error);
    res.status(500).json({ error: 'Error al listar empleados' });
  }
};

/**
 * OBTENER EMPLEADO POR ID
 */
const obtenerEmpleado = async (req, res) => {
  try {
    const { id } = req.params;

    const empleado = await prisma.empleado.findUnique({
      where: { id_empleado: parseInt(id) },
      include: {
        cargo: true,
        usuario: {
          select: {
            id_usuario: true,
            usuario: true,
            tipo_usuario: true,
            estado: true
          }
        }
      }
    });

    if (!empleado) {
      return res.status(404).json({ 
        error: 'Empleado no encontrado' 
      });
    }

    res.json(empleado);

  } catch (error) {
    console.error('Error al obtener empleado:', error);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
};

/**
 * CREAR EMPLEADO
 */
const crearEmpleado = async (req, res) => {
  try {
    const {
      nombre1,
      nombre2,
      apellido1,
      apellido2,
      cedula,
      edad,
      sexo,
      vehiculo,
      id_cargo,
      areas_permitidas
    } = req.body;

    // Validar datos requeridos
    if (!nombre1 || !apellido1 || !cedula || !id_cargo) {
      return res.status(400).json({ 
        error: 'Nombre, apellido, cédula y cargo son requeridos' 
      });
    }

    // Verificar si la cédula ya existe
    const cedulaExistente = await prisma.empleado.findUnique({
      where: { cedula }
    });

    if (cedulaExistente) {
      return res.status(409).json({ 
        error: 'Ya existe un empleado con esta cédula' 
      });
    }

    // Crear empleado
    const empleado = await prisma.empleado.create({
      data: {
        nombre1,
        nombre2,
        apellido1,
        apellido2,
        cedula,
        edad: edad ? parseInt(edad) : null,
        sexo,
        vehiculo,
        id_cargo: parseInt(id_cargo),
        areas_permitidas: areas_permitidas || [],
        estado: true
      },
      include: {
        cargo: true
      }
    });

    res.status(201).json({
      mensaje: 'Empleado creado exitosamente',
      empleado
    });

  } catch (error) {
    console.error('Error al crear empleado:', error);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
};

/**
 * ACTUALIZAR EMPLEADO
 */
const actualizarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    // Verificar si existe
    const empleadoExistente = await prisma.empleado.findUnique({
      where: { id_empleado: parseInt(id) }
    });

    if (!empleadoExistente) {
      return res.status(404).json({ 
        error: 'Empleado no encontrado' 
      });
    }

    // Si se actualiza la cédula, verificar que no exista
    if (datos.cedula && datos.cedula !== empleadoExistente.cedula) {
      const cedulaExistente = await prisma.empleado.findUnique({
        where: { cedula: datos.cedula }
      });

      if (cedulaExistente) {
        return res.status(409).json({ 
          error: 'Ya existe un empleado con esta cédula' 
        });
      }
    }

    // Actualizar empleado
    const empleado = await prisma.empleado.update({
      where: { id_empleado: parseInt(id) },
      data: {
        ...datos,
        ...(datos.edad && { edad: parseInt(datos.edad) }),
        ...(datos.id_cargo && { id_cargo: parseInt(datos.id_cargo) })
      },
      include: {
        cargo: true
      }
    });

    res.json({
      mensaje: 'Empleado actualizado exitosamente',
      empleado
    });

  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
};

/**
 * ELIMINAR/DESACTIVAR EMPLEADO
 */
const eliminarEmpleado = async (req, res) => {
  try {
    const { id } = req.params;

    // Cambiar estado a inactivo en lugar de eliminar
    const empleado = await prisma.empleado.update({
      where: { id_empleado: parseInt(id) },
      data: { estado: false }
    });

    res.json({
      mensaje: 'Empleado desactivado exitosamente',
      empleado
    });

  } catch (error) {
    console.error('Error al eliminar empleado:', error);
    res.status(500).json({ error: 'Error al eliminar empleado' });
  }
};

/**
 * OBTENER EMPLEADOS ACTIVOS
 */
const obtenerEmpleadosActivos = async (req, res) => {
  try {
    const empleados = await prisma.empleado.findMany({
      where: { estado: true },
      select: {
        id_empleado: true,
        nombre1: true,
        nombre2: true,
        apellido1: true,
        apellido2: true,
        cedula: true,
        cargo: {
          select: {
            nombre_cargo: true,
            salario_base: true
          }
        },
        areas_permitidas: true
      },
      orderBy: [
        { apellido1: 'asc' },
        { nombre1: 'asc' }
      ]
    });

    // Formatear nombres completos
    const empleadosFormateados = empleados.map(emp => ({
      ...emp,
      nombre_completo: `${emp.nombre1} ${emp.nombre2 || ''} ${emp.apellido1} ${emp.apellido2 || ''}`.trim()
    }));

    res.json(empleadosFormateados);

  } catch (error) {
    console.error('Error al obtener empleados activos:', error);
    res.status(500).json({ error: 'Error al obtener empleados activos' });
  }
};

module.exports = {
  listarEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
  obtenerEmpleadosActivos
};

