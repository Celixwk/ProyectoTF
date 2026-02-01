# 📚 Documentación API - Sistema de Nómina v2.0

## 📋 Información General

- **URL Base:** `http://localhost:5000`
- **Versión:** 2.0.0
- **Formato:** JSON
- **Autenticación:** JWT (JSON Web Tokens)
- **Charset:** UTF-8

---

## 🔐 Autenticación

La API utiliza **JWT (JSON Web Tokens)** para autenticación. La mayoría de los endpoints requieren un token válido.

### Obtener Token

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "usuario": "admin",
  "contrasenia": "admin123"
}
```

**Response (200 OK):**
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id_usuario": 1,
    "usuario": "admin",
    "nombre_completo": "Administrador del Sistema",
    "tipo_usuario": "administrador",
    "empleado": null
  }
}
```

### Usar el Token

Incluye el token en el header `Authorization` de tus peticiones:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo con curl:**
```bash
curl -H "Authorization: Bearer TU_TOKEN" http://localhost:5000/api/empleados
```

**Ejemplo con JavaScript:**
```javascript
fetch('http://localhost:5000/api/empleados', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

## 👥 Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **admin** | Administrador | Acceso total a todos los módulos |
| **supervisor** | Supervisor | Crear/editar empleados, turnos, novedades |
| **empleado** | Empleado | Solo lectura de su información |

---

## 📊 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Petición exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Error en los datos enviados |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - No tienes permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: registro duplicado) |
| 500 | Internal Server Error - Error del servidor |

---

## 📑 Módulos de la API

1. [Autenticación](#1-autenticación)
2. [Empleados](#2-empleados)
3. [Cargos](#3-cargos)
4. [Áreas](#4-áreas)
5. [Turnos](#5-turnos)
6. [Novedades](#6-novedades)
7. [Recargos](#7-recargos)
8. [Calendario](#8-calendario)
9. [Dashboard](#9-dashboard)
10. [Parametrización](#10-parametrización)

---

## 1. Autenticación

### 1.1 Iniciar Sesión
`POST /api/auth/login`

Autentica un usuario y devuelve un token JWT.

**Request:**
```json
{
  "usuario": "admin",
  "contrasenia": "admin123"
}
```

**Response (200):**
```json
{
  "mensaje": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id_usuario": 1,
    "usuario": "admin",
    "nombre_completo": "Administrador del Sistema",
    "tipo_usuario": "administrador"
  }
}
```

**Errores:**
- `401`: Credenciales inválidas
- `403`: Usuario inactivo

---

### 1.2 Obtener Perfil
`GET /api/auth/perfil`

Obtiene la información del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id_usuario": 1,
  "usuario": "admin",
  "nombre_completo": "Administrador del Sistema",
  "tipo_usuario": "administrador",
  "estado": true,
  "fecha_creacion": "2024-11-18T00:00:00.000Z",
  "empleado": null
}
```

---

### 1.3 Cambiar Contraseña
`PUT /api/auth/cambiar-contrasenia`

Permite al usuario cambiar su contraseña.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "contraseniaActual": "admin123",
  "contraseniaNueva": "nuevaContraseña123"
}
```

**Response (200):**
```json
{
  "mensaje": "Contraseña actualizada exitosamente"
}
```

**Validaciones:**
- La nueva contraseña debe tener mínimo 6 caracteres
- La contraseña actual debe ser correcta

---

### 1.4 Crear Usuario (Admin)
`POST /api/auth/usuarios`

Crea un nuevo usuario en el sistema.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "usuario": "supervisor1",
  "contrasenia": "password123",
  "tipo_usuario": "supervisor",
  "nombre_completo": "Juan Pérez",
  "id_empleado": 5
}
```

**Response (201):**
```json
{
  "mensaje": "Usuario creado exitosamente",
  "usuario": {
    "id_usuario": 2,
    "usuario": "supervisor1",
    "nombre_completo": "Juan Pérez",
    "tipo_usuario": "supervisor",
    "estado": true,
    "fecha_creacion": "2024-11-18T00:00:00.000Z"
  }
}
```

**Errores:**
- `409`: El nombre de usuario ya existe

---

### 1.5 Listar Usuarios (Admin)
`GET /api/auth/usuarios`

Lista todos los usuarios del sistema.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Response (200):**
```json
[
  {
    "id_usuario": 1,
    "usuario": "admin",
    "nombre_completo": "Administrador del Sistema",
    "tipo_usuario": "administrador",
    "estado": true,
    "fecha_creacion": "2024-11-18T00:00:00.000Z",
    "empleado": null
  }
]
```

---

### 1.6 Actualizar Estado de Usuario (Admin)
`PUT /api/auth/usuarios/:id/estado`

