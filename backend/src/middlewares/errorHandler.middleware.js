/**
 * Middleware para manejo centralizado de errores
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Error de Prisma - Registro no encontrado
  if (err.code === 'P2025') {
    error = new AppError('Registro no encontrado', 404);
  }

  // Error de Prisma - Violación de constraint único
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    error = new AppError(`Ya existe un registro con ese ${field}`, 409);
  }

  // Error de Prisma - Violación de foreign key
  if (err.code === 'P2003') {
    error = new AppError('Referencia inválida a otro registro', 400);
  }

  // Error de Prisma - Error en la consulta
  if (err.code === 'P2001') {
    error = new AppError('Error en la consulta a la base de datos', 400);
  }

  // Error de validación
  if (err.name === 'ValidationError') {
    error = new AppError('Error de validación de datos', 400);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expirado', 401);
  }

  // Respuesta de error
  res.status(error.statusCode || 500).json({
    error: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      code: err.code 
    })
  });
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler
};

