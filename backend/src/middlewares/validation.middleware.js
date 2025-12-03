const { validationResult } = require('express-validator');

/**
 * Middleware para validar los resultados de express-validator
 */
const validarCampos = (req, res, next) => {
  const errores = validationResult(req);
  
  if (!errores.isEmpty()) {
    return res.status(400).json({ 
      error: 'Errores de validación',
      errores: errores.array().map(err => ({
        campo: err.path || err.param,
        mensaje: err.msg,
        valor: err.value
      }))
    });
  }
  
  next();
};

/**
 * Middleware para sanitizar y limpiar inputs
 */
const sanitizarInput = (req, res, next) => {
  // Eliminar espacios en blanco de strings
  const sanitizar = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizar);
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key] = sanitizar(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  req.body = sanitizar(req.body);
  next();
};

/**
 * Middleware para validar IDs numéricos
 */
const validarId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ 
        error: `El parámetro '${paramName}' debe ser un número válido mayor a 0` 
      });
    }
    
    req.params[paramName] = id;
    next();
  };
};

/**
 * Middleware para validar fechas
 */
const validarFecha = (campo) => {
  return (req, res, next) => {
    const fecha = req.body[campo] || req.query[campo];
    
    if (fecha && isNaN(Date.parse(fecha))) {
      return res.status(400).json({ 
        error: `El campo '${campo}' no tiene un formato de fecha válido` 
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar paginación
 */
const validarPaginacion = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || parseInt(process.env.PAGE_LIMIT) || 50;
  
  if (page < 1) {
    return res.status(400).json({ 
      error: 'El número de página debe ser mayor o igual a 1' 
    });
  }
  
  // Aumentar el límite máximo para permitir consultas grandes (ej: programación mensual)
  if (limit < 1 || limit > 10000) {
    return res.status(400).json({ 
      error: 'El límite debe estar entre 1 y 10000' 
    });
  }
  
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };
  
  next();
};

module.exports = {
  validarCampos,
  sanitizarInput,
  validarId,
  validarFecha,
  validarPaginacion
};