Activa o desactiva un usuario.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "estado": false
}
```

**Response (200):**
```json
{
  "mensaje": "Estado actualizado exitosamente",
  "usuario": {
    "id_usuario": 2,
    "usuario": "supervisor1",
    "nombre_completo": "Juan Pérez",
    "estado": false
  }
}
```

---

## 2. Empleados

### 2.1 Listar Empleados
`GET /api/empleados`

Lista todos los empleados con paginación y filtros.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `estado` (boolean): Filtrar por estado (true/false)
- `id_cargo` (number): Filtrar por cargo
- `busqueda` (string): Buscar por nombre o cédula
- `page` (number): Número de página (default: 1)
- `limit` (number): Registros por página (default: 50)

**Ejemplo:**
```
GET /api/empleados?estado=true&page=1&limit=20&busqueda=Juan
```

**Response (200):**
```json
{
  "empleados": [
    {
      "id_empleado": 1,
      "nombre1": "Juan",
      "nombre2": "Carlos",
      "apellido1": "Pérez",
      "apellido2": "González",
      "cedula": "1234567890",
      "edad": 30,
      "sexo": "M",
      "vehiculo": "ABC123",
      "estado": true,
      "id_cargo": 1,
      "areas_permitidas": [1, 2, 3],
      "created_at": "2024-11-18T00:00:00.000Z",
      "cargo": {
        "id_cargo": 1,
        "nombre_cargo": "Operario General",
        "salario_base": "1300000.00"
      }
    }
  ],
  "paginacion": {
    "total": 50,
    "pagina": 1,
    "limite": 20,
    "totalPaginas": 3
  }
}
```

---

### 2.2 Obtener Empleado por ID
`GET /api/empleados/:id`

Obtiene la información detallada de un empleado.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id_empleado": 1,
  "nombre1": "Juan",
  "nombre2": "Carlos",
  "apellido1": "Pérez",
  "apellido2": "González",
  "cedula": "1234567890",
  "edad": 30,
  "sexo": "M",
  "vehiculo": "ABC123",
  "estado": true,
  "id_cargo": 1,
  "areas_permitidas": [1, 2, 3],
  "created_at": "2024-11-18T00:00:00.000Z",
  "cargo": {
    "id_cargo": 1,
    "nombre_cargo": "Operario General",
    "salario_base": "1300000.00"
  },
  "usuario": {
    "id_usuario": 2,
    "usuario": "jperez",
    "tipo_usuario": "empleado",
    "estado": true
  }
}
```

**Errores:**
- `404`: Empleado no encontrado

---

### 2.3 Crear Empleado
`POST /api/empleados`

Crea un nuevo empleado en el sistema.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Request:**
```json
{
  "nombre1": "María",
  "nombre2": "Fernanda",
  "apellido1": "López",
  "apellido2": "Martínez",
  "cedula": "9876543210",
  "edad": 28,
  "sexo": "F",
  "vehiculo": "XYZ789",
  "id_cargo": 1,
  "areas_permitidas": [1, 2]
}
```

**Response (201):**
```json
{
  "mensaje": "Empleado creado exitosamente",
  "empleado": {
    "id_empleado": 2,
    "nombre1": "María",
    "apellido1": "López",
    "cedula": "9876543210",
    "estado": true,
    "cargo": {
      "nombre_cargo": "Operario General"
    }
  }
}
```

**Validaciones:**
- `nombre1`, `apellido1`, `cedula`, `id_cargo`: Requeridos
- `cedula`: Debe ser única
- `edad`: Entre 18 y 100 (opcional)
- `sexo`: 'M' o 'F' (opcional)

**Errores:**
- `409`: Ya existe un empleado con esa cédula

---

### 2.4 Actualizar Empleado
`PUT /api/empleados/:id`

Actualiza la información de un empleado.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Request:**
```json
{
  "edad": 31,
  "vehiculo": "ABC999",
  "areas_permitidas": [1, 2, 3, 4]
}
```

**Response (200):**
```json
{
  "mensaje": "Empleado actualizado exitosamente",
  "empleado": {
    "id_empleado": 1,
    "nombre1": "Juan",
    "apellido1": "Pérez",
    "edad": 31,
    "vehiculo": "ABC999"
  }
}
```

---

### 2.5 Eliminar/Desactivar Empleado
`DELETE /api/empleados/:id`

Desactiva un empleado (no lo elimina físicamente).

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Response (200):**
```json
{
  "mensaje": "Empleado desactivado exitosamente",
  "empleado": {
    "id_empleado": 1,
    "estado": false
  }
}
```

---

### 2.6 Obtener Empleados Activos
`GET /api/empleados/activos`

Obtiene una lista simplificada de empleados activos.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
[
  {
    "id_empleado": 1,
    "nombre1": "Juan",
    "nombre2": "Carlos",
    "apellido1": "Pérez",
    "apellido2": "González",
    "cedula": "1234567890",
    "nombre_completo": "Juan Carlos Pérez González",
    "cargo": {
      "nombre_cargo": "Operario General",
      "salario_base": "1300000.00"
    },
    "areas_permitidas": [1, 2, 3]
  }
]
```

---

## 3. Cargos

### 3.1 Listar Cargos
`GET /api/cargos`

Lista todos los cargos disponibles.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
[
  {
    "id_cargo": 1,
    "nombre_cargo": "Operario General",
    "salario_base": "1300000.00",
    "created_at": "2024-11-18T00:00:00.000Z",
    "_count": {
      "empleados": 15
    }
  }
]
```

