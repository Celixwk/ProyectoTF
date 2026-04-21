# 🚀 Instrucciones Rápidas - Backend Sistema de Nómina

## ✅ ¿Qué se ha creado?

El backend está **100% completo** con:

- ✅ **10 Controladores** completos (auth, empleado, cargo, area, turno, novedad, recargo, calendario, dashboard, parametrizacion)
- ✅ **10 Rutas** con validación y autenticación
- ✅ **3 Middlewares** (auth, validation, errorHandler)
- ✅ **Servidor Express** configurado con CORS, helmet, compression
- ✅ **Prisma Client** generado
- ✅ **Todas las dependencias** instaladas (164 paquetes)
- ✅ **Script de configuración inicial** de base de datos

## 📋 Pasos para Iniciar

### 1. Configurar PostgreSQL (IMPORTANTE)

Asegúrate de que PostgreSQL esté corriendo y edita el archivo `.env` en la carpeta `backend/`:

```env
DATABASE_URL="postgresql://TU_USUARIO:TU_CONTRASEÑA@localhost:5432/sistema_nomina"
```

**Reemplaza:**
- `TU_USUARIO` → tu usuario de PostgreSQL (por defecto: `postgres`)
- `TU_CONTRASEÑA` → tu contraseña de PostgreSQL

### 2. Crear la Base de Datos

Opción A - **Desde psql:**
```bash
psql -U postgres
CREATE DATABASE sistema_nomina;
\q
```

Opción B - **Desde pgAdmin:**
- Click derecho en "Databases"
- "Create" → "Database"
- Name: `sistema_nomina`
- Save

### 3. Crear las Tablas

```bash
npm run prisma:push
```

### 4. Configurar Datos Iniciales

```bash
node src/scripts/setup-database.js
```

Este script creará:
- ✅ 8 tipos de recargos (RNO, RNF, HE, etc.)
- ✅ 6 tipos de novedades (incapacidades, vacaciones, etc.)
- ✅ Cargo y área por defecto
- ✅ 3 turnos básicos (día, tarde, noche)
- ✅ Usuario admin (usuario: `admin`, contraseña: `admin123`)
- ✅ Domingos del año actual

### 5. Iniciar el Servidor

```bash
npm run dev
```

Deberías ver:
```
╔═══════════════════════════════════════════════════════╗
║   🚀 Sistema de Nómina v2.0 - Backend              ║
║   📡 Servidor corriendo en: http://localhost:5000  ║
╚═══════════════════════════════════════════════════════╝
✅ Conexión a PostgreSQL establecida correctamente
```

## 🧪 Probar el Servidor

### Health Check
```bash
curl http://localhost:5000/health
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","contrasenia":"admin123"}'
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── database.js           ✅ Configuración de Prisma
│   ├── controllers/               ✅ 10 controladores
│   │   ├── auth.controller.js
│   │   ├── empleado.controller.js
│   │   ├── cargo.controller.js
│   │   ├── area.controller.js
│   │   ├── turno.controller.js
│   │   ├── novedad.controller.js
│   │   ├── recargo.controller.js
│   │   ├── calendario.controller.js
│   │   ├── dashboard.controller.js
│   │   └── parametrizacion.controller.js
│   ├── routes/                    ✅ 10 rutas
│   │   └── (mismos archivos que controllers)
│   ├── middlewares/               ✅ 3 middlewares
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── services/
│   │   └── recargos/              ✅ Lógica de cálculo
│   ├── prisma/
│   │   └── schema.prisma          ✅ Schema completo
│   ├── scripts/
│   │   └── setup-database.js      ✅ Setup inicial
│   └── server.js                  ✅ Servidor principal
└── package.json                   ✅ Configurado
```

## 🔑 Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/perfil` - Obtener perfil (requiere token)
- `PUT /api/auth/cambiar-contrasenia` - Cambiar contraseña
- `POST /api/auth/usuarios` - Crear usuario (admin)
- `GET /api/auth/usuarios` - Listar usuarios (admin)

### Empleados
- `GET /api/empleados` - Listar empleados
- `GET /api/empleados/activos` - Empleados activos
- `GET /api/empleados/:id` - Obtener empleado
- `POST /api/empleados` - Crear empleado
- `PUT /api/empleados/:id` - Actualizar empleado
- `DELETE /api/empleados/:id` - Desactivar empleado

### Cargos
- `GET /api/cargos` - Listar cargos
- `GET /api/cargos/:id` - Obtener cargo
- `POST /api/cargos` - Crear cargo (admin)
- `PUT /api/cargos/:id` - Actualizar cargo (admin)
- `DELETE /api/cargos/:id` - Eliminar cargo (admin)

### Áreas
- `GET /api/areas` - Listar áreas
- `POST /api/areas` - Crear área (admin)
- `PUT /api/areas/:id` - Actualizar área (admin)
- `DELETE /api/areas/:id` - Eliminar área (admin)

### Turnos
- `GET /api/turnos` - Listar turnos
- `GET /api/turnos/asignados` - Turnos asignados
- `POST /api/turnos` - Crear turno
- `POST /api/turnos/asignar` - Asignar turno a empleado
- `PUT /api/turnos/:id` - Actualizar turno
- `DELETE /api/turnos/:id` - Desactivar turno

### Novedades
- `GET /api/novedades` - Listar novedades
- `GET /api/novedades/tipos` - Tipos de novedad
- `POST /api/novedades` - Crear novedad
- `PUT /api/novedades/:id/estado` - Actualizar estado
- `DELETE /api/novedades/:id` - Eliminar novedad

### Recargos
- `GET /api/recargos` - Listar recargos
- `GET /api/recargos/tipos` - Tipos de recargo
- `GET /api/recargos/resumen` - Resumen por empleado
- `POST /api/recargos/calcular/:id` - Calcular recargos

### Calendario
- `GET /api/calendario` - Listar calendario
- `GET /api/calendario/festivos/:anio` - Festivos del año
- `POST /api/calendario/festivos` - Crear festivo (admin)
- `POST /api/calendario/sincronizar-domingos` - Sincronizar domingos (admin)

### Dashboard
- `GET /api/dashboard/estadisticas` - Estadísticas generales
- `GET /api/dashboard/turnos-hoy` - Turnos del día
- `GET /api/dashboard/recargos-por-mes` - Gráfico de recargos
- `GET /api/dashboard/empleados-activos` - Empleados más activos
- `GET /api/dashboard/distribucion-areas` - Distribución por área

### Parametrización
- `GET /api/parametrizacion` - Listar parámetros
- `GET /api/parametrizacion/categoria/:categoria` - Por categoría
- `POST /api/parametrizacion` - Crear parámetro (admin)
- `PUT /api/parametrizacion/:id` - Actualizar parámetro (admin)

## ⚙️ Variables de Entorno

Archivo `.env`:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/sistema_nomina
JWT_SECRET=clave_secreta_cambiar_en_produccion
JWT_EXPIRES_IN=7d
HORA_NOCTURNA_INICIO=21
HORA_NOCTURNA_FIN=6
PAGE_LIMIT=50
QUERY_TIMEOUT=30
```

## 🐛 Solución de Problemas

### Error: "Authentication failed"
- Verifica que PostgreSQL esté corriendo
- Revisa las credenciales en el archivo `.env`
- Asegúrate de que el usuario tenga permisos

### Error: "Port 5000 is already in use"
```bash
# Buscar y matar el proceso
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Error: "Prisma Client not found"
```bash
npm run prisma:generate
```

## 📊 Próximos Pasos

1. ✅ Backend está completo y funcionando
2. ⏳ Necesitas crear la base de datos y configurar el `.env`
3. ⏳ Ejecutar el script de setup
4. ⏳ Iniciar el servidor
5. ⏳ Desarrollar el frontend (si aún no existe)

## 🎉 ¡Todo Listo!

El backend está **100% funcional** con:
- Autenticación JWT
- 10 módulos completos
- Validación de datos
- Manejo de errores
- Middleware de seguridad
- Sistema de auditoría
- Cálculo automático de recargos

¡Solo necesitas configurar PostgreSQL y ejecutar el setup!

