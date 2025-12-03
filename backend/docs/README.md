# 📚 Documentación del Backend - Sistema de Nómina v2.0

¡Bienvenido a la documentación completa del backend del Sistema de Nómina!

---

## 📖 Índice de Documentación

### 🎯 Para Desarrolladores

1. **[API_DOCUMENTACION.md](./API_DOCUMENTACION.md)** ⭐ PRINCIPAL
   - Referencia completa de todos los endpoints
   - Autenticación y seguridad
   - Códigos de estado HTTP
   - Estructura de respuestas

2. **[MODELOS.md](./MODELOS.md)**
   - Modelos de datos detallados
   - Esquemas TypeScript
   - Validaciones
   - Relaciones entre tablas

3. **[EJEMPLOS.md](./EJEMPLOS.md)**
   - Ejemplos de código en JavaScript, Python, cURL
   - Flujos de trabajo completos
   - Casos de uso reales
   - Utilidades y helpers

4. **[PRUEBAS_RAPIDAS.md](./PRUEBAS_RAPIDAS.md)**
   - Guía de testing
   - Colecciones para Postman
   - Scripts de pruebas automáticas
   - Checklist de verificación

---

## 🚀 Inicio Rápido

### 1️⃣ Verificar que el servidor esté corriendo

```bash
curl http://localhost:5000/health
```

**Respuesta esperada:**
```json
{
  "status": "OK",
  "message": "Sistema de Nómina API v2.0",
  "timestamp": "2024-11-18T..."
}
```

---

### 2️⃣ Hacer login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"admin","contrasenia":"admin123"}'
```

**Guarda el token** que recibes en la respuesta.

---

### 3️⃣ Usar el token en peticiones

```bash
TOKEN="tu_token_aqui"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/empleados
```

---

## 📊 Resumen de la API

### Estadísticas

- **Total de Endpoints:** 60+
- **Módulos:** 10
- **Métodos HTTP:** GET, POST, PUT, DELETE
- **Autenticación:** JWT
- **Base de datos:** PostgreSQL con Prisma ORM

### Módulos Disponibles

| Módulo | Endpoints | Descripción |
|--------|-----------|-------------|
| 🔐 **Autenticación** | 6 | Login, gestión de usuarios, cambio de contraseña |
| 👥 **Empleados** | 6 | CRUD completo, búsqueda, filtros |
| 👔 **Cargos** | 5 | Gestión de puestos y salarios |
| 🏢 **Áreas** | 5 | Gestión de áreas de trabajo |
| ⏰ **Turnos** | 7 | Creación, asignación, consulta |
| 📋 **Novedades** | 6 | Incapacidades, vacaciones, permisos |
| 💰 **Recargos** | 5 | Cálculo automático, consultas, resúmenes |
| 📅 **Calendario** | 6 | Festivos, domingos, sincronización |
| 📊 **Dashboard** | 6 | Estadísticas, gráficos, reportes |
| ⚙️ **Parametrización** | 8 | Configuración del sistema |

---

## 🎯 Casos de Uso Principales

### 1. Gestionar Empleados
```
Login → Listar Cargos → Crear Empleado → Asignar Áreas
```

### 2. Programar Turnos
```
Login → Listar Empleados → Listar Turnos → Asignar Turno → Calcular Recargos
```

### 3. Registrar Novedades
```
Login → Seleccionar Empleado → Crear Novedad → Aprobar/Rechazar
```

### 4. Consultar Reportes
```
Login → Dashboard Estadísticas → Recargos por Mes → Distribución por Área
```

---

## 🔑 Credenciales por Defecto

Después de ejecutar el script de configuración inicial:

```
Usuario: admin
Contraseña: admin123
Tipo: administrador
```

⚠️ **IMPORTANTE:** Cambia estas credenciales en producción.

---

## 🛡️ Seguridad

### Autenticación
- ✅ JWT con expiración de 7 días
- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Validación de tokens en cada petición

### Autorización
- ✅ Sistema de roles (admin, supervisor, empleado)
- ✅ Middleware de verificación de permisos
- ✅ Endpoints protegidos por rol

### Validación
- ✅ Validación de datos con express-validator
- ✅ Sanitización de inputs
- ✅ Validación de IDs, fechas y campos requeridos

### Headers de Seguridad
- ✅ Helmet.js para headers HTTP seguros
- ✅ CORS configurado
- ✅ Compresión de respuestas

---

## 📝 Guías de Referencia Rápida

### Formato de Fechas
```javascript
// Enviar
"2024-11-18"

// Recibir
"2024-11-18T00:00:00.000Z"
```

### Formato de Horas
```javascript
// Enviar
"14:30:00"

// Recibir (almacenado con fecha dummy)
"1970-01-01T14:30:00.000Z"
```

### Paginación
```
GET /api/empleados?page=1&limit=20