---

### 3.2 Obtener Cargo por ID
`GET /api/cargos/:id`

Obtiene la información de un cargo específico con sus empleados.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id_cargo": 1,
  "nombre_cargo": "Operario General",
  "salario_base": "1300000.00",
  "created_at": "2024-11-18T00:00:00.000Z",
  "empleados": [
    {
      "id_empleado": 1,
      "nombre1": "Juan",
      "apellido1": "Pérez",
      "cedula": "1234567890"
    }
  ]
}
```

---

### 3.3 Crear Cargo
`POST /api/cargos`

Crea un nuevo cargo.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "nombre_cargo": "Supervisor de Producción",
  "salario_base": 2500000
}
```

**Response (201):**
```json
{
  "mensaje": "Cargo creado exitosamente",
  "cargo": {
    "id_cargo": 2,
    "nombre_cargo": "Supervisor de Producción",
    "salario_base": "2500000.00"
  }
}
```

**Validaciones:**
- `nombre_cargo`: Requerido
- `salario_base`: Requerido, debe ser número positivo

---

### 3.4 Actualizar Cargo
`PUT /api/cargos/:id`

Actualiza un cargo existente.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "salario_base": 2800000
}
```

**Response (200):**
```json
{
  "mensaje": "Cargo actualizado exitosamente",
  "cargo": {
    "id_cargo": 2,
    "nombre_cargo": "Supervisor de Producción",
    "salario_base": "2800000.00"
  }
}
```

---

### 3.5 Eliminar Cargo
`DELETE /api/cargos/:id`

Elimina un cargo del sistema.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Response (200):**
```json
{
  "mensaje": "Cargo eliminado exitosamente"
}
```

**Errores:**
- `400`: No se puede eliminar si hay empleados asignados

---

## 4. Áreas

### 4.1 Listar Áreas
`GET /api/areas`

Lista todas las áreas de trabajo.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
[
  {
    "id_area": 1,
    "nombre_area": "Producción",
    "created_at": "2024-11-18T00:00:00.000Z"
  }
]
```

---

### 4.2 Obtener Área por ID
`GET /api/areas/:id`

Obtiene información de un área específica.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id_area": 1,
  "nombre_area": "Producción",
  "created_at": "2024-11-18T00:00:00.000Z"
}
```

---

### 4.3 Crear Área
`POST /api/areas`

Crea una nueva área de trabajo.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "nombre_area": "Almacén"
}
```

**Response (201):**
```json
{
  "mensaje": "Área creada exitosamente",
  "area": {
    "id_area": 2,
    "nombre_area": "Almacén"
  }
}
```

---

### 4.4 Actualizar Área
`PUT /api/areas/:id`

Actualiza el nombre de un área.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "nombre_area": "Almacén General"
}
```

**Response (200):**
```json
{
  "mensaje": "Área actualizada exitosamente",
  "area": {
    "id_area": 2,
    "nombre_area": "Almacén General"
  }
}
```

---

### 4.5 Eliminar Área
`DELETE /api/areas/:id`

Elimina un área del sistema.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Response (200):**
```json
{
  "mensaje": "Área eliminada exitosamente"
}
```

**Errores:**
- `400`: No se puede eliminar si hay turnos asignados

---

## 5. Turnos

### 5.1 Listar Turnos
`GET /api/turnos`

Lista todos los turnos configurados.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `estado` (boolean): Filtrar por estado activo/inactivo

**Response (200):**
```json
[
  {
    "id_turno": 1,
    "codigo": "DIA",
    "hora_entrada": "1970-01-01T06:00:00.000Z",
    "hora_salida": "1970-01-01T14:00:00.000Z",
    "tipo_turno": "Diurno",
    "estado": true,
    "created_at": "2024-11-18T00:00:00.000Z"
  }
]
```

---

### 5.2 Obtener Turno por ID
`GET /api/turnos/:id`

Obtiene información de un turno específico.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id_turno": 1,
  "codigo": "DIA",
  "hora_entrada": "1970-01-01T06:00:00.000Z",
  "hora_salida": "1970-01-01T14:00:00.000Z",
  "tipo_turno": "Diurno",
  "estado": true
}
```

---

### 5.3 Crear Turno
`POST /api/turnos`

Crea un nuevo turno.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Request:**
```json
{
  "codigo": "MADRUGADA",
  "hora_entrada": "00:00:00",
  "hora_salida": "06:00:00",
  "tipo_turno": "Madrugada"
}
```

**Response (201):**
```json
{
  "mensaje": "Turno creado exitosamente",
  "turno": {
    "id_turno": 4,
    "codigo": "MADRUGADA",
    "hora_entrada": "1970-01-01T00:00:00.000Z",
    "hora_salida": "1970-01-01T06:00:00.000Z",
    "tipo_turno": "Madrugada",
    "estado": true
  }
}
```

**Validaciones:**
- Todos los campos son requeridos
- `codigo`: Debe ser único

