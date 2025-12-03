# 📋 Resumen de Endpoints - API Sistema de Nómina

## 🌐 URL Base: `http://localhost:5000`

---

## 🔐 AUTENTICACIÓN (`/api/auth`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| POST | `/api/auth/login` | Iniciar sesión | ❌ | - |
| GET | `/api/auth/perfil` | Obtener perfil | ✅ | Todos |
| PUT | `/api/auth/cambiar-contrasenia` | Cambiar contraseña | ✅ | Todos |
| POST | `/api/auth/usuarios` | Crear usuario | ✅ | Admin |
| GET | `/api/auth/usuarios` | Listar usuarios | ✅ | Admin |
| PUT | `/api/auth/usuarios/:id/estado` | Activar/desactivar usuario | ✅ | Admin |

---

## 👥 EMPLEADOS (`/api/empleados`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/empleados` | Listar empleados | ✅ | Todos |
| GET | `/api/empleados/activos` | Empleados activos | ✅ | Todos |
| GET | `/api/empleados/:id` | Obtener empleado | ✅ | Todos |
| POST | `/api/empleados` | Crear empleado | ✅ | Admin/Supervisor |
| PUT | `/api/empleados/:id` | Actualizar empleado | ✅ | Admin/Supervisor |
| DELETE | `/api/empleados/:id` | Desactivar empleado | ✅ | Admin/Supervisor |

**Query Params (Listar):**
- `estado` (boolean): Filtrar por activo/inactivo
- `id_cargo` (number): Filtrar por cargo
- `busqueda` (string): Buscar por nombre/cédula
- `page` (number): Número de página
- `limit` (number): Registros por página

---

## 👔 CARGOS (`/api/cargos`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/cargos` | Listar cargos | ✅ | Todos |
| GET | `/api/cargos/:id` | Obtener cargo | ✅ | Todos |
| POST | `/api/cargos` | Crear cargo | ✅ | Admin |
| PUT | `/api/cargos/:id` | Actualizar cargo | ✅ | Admin |
| DELETE | `/api/cargos/:id` | Eliminar cargo | ✅ | Admin |

---

## 🏢 ÁREAS (`/api/areas`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/areas` | Listar áreas | ✅ | Todos |
| GET | `/api/areas/:id` | Obtener área | ✅ | Todos |
| POST | `/api/areas` | Crear área | ✅ | Admin |
| PUT | `/api/areas/:id` | Actualizar área | ✅ | Admin |
| DELETE | `/api/areas/:id` | Eliminar área | ✅ | Admin |

---

## ⏰ TURNOS (`/api/turnos`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/turnos` | Listar turnos | ✅ | Todos |
| GET | `/api/turnos/asignados` | Turnos asignados | ✅ | Todos |
| GET | `/api/turnos/:id` | Obtener turno | ✅ | Todos |
| POST | `/api/turnos` | Crear turno | ✅ | Admin/Supervisor |
| POST | `/api/turnos/asignar` | Asignar turno | ✅ | Admin/Supervisor |
| PUT | `/api/turnos/:id` | Actualizar turno | ✅ | Admin/Supervisor |
| DELETE | `/api/turnos/:id` | Desactivar turno | ✅ | Admin/Supervisor |

**Query Params (Listar):**
- `estado` (boolean): Filtrar por activo/inactivo

**Query Params (Asignados):**
- `id_empleado` (number): Filtrar por empleado
- `fecha_inicio` (date): Desde fecha
- `fecha_fin` (date): Hasta fecha
- `page`, `limit`: Paginación

---

## 📋 NOVEDADES (`/api/novedades`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/novedades` | Listar novedades | ✅ | Todos |
| GET | `/api/novedades/tipos` | Tipos de novedad | ✅ | Todos |
| GET | `/api/novedades/:id` | Obtener novedad | ✅ | Todos |
| POST | `/api/novedades` | Crear novedad | ✅ | Admin/Supervisor |
| PUT | `/api/novedades/:id/estado` | Cambiar estado | ✅ | Admin/Supervisor |
| DELETE | `/api/novedades/:id` | Eliminar novedad | ✅ | Admin/Supervisor |

**Etapas válidas:**
- `pendiente` - Esperando aprobación
- `aprobada` - Aprobada
- `rechazada` - Rechazada
- `completada` - Finalizada

---

## 💰 RECARGOS (`/api/recargos`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/recargos` | Listar recargos | ✅ | Todos |
| GET | `/api/recargos/tipos` | Tipos de recargo | ✅ | Todos |
| GET | `/api/recargos/resumen` | Resumen por empleado | ✅ | Todos |
| GET | `/api/recargos/:id` | Obtener recargo | ✅ | Todos |
| POST | `/api/recargos/calcular/:id_detalle_turno` | Calcular recargos | ✅ | Admin/Supervisor |

**Tipos de Recargo:**
- **RNO** - Recargo Nocturno Ordinario (35%)
- **RNF** - Recargo Nocturno Festivo (110%)
- **D** - Dominical (75%)
- **F** - Festivo (75%)
- **HEOD** - Hora Extra Ordinaria Diurna (25%)
- **HEON** - Hora Extra Ordinaria Nocturna (75%)
- **HEFD** - Hora Extra Festiva Diurna (100%)
- **HEFN** - Hora Extra Festiva Nocturna (150%)

