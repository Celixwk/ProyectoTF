# 📘 DOCUMENTACIÓN TÉCNICA INTEGRAL - SISTEMA DE NÓMINA Y TURNOS

**Versión:** 2.0.0  
**Fecha de Actualización:** Diciembre 2025  
**Proyecto:** Sistema de Gestión de Nómina y Turnos (ProyectoTF)

Este documento centraliza toda la información técnica del proyecto, desde la arquitectura de alto nivel hasta el detalle de cada tabla de base de datos y cada endpoint de la API.

---

## 📑 TABLA DE CONTENIDOS

1.  **DESCRIPCIÓN GENERAL DEL SISTEMA**
    *   Propósito y Alcance
    *   Arquitectura General (PERN Stack)
    *   Flujo de Datos
2.  **BACKEND: ARQUITECTURA DETALLADA**
    *   Estructura de Carpetas
    *   Patrones de Diseño (MVC, Services)
    *   Manejo de Errores y Validaciones
3.  **BASE DE DATOS: MODELO DE DATOS COMPLETO**
    *   Diagrama Relacional
    *   Diccionario de Datos (Todas las Tablas y Relaciones)
4.  **LÓGICA DE NEGOCIO**
    *   Algoritmo de Programación Automática
    *   Motor de Cálculo de Recargos
5.  **FRONTEND: ARQUITECTURA Y VISTAS**
    *   Estructura Vite + React
    *   Manejo de Estado (Global vs Server)
    *   Mapa de Componentes
6.  **REFERENCIA DE API (ENDPOINTS)**
    *   Autenticación, Empleados, Cargos, Áreas, Turnos, Novedades, Recargos, Calendario, Dashboard, Parametrización.
7.  **GUÍA PARA DESARROLLADORES**
    *   Instalación y Despliegue
    *   Testing

---

## 1. DESCRIPCIÓN GENERAL DEL SISTEMA

### Propósito
El **Sistema de Nómina y Turnos** es una plataforma web diseñada para gestionar la programación de operarios en una planta de producción, calcular automáticamente recargos (horas extras, nocturnas, festivos) y administrar novedades (incapacidades, vacaciones).

### Arquitectura General
El sistema utiliza una arquitectura **Fullstack Desacoplada** basada en el stack PERN:

*   **Frontend (SPA):** React 18 + TypeScript + Vite.
*   **Backend (API REST):** Node.js + Express.
*   **Base de Datos:** PostgreSQL 15+.
*   **ORM:** Prisma.

### Tecnologías Clave
| Capa | Tecnologías | Propósito |
|------|-------------|-----------|
| **Frontend** | React, Zustand, React Query, TailwindCSS, Shadcn UI | Interfaz reactiva, gestión de estado eficiente. |
| **Backend** | Express, JWT, Bcrypt, Morgan | API segura y documentada. |
| **Data** | PostgreSQL, Prisma ORM | Integridad referencial y acceso tipado a datos. |

---

## 2. BACKEND: ARQUITECTURA DETALLADA

### Estructura de Directorios (`backend/src`)
El backend organiza su código por capas de responsabilidad:

*   `config/`: Configuraciones de base de datos (`database.js`) y variables de entorno.
*   `controllers/`: **Controladores**. Puntos de entrada de la petición (Req/Res). Validan entrada y llaman al servicio.
    *   Ej: `programacion.controller.js` maneja la generación de turnos.
*   `middlewares/`: **Intermediarios**.
    *   `authMiddleware.js`: Verifica JWT.
    *   `errorHandler.js`: Captura excepciones globales.
*   `routes/`: **Rutas**. Definen los endpoints URL y su método HTTP.
*   `services/`: **Lógica Pura**. Contiene reglas de negocio complejas (ej: cálculo de horas).
*   `utils/`: Funciones auxiliares (helpers de fecha, formateadores).
*   `prisma/`: Definición del esquema de datos (`schema.prisma`).

### Flujo de Datos Interno
1.  **Request:** Llega a `server.js` -> `routes`.
2.  **Middleware:** Valida token y permisos.
3.  **Controller:** Recibe datos, llama al Service o Prisma.
4.  **Model (Prisma):** Ejecuta query SQL.
5.  **Response:** Controller devuelve JSON estandarizado.

---

## 3. BASE DE DATOS: MODELO DE DATOS COMPLETO

El diseño está normalizado para garantizar integridad. A continuación, el detalle exhaustivo de cada entidad.

### 👤 Entidades de Personal

#### `Cargo`
Roles y categorías salariales.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_cargo` | Int (PK) | Identificador único autoincremental. |
| `nombre_cargo` | String(100) | Nombre del puesto (ej: Operario). |
| `salario_base` | Decimal(12,2)| Sueldo base mensual. |
| `empleados` | Relation | Relación 1:N con Empleado. |

#### `Empleado`
Información del trabajador.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_empleado` | Int (PK) | Identificador único. |
| `cedula` | String(20) | Documento de identidad (Unique). |
| `nombre1`, `apellido1` | String | Nombres y apellidos. |
| `id_cargo` | Int (FK) | Relación con Cargo. |
| `areas_permitidas` | Json | Array de IDs de áreas donde puede rotar (`[1, 3]`). |
| `estado` | Boolean | True = Activo. |