**Errores:**
- `409`: Ya existe un turno con ese código

---

### 5.4 Asignar Turno a Empleado
`POST /api/turnos/asignar`

Asigna un turno a un empleado en una fecha específica.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Request:**
```json
{
  "id_empleado": 1,
  "id_turno": 1,
  "id_area": 1,
  "fecha": "2024-11-20",
  "fecha_inicio": "2024-11-01",
  "fecha_fin": "2024-11-30"
}
```

**Response (201):**
```json
{
  "mensaje": "Turno asignado exitosamente",
  "detalleProgramacion": {
    "id_detalle_turno": 1,
    "fecha": "2024-11-20T00:00:00.000Z",
    "id_area": 1,
    "total_horas_laboradas": 0,
    "turno": {
      "codigo": "DIA",
      "hora_entrada": "1970-01-01T06:00:00.000Z",
      "hora_salida": "1970-01-01T14:00:00.000Z"
    },
    "area": {
      "nombre_area": "Producción"
    }
  }
}
```

---

### 5.5 Obtener Turnos Asignados
`GET /api/turnos/asignados`

Lista los turnos que han sido asignados a empleados.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `id_empleado` (number): Filtrar por empleado
- `fecha_inicio` (date): Desde fecha
- `fecha_fin` (date): Hasta fecha
- `page` (number): Página
- `limit` (number): Registros por página

**Ejemplo:**
```
GET /api/turnos/asignados?id_empleado=1&fecha_inicio=2024-11-01&fecha_fin=2024-11-30
```

**Response (200):**
```json
{
  "turnosAsignados": [
    {
      "id_detalle_turno": 1,
      "fecha": "2024-11-20T00:00:00.000Z",
      "total_horas_laboradas": "8.00",
      "turno": {
        "codigo": "DIA",
        "hora_entrada": "1970-01-01T06:00:00.000Z",
        "hora_salida": "1970-01-01T14:00:00.000Z",
        "tipo_turno": "Diurno"
      },
      "area": {
        "nombre_area": "Producción"
      },
      "labor_mes": {
        "empleado": {
          "nombre1": "Juan",
          "apellido1": "Pérez",
          "cargo": {
            "nombre_cargo": "Operario General"
          }
        }
      }
    }
  ],
  "paginacion": {
    "total": 15,
    "pagina": 1,
    "limite": 100,
    "totalPaginas": 1
  }
}
```

---

### 5.6 Actualizar Turno
`PUT /api/turnos/:id`

Actualiza la información de un turno.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Request:**
```json
{
  "hora_entrada": "05:00:00",
  "hora_salida": "13:00:00"
}
```

**Response (200):**
```json
{
  "mensaje": "Turno actualizado exitosamente",
  "turno": {
    "id_turno": 1,
    "codigo": "DIA",
    "hora_entrada": "1970-01-01T05:00:00.000Z",
    "hora_salida": "1970-01-01T13:00:00.000Z"
  }
}
```

---

### 5.7 Eliminar/Desactivar Turno
`DELETE /api/turnos/:id`

Desactiva un turno.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Response (200):**
```json
{
  "mensaje": "Turno desactivado exitosamente",
  "turno": {
    "id_turno": 1,
    "estado": false
  }
}
```

---

## 6. Novedades

### 6.1 Listar Novedades
`GET /api/novedades`

Lista las novedades (incapacidades, vacaciones, permisos, etc.).

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `id_empleado` (number): Filtrar por empleado
- `etapa` (string): pendiente, aprobada, rechazada, completada
- `fecha_inicio` (date): Desde fecha
- `fecha_fin` (date): Hasta fecha
- `page` (number): Página
- `limit` (number): Registros por página

**Response (200):**
```json
{
  "novedades": [
    {
      "id_novedad_registro": 1,
      "fecha_solicitud": "2024-11-15T00:00:00.000Z",
      "fecha_registro": "2024-11-15T00:00:00.000Z",
      "fecha_vencimiento": "2024-11-20T00:00:00.000Z",
      "etapa": "pendiente",
      "empleado": {
        "id_empleado": 1,
        "nombre1": "Juan",
        "apellido1": "Pérez",
        "cargo": {
          "nombre_cargo": "Operario General"
        }
      },
      "usuario": {
        "nombre_completo": "Administrador del Sistema"
      },
      "detalle_novedad": [
        {
          "id_detalle_novedad": 1,
          "fecha": "2024-11-16T00:00:00.000Z",
          "cantidad": "1.00",
          "observaciones": "Incapacidad médica",
          "tipo_novedad": {
            "codigo": "INCAP",
            "nombre_novedad": "Incapacidad",
            "afecta_pago": true
          }
        }
      ]
    }
  ],
  "paginacion": {
    "total": 10,
    "pagina": 1,
    "limite": 50,
    "totalPaginas": 1
  }
}
```

---

### 6.2 Obtener Novedad por ID
`GET /api/novedades/:id`

