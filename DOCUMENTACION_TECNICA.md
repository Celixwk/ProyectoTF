# 📘 Documentación Técnica Fullstack - Sistema de Nómina y Turnos

**Proyecto:** Sistema de Gestión de Nómina y Turnos (ProyectoTF)  
**Versión:** 2.0.0  
**Fecha de Actualización:** Diciembre 2025

---

## 📑 Tabla de Contenidos

1. [Descripción General del Sistema](#1-descripción-general-del-sistema)
2. [Backend: Arquitectura y Estructura](#2-backend-arquitectura-y-estructura)
3. [Backend: Modelo de Datos Completo](#3-backend-modelo-de-datos-completo)
4. [Backend: API Completa](#4-backend-api-completa)
5. [Backend: Lógica de Negocio](#5-backend-lógica-de-negocio)
6. [Frontend: Arquitectura y Estructura](#6-frontend-arquitectura-y-estructura)
7. [Frontend: Componentes y Vistas](#7-frontend-componentes-y-vistas)
8. [Frontend: Lógica y Flujos](#8-frontend-lógica-y-flujos)
9. [Integración Frontend-Backend](#9-integración-frontend-backend)
10. [Consideraciones Técnicas](#10-consideraciones-técnicas)
11. [Guía para Desarrolladores](#11-guía-para-desarrolladores)

---

## 1. DESCRIPCIÓN GENERAL DEL SISTEMA

### Propósito
El sistema tiene como objetivo gestionar integralmente la programación de turnos, cálculo de nómina, gestión de empleados y registro de novedades para una planta de producción. Automatiza el cálculo de recargos (nocturnos, dominicales, festivos) basado en la programación de turnos y las marcaciones reales.

### Arquitectura General
El sistema sigue una arquitectura **PERN Stack** (PostgreSQL, Express, React, Node.js) desacoplada:

*   **Frontend (SPA):** Aplicación React servida con Vite, que consume la API REST. Maneja la interfaz de usuario y el estado de la sesión.
*   **Backend (REST API):** Servidor Node.js con Express que expone endpoints JSON. Maneja la lógica de negocio, autenticación y conexión a datos.
*   **Base de Datos (Relacional):** PostgreSQL gestionada a través de Prisma ORM.

### Tecnologías Clave
*   **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI, Zustand (Estado), React Query (Data Fetching).
*   **Backend:** Node.js, Express, Prisma ORM, JWT (Auth), Bcrypt (Seguridad).
*   **Base de Datos:** PostgreSQL 15+.

### Flujo de Funcionamiento
1.  El **Usuario** interactúa con la interfaz (Web).
2.  El Frontend envía peticiones HTTP (Axios) con Token JWT al **Backend**.
3.  El Backend valida el token (Middleware), procesa la solicitud (Controller/Service) y consulta la **Base de Datos** (Prisma).
4.  La base de datos retorna los datos o confirma la transacción.
5.  El Backend responde con JSON al Frontend.
6.  El Frontend actualiza la vista.

---

## 2. BACKEND: ARQUITECTURA Y ESTRUCTURA

### Estructura de Directorios (`backend/src`)

*   `config/`: Configuraciones globales (DB conex, constantes).
*   `controllers/`: **Controladores**. Manejan la lógica de entrada/salida HTTP (req, res).
*   `middlewares/`: Interceptores para validar tokens (`auth`), errores, y validaciones de datos (`express-validator`).
*   `routes/`: Definición de endpoints y asociación con controladores.
*   `services/`: **Lógica de Negocio**. Contiene la lógica compleja separada del controlador.
*   `utils/`: Funciones auxiliares (formato de fechas, logs).
*   `prisma/`: Esquema de base de datos (`schema.prisma`) y migraciones.

### Patrones de Diseño
*   **MVC (Model-View-Controller):** Aunque es una API (sin Vistas HTML), separa Controlador (Handler) y Modelo (Prisma).
*   **Service Layer Pattern:** La lógica pesada (ej: cálculo de horas) reside en servicios, no en controladores.
*   **Repository Pattern (Implícito):** Prisma actúa como la capa de acceso a datos.

### Manejo de Errores
Se utiliza un middleware global de manejo de errores. Las excepciones en controladores se capturan con `try/catch` y se pasan al middleware mediante `next(error)`, estandarizando la respuesta JSON de error.

---

## 3. BACKEND: MODELO DE DATOS COMPLETO

La base de datos está normalizada y utiliza **PostgreSQL**.

### Entidades Principales

#### 👤 Empleado (`empleado`)
Almacena la información personal y laboral.
*   `id_empleado` (PK), `cedula` (Unique), `nombre1`, `apellido1`.
*   `id_cargo` (FK -> Cargo).
*   `areas_permitidas` (JSON): Lista de IDs de áreas donde puede trabajar.
*   **Relación:** 1 Cargo -> N Empleados.

#### 🏢 Cargo (`cargo`)
Define los roles y salarios base.
*   `id_cargo` (PK), `nombre_cargo`, `salario_base`.

#### 🏭 Área (`area`)
Zonas de trabajo (ej: Producción, Empaque).
*   `id_area` (PK), `nombre_area`.

#### 🕒 Turno (`turno`)
Configuración de horarios posibles.
*   `codigo` (ej: T1, T2), `hora_entrada`, `hora_salida`.
*   `tipo_turno` (Diurno, Nocturno).

#### 📅 Programación (`labor_mes` y `detalle_programacion`)
Eje central del cálculo.
*   **LaborMes (`labor_mes`):** Cabecera mensual por empleado. Relaciona `id_empleado` con un rango de fechas (`fecha_inicio`, `fecha_fin`). Almacena totales (`total_horas`, `total_recargos`).
*   **DetalleProgramacion (`detalle_programacion`):** El día a día. Relaciona `LaborMes`, `Turno` y `Area` para una `fecha` específica.
*   **Relación:** 1 LaborMes -> N Detalles (días del mes).

#### 💰 Recargos (`recargo` y `detalle_recargo`)
Resultados del cálculo de nómina.
*   **Recargo:** Cabecera de recargos calculados para un turno específico (`fk_id_detalle_turno`).
*   **DetalleRecargo:** Desglose específico (ej: 2 horas HED, 4 horas HEN). Relaciona con `TipoRecargo`.

#### ⚠️ Novedades (`novedad_empleado` y `tipo_novedad`)
Incidencias como incapacidades, permisos, vacaciones.
*   `id_novedad_registro`, `fecha_inicio`, `fecha_fin`, `estado`.

### Diagrama Relacional (Texto)
```mermaid
erDiagram
    Cargo ||--o{ Empleado : "tiene"
    Empleado ||--o{ LaborMes : "tiene reportes"
    Empleado ||--o{ NovedadEmpleado : "registra"
    Empleado ||--o{ Usuario : "accede como"
    LaborMes ||--o{ DetalleProgramacion : "contiene dias"
    DetalleProgramacion }o--|| Turno : "usa"
    DetalleProgramacion }o--|| Area : "en"
    DetalleProgramacion ||--o{ Recargo : "genera"
    Recargo ||--o{ DetalleRecargo : "desglosa"
    TipoRecargo ||--o{ DetalleRecargo : "define tipo"
```

---

## 4. BACKEND: API COMPLETA

La API es RESTful. Todos los endpoints inician con `/api`.

### Endpoints Principales

| Módulo | Método | Endpoint | Descripción |
|--------|--------|----------|-------------|
| **Auth** | POST | `/auth/login` | Inicia sesión y retorna JWT. |
| **Auth** | GET | `/auth/perfil` | Obtiene datos del usuario actual. |
| **Empleados** | GET | `/empleados` | Lista paginada de empleados. |
| **Empleados** | POST | `/empleados` | Crea un nuevo empleado. |
| **Empleados** | PUT | `/empleados/:id` | Actualiza un empleado. |
| **Turnos** | GET | `/turnos` | Lista turnos configurados. |
| **Programación** | GET | `/programacion/:anio/:mes` | Obtiene la parrilla de turnos mensual. |
| **Programación** | POST | `/programacion/generar` | Genera turnos automáticos (algoritmo). |
| **Programación** | PUT | `/programacion/turno` | Asigna/Cambia un turno manual a un empleado. |
| **Recargos** | POST | `/recargos/calcular` | Dispara el cálculo de horas extras/recargos. |
| **Novedades** | POST | `/novedades` | Registra una nueva novedad. |

### Ejemplo Request/Response (Login)

**Request:**
```json
POST /api/auth/login
{
  "usuario": "admin",
  "contrasenia": "123456"
}
```

**Response:**
```json
200 OK
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "usuario": { "nombre": "Admin", "rol": "administrador" }
}
```

---

## 5. BACKEND: LÓGICA DE NEGOCIO

### Reglas Clave
1.  **Cálculo de Recargos:** El sistema determina automáticamente si un turno cruza horario nocturno (ej: 9pm - 6am) o si cae en domingo/festivo, aplicando los porcentajes definidos en `TipoRecargo`.
2.  **Validación de Turnos:** No se puede asignar turno si el empleado tiene una novedad (incapacidad) en esa fecha.
3.  **Generación Automática:** Existe un algoritmo que intenta llenar el calendario respetando descansos y rotación de turnos (lógica compleja en servicio de programación).

---

## 6. FRONTEND: ARQUITECTURA Y ESTRUCTURA

### Estructura (`frontend/src`)

*   `components/`: Componentes UI reutilizables (Botones, Tablas, Inputs). Usa **Shadcn UI**.
*   `pages/`: Vistas completas (rutas).
*   `services/`: Capa de comunicación HTTP (`api.service.ts`).
*   `store/`: Estado global con **Zustand** (`authStore.ts` para usuario/token).
*   `hooks/`: Custom hooks (si aplica).
*   `lib/`: Utilidades (ej: `cn` para clases Tailwind).

### Manejo de Estado
*   **Global (Zustand):** Sesión de usuario, tema (oscuro/claro).
*   **Server State (React Query):** Caching de datos de la API (empleados, turnos). Evita re-fetching innecesario.
*   **Local:** `useState` para formularios simples o UI efímera.

---

## 7. FRONTEND: COMPONENTES Y VISTAS

### Vistas Principales (`src/pages`)

1.  **Dashboard:** Resumen métricas, gráficas de horas extras.
2.  **Programación (Grilla):** Tabla compleja tipo Excel donde filas=empleados, columnas=días. Permite asignar turnos con clic derecho/modal.
3.  **Empleados:** CRUD de empleados. Tabla con filtros y modal de creación.
4.  **Novedades:** Calendario o lista para registrar ausencias.
5.  **Turnos/Áreas:** Configuración de catálogos.

### Interacciones Clave
*   **Login:** Formulario con validación Zod. Guarda token en LocalStorage.
*   **Asignación de Turno:** Al hacer clic en una celda de la grilla de programación, se abre un popover para seleccionar el turno. Al confirmar, se llama a `PUT /programacion/turno` y se invalida la query de React Query para refrescar.

---

## 8. INTEGRACIÓN FRONT–BACK

### Comunicación
Se utiliza **Axios** configurado en `api.service.ts`.
*   **Interceptor Request:** Inyecta automáticamente el header `Authorization: Bearer <token>`.
*   **Interceptor Response:** Maneja errores globales (ej: si recibe 401, redirige al Login).

### Flujo de Datos
1.  Usuario entra a `/empleados`.
2.  React Query llama a `getEmpleados()`.
3.  Axios hace GET a API.
4.  Backend retorna Array JSON.
5.  React Query cachea y entrega data al componente.
6.  Componente renderiza Tabla.

---

## 9. GUÍA PARA DESARROLLADORES

### Requisitos Previos
*   Node.js v18+
*   PostgreSQL v15+

### Instalación y Ejecución

**1. Base de Datos:**
Crear base de datos en Postgres y configurar `.env` en `backend/`.
```bash
# backend/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/mi_db?schema=public"
JWT_SECRET="secreto_super_seguro"
```

**2. Backend:**
```bash
cd backend
npm install
npx prisma migrate dev  # Crea tablas
npm run dev             # Inicia en puerto 5000
```

**3. Frontend:**
```bash
cd frontend
npm install
npm run dev             # Inicia en puerto 5173
```

### Testing
*   **Backend:** Se recomienda usar Jest/Supertest (si está configurado) o probar manualmente con Postman/Insomnia importando la colección de rutas.
*   **Frontend:** Cypress o Vitest para componentes claves.

---

## 10. CONSIDERACIONES TÉCNICAS

### Seguridad
*   Contraseñas hasheadas con **Bcrypt**.
*   JWT con expiración para manejo de sesión.
*   CORS configurado para permitir solo origen del frontend.

### Futuras Mejoras
*   Implementar WebSockets para actualización en tiempo real de la parrilla de programación.
*   Agregar reportes exportables a PDF/Excel desde el Backend.
