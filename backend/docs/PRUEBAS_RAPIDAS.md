# 🧪 Pruebas Rápidas - API Sistema de Nómina

Esta guía te ayudará a probar rápidamente todos los endpoints de la API.

---

## 🚀 Requisitos Previos

1. ✅ Servidor corriendo en `http://localhost:5000`
2. ✅ Base de datos configurada
3. ✅ Usuario admin creado (`admin` / `admin123`)

---

## 🔧 Herramientas Recomendadas

- **Postman**: [Descargar](https://www.postman.com/downloads/)
- **Thunder Client** (VS Code Extension)
- **cURL** (línea de comandos)
- **REST Client** (VS Code Extension)

---

## 📝 Collection para Postman/Thunder Client

### 1. Configurar Variable de Entorno

En Postman/Thunder Client, crea estas variables:

```
baseURL: http://localhost:5000
token: (se llenará después del login)
```

---

## 🔐 Paso 1: Autenticación

### Login

**Request:**
```http
POST {{baseURL}}/api/auth/login
Content-Type: application/json

{
  "usuario": "admin",
  "contrasenia": "admin123"
}
```

**Response Esperado:**
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

**✅ Acción:** Copia el `token` y guárdalo en la variable `{{token}}`

---

## 👥 Paso 2: Gestión de Empleados

### 2.1 Listar Empleados

```http
GET {{baseURL}}/api/empleados?page=1&limit=10
Authorization: Bearer {{token}}
```

### 2.2 Crear Empleado

```http
POST {{baseURL}}/api/empleados
Authorization: Bearer {{token}}
Content-Type: application/json

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
  "areas_permitidas": [1]
}
```

### 2.3 Obtener Empleado

```http
GET {{baseURL}}/api/empleados/1
Authorization: Bearer {{token}}
```

### 2.4 Actualizar Empleado

```http
PUT {{baseURL}}/api/empleados/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "edad": 31,
  "vehiculo": "ABC999"
}
```

### 2.5 Obtener Empleados Activos

```http
GET {{baseURL}}/api/empleados/activos
Authorization: Bearer {{token}}
```

---

## 👔 Paso 3: Gestión de Cargos

### 3.1 Listar Cargos

```http
GET {{baseURL}}/api/cargos
Authorization: Bearer {{token}}
```

### 3.2 Crear Cargo

```http
POST {{baseURL}}/api/cargos
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre_cargo": "Supervisor de Producción",
  "salario_base": 2500000
}
```

### 3.3 Actualizar Salario

```http
PUT {{baseURL}}/api/cargos/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "salario_base": 2800000
}
```

---

## 🏢 Paso 4: Gestión de Áreas

### 4.1 Listar Áreas

```http
GET {{baseURL}}/api/areas
Authorization: Bearer {{token}}
```

### 4.2 Crear Área

```http
POST {{baseURL}}/api/areas
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre_area": "Almacén"
}
```

---

## ⏰ Paso 5: Gestión de Turnos

### 5.1 Listar Turnos

```http
GET {{baseURL}}/api/turnos
Authorization: Bearer {{token}}
```

### 5.2 Crear Turno

```http
POST {{baseURL}}/api/turnos
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "codigo": "MADRUGADA",
  "hora_entrada": "00:00:00",
  "hora_salida": "06:00:00",
  "tipo_turno": "Madrugada"
}
```

### 5.3 Asignar Turno a Empleado

```http
POST {{baseURL}}/api/turnos/asignar
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "id_empleado": 1,
  "id_turno": 1,
  "id_area": 1,
  "fecha": "2024-11-20",
  "fecha_inicio": "2024-11-01",
  "fecha_fin": "2024-11-30"
}
```

### 5.4 Consultar Turnos Asignados

```http
GET {{baseURL}}/api/turnos/asignados?id_empleado=1&fecha_inicio=2024-11-01&fecha_fin=2024-11-30
Authorization: Bearer {{token}}
```

---

## 📋 Paso 6: Gestión de Novedades

### 6.1 Listar Tipos de Novedad

```http
GET {{baseURL}}/api/novedades/tipos
Authorization: Bearer {{token}}
```

### 6.2 Crear Novedad (Incapacidad)

```http
POST {{baseURL}}/api/novedades
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "id_empleado": 1,
  "fecha_solicitud": "2024-11-18",
  "fecha_registro": "2024-11-18",
  "fecha_vencimiento": "2024-11-22",
  "detalles": [
    {
      "id_novedad_tipo": 1,
      "fecha": "2024-11-19",
      "cantidad": 3,
      "observaciones": "Incapacidad médica por gripe"
    }
  ]
}
```

### 6.3 Listar Novedades Pendientes

```http
GET {{baseURL}}/api/novedades?etapa=pendiente&page=1&limit=20
Authorization: Bearer {{token}}
```

### 6.4 Aprobar Novedad

```http
PUT {{baseURL}}/api/novedades/1/estado
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "etapa": "aprobada"
}
```

---

## 💰 Paso 7: Recargos

### 7.1 Listar Tipos de Recargo

```http
GET {{baseURL}}/api/recargos/tipos
Authorization: Bearer {{token}}
```

### 7.2 Calcular Recargos de un Turno

```http
POST {{baseURL}}/api/recargos/calcular/1
Authorization: Bearer {{token}}
```

### 7.3 Obtener Resumen de Recargos

```http
GET {{baseURL}}/api/recargos/resumen?id_empleado=1&fecha_inicio=2024-11-01&fecha_fin=2024-11-30
Authorization: Bearer {{token}}
```

### 7.4 Listar Recargos con Filtros

```http
GET {{baseURL}}/api/recargos?id_empleado=1&fecha_inicio=2024-11-01&fecha_fin=2024-11-30&page=1&limit=50
Authorization: Bearer {{token}}
```

---

## 📅 Paso 8: Calendario

### 8.1 Obtener Festivos del Año

```http
GET {{baseURL}}/api/calendario/festivos/2024
Authorization: Bearer {{token}}
```

### 8.2 Crear Festivo

```http
POST {{baseURL}}/api/calendario/festivos
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "fecha": "2024-12-25",
  "nombre_festivo": "Navidad",
  "tipo_festivo": "nacional"
}
```

### 8.3 Sincronizar Domingos del Año

```http
POST {{baseURL}}/api/calendario/sincronizar-domingos
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "anio": 2025
}
```

### 8.4 Consultar un Día Específico

```http
GET {{baseURL}}/api/calendario/2024-12-25
Authorization: Bearer {{token}}
```

---

## 📊 Paso 9: Dashboard

### 9.1 Estadísticas Generales

```http
GET {{baseURL}}/api/dashboard/estadisticas
Authorization: Bearer {{token}}
```

### 9.2 Turnos de Hoy

```http
GET {{baseURL}}/api/dashboard/turnos-hoy
Authorization: Bearer {{token}}
```

### 9.3 Recargos por Mes (para gráficos)

```http
GET {{baseURL}}/api/dashboard/recargos-por-mes?anio=2024
Authorization: Bearer {{token}}
```

### 9.4 Empleados Más Activos

```http
GET {{baseURL}}/api/dashboard/empleados-activos?limite=10
Authorization: Bearer {{token}}
```

### 9.5 Distribución por Área

```http
GET {{baseURL}}/api/dashboard/distribucion-areas?mes=11&anio=2024
Authorization: Bearer {{token}}
```

### 9.6 Resumen de Novedades

```http
GET {{baseURL}}/api/dashboard/resumen-novedades?mes=11&anio=2024
Authorization: Bearer {{token}}
```

---

## ⚙️ Paso 10: Parametrización

### 10.1 Listar Parámetros

```http
GET {{baseURL}}/api/parametrizacion
Authorization: Bearer {{token}}
```

### 10.2 Crear Parámetro

```http
POST {{baseURL}}/api/parametrizacion
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre_parametro": "HORA_EXTRA_MAXIMA_DIA",
  "valor_numerico": 4,
  "descripcion": "Máximo de horas extras por día",
  "tipo_parametro": "numerico",
  "categoria": "recargos"
}
```

### 10.3 Obtener Parámetros por Categoría

```http
GET {{baseURL}}/api/parametrizacion/categoria/recargos
Authorization: Bearer {{token}}
```

---

## 🔄 Flujo de Trabajo Típico

### Escenario: Registrar un empleado y asignarle turnos

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usuario: 'admin', contrasenia: 'admin123' })
});
const { token } = await loginResponse.json();