Obtiene el detalle completo de una novedad.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id_novedad_registro": 1,
  "fecha_solicitud": "2024-11-15T00:00:00.000Z",
  "fecha_registro": "2024-11-15T00:00:00.000Z",
  "etapa": "pendiente",
  "empleado": {
    "nombre1": "Juan",
    "apellido1": "Pérez"
  },
  "detalle_novedad": [
    {
      "fecha": "2024-11-16T00:00:00.000Z",
      "cantidad": "1.00",
      "observaciones": "Incapacidad médica",
      "tipo_novedad": {
        "nombre_novedad": "Incapacidad"
      }
    }
  ]
}
```

---

### 6.3 Crear Novedad
`POST /api/novedades`

Registra una nueva novedad para un empleado.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Request:**
```json
{
  "id_empleado": 1,
  "fecha_solicitud": "2024-11-15",
  "fecha_registro": "2024-11-15",
  "fecha_vencimiento": "2024-11-20",
  "detalles": [
    {
      "id_novedad_tipo": 1,
      "fecha": "2024-11-16",
      "cantidad": 1,
      "observaciones": "Incapacidad médica general"
    }
  ]
}
```

**Response (201):**
```json
{
  "mensaje": "Novedad creada exitosamente",
  "novedad": {
    "id_novedad_registro": 1,
    "etapa": "pendiente",
    "empleado": {
      "nombre1": "Juan",
      "apellido1": "Pérez"
    },
    "detalle_novedad": [...]
  }
}
```

**Validaciones:**
- `detalles`: Debe incluir al menos un detalle

---

### 6.4 Actualizar Estado de Novedad
`PUT /api/novedades/:id/estado`

Cambia el estado de una novedad.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Request:**
```json
{
  "etapa": "aprobada"
}
```

**Valores permitidos para `etapa`:**
- `pendiente`
- `aprobada`
- `rechazada`
- `completada`

**Response (200):**
```json
{
  "mensaje": "Estado de novedad actualizado exitosamente",
  "novedad": {
    "id_novedad_registro": 1,
    "etapa": "aprobada"
  }
}
```

---

### 6.5 Eliminar Novedad
`DELETE /api/novedades/:id`

Elimina una novedad del sistema.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin o Supervisor

**Response (200):**
```json
{
  "mensaje": "Novedad eliminada exitosamente"
}
```

---

### 6.6 Listar Tipos de Novedad
`GET /api/novedades/tipos`

Lista los tipos de novedades disponibles.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
[
  {
    "id_novedad_tipo": 1,
    "codigo": "INCAP",
    "nombre_novedad": "Incapacidad",
    "afecta_pago": true
  },
  {
    "id_novedad_tipo": 2,
    "codigo": "VAC",
    "nombre_novedad": "Vacaciones",
    "afecta_pago": false
  }
]
```

---

## 7. Recargos

### 7.1 Listar Recargos
`GET /api/recargos`

Lista los recargos calculados.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `id_empleado` (number): Filtrar por empleado
- `fecha_inicio` (date): Desde fecha
- `fecha_fin` (date): Hasta fecha
- `page` (number): Página
- `limit` (number): Registros por página

**Response (200):**
```json
{
  "recargos": [
    {
      "id_recargo": 1,
      "total_horas": "5.50",
      "total_dinero": "125000.00",
      "dominicales": 0,
      "festivos": 0,
      "rno": "5.50",
      "rnf": "0.00",
      "heon": "0.00",
      "heod": "0.00",
      "hefd": "0.00",
      "hefn": "0.00",
      "fecha_inicio": "2024-11-01T00:00:00.000Z",
      "fecha_fin": "2024-11-30T00:00:00.000Z",
      "detalle_programacion": {
        "turno": {
          "codigo": "NOCHE"
        },
        "area": {
          "nombre_area": "Producción"
        },
        "labor_mes": {
          "empleado": {
            "nombre1": "Juan",
            "apellido1": "Pérez",
            "cargo": {
              "salario_base": "1300000.00"
            }
          }
        }
      },
      "detalle_recargo": [
        {
          "tipo_recargo": {
            "codigo": "RNO",
            "nombre_recargo": "Recargo Nocturno Ordinario",
            "porcentaje_recargo": "35.00"
          },
          "cantidad": "5.50",
          "valor_calculado": "125000.00"
        }
      ]
    }
  ],
  "paginacion": {
    "total": 25,
    "pagina": 1,
    "limite": 50,
    "totalPaginas": 1
  }
}
```

---

### 7.2 Obtener Recargo por ID
`GET /api/recargos/:id`

Obtiene el detalle completo de un recargo.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id_recargo": 1,
  "total_horas": "5.50",
  "total_dinero": "125000.00",
  "dominicales": 0,
  "festivos": 0,
  "rno": "5.50",
  "detalle_recargo": [...],
  "detalle_programacion": {...}
}
```

---

### 7.3 Calcular Recargos para un Turno
`POST /api/recargos/calcular/:id_detalle_turno`

Calcula automáticamente los recargos para un turno asignado.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "mensaje": "Recargos calculados exitosamente",
  "recargos": {
    "id_recargo": 1,
    "total_horas": "5.50",
    "total_dinero": "125000.00",
    "rno": "5.50",
    "rnf": "0.00",
    "dominicales": 0,
    "festivos": 0
  }
}
```