#### `Usuario`
Credenciales de acceso al sistema.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | Int (PK) | ID único. |
| `usuario` | String(50) | Username para login. |
| `contrasenia` | String(255)| Hash Bcrypt. |
| `tipo_usuario` | String | 'admin', 'supervisor', 'empleado'. |
| `id_empleado` | Int (FK) | Relación 1:1 opcional con Empleado. |

### 🏭 Entidades de Operación

#### `Area`
Zonas físicas de trabajo.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_area` | Int (PK) | ID de área. |
| `nombre_area` | String | Ej: Producción, Empaque. |

#### `Turno`
Horarios predefinidos.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_turno` | Int (PK) | ID interno. |
| `codigo` | String(20) | Código corto (T1, T2, N1). Unique. |
| `hora_entrada` | Time | Hora inicio turno. |
| `hora_salida` | Time | Hora fin turno. |
| `tipo_turno` | String | 'Diurno', 'Nocturno'. |

### 📅 Entidades de Programación y Nómina

#### `LaborMes`
Cabecera mensual de labor por empleado.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Int (PK) | ID registro mensual. |
| `id_empleado` | Int (FK) | Empleado dueño del registro. |
| `fecha_inicio` | Date | Inicio del mes (01/MM/YYYY). |
| `total_horas` | Decimal | Acumulado de horas del mes. |
| `total_recargos` | Decimal | Acumulado de dinero en recargos. |

#### `DetalleProgramacion`
Asignación diaria (Turno x Día x Área).
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_detalle_turno`| Int (PK) | ID único del día programado. |
| `fecha` | Date | Fecha específica. |
| `fk_id_labor_mes` | Int (FK) | Relación con la cabecera mensual. |
| `fk_id_turno` | Int (FK) | Turno asignado (puede ser 'Descanso'). |
| `id_area` | Int (FK) | Área asignada. |
| `recargo` | Relation | Relación 1:N con Recargo. |

#### `Recargo`
Cálculo de horas extras/recargos para un turno.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_recargo` | Int (PK) | ID del cálculo. |
| `fk_id_detalle_turno`| Int (FK) | Turno que generó el recargo. |
| `total_dinero` | Decimal | Valor monetario total calculado. |
| `detalle_recargo` | Relation | Desglose por tipo (HED, HEN, etc). |