---

## 📅 CALENDARIO (`/api/calendario`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/calendario` | Listar calendario | ✅ | Todos |
| GET | `/api/calendario/festivos/:anio` | Festivos del año | ✅ | Todos |
| GET | `/api/calendario/:fecha` | Obtener día | ✅ | Todos |
| POST | `/api/calendario/festivos` | Crear festivo | ✅ | Admin |
| POST | `/api/calendario/sincronizar-domingos` | Sincronizar domingos | ✅ | Admin |
| DELETE | `/api/calendario/:fecha` | Eliminar festivo | ✅ | Admin |

---

## 📊 DASHBOARD (`/api/dashboard`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/dashboard/estadisticas` | Estadísticas generales | ✅ | Todos |
| GET | `/api/dashboard/turnos-hoy` | Turnos del día | ✅ | Todos |
| GET | `/api/dashboard/recargos-por-mes` | Gráfico de recargos | ✅ | Todos |
| GET | `/api/dashboard/empleados-activos` | Top empleados | ✅ | Todos |
| GET | `/api/dashboard/distribucion-areas` | Distribución por área | ✅ | Todos |
| GET | `/api/dashboard/resumen-novedades` | Resumen de novedades | ✅ | Todos |

---

## ⚙️ PARAMETRIZACIÓN (`/api/parametrizacion`)

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/parametrizacion` | Listar parámetros | ✅ | Todos |
| GET | `/api/parametrizacion/categoria/:cat` | Por categoría | ✅ | Todos |
| GET | `/api/parametrizacion/nombre/:nombre` | Por nombre | ✅ | Todos |
| GET | `/api/parametrizacion/:id` | Obtener parámetro | ✅ | Todos |
| POST | `/api/parametrizacion` | Crear parámetro | ✅ | Admin |
| PUT | `/api/parametrizacion/:id` | Actualizar parámetro | ✅ | Admin |
| PUT | `/api/parametrizacion/:id/toggle` | Activar/desactivar | ✅ | Admin |
| DELETE | `/api/parametrizacion/:id` | Eliminar parámetro | ✅ | Admin |

---

## 📊 Resumen por Método HTTP

| Método | Cantidad | Uso |
|--------|----------|-----|
| GET | 35 | Consultar datos |
| POST | 15 | Crear registros |
| PUT | 8 | Actualizar registros |
| DELETE | 5 | Eliminar/desactivar |
| **TOTAL** | **63** | **endpoints** |

---

## 🎯 Endpoints Más Usados

### Para el Frontend

1. `POST /api/auth/login` - Autenticación
2. `GET /api/empleados/activos` - Lista de empleados
3. `GET /api/turnos` - Lista de turnos
4. `POST /api/turnos/asignar` - Asignar turnos
5. `GET /api/dashboard/estadisticas` - Datos del dashboard
6. `GET /api/recargos/resumen` - Resumen de recargos
7. `GET /api/calendario/festivos/:anio` - Festivos
8. `GET /api/dashboard/turnos-hoy` - Turnos del día

---

## 🔄 Flujos Principales

### Flujo 1: Autenticación
```
1. POST /api/auth/login
2. Guardar token
3. Usar token en header de todas las peticiones
```

### Flujo 2: Crear y Asignar Empleado
```
1. GET /api/cargos (obtener cargos disponibles)
2. POST /api/empleados (crear empleado)
3. POST /api/turnos/asignar (asignar turno)
4. GET /api/dashboard/turnos-hoy (verificar)
```

### Flujo 3: Registrar Novedad
```
1. GET /api/novedades/tipos (tipos disponibles)
2. POST /api/novedades (crear novedad)
3. PUT /api/novedades/:id/estado (aprobar/rechazar)
```

### Flujo 4: Consultar Recargos
```
1. GET /api/recargos/resumen?id_empleado=X&fecha_inicio=Y&fecha_fin=Z
2. GET /api/recargos?id_empleado=X (detalles)
3. GET /api/recargos/:id (recargo específico)
```

---

## 📝 Campos Comunes

### Request Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Paginación (Response)
```json
{
  "paginacion": {
    "total": 100,
    "pagina": 1,
    "limite": 50,
    "totalPaginas": 2
  }
}
```

### Error (Response)
```json
{
  "error": "Descripción del error",
  "errores": [
    {
      "campo": "cedula",
      "mensaje": "La cédula es requerida",
      "valor": null
    }
  ]
}
```

---

## ⚡ Comandos Rápidos

### Iniciar servidor
```bash
npm run dev
```

### Probar API
```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","contrasenia":"admin123"}'

# Tests automáticos (PowerShell)
.\test-api.ps1
```

### Ver base de datos
```bash
npm run prisma:studio
```

---

## 🎓 Más Información

- **Documentación completa:** `/backend/docs/API_DOCUMENTACION.md`
- **Ejemplos de código:** `/backend/docs/EJEMPLOS.md`
- **Modelos de datos:** `/backend/docs/MODELOS.md`
- **Guía de pruebas:** `/backend/docs/PRUEBAS_RAPIDAS.md`

---

**Total de Endpoints:** 63  
**Módulos:** 10  
**Estado:** ✅ Completamente Funcional