---

### 7.4 Obtener Resumen de Recargos por Empleado
`GET /api/recargos/resumen`

Obtiene un resumen consolidado de recargos de un empleado en un período.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters (Requeridos):**
- `id_empleado` (number): ID del empleado
- `fecha_inicio` (date): Fecha inicio del período
- `fecha_fin` (date): Fecha fin del período

**Ejemplo:**
```
GET /api/recargos/resumen?id_empleado=1&fecha_inicio=2024-11-01&fecha_fin=2024-11-30
```

**Response (200):**
```json
{
  "id_empleado": 1,
  "periodo": {
    "fecha_inicio": "2024-11-01",
    "fecha_fin": "2024-11-30"
  },
  "resumen": {
    "total_recargos_dinero": 850000,
    "total_horas_recargo": 45.5,
    "total_dominicales": 4,
    "total_festivos": 1,
    "desglose": {
      "rno": 25.5,
      "rnf": 8.0,
      "heon": 5.0,
      "heod": 3.0,
      "hefd": 2.0,
      "hefn": 2.0
    }
  },
  "cantidad_turnos": 22
}
```

---

### 7.5 Listar Tipos de Recargo
`GET /api/recargos/tipos`

Lista los tipos de recargos configurados.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
[
  {
    "id_tipo_recargo": 1,
    "codigo": "RNO",
    "nombre_recargo": "Recargo Nocturno Ordinario",
    "porcentaje_recargo": "35.00"
  },
  {
    "id_tipo_recargo": 2,
    "codigo": "RNF",
    "nombre_recargo": "Recargo Nocturno Festivo",
    "porcentaje_recargo": "110.00"
  },
  {
    "id_tipo_recargo": 3,
    "codigo": "D",
    "nombre_recargo": "Dominical",
    "porcentaje_recargo": "75.00"
  },
  {
    "id_tipo_recargo": 4,
    "codigo": "F",
    "nombre_recargo": "Festivo",
    "porcentaje_recargo": "75.00"
  },
  {
    "id_tipo_recargo": 5,
    "codigo": "HEOD",
    "nombre_recargo": "Hora Extra Ordinaria Diurna",
    "porcentaje_recargo": "25.00"
  },
  {
    "id_tipo_recargo": 6,
    "codigo": "HEON",
    "nombre_recargo": "Hora Extra Ordinaria Nocturna",
    "porcentaje_recargo": "75.00"
  },
  {
    "id_tipo_recargo": 7,
    "codigo": "HEFD",
    "nombre_recargo": "Hora Extra Festiva Diurna",
    "porcentaje_recargo": "100.00"
  },
  {
    "id_tipo_recargo": 8,
    "codigo": "HEFN",
    "nombre_recargo": "Hora Extra Festiva Nocturna",
    "porcentaje_recargo": "150.00"
  }
]
```

---

## 8. Calendario

### 8.1 Listar Calendario
`GET /api/calendario`

Lista los días del calendario (festivos y domingos).

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `anio` (number): Año a consultar
- `mes` (number): Mes a consultar (1-12)
- `es_festivo` (boolean): Solo festivos (true)

**Ejemplo:**
```
GET /api/calendario?anio=2024&mes=11
```

**Response (200):**
```json
[
  {
    "id_calendario": 1,
    "fecha": "2024-11-03T00:00:00.000Z",
    "es_festivo": false,
    "es_domingo": true,
    "nombre_festivo": null,
    "tipo_festivo": null
  },
  {
    "id_calendario": 2,
    "fecha": "2024-11-11T00:00:00.000Z",
    "es_festivo": true,
    "es_domingo": false,
    "nombre_festivo": "Día de la Independencia",
    "tipo_festivo": "nacional"
  }
]
```

---

### 8.2 Obtener Día del Calendario
`GET /api/calendario/:fecha`

Obtiene información de un día específico.

**Headers:** `Authorization: Bearer {token}`

**Ejemplo:**
```
GET /api/calendario/2024-11-11
```

**Response (200):**
```json
{
  "fecha": "2024-11-11T00:00:00.000Z",
  "es_festivo": true,
  "es_domingo": false,
  "nombre_festivo": "Día de la Independencia",
  "tipo_festivo": "nacional"
}
```

---

### 8.3 Crear Festivo
`POST /api/calendario/festivos`

Registra un nuevo día festivo.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "fecha": "2024-12-25",
  "nombre_festivo": "Navidad",
  "tipo_festivo": "nacional"
}
```

**Response (201):**
```json
{
  "mensaje": "Festivo registrado exitosamente",
  "festivo": {
    "id_calendario": 10,
    "fecha": "2024-12-25T00:00:00.000Z",
    "es_festivo": true,
    "nombre_festivo": "Navidad",
    "tipo_festivo": "nacional"
  }
}
```

---

### 8.4 Sincronizar Domingos del Año
`POST /api/calendario/sincronizar-domingos`

