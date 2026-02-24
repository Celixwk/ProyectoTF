import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import configuracionRoutes from './routes/configuracion.routes';
import dashboardRoutes from './routes/dashboard.routes';
import empleadosRoutes from './routes/empleados.routes';
import vistasRoutes from './routes/vista.routes';
import turnosRoutes from './routes/turnos.routes';
import cargosRoutes from './routes/cargos.routes';
import areasRoutes from './routes/areas.routes';
import calendarioRoutes from './routes/calendario.routes';
import novedadesRoutes from './routes/novedades.routes';
import programacionRoutes from './routes/programacion.routes';
import alertasRoutes from './routes/alertas.routes';
import estadosRoutes from './routes/estados.routes';
import authRoutes from './routes/auth.routes';
import { verificarEstructuraBD } from './database/inicializar';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

app.use('/api/configuracion', configuracionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/vistas', vistasRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/cargos', cargosRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/calendario', calendarioRoutes);
app.use('/api/novedades', novedadesRoutes);
app.use('/api/programacion', programacionRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/estados', estadosRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => res.send('Backend operativo ✅'));

const frontendPath = path.join(__dirname, '../frontend-build');

app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

async function iniciarServidor() {
  try {
    console.log('🔄 Verificando estructura de base de datos...');
    await verificarEstructuraBD();

    app.listen(PORT, () => {
      console.log(`🚀 SERVIDOR CORRIENDO\n📡 Puerto: ${PORT}\n🔗 URL: http://localhost:${PORT}`);
      console.log(`📂 Sirviendo Frontend desde: ${frontendPath}`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
}

iniciarServidor();