Response:
{
  "empleados": [...],
  "paginacion": {
    "total": 100,
    "pagina": 1,
    "limite": 20,
    "totalPaginas": 5
  }
}
```

### Filtros
```
GET /api/empleados?estado=true&id_cargo=1&busqueda=Juan
```

---

## 🔄 Flujo de Desarrollo

1. **Leer** [API_DOCUMENTACION.md](./API_DOCUMENTACION.md) - Conocer todos los endpoints
2. **Revisar** [MODELOS.md](./MODELOS.md) - Entender la estructura de datos
3. **Practicar** con [EJEMPLOS.md](./EJEMPLOS.md) - Ver código funcional
4. **Probar** con [PRUEBAS_RAPIDAS.md](./PRUEBAS_RAPIDAS.md) - Verificar funcionamiento

---

## 🧪 Probar la API Ahora

### Opción 1: Script Automático (Recomendado)

Ejecuta el script de pruebas:

```powershell
cd backend
.\test-api.ps1
```

Este script probará automáticamente:
- ✅ Health check
- ✅ Login
- ✅ Todos los módulos principales
- ✅ Tipos de datos iniciales

---

### Opción 2: Postman/Thunder Client

1. Importa la colección desde [PRUEBAS_RAPIDAS.md](./PRUEBAS_RAPIDAS.md)
2. Ejecuta el endpoint de Login
3. El token se guardará automáticamente
4. Prueba los demás endpoints

---

### Opción 3: Manual con cURL

Sigue la [Guía de Pruebas Rápidas](./PRUEBAS_RAPIDAS.md)

---

## 📦 Datos Iniciales Configurados

Después de ejecutar `node src/scripts/setup-database.js`:

### Tipos de Recargo (8)
- RNO: Recargo Nocturno Ordinario (35%)
- RNF: Recargo Nocturno Festivo (110%)
- D: Dominical (75%)
- F: Festivo (75%)
- HEOD: Hora Extra Ordinaria Diurna (25%)
- HEON: Hora Extra Ordinaria Nocturna (75%)
- HEFD: Hora Extra Festiva Diurna (100%)
- HEFN: Hora Extra Festiva Nocturna (150%)

### Tipos de Novedad (6)
- INCAP: Incapacidad
- VAC: Vacaciones
- PERM: Permiso
- LIC: Licencia
- AUS: Ausencia
- SUSP: Suspensión

### Turnos Básicos (3)
- DIA: 6:00 - 14:00 (Diurno)
- TARDE: 14:00 - 22:00 (Tarde)
- NOCHE: 22:00 - 6:00 (Nocturno)

### Configuración Base
- 1 Cargo: "Operario General" ($1,300,000)
- 1 Área: "Producción"
- 52 Domingos del año sincronizados
- 1 Usuario admin

---

## 🔗 Enlaces Útiles

### Documentación Externa
- [Prisma Docs](https://www.prisma.io/docs) - ORM utilizado
- [Express Docs](https://expressjs.com/) - Framework web
- [JWT.io](https://jwt.io/) - Sobre JSON Web Tokens

### Herramientas
- [Postman](https://www.postman.com/)
- [Thunder Client](https://www.thunderclient.com/)
- [Prisma Studio](https://www.prisma.io/studio) - GUI para ver la BD

---

## 🐛 Problemas Comunes

### El servidor no inicia
```bash
# Verificar que PostgreSQL esté corriendo
# Revisar archivo .env
# Ver logs de error
```

### Error 401 en todas las peticiones
```bash
# Hacer login nuevamente
# Verificar que el token esté en el header
# Revisar que el token no haya expirado
```

### Error de conexión a la BD
```bash
# Verificar credenciales en .env
# Asegurar que la BD existe
# Revisar que PostgreSQL esté corriendo en puerto 5432
```

---

## 📞 Contacto y Soporte

Para preguntas o reportar bugs:
- **Email:** soporte@sistema-nomina.com
- **Issues:** [GitHub/Issues]
- **Documentación:** `/backend/docs/`

---

## 📅 Historial de Versiones

### v2.0.0 - Noviembre 2024
- ✅ Reescritura completa del backend
- ✅ Migración a arquitectura simplificada
- ✅ Solo PostgreSQL (eliminado MongoDB)
- ✅ Eliminado OptaPlanner/Java
- ✅ 60+ endpoints REST
- ✅ Documentación completa

---

## 🎓 Recursos de Aprendizaje

### Para Entender la API
1. Lee [API_DOCUMENTACION.md](./API_DOCUMENTACION.md) completo
2. Prueba los ejemplos de [EJEMPLOS.md](./EJEMPLOS.md)
3. Ejecuta el script de pruebas automáticas

### Para Integrar con Frontend
1. Revisa los ejemplos de JavaScript en [EJEMPLOS.md](./EJEMPLOS.md)
2. Implementa la función `fetchAPI` helper
3. Maneja errores 401 para sesión expirada

### Para Extender la API
1. Revisa la estructura en `/backend/src/`
2. Sigue el patrón: Controller → Route → Server
3. Usa los middlewares existentes (auth, validation)

---

## ✅ Siguiente Paso

**¡La documentación está completa!**

Ahora puedes:
1. 🧪 **Probar la API** con el script `test-api.ps1`
2. 🎨 **Desarrollar el Frontend** usando la documentación
3. 📱 **Integrar** con aplicaciones móviles
4. 🔧 **Extender** la funcionalidad según necesites

---

**¿Listo para desarrollar el frontend?** 🚀

Toda la información que necesitas está en estos documentos. ¡Buena suerte!

