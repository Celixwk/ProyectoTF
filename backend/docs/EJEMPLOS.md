# 💡 Ejemplos de Uso - API Sistema de Nómina

## 📋 Índice

1. [Flujo Completo de Autenticación](#1-flujo-completo-de-autenticación)
2. [Gestión de Empleados](#2-gestión-de-empleados)
3. [Asignación de Turnos](#3-asignación-de-turnos)
4. [Registro de Novedades](#4-registro-de-novedades)
5. [Consulta de Recargos](#5-consulta-de-recargos)
6. [Dashboard y Reportes](#6-dashboard-y-reportes)

---

## 1. Flujo Completo de Autenticación

### Ejemplo con cURL

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin",
    "contrasenia": "admin123"
  }'

# Respuesta:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "usuario": {...}
# }

# 2. Usar el token en otras peticiones
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/empleados
```

### Ejemplo con JavaScript/Fetch

```javascript
// 1. Login
async function login(usuario, contrasenia) {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ usuario, contrasenia })
  });
  
  const data = await response.json();
  
  // Guardar token en localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
  
  return data;
}

// 2. Función helper para peticiones autenticadas
async function fetchAPI(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:5000${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  if (response.status === 401) {
    // Token expirado, redirigir a login
    window.location.href = '/login';
    return;
  }
  
  return response.json();
}

// 3. Uso
async function obtenerEmpleados() {
  const data = await fetchAPI('/api/empleados?page=1&limit=20');
  console.log(data.empleados);
}
```

### Ejemplo con Python/Requests

```python
import requests

# 1. Login
def login(usuario, contrasenia):
    url = "http://localhost:5000/api/auth/login"
    payload = {
        "usuario": usuario,
        "contrasenia": contrasenia
    }
    
    response = requests.post(url, json=payload)
    data = response.json()
    
    return data['token']

# 2. Cliente API con sesión
class NominaAPI:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
    
    def login(self, usuario, contrasenia):
        response = self.session.post(
            f"{self.base_url}/api/auth/login",
            json={"usuario": usuario, "contrasenia": contrasenia}
        )
        data = response.json()
        self.token = data['token']
        self.session.headers.update({
            'Authorization': f'Bearer {self.token}'
        })
        return data
    
    def obtener_empleados(self, **params):
        response = self.session.get(
            f"{self.base_url}/api/empleados",
            params=params
        )
        return response.json()

# 3. Uso
api = NominaAPI()
api.login("admin", "admin123")
empleados = api.obtener_empleados(page=1, limit=20, estado=True)
print(f"Total empleados: {empleados['paginacion']['total']}")
```

---

## 2. Gestión de Empleados

### Crear un empleado nuevo

```javascript
async function crearEmpleado() {
  const nuevoEmpleado = {
    nombre1: "María",
    nombre2: "Fernanda",
    apellido1: "López",
    apellido2: "Martínez",
    cedula: "9876543210",
    edad: 28,
    sexo: "F",
    vehiculo: "XYZ789",
    id_cargo: 1,
    areas_permitidas: [1, 2]  // IDs de las áreas permitidas
  };
  
  const response = await fetchAPI('/api/empleados', {
    method: 'POST',
    body: JSON.stringify(nuevoEmpleado)
  });
  
  console.log('Empleado creado:', response.empleado);
  return response;
}
```

### Buscar empleados con filtros

```javascript
async function buscarEmpleados(busqueda) {
  const params = new URLSearchParams({
    busqueda: busqueda,
    estado: 'true',
    page: '1',
    limit: '10'
  });
  
  const data = await fetchAPI(`/api/empleados?${params}`);
  
  return data.empleados;
}

// Uso:
const empleados = await buscarEmpleados('Juan');
```

### Actualizar información de empleado

```javascript
async function actualizarEmpleado(id, cambios) {
  const response = await fetchAPI(`/api/empleados/${id}`, {
    method: 'PUT',
    body: JSON.stringify(cambios)
  });
  
  return response;
}

// Ejemplo: Actualizar áreas permitidas
await actualizarEmpleado(1, {
  areas_permitidas: [1, 2, 3, 4]
});
```

---

## 3. Asignación de Turnos

### Crear un nuevo turno

```javascript
async function crearTurno() {
  const nuevoTurno = {
    codigo: "MADRUGADA",
    hora_entrada: "00:00:00",
    hora_salida: "06:00:00",
    tipo_turno: "Madrugada"
  };
  
  const response = await fetchAPI('/api/turnos', {
    method: 'POST',
    body: JSON.stringify(nuevoTurno)
  });
  
  return response.turno;
}
```

### Asignar turno a un empleado

```javascript
async function asignarTurnoEmpleado(idEmpleado, idTurno, idArea, fecha) {
  // Obtener el mes actual para el período
  const hoy = new Date(fecha);
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  
  const asignacion = {
    id_empleado: idEmpleado,
    id_turno: idTurno,
    id_area: idArea,
    fecha: fecha,
    fecha_inicio: primerDia.toISOString().split('T')[0],
    fecha_fin: ultimoDia.toISOString().split('T')[0]
  };
  
  const response = await fetchAPI('/api/turnos/asignar', {
    method: 'POST',
    body: JSON.stringify(asignacion)
  });
  
  console.log('Turno asignado:', response);
  return response;
}

// Uso: Asignar turno diurno al empleado 1 en producción para hoy
await asignarTurnoEmpleado(1, 1, 1, '2024-11-20');
```

### Consultar turnos asignados de un empleado

```javascript
async function obtenerTurnosEmpleado(idEmpleado, fechaInicio, fechaFin) {
  const params = new URLSearchParams({
    id_empleado: idEmpleado.toString(),
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    page: '1',
    limit: '100'
  });
  
  const data = await fetchAPI(`/api/turnos/asignados?${params}`);
  
  return data.turnosAsignados;
}

// Uso: Turnos de noviembre 2024
const turnos = await obtenerTurnosEmpleado(1, '2024-11-01', '2024-11-30');
console.log(`Total turnos: ${turnos.length}`);
```

### Programar turnos para todo un mes

```javascript
async function programarTurnosMes(idEmpleado, mes, anio, turnosPorDia) {
  // turnosPorDia es un objeto: { '1': idTurno, '2': idTurno, ...}
  
  const primerDia = new Date(anio, mes - 1, 1);
  const ultimoDia = new Date(anio, mes, 0);
  
  const asignaciones = [];
  
  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const fecha = new Date(anio, mes - 1, dia);
    const diaSemana = fecha.getDay(); // 0 = Domingo
    
    // Saltar domingos si no hay turno asignado
    if (diaSemana === 0 && !turnosPorDia[dia]) continue;
    
    const idTurno = turnosPorDia[dia] || 1; // Turno por defecto: 1 (Día)
    
    asignaciones.push({
      id_empleado: idEmpleado,
      id_turno: idTurno,
      id_area: 1, // Producción
      fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
      fecha_inicio: primerDia.toISOString().split('T')[0],
      fecha_fin: ultimoDia.toISOString().split('T')[0]
    });
  }
  
  // Asignar todos los turnos
  const resultados = [];
  for (const asignacion of asignaciones) {
    const resultado = await fetchAPI('/api/turnos/asignar', {
      method: 'POST',
      body: JSON.stringify(asignacion)
    });
    resultados.push(resultado);
  }
  
  return resultados;
}

// Uso: Programar turnos diurnos para todo diciembre
await programarTurnosMes(1, 12, 2024, {});
```

---

## 4. Registro de Novedades

### Registrar una incapacidad

```javascript
async function registrarIncapacidad(idEmpleado, fechaInicio, dias, observaciones) {
  const novedad = {
    id_empleado: idEmpleado,
    fecha_solicitud: new Date().toISOString().split('T')[0],
    fecha_registro: new Date().toISOString().split('T')[0],
    fecha_vencimiento: calcularFechaFin(fechaInicio, dias),
    detalles: [
      {
        id_novedad_tipo: 1, // INCAP
        fecha: fechaInicio,
        cantidad: dias,
        observaciones: observaciones
      }
    ]
  };
  
  const response = await fetchAPI('/api/novedades', {
    method: 'POST',
    body: JSON.stringify(novedad)
  });
  
  return response;
}

function calcularFechaFin(fechaInicio, dias) {
  const fecha = new Date(fechaInicio);
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().split('T')[0];
}

// Uso:
await registrarIncapacidad(1, '2024-11-20', 3, 'Gripe común');
```

### Aprobar/Rechazar novedad

```javascript
async function cambiarEstadoNovedad(idNovedad, nuevoEstado) {
  // nuevoEstado: 'pendiente', 'aprobada', 'rechazada', 'completada'
  
  const response = await fetchAPI(`/api/novedades/${idNovedad}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ etapa: nuevoEstado })
  });
  
  console.log(`Novedad ${nuevoEstado}:`, response);
  return response;
}

// Aprobar
await cambiarEstadoNovedad(1, 'aprobada');

// Rechazar
await cambiarEstadoNovedad(2, 'rechazada');
```

### Consultar novedades pendientes

```javascript
async function obtenerNovedadesPendientes() {
  const params = new URLSearchParams({
    etapa: 'pendiente',
    page: '1',
    limit: '50'
  });
  
  const data = await fetchAPI(`/api/novedades?${params}`);
  
  return data.novedades;
}

// Uso
const pendientes = await obtenerNovedadesPendientes();
console.log(`${pendientes.length} novedades pendientes de aprobación`);
```

---

## 5. Consulta de Recargos

### Calcular recargos de un turno

```javascript
async function calcularRecargos(idDetalleTurno) {
  const response = await fetchAPI(
    `/api/recargos/calcular/${idDetalleTurno}`,
    { method: 'POST' }
  );
  
  console.log('Recargos calculados:', response.recargos);
  return response;
}
```

### Obtener resumen mensual de recargos

```javascript
async function obtenerResumenRecargos(idEmpleado, mes, anio) {
  const primerDia = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDia = new Date(anio, mes, 0);
  const ultimoDiaStr = ultimoDia.toISOString().split('T')[0];
  
  const params = new URLSearchParams({
    id_empleado: idEmpleado.toString(),
    fecha_inicio: primerDia,
    fecha_fin: ultimoDiaStr
  });
  
  const data = await fetchAPI(`/api/recargos/resumen?${params}`);
  
  return data;
}

// Uso:
const resumen = await obtenerResumenRecargos(1, 11, 2024);
console.log(`Total recargos: $${resumen.resumen.total_recargos_dinero}`);
console.log(`Horas nocturnas: ${resumen.resumen.desglose.rno}`);
console.log(`Dominicales: ${resumen.resumen.total_dominicales}`);
```

### Listar todos los recargos de un período

```javascript
async function obtenerRecargosEmpleados(fechaInicio, fechaFin) {
  const params = new URLSearchParams({
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    page: '1',
    limit: '100'
  });
  
  const data = await fetchAPI(`/api/recargos?${params}`);
  
  // Agrupar por empleado
  const porEmpleado = {};
  
  data.recargos.forEach(recargo => {
    const empleado = recargo.detalle_programacion.labor_mes.empleado;
    const key = empleado.id_empleado;
    
    if (!porEmpleado[key]) {
      porEmpleado[key] = {
        empleado: `${empleado.nombre1} ${empleado.apellido1}`,
        totalDinero: 0,
        totalHoras: 0,
        recargos: []
      };
    }
    
    porEmpleado[key].totalDinero += parseFloat(recargo.total_dinero);
    porEmpleado[key].totalHoras += parseFloat(recargo.total_horas);
    porEmpleado[key].recargos.push(recargo);
  });
  
  return porEmpleado;
}
```

---

## 6. Dashboard y Reportes

### Obtener estadísticas generales

```javascript
async function obtenerEstadisticas() {
  const data = await fetchAPI('/api/dashboard/estadisticas');
  
  console.log('=== ESTADÍSTICAS DEL SISTEMA ===');
  console.log(`Empleados activos: ${data.empleados.activos}/${data.empleados.total}`);
  console.log(`Turnos hoy: ${data.operacion.turnosHoy}`);
  console.log(`Novedades pendientes: ${data.operacion.novedadesPendientes}`);
  console.log(`Recargos mes actual: $${data.operacion.recargosMesActual}`);
  
  return data;
}
```

### Generar reporte mensual

```javascript
async function generarReporteMensual(mes, anio) {
  // 1. Estadísticas generales
  const estadisticas = await obtenerEstadisticas();
  
  // 2. Recargos por mes (para gráfico)
  const params = new URLSearchParams({ anio: anio.toString() });
  const recargosPorMes = await fetchAPI(`/api/dashboard/recargos-por-mes?${params}`);
  const datosMes = recargosPorMes.recargosPorMes.find(m => m.mes === mes);
  
  // 3. Empleados más activos
  const paramsEmpleados = new URLSearchParams({
    limite: '10',
    mes: mes.toString(),
    anio: anio.toString()
  });
  const empleadosActivos = await fetchAPI(`/api/dashboard/empleados-activos?${paramsEmpleados}`);
  
  // 4. Distribución por área
  const paramsAreas = new URLSearchParams({
    mes: mes.toString(),
    anio: anio.toString()
  });
  const distribucion = await fetchAPI(`/api/dashboard/distribucion-areas?${paramsAreas}`);
  
  // 5. Resumen de novedades
  const paramsNovedades = new URLSearchParams({
    mes: mes.toString(),
    anio: anio.toString()
  });
  const novedades = await fetchAPI(`/api/dashboard/resumen-novedades?${paramsNovedades}`);
  
  return {
    mes: datosMes.nombreMes,
    anio: anio,
    estadisticas,
    recargos: datosMes,
    empleadosActivos,
    distribucionAreas: distribucion,
    novedades
  };
}

// Uso: Reporte de noviembre 2024
const reporte = await generarReporteMensual(11, 2024);
console.log(JSON.stringify(reporte, null, 2));
```

### Obtener turnos del día en tiempo real

```javascript
async function actualizarTurnosHoy() {
  const turnos = await fetchAPI('/api/dashboard/turnos-hoy');
  
  // Mostrar en interfaz
  turnos.forEach(turno => {
    const empleado = turno.labor_mes.empleado;
    const horario = `${formatHora(turno.turno.hora_entrada)} - ${formatHora(turno.turno.hora_salida)}`;
    
    console.log(`${empleado.nombre1} ${empleado.apellido1} - ${turno.turno.codigo} (${horario}) - ${turno.area.nombre_area}`);
  });
  
  return turnos;
}

function formatHora(dateString) {
  const fecha = new Date(dateString);
  return fecha.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
}

// Actualizar cada minuto
setInterval(actualizarTurnosHoy, 60000);
```

### Exportar datos a Excel (ejemplo con CSV)

```javascript
async function exportarEmpleadosCSV() {
  const data = await fetchAPI('/api/empleados?limit=1000');
  
  // Crear CSV
  const headers = ['ID', 'Cédula', 'Nombre Completo', 'Cargo', 'Salario', 'Estado'];
  const rows = data.empleados.map(emp => [
    emp.id_empleado,
    emp.cedula,
    `${emp.nombre1} ${emp.apellido1}`,
    emp.cargo.nombre_cargo,
    emp.cargo.salario_base,
    emp.estado ? 'Activo' : 'Inactivo'
  ]);
  
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.join(',') + '\n';
  });
  
  // Descargar
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `empleados_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}
```

---

## 🔧 Utilidades y Helpers

### Función para refrescar token

```javascript
async function refrescarToken() {
  try {
    const response = await fetchAPI('/api/auth/perfil');
    // Si el perfil se obtiene correctamente, el token sigue válido
    return true;
  } catch (error) {
    // Token expirado, hacer login nuevamente
    return false;
  }
}

// Verificar token cada 30 minutos
setInterval(async () => {
  const tokenValido = await refrescarToken();
  if (!tokenValido) {
    alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
    window.location.href = '/login';
  }
}, 30 * 60 * 1000);
```

### Manejo de errores centralizado

```javascript
async function fetchAPIConErrores(url, options = {}) {
  try {
    const response = await fetch(`http://localhost:5000${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Manejar errores HTTP
      switch (response.status) {
        case 400:
          throw new Error(`Datos inválidos: ${data.error}`);
        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Sesión expirada');
        case 403:
          throw new Error('No tienes permisos para realizar esta acción');
        case 404:
          throw new Error('Recurso no encontrado');
        case 409:
          throw new Error(`Conflicto: ${data.error}`);
        default:
          throw new Error(`Error del servidor: ${data.error}`);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error en la petición:', error);
    // Mostrar notificación al usuario
    mostrarNotificacion('error', error.message);
    throw error;
  }
}
```

---

## 📝 Notas Importantes

1. **Todos los ejemplos asumen que el servidor está en `http://localhost:5000`**
2. **Las fechas deben enviarse en formato ISO:** `YYYY-MM-DD`
3. **Las horas se envían en formato:** `HH:mm:ss`
4. **El token JWT expira en 7 días** por defecto
5. **Siempre incluye el header `Authorization`** en peticiones protegidas

---

**¿Necesitas más ejemplos?** Consulta la [documentación principal](./API_DOCUMENTACION.md)