Registra automáticamente todos los domingos de un año.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "anio": 2025
}
```

**Response (200):**
```json
{
  "mensaje": "Sincronizados 52 domingos del año 2025",
  "cantidad": 52
}
```

---

### 8.5 Obtener Festivos del Año
`GET /api/calendario/festivos/:anio`

Lista todos los festivos de un año específico.

**Headers:** `Authorization: Bearer {token}`

**Ejemplo:**
```
GET /api/calendario/festivos/2024
```

**Response (200):**
```json
[
  {
    "id_calendario": 5,
    "fecha": "2024-01-01T00:00:00.000Z",
    "es_festivo": true,
    "nombre_festivo": "Año Nuevo",
    "tipo_festivo": "nacional"
  }
]
```

---

### 8.6 Eliminar Festivo
`DELETE /api/calendario/:fecha`

Elimina un día festivo del calendario.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Ejemplo:**
```
DELETE /api/calendario/2024-12-25
```

**Response (200):**
```json
{
  "mensaje": "Festivo eliminado exitosamente"
}
```

---

## 9. Dashboard

### 9.1 Obtener Estadísticas Generales
`GET /api/dashboard/estadisticas`

Obtiene estadísticas generales del sistema.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "empleados": {
    "total": 50,
    "activos": 45,
    "inactivos": 5
  },
  "configuracion": {
    "cargos": 5,
    "areas": 3,
    "turnos": 3
  },
  "operacion": {
    "turnosHoy": 15,
    "novedadesPendientes": 3,
    "recargosMesActual": 15750000.50
  }
}
```

---

### 9.2 Obtener Turnos del Día
`GET /api/dashboard/turnos-hoy`

Lista los turnos programados para el día actual.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
[
  {
    "id_detalle_turno": 1,
    "fecha": "2024-11-18T00:00:00.000Z",
    "turno": {
      "codigo": "DIA",
      "hora_entrada": "1970-01-01T06:00:00.000Z",
      "hora_salida": "1970-01-01T14:00:00.000Z",
      "tipo_turno": "Diurno"
    },
    "area": {
      "nombre_area": "Producción"
    },
    "labor_mes": {
      "empleado": {
        "nombre1": "Juan",
        "apellido1": "Pérez",
        "cargo": {
          "nombre_cargo": "Operario General"
        }
      }
    }
  }
]
```

---

### 9.3 Obtener Recargos por Mes (para gráficos)
`GET /api/dashboard/recargos-por-mes`

Obtiene datos agregados de recargos por mes para gráficos.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `anio` (number): Año a consultar (default: año actual)

**Ejemplo:**
```
GET /api/dashboard/recargos-por-mes?anio=2024
```

**Response (200):**
```json
{
  "anio": 2024,
  "recargosPorMes": [
    {
      "mes": 1,
      "nombreMes": "enero",
      "totalDinero": 1250000,
      "totalHoras": 345.5,
      "cantidadTurnos": 450
    },
    {
      "mes": 2,
      "nombreMes": "febrero",
      "totalDinero": 1180000,
      "totalHoras": 320.0,
      "cantidadTurnos": 420
    }
  ]
}
```

---

### 9.4 Obtener Empleados Más Activos
`GET /api/dashboard/empleados-activos`

Lista los empleados con más turnos asignados.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `limite` (number): Cantidad de empleados (default: 10)
- `mes` (number): Mes a consultar (opcional)
- `anio` (number): Año a consultar (opcional)

**Response (200):**
```json
[
  {
    "id_empleado": 1,
    "nombre_completo": "Juan Pérez",
    "nombre_cargo": "Operario General",
    "total_turnos": 22,
    "total_horas": 176,
    "total_recargos": 450000
  }
]
```

---

### 9.5 Obtener Distribución por Área
`GET /api/dashboard/distribucion-areas`

Muestra la distribución de turnos por área.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `mes` (number): Mes a consultar (default: mes actual)
- `anio` (number): Año a consultar (default: año actual)

**Response (200):**
```json
[
  {
    "id_area": 1,
    "nombre_area": "Producción",
    "total_turnos": 450,
    "empleados_unicos": 25
  },
  {
    "id_area": 2,
    "nombre_area": "Almacén",
    "total_turnos": 180,
    "empleados_unicos": 10
  }
]
```

---

### 9.6 Obtener Resumen de Novedades
`GET /api/dashboard/resumen-novedades`

Obtiene un resumen del estado de las novedades.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `mes` (number): Mes a consultar (opcional)
- `anio` (number): Año a consultar (opcional)

**Response (200):**
```json
{
  "total": 25,
  "pendientes": 3,
  "aprobadas": 18,
  "rechazadas": 2,
  "completadas": 2
}
```

---

## 10. Parametrización

### 10.1 Listar Parámetros
`GET /api/parametrizacion`

Lista todos los parámetros del sistema.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `categoria` (string): Filtrar por categoría
- `activo` (boolean): Filtrar por estado

**Response (200):**
```json
[
  {
    "id_parametro": 1,
    "nombre_parametro": "HORA_EXTRA_MAXIMA_DIA",
    "valor_numerico": "4.00",
    "valor_texto": null,
    "descripcion": "Horas extras máximas permitidas por día",
    "tipo_parametro": "numerico",
    "categoria": "recargos",
    "activo": true,
    "fecha_vigencia_inicio": null,
    "fecha_vigencia_fin": null
  }
]
```

---

### 10.2 Obtener Parámetro por ID
`GET /api/parametrizacion/:id`

Obtiene un parámetro específico por su ID.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "id_parametro": 1,
  "nombre_parametro": "HORA_EXTRA_MAXIMA_DIA",
  "valor_numerico": "4.00",
  "descripcion": "Horas extras máximas permitidas por día",
  "tipo_parametro": "numerico",
  "categoria": "recargos",
  "activo": true
}
```

