const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========== MIDDLEWARES GLOBALES ==========
app.use(helmet()); // Seguridad HTTP headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression()); // Compresión de respuestas
app.use(morgan('dev')); // Logging de peticiones
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true }));

// ========== IMPORTAR RUTAS ==========
const authRoutes = require('./routes/auth.routes');
const empleadoRoutes = require('./routes/empleado.routes');
const cargoRoutes = require('./routes/cargo.routes');
const areaRoutes = require('./routes/area.routes');
const turnoRoutes = require('./routes/turno.routes');
const novedadRoutes = require('./routes/novedad.routes');
const recargoRoutes = require('./routes/recargo.routes');
const calendarioRoutes = require('./routes/calendario.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const parametrizacionRoutes = require('./routes/parametrizacion.routes');
const vistasRoutes = require('./routes/vistas.routes');
const programacionRoutes = require('./routes/programacion.routes');

// ========== RUTAS ==========
app.use('/api/auth', authRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/cargos', cargoRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/novedades', novedadRoutes);
app.use('/api/recargos', recargoRoutes);
app.use('/api/calendario', calendarioRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/parametrizacion', parametrizacionRoutes);
app.use('/api/vistas', vistasRoutes);
app.use('/api/programacion', programacionRoutes);

// ========== RUTA DE HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sistema de Nómina API v2.0',
    timestamp: new Date().toISOString() 
  });
});

// ========== MANEJO DE RUTAS NO ENCONTRADAS ==========
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.path 
  });
});

// ========== MANEJO DE ERRORES GLOBAL ==========
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Sistema de Nómina v2.0 - Backend              ║
║                                                       ║
║   📡 Servidor corriendo en: http://localhost:${PORT}  ║
║   🌍 Entorno: ${process.env.NODE_ENV || 'development'}                   ║
║   📅 Fecha: ${new Date().toLocaleString('es-CO')}          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

module.exports = app;

