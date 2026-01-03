import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { capa6_generarProgramacionDia } from './services/programacion/capa6.integracion';
import configuracionRoutes from './routes/configuracion.routes';
import dashboardRoutes from './routes/dashboard.routes';
import empleadosRoutes from './routes/empleados.routes';
import vistasRoutes from './routes/vista.routes';
import turnosRoutes from './routes/turnos.routes';
import cargosRoutes from './routes/cargos.routes';
import areasRoutes from './routes/areas.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/configuracion', configuracionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/vistas', vistasRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/cargos', cargosRoutes);
app.use('/api/areas', areasRoutes);

app.post('/api/programacion/generar', async (req, res) => {
  try {
    const { fecha } = req.body;
    if (!fecha) return res.status(400).json({ error: "Falta la fecha" });
    const resultado = await capa6_generarProgramacionDia(new Date(fecha));
    res.json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => res.send('Backend operativo ✅'));

app.listen(PORT, () => {
  console.log(`🚀 SERVIDOR CORRIENDO\n📡 Puerto: ${PORT}\n🔗 URL: http://localhost:${PORT}`);
});