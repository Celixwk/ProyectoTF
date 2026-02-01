# 🚀 Sistema de Nómina - Versión 2.0 (Arquitectura Simplificada)

Sistema integral de gestión de nómina con programación de turnos y cálculo automático de recargos.

## 🎯 ¿Por qué una nueva versión?

Esta es una **reescritura completa** del sistema anterior con una arquitectura simplificada:

### Mejoras principales:
- ✅ **Una sola base de datos** (PostgreSQL) en vez de dos (PostgreSQL + MongoDB)
- ✅ **Sin dependencias de Java** (eliminado OptaPlanner)
- ✅ **Código limpio** sin duplicaciones
- ✅ **Más fácil de mantener** y escalar
- ✅ **Deploy simplificado** - solo Node.js y PostgreSQL

## 📋 Stack Tecnológico

### Backend
- **Node.js** + Express
- **Prisma ORM** (PostgreSQL)
- **JWT** para autenticación
- **Bcrypt** para passwords

### Frontend
- **React 18** + TypeScript
- **Vite** (build rápido)
- **Tailwind CSS** + Shadcn/UI
- **Axios** para HTTP

### Base de Datos
- **PostgreSQL 14+**
- Includes: Views, Triggers, Auditoría

## 📁 Estructura del Proyecto

```
proyecto-nomina/
├── backend/                 # API REST
│   ├── src/
│   │   ├── config/         # Configuración de BD y app
│   │   ├── controllers/    # Lógica de endpoints
│   │   ├── services/       # Lógica de negocio
│   │   ├── routes/         # Definición de rutas
│   │   ├── middlewares/    # Auth, validación, etc
│   │   ├── prisma/         # Schema y migraciones
│   │   └── utils/          # Helpers y constantes
│   ├── package.json
│   └── .env.example
│
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/    # Componentes de UI
│   │   ├── pages/         # Páginas principales
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # Llamadas API
│   │   └── utils/         # Helpers
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                  # Documentación
│   ├── MIGRACION.md      # Guía de migración
│   ├── API.md            # Documentación de API
│   └── DATABASE.md       # Estructura de BD
│
└── README.md             # Este archivo
```

## 🚀 Inicio Rápido

### 1. Prerequisitos

- **Node.js** 18+ ([Descargar](https://nodejs.org/))
- **PostgreSQL** 14+ ([Descargar](https://www.postgresql.org/download/))
- **Git**

### 2. Clonar / Copiar el Proyecto

Si estás migrando del proyecto anterior, ya tienes esta carpeta en:
```
C:\Users\jccpp\Documents\proyecto-nomina\
```

### 3. Configurar Base de Datos

```bash
# Crear base de datos
createdb sistema_nomina

# O desde psql:
psql -U postgres
CREATE DATABASE sistema_nomina;
\q
```

### 4. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de entorno
copy .env.example .env

# Editar .env con tus credenciales
# DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/sistema_nomina"
```

### 5. Ejecutar Migraciones

```bash
# Desde backend/
npm run prisma:push
npm run prisma:generate
```

### 6. Iniciar Backend

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Debe mostrar:
# 🚀 Servidor corriendo en http://localhost:5000
```

### 7. Configurar e Iniciar Frontend

```bash
# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Debe mostrar:
# ➜  Local:   http://localhost:5173/
```

### 8. Abrir la Aplicación

Navega a: **http://localhost:5173**

## 🔑 Usuarios por Defecto

Después de la migración, puedes crear usuarios con:

```bash
cd backend
node src/scripts/crear-usuario.js
```

## 📊 Funcionalidades Principales

### ✅ Gestión de Empleados
- Crear, editar, eliminar empleados
- Asignar cargos y áreas permitidas
- Control de estado (activo/inactivo)

### ✅ Programación de Turnos
- Crear turnos personalizados
- Asignar empleados a turnos
- Visualización de calendario
- Exportar a Excel/PDF

### ✅ Cálculo de Recargos
- **Automático** al asignar turnos
- Tipos de recargos:
  - RNO: Recargo Nocturno Ordinario
  - RNF: Recargo Nocturno Festivo
  - D: Dominical
  - F: Festivo
  - HEOD: Hora Extra Ordinaria Diurna
  - HEON: Hora Extra Ordinaria Nocturna
  - HEFD: Hora Extra Festiva Diurna
  - HEFN: Hora Extra Festiva Nocturna

### ✅ Gestión de Novedades
- Incapacidades
- Vacaciones
- Permisos
- Licencias

### ✅ Reportes
- Resumen mensual por empleado
- Recargos por período
- Horas trabajadas
- Exportación a Excel

### ✅ Dashboard
- Métricas clave
- Gráficos de recargos
- Empleados activos
- Turnos del día

## 🔧 Comandos Útiles

### Backend

```bash
# Desarrollo con hot-reload
npm run dev

# Producción
npm start

# Prisma Studio (GUI de BD)
npm run prisma:studio

# Crear migración
npm run prisma:migrate

# Regenerar cliente Prisma
npm run prisma:generate
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 📚 Documentación Adicional

- [Guía de Migración](docs/MIGRACION.md) - Cómo migrar del proyecto anterior
- [Documentación de API](docs/API.md) - Endpoints disponibles
- [Estructura de Base de Datos](docs/DATABASE.md) - Schema y relaciones
- [Deployment](docs/DEPLOYMENT.md) - Desplegar a producción

## 🐛 Solución de Problemas

### Error: Puerto 5000 ya en uso

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Error: No se puede conectar a PostgreSQL

1. Verifica que PostgreSQL esté corriendo
2. Revisa las credenciales en `.env`
3. Verifica el puerto (default: 5432)

### Error: Prisma Client no generado

```bash
cd backend
npm run prisma:generate
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📝 Licencia

Este proyecto es propietario. Todos los derechos reservados.

## 👥 Equipo de Desarrollo

- Desarrollo: [Tu Nombre]
- Arquitectura: [Tu Nombre]

## 📧 Soporte

Para soporte técnico o preguntas:
- Email: soporte@tuempresa.com
- Issues: [GitHub Issues]

---

**Versión**: 2.0.0  
**Última actualización**: Noviembre 2025