// Headers para siguientes peticiones
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// 2. Verificar cargos disponibles
const cargosResponse = await fetch('http://localhost:5000/api/cargos', { headers });
const cargos = await cargosResponse.json();
console.log('Cargos disponibles:', cargos);

// 3. Crear empleado
const nuevoEmpleado = {
  nombre1: "Pedro",
  apellido1: "Ramírez",
  cedula: "1122334455",
  edad: 25,
  sexo: "M",
  id_cargo: cargos[0].id_cargo,
  areas_permitidas: [1]
};

const empleadoResponse = await fetch('http://localhost:5000/api/empleados', {
  method: 'POST',
  headers,
  body: JSON.stringify(nuevoEmpleado)
});
const { empleado } = await empleadoResponse.json();
console.log('Empleado creado:', empleado);

// 4. Asignar turno diurno para hoy
const asignacionTurno = {
  id_empleado: empleado.id_empleado,
  id_turno: 1, // Turno DIA
  id_area: 1,
  fecha: new Date().toISOString().split('T')[0],
  fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  fecha_fin: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
};

const turnoResponse = await fetch('http://localhost:5000/api/turnos/asignar', {
  method: 'POST',
  headers,
  body: JSON.stringify(asignacionTurno)
});
const turnoAsignado = await turnoResponse.json();
console.log('Turno asignado:', turnoAsignado);

