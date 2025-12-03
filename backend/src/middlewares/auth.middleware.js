const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Middleware para verificar JWT y autenticar usuario
 */
const verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'No se proporcionó token de autenticación' 
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: decoded.id_usuario },
      include: {
        empleado: {
          include: {
            cargo: true
          }
        }
      }
    });

    if (!usuario || !usuario.estado) {
      return res.status(401).json({ 
        error: 'Usuario no válido o inactivo' 
      });
    }

    // Agregar usuario al request
    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    }
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error en autenticación' });
  }
};

/**
 * Middleware para verificar roles de usuario
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado' 
      });
    }

    const tipoUsuario = req.usuario.tipo_usuario.toLowerCase();
    
    if (!rolesPermitidos.map(r => r.toLowerCase()).includes(tipoUsuario)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción',
        requiereRol: rolesPermitidos,
        tuRol: req.usuario.tipo_usuario
      });
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
const esAdmin = verificarRol('admin', 'administrador');

/**
 * Middleware para verificar que el usuario sea admin o supervisor
 */
const esAdminOSupervisor = verificarRol('admin', 'administrador', 'supervisor');

module.exports = {
  verificarToken,
  verificarRol,
  esAdmin,
  esAdminOSupervisor
};