#### `DetalleRecargo`
Desglose específico.
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_recargo` | Int (FK) | Relación con Recargo padre. |
| `id_tipo_recargo` | Int (FK) | Tipo (ej: Dominical). |
| `cantidad` | Decimal | Horas calculadas. |
| `valor_calculado` | Decimal | (Cantidad * ValorHora * Porcentaje). |

### ⚠️ Entidades de Novedades

#### `NovedadEmpleado` (Cabecera), `DetalleNovedad` (Días), `TipoNovedad` (Catálogo).
Manejan las ausencias. Si existe novedad, bloquea la programación de turnos.

---

## 4. LÓGICA DE NEGOCIO

### Algoritmo de Programación Automática
Ubicación: `controllers/programacion.controller.js`

1.  **Entrada:** Mes/Año y (opcional) lista de descansos pre-asignados.
2.  **Validación:** Verifica que no exista programación previa para ese mes.
3.  **Balanceo de Áreas:** 
    *   Analiza `maximosPorAreaMap` vs empleados disponibles.
    *   Si hay déficit, intenta expandir las `areas_permitidas` de empleados con pocas áreas.
4.  **Asignación Diaria:**
    *   Itera por cada día del mes.
    *   Asigna turnos rotativos respetando `areas_permitidas` y balanceando carga.
    *   Asegura cobertura mínima por área.
5.  **Persistencia:** Crea registros en `labor_mes` y `detalle_programacion`.

### Motor de Cálculo de Recargos
Ubicación: `controllers/recargo.controller.js` y `services/calculoHoras.js`

1.  Toma un turno (`hora_entrada`, `hora_salida`) y una fecha.
2.  Determina intersección con horario nocturno (ej: 21:00 - 06:00).
3.  Consulta `Calendario` para saber si es domingo o festivo.
4.  Aplica reglas:
    *   **RNO:** Recargo Nocturno Ordinario (35%).
    *   **RNF:** Recargo Nocturno Festivo (110%).
    *   **Dominical/Festivo:** (75%).
5.  Calcula valores monetarios basados en el `salario_base` del cargo del empleado.

---

## 5. FRONTEND: ARQUITECTURA Y VISTAS

### Estructura
*   `src/pages/`: Contiene las vistas principales.
    *   **Dashboard**: Gráficos Recharts.
    *   **Programacion**: Grid compleja interactiva.
*   `src/components/`: UI Kit (Botones, Modales, Tablas).
*   `src/store/`: `authStore.ts` (Zustand) para sesión.
*   `src/services/`: `api.service.ts` (Instancia Axios).

### Manejo de Estado
*   **React Query:** Se usa para obtener y cachear datos del backend (`useQuery(['turnos'])`).
*   **Integración:** Al hacer un cambio (ej: asignar turno), se invalida la query para refrescar la vista automáticamente.

---

## 6. REFERENCIA DE API (ENDPOINTS)

Lista detallada de todos los endpoints disponibles.

### 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| POST | `/login` | Iniciar sesión | `{usuario, contrasenia}` |
| GET | `/perfil` | Datos usuario actual | Header Auth |
| PUT | `/cambiar-contrasenia` | Cambio de clave | `{contraseniaActual, contraseniaNueva}` |
| POST | `/usuarios` | (Admin) Crear usuario | `{usuario, contrasenia, role, id_empleado}` |
| GET | `/usuarios` | (Admin) Listar todos | - |

### 👤 Empleados (`/api/empleados`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| GET | `/` | Listar (paginado) | `?page=1&limit=50&busqueda=Juan` |
| GET | `/:id` | Detalle empleado | - |
| POST | `/` | Crear empleado | `{nombre1, apellido1, cedula, id_cargo, areas_permitidas...}` |
| PUT | `/:id` | Actualizar | `{vehiculo, areas_permitidas...}` |
| DELETE | `/:id` | Desactivar (Logico) | - |
| GET | `/activos` | Lista simple activos | - |

### 👔 Cargos (`/api/cargos`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| GET | `/` | Listar cargos | - |
| POST | `/` | Crear cargo | `{nombre_cargo, salario_base}` |
| PUT | `/:id` | Editar salario/nombre | - |

### 🏭 Áreas (`/api/areas`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| GET | `/` | Listar áreas | - |
| POST | `/` | Crear área | `{nombre_area}` |

### 🕒 Turnos (`/api/turnos`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| GET | `/` | Listar turnos config | - |
| POST | `/` | Crear turno config | `{codigo, hora_entrada, hora_salida}` |
| POST | `/asignar` | Asignar turno manual | `{id_empleado, id_turno, fecha}` |
| GET | `/asignados` | Ver turnos asignados | `?fecha_inicio=...&fecha_fin=...` |

### 📅 Programación (`/api/programacion`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| GET | `/:anio/:mes` | Obtener parrilla mensual | Retorna estructura anidada por empleado |
| POST | `/generar` | **Generar Automático** | `{mes, anio, maximos_por_area}` |
| DELETE | `/:anio/:mes` | Eliminar programación | - |

### 💰 Recargos (`/api/recargos`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| GET | `/` | Listar recargos calc. | - |
| POST | `/calcular/:id_turno` | Forzar cálculo turno | - |
| GET | `/resumen` | Resumen nómina emp. | `?id_empleado=1&fecha_inicio=...` |

### ⚠️ Novedades (`/api/novedades`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| GET | `/` | Listar novedades | - |
| POST | `/` | Registrar novedad | `{id_empleado, fechas, tipo}` |
| PUT | `/:id/estado` | Aprobar/Rechazar | `{etapa: 'aprobada'}` |

### 📆 Calendario (`/api/calendario`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| GET | `/` | Ver festivos mes | `?mes=12` |
| POST | `/festivos` | Crear festivo | `{fecha, nombre}` |
| POST | `/sincronizar-domingos`| Auto-crear domingos | `{anio: 2025}` |

### ⚙️ Parametrización (`/api/parametrizacion`)

| Método | Endpoint | Descripción | Body/Params |
|:------:|----------|-------------|-------------|
| GET | `/` | Listar parámetros | - |
| POST | `/` | Crear config global | `{nombre, valor}` |

---

## 7. GUÍA PARA DESARROLLADORES

### Levantar el Proyecto Localmente

1.  **Clonar y configurar BD:**
    Asegúrate de tener PostgreSQL corriendo.
    Crea un archivo `.env` en `/backend` con:
    ```env
    DATABASE_URL="postgresql://usuario:pass@localhost:5432/nomidb?schema=public"
    JWT_SECRET="tusecreto"
    PORT=5000
    ```

2.  **Backend:**
    ```bash
    cd backend
    npm install
    npx prisma migrate dev --name init  # Crea las tablas
    npm run dev                         # Inicia servidor
    ```

3.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev                         # Inicia Vite
    ```

### Extensión y Testing
*   **Agregar Nueva Tabla:** Editar `schema.prisma`, ejecutar `npx prisma migrate dev`, crear rutas y controladores.
*   **Tests:** Ejecutar `npm test` en backend (si hay tests configurados) o usar Postman importando la colección de rutas.

---
**Documentación generada automáticamente para ProyectoTF v2.0.0**