// 5. Verificar que aparece en el dashboard
const dashboardResponse = await fetch('http://localhost:5000/api/dashboard/turnos-hoy', { headers });
const turnosHoy = await dashboardResponse.json();
console.log(`Turnos de hoy: ${turnosHoy.length}`);
```

---

## 🧪 Tests Básicos con cURL (PowerShell)

Guarda estos comandos en un archivo `.ps1` para probar rápidamente:

```powershell
# Variables
$baseURL = "http://localhost:5000"

# 1. Health Check
Write-Host "`n=== TEST 1: Health Check ===" -ForegroundColor Cyan
curl.exe "$baseURL/health"

# 2. Login y obtener token
Write-Host "`n`n=== TEST 2: Login ===" -ForegroundColor Cyan
$loginResponse = Invoke-RestMethod -Uri "$baseURL/api/auth/login" `
  -Method Post `
  -Body '{"usuario":"admin","contrasenia":"admin123"}' `
  -ContentType "application/json"

$token = $loginResponse.token
Write-Host "✅ Token obtenido: $($token.Substring(0, 20))..." -ForegroundColor Green

# 3. Listar empleados
Write-Host "`n=== TEST 3: Listar Empleados ===" -ForegroundColor Cyan
$empleados = Invoke-RestMethod -Uri "$baseURL/api/empleados" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "✅ Total empleados: $($empleados.paginacion.total)" -ForegroundColor Green

# 4. Listar cargos
Write-Host "`n=== TEST 4: Listar Cargos ===" -ForegroundColor Cyan
$cargos = Invoke-RestMethod -Uri "$baseURL/api/cargos" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "✅ Total cargos: $($cargos.Count)" -ForegroundColor Green

# 5. Listar áreas
Write-Host "`n=== TEST 5: Listar Áreas ===" -ForegroundColor Cyan
$areas = Invoke-RestMethod -Uri "$baseURL/api/areas" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "✅ Total áreas: $($areas.Count)" -ForegroundColor Green

# 6. Listar turnos
Write-Host "`n=== TEST 6: Listar Turnos ===" -ForegroundColor Cyan
$turnos = Invoke-RestMethod -Uri "$baseURL/api/turnos" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "✅ Total turnos: $($turnos.Count)" -ForegroundColor Green

# 7. Estadísticas del dashboard
Write-Host "`n=== TEST 7: Dashboard Estadísticas ===" -ForegroundColor Cyan
$stats = Invoke-RestMethod -Uri "$baseURL/api/dashboard/estadisticas" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "✅ Empleados activos: $($stats.empleados.activos)" -ForegroundColor Green
Write-Host "✅ Turnos hoy: $($stats.operacion.turnosHoy)" -ForegroundColor Green

