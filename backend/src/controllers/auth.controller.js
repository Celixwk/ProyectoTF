const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * LOGIN - Autenticar usuario
 */
const login = async (req, res) => {
  try {
    const { usuario, contrasenia } = req.body;

    // Validar datos requeridos
    if (!usuario || !contrasenia) {
      return res.status(400).json({ 
        error: 'Usuario y contraseña son requeridos' 
      });
    }

    // Buscar usuario
    const usuarioEncontrado = await prisma.usuario.findUnique({
      where: { usuario },
      include: {
        empleado: {
          include: {
            cargo: true
          }
        }
      }
    });

    if (!usuarioEncontrado) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar si el usuario está activo
    if (!usuarioEncontrado.estado) {
      return res.status(403).json({ 
        error: 'Usuario inactivo. Contacte al administrador' 
      });
    }

    // Verificar contraseña
    const contraseniaValida = await bcrypt.compare(
      contrasenia, 
      usuarioEncontrado.contrasenia
    );

    if (!contraseniaValida) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id_usuario: usuarioEncontrado.id_usuario,
        usuario: usuarioEncontrado.usuario,
        tipo_usuario: usuarioEncontrado.tipo_usuario
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Respuesta exitosa
    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id_usuario: usuarioEncontrado.id_usuario,
        usuario: usuarioEncontrado.usuario,
        nombre_completo: usuarioEncontrado.nombre_completo,
        tipo_usuario: usuarioEncontrado.tipo_usuario,
        empleado: usuarioEncontrado.empleado ? {
          id_empleado: usuarioEncontrado.empleado.id_empleado,
          nombre_completo: `${usuarioEncontrado.empleado.nombre1} ${usuarioEncontrado.empleado.apellido1}`,
          cargo: usuarioEncontrado.empleado.cargo?.nombre_cargo
        } : null
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

/**
 * OBTENER PERFIL - Obtener datos del usuario autenticado
 */
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: req.usuario.id_usuario },
      select: {
        id_usuario: true,
        usuario: true,
        nombre_completo: true,
        tipo_usuario: true,
        estado: true,
        fecha_creacion: true,
        empleado: {
          include: {
            cargo: true
          }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

/**
 * CAMBIAR CONTRASEÑA
 */
const cambiarContrasenia = async (req, res) => {
  try {
    const { contraseniaActual, contraseniaNueva } = req.body;
    const { id_usuario } = req.usuario;

    // Validar datos
    if (!contraseniaActual || !contraseniaNueva) {
      return res.status(400).json({ 
        error: 'Se requiere contraseña actual y nueva' 
      });
    }

    if (contraseniaNueva.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario }
    });

    // Verificar contraseña actual
    const contraseniaValida = await bcrypt.compare(
      contraseniaActual, 
      usuario.contrasenia
    );

    if (!contraseniaValida) {
      return res.status(401).json({ 
        error: 'Contraseña actual incorrecta' 
      });
    }

    // Encriptar nueva contraseña
    const contraseniaEncriptada = await bcrypt.hash(contraseniaNueva, 10);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id_usuario },
      data: { contrasenia: contraseniaEncriptada }
    });

    res.json({ 
      mensaje: 'Contraseña actualizada exitosamente' 
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

/**
 * CREAR USUARIO (solo admin)
 */
const crearUsuario = async (req, res) => {
  try {
    const { 
      usuario, 
      contrasenia, 
      tipo_usuario, 
      nombre_completo, 
      id_empleado 
    } = req.body;

    // Validar datos requeridos
    if (!usuario || !contrasenia || !tipo_usuario || !nombre_completo) {
      return res.status(400).json({ 
        error: 'Todos los campos son requeridos' 
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { usuario }
    });

    if (usuarioExistente) {
      return res.status(409).json({ 
        error: 'El nombre de usuario ya existe' 
      });
    }

    // Encriptar contraseña
    const contraseniaEncriptada = await bcrypt.hash(contrasenia, 10);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        usuario,
        contrasenia: contraseniaEncriptada,
        tipo_usuario,
        nombre_completo,
        estado: true,
        fecha_creacion: new Date(),
        ...(id_empleado && { id_empleado: parseInt(id_empleado) })
      },
      include: {
        empleado: true
      }
    });

    // Remover contraseña de la respuesta
    delete nuevoUsuario.contrasenia;

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: nuevoUsuario
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

/**
 * LISTAR USUARIOS (solo admin)
 */
const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id_usuario: true,
        usuario: true,
        nombre_completo: true,
        tipo_usuario: true,
        estado: true,
        fecha_creacion: true,
        empleado: {
          select: {
            id_empleado: true,
            nombre1: true,
            apellido1: true,
            cargo: {
              select: {
                nombre_cargo: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      }
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

/**
 * ACTUALIZAR ESTADO DE USUARIO (solo admin)
 */
const actualizarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id_usuario: parseInt(id) },
      data: { estado },
      select: {
        id_usuario: true,
        usuario: true,
        nombre_completo: true,
        estado: true
      }
    });

    res.json({
      mensaje: 'Estado actualizado exitosamente',
      usuario
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

module.exports = {
  login,
  obtenerPerfil,
  cambiarContrasenia,
  crearUsuario,
  listarUsuarios,
  actualizarEstadoUsuario
};

