"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Importación de rutas
const configuracion_routes_1 = __importDefault(require("./routes/configuracion.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const empleados_routes_1 = __importDefault(require("./routes/empleados.routes"));
const vista_routes_1 = __importDefault(require("./routes/vista.routes"));
const turnos_routes_1 = __importDefault(require("./routes/turnos.routes"));
const cargos_routes_1 = __importDefault(require("./routes/cargos.routes"));
const areas_routes_1 = __importDefault(require("./routes/areas.routes"));
const calendario_routes_1 = __importDefault(require("./routes/calendario.routes"));
const novedades_routes_1 = __importDefault(require("./routes/novedades.routes"));
const programacion_routes_1 = __importDefault(require("./routes/programacion.routes"));
const alertas_routes_1 = __importDefault(require("./routes/alertas.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use((0, morgan_1.default)('dev'));
// Rutas de API
app.use('/api/configuracion', configuracion_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/empleados', empleados_routes_1.default);
app.use('/api/vistas', vista_routes_1.default);
app.use('/api/turnos', turnos_routes_1.default);
app.use('/api/cargos', cargos_routes_1.default);
app.use('/api/areas', areas_routes_1.default);
app.use('/api/calendario', calendario_routes_1.default);
app.use('/api/novedades', novedades_routes_1.default);
app.use('/api/programacion', programacion_routes_1.default);
app.use('/api/alertas', alertas_routes_1.default);
app.get('/health', (req, res) => res.send('Backend operativo ✅'));
const frontendPath = path_1.default.join(__dirname, '../frontend-build');
app.use(express_1.default.static(frontendPath));
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path_1.default.join(frontendPath, 'index.html'));
    }
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SERVIDOR CORRIENDO`);
    console.log(`📡 Puerto: ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`📂 Sirviendo Frontend desde: ${frontendPath}`);

    console.log('✅ Express está ESCUCHANDO y LISTO');
});