# 8. Tipos de recargo
Write-Host "`n=== TEST 8: Tipos de Recargo ===" -ForegroundColor Cyan
$tiposRecargo = Invoke-RestMethod -Uri "$baseURL/api/recargos/tipos" `
  -Headers @{Authorization="Bearer $token"}
Write-Host "✅ Total tipos de recargo: $($tiposRecargo.Count)" -ForegroundColor Green
$tiposRecargo | ForEach-Object { 
  Write-Host "  - $($_.codigo): $($_.nombre_recargo) ($($_.porcentaje_recargo)%)" 
}

Write-Host "`n`n✅ TODOS LOS TESTS COMPLETADOS`n" -ForegroundColor Green
```

**Para ejecutar:**
```powershell
# Guarda el código anterior en: backend/test-api.ps1
cd C:\Users\jccpp\OneDrive\Documentos\proyecto-nomina\backend
.\test-api.ps1
```

---

## 🎯 Tests Completos con Escenarios

### Escenario 1: Día Normal de Trabajo

```powershell
$token = (Invoke-RestMethod -Uri "$baseURL/api/auth/login" `
  -Method Post `
  -Body '{"usuario":"admin","contrasenia":"admin123"}' `
  -ContentType "application/json").token

$headers = @{Authorization="Bearer $token"}

# 1. Crear empleado
$nuevoEmpleado = @{
  nombre1 = "Carlos"
  apellido1 = "Méndez"
  cedula = "5544332211"
  edad = 32
  sexo = "M"
  id_cargo = 1
  areas_permitidas = @(1)
} | ConvertTo-Json

$empleado = Invoke-RestMethod -Uri "$baseURL/api/empleados" `
  -Method Post `
  -Headers $headers `
  -Body $nuevoEmpleado `
  -ContentType "application/json"

Write-Host "✅ Empleado creado: $($empleado.empleado.nombre1) $($empleado.empleado.apellido1)"

# 2. Asignar turno diurno
$hoy = Get-Date -Format "yyyy-MM-dd"
$primerDia = Get-Date -Day 1 -Format "yyyy-MM-dd"
$ultimoDia = (Get-Date -Day 1).AddMonths(1).AddDays(-1) | Get-Date -Format "yyyy-MM-dd"

$turnoAsignacion = @{
  id_empleado = $empleado.empleado.id_empleado
  id_turno = 1
  id_area = 1
  fecha = $hoy
  fecha_inicio = $primerDia
  fecha_fin = $ultimoDia
} | ConvertTo-Json

$turnoAsignado = Invoke-RestMethod -Uri "$baseURL/api/turnos/asignar" `
  -Method Post `
  -Headers $headers `
  -Body $turnoAsignacion `
  -ContentType "application/json"

Write-Host "✅ Turno asignado: $($turnoAsignado.detalleProgramacion.turno.codigo)"

# 3. Verificar en turnos de hoy
$turnosHoy = Invoke-RestMethod -Uri "$baseURL/api/dashboard/turnos-hoy" `
  -Headers $headers

Write-Host "✅ Turnos de hoy: $($turnosHoy.Count)"
```

---

### Escenario 2: Turno Nocturno con Recargos

```powershell
# Asignar turno nocturno
$turnoNocturno = @{
  id_empleado = 1
  id_turno = 3  # NOCHE
  id_area = 1
  fecha = "2024-11-20"
  fecha_inicio = "2024-11-01"
  fecha_fin = "2024-11-30"
} | ConvertTo-Json

$turnoAsignado = Invoke-RestMethod -Uri "$baseURL/api/turnos/asignar" `
  -Method Post `
  -Headers $headers `
  -Body $turnoNocturno `
  -ContentType "application/json"

$idDetalleTurno = $turnoAsignado.detalleProgramacion.id_detalle_turno
Write-Host "✅ Turno nocturno asignado: ID $idDetalleTurno"

# Calcular recargos
$recargos = Invoke-RestMethod -Uri "$baseURL/api/recargos/calcular/$idDetalleTurno" `
  -Method Post `
  -Headers $headers

Write-Host "✅ Recargos calculados:"
Write-Host "   Total dinero: $($recargos.recargos.total_dinero)"
Write-Host "   Horas RNO: $($recargos.recargos.rno)"
```

---

## 📦 Colección Postman (JSON)

Crea un archivo `nomina-api.postman_collection.json`:

```json
{
  "info": {
    "name": "Sistema Nómina API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseURL",
      "value": "http://localhost:5000"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "const response = pm.response.json();",
                  "pm.collectionVariables.set('token', response.token);"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"usuario\": \"admin\",\n  \"contrasenia\": \"admin123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseURL}}/api/auth/login",
              "host": ["{{baseURL}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    }
  ]
}
```

**Para importar en Postman:**
1. Abre Postman
2. Click en "Import"
3. Selecciona el archivo `nomina-api.postman_collection.json`
4. ¡Listo! Todos los endpoints estarán disponibles

---

## ✅ Checklist de Pruebas

Usa este checklist para verificar que todos los módulos funcionan:

### Autenticación
- [ ] Login exitoso con admin
- [ ] Obtener perfil de usuario
- [ ] Cambiar contraseña
- [ ] Crear nuevo usuario
- [ ] Listar usuarios

### Empleados
- [ ] Listar empleados
- [ ] Crear empleado
- [ ] Actualizar empleado
- [ ] Obtener empleado por ID
- [ ] Listar empleados activos
- [ ] Desactivar empleado

### Cargos
- [ ] Listar cargos
- [ ] Crear cargo
- [ ] Actualizar cargo
- [ ] Eliminar cargo

### Áreas
- [ ] Listar áreas
- [ ] Crear área
- [ ] Actualizar área

### Turnos
- [ ] Listar turnos
- [ ] Crear turno
- [ ] Asignar turno a empleado
- [ ] Consultar turnos asignados

### Novedades
- [ ] Listar tipos de novedad
- [ ] Crear novedad
- [ ] Aprobar/rechazar novedad
- [ ] Listar novedades pendientes

### Recargos
- [ ] Listar tipos de recargo
- [ ] Calcular recargos
- [ ] Obtener resumen de recargos
- [ ] Listar recargos con filtros

### Calendario
- [ ] Listar calendario
- [ ] Crear festivo
- [ ] Sincronizar domingos
- [ ] Obtener festivos del año

### Dashboard
- [ ] Estadísticas generales
- [ ] Turnos de hoy
- [ ] Recargos por mes
- [ ] Empleados más activos
- [ ] Distribución por área

### Parametrización
- [ ] Listar parámetros
- [ ] Crear parámetro
- [ ] Actualizar parámetro
- [ ] Obtener por categoría

---

## 🐛 Solución de Problemas Comunes

### Error 401: Unauthorized

**Causa:** Token inválido o expirado

**Solución:**
1. Verifica que incluiste el header `Authorization: Bearer {token}`
2. Haz login nuevamente para obtener un token fresco
3. Verifica que no haya espacios extra en el token

---

### Error 400: Bad Request

**Causa:** Datos de entrada incorrectos

**Solución:**
1. Verifica que todos los campos requeridos estén presentes
2. Revisa el formato de fechas (`YYYY-MM-DD`)
3. Revisa el formato de horas (`HH:mm:ss`)
4. Lee el mensaje de error para ver qué campo específico falló

---

### Error 409: Conflict

**Causa:** Registro duplicado

**Solución:**
1. Si es cédula: Cambia la cédula del empleado
2. Si es código de turno: Usa otro código
3. Si es usuario: Cambia el nombre de usuario

---

### Error 500: Internal Server Error

**Causa:** Error del servidor

**Solución:**
1. Verifica los logs del servidor
2. Asegúrate de que PostgreSQL esté corriendo
3. Revisa que el archivo `.env` esté configurado correctamente

---

## 📞 Soporte

Si encuentras errores no documentados aquí:
1. Revisa los logs del servidor
2. Consulta la [documentación completa](./API_DOCUMENTACION.md)
3. Revisa los [ejemplos de código](./EJEMPLOS.md)

---

**¡Happy Testing!** 🚀