---

### 10.3 Obtener Parámetro por Nombre
`GET /api/parametrizacion/nombre/:nombre`

Obtiene un parámetro por su nombre único.

**Headers:** `Authorization: Bearer {token}`

**Ejemplo:**
```
GET /api/parametrizacion/nombre/HORA_EXTRA_MAXIMA_DIA
```

**Response (200):**
```json
{
  "id_parametro": 1,
  "nombre_parametro": "HORA_EXTRA_MAXIMA_DIA",
  "valor_numerico": "4.00",
  "activo": true
}
```

---

### 10.4 Obtener Parámetros por Categoría
`GET /api/parametrizacion/categoria/:categoria`

Obtiene todos los parámetros de una categoría específica.

**Headers:** `Authorization: Bearer {token}`

**Ejemplo:**
```
GET /api/parametrizacion/categoria/recargos
```

**Response (200):**
```json
[
  {
    "id_parametro": 1,
    "nombre_parametro": "HORA_EXTRA_MAXIMA_DIA",
    "valor_numerico": "4.00",
    "categoria": "recargos",
    "activo": true
  }
]
```

---

### 10.5 Crear Parámetro
`POST /api/parametrizacion`

Crea un nuevo parámetro de configuración.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "nombre_parametro": "DIAS_VACACIONES_ANUALES",
  "valor_numerico": 15,
  "descripcion": "Días de vacaciones anuales por empleado",
  "tipo_parametro": "numerico",
  "categoria": "novedades"
}
```

**Response (201):**
```json
{
  "mensaje": "Parámetro creado exitosamente",
  "parametro": {
    "id_parametro": 2,
    "nombre_parametro": "DIAS_VACACIONES_ANUALES",
    "valor_numerico": "15.00",
    "activo": true
  }
}
```

**Validaciones:**
- `nombre_parametro`: Debe ser único
- `tipo_parametro`: Requerido

---

### 10.6 Actualizar Parámetro
`PUT /api/parametrizacion/:id`

Actualiza un parámetro existente.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Request:**
```json
{
  "valor_numerico": 20,
  "descripcion": "Días de vacaciones aumentados a 20"
}
```

**Response (200):**
```json
{
  "mensaje": "Parámetro actualizado exitosamente",
  "parametro": {
    "id_parametro": 2,
    "valor_numerico": "20.00"
  }
}
```

---

### 10.7 Activar/Desactivar Parámetro
`PUT /api/parametrizacion/:id/toggle`

Alterna el estado activo/inactivo de un parámetro.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Response (200):**
```json
{
  "mensaje": "Parámetro desactivado exitosamente",
  "parametro": {
    "id_parametro": 2,
    "activo": false
  }
}
```

---

### 10.8 Eliminar Parámetro
`DELETE /api/parametrizacion/:id`

Elimina un parámetro del sistema.

**Headers:** `Authorization: Bearer {token}`  
**Permiso:** Admin

**Response (200):**
```json
{
  "mensaje": "Parámetro eliminado exitosamente"
}
```

---

## 📝 Modelos de Datos

Ver archivo separado: [MODELOS.md](./MODELOS.md)

---

## 🔍 Ejemplos de Uso Completos

Ver archivo separado: [EJEMPLOS.md](./EJEMPLOS.md)

---

## ⚠️ Manejo de Errores

Todos los endpoints devuelven errores en el siguiente formato:

```json
{
  "error": "Descripción del error",
  "errores": [
    {
      "campo": "nombre_campo",
      "mensaje": "Descripción específica",
      "valor": "valor_recibido"
    }
  ]
}
```

**Errores Comunes:**

| Error | Causa | Solución |
|-------|-------|----------|
| Token inválido | Token JWT incorrecto | Verificar el token |
| Token expirado | Sesión vencida | Hacer login nuevamente |
| No tienes permisos | Rol insuficiente | Verificar permisos del usuario |
| Registro no encontrado | ID inexistente | Verificar que el ID sea correcto |
| Ya existe un registro | Violación de constraint único | Cambiar datos duplicados (ej: cédula) |

---

## 📞 Soporte

Para más información sobre la API:
- **Email:** soporte@sistema-nomina.com
- **Documentación adicional:** `/backend/docs/`

---

**Versión:** 2.0.0  
**Última actualización:** Noviembre 2024

