# 📦 Guía de Migración - Proyecto Anterior → Versión 2.0

## ¿Qué vamos a migrar?

Solo vamos a migrar lo realmente importante:
- ✅ **Datos de la base de datos** (empleados, turnos, recargos, etc)
- ✅ **Esquema de base de datos** (ya copiado)
- ✅ **Lógica de cálculo de recargos** (ya copiada)
- ❌ Código redundante
- ❌ Archivos de configuración obsoletos
- ❌ Dependencias innecesarias (MongoDB, OptaPlanner/Java)

## 🎯 Plan de Migración

### FASE 1: Preparación (5 min)

1. **Backup de la base de datos actual**

```bash
# Exportar datos actuales
pg_dump -U postgres -d nomina > backup_nomina_anterior.sql
```

2. **Verificar que el nuevo proyecto está configurado**

```bash
cd C:\Users\jccpp\Documents\proyecto-nomina\backend
npm install
```

### FASE 2: Migración de Datos (10 min)

#### Opción A: Usar la misma base de datos

Si quieres seguir usando la misma BD:

```bash
cd backend

# Editar .env para apuntar a la BD anterior
# DATABASE_URL="postgresql://usuario:password@localhost:5432/nomina"

# Prisma va a detectar la estructura existente
npm run prisma:db:pull
npm run prisma:generate
```

#### Opción B: Crear nueva base de datos (Recomendado)

Si quieres empezar limpio:

```bash
# 1. Crear nueva BD
createdb sistema_nomina_v2

# 2. Configurar .env
# DATABASE_URL="postgresql://usuario:password@localhost:5432/sistema_nomina_v2"

# 3. Crear estructura
cd backend
npm run prisma:push
npm run prisma:generate

# 4. Exportar datos del proyecto anterior
cd "C:\Users\jccpp\Downloads\Interfaz Web Sistema Nómina\backend"
node scripts/exportar-datos.js

# 5. Importar en el nuevo proyecto
cd C:\Users\jccpp\Documents\proyecto-nomina\backend
node scripts/importar-datos.js
```

### FASE 3: Migrar Componentes del Frontend (30 min)

Los componentes que valen la pena migrar:

```bash
# Desde el proyecto anterior
C:\Users\jccpp\Downloads\Interfaz Web Sistema Nómina\src\components\

# Copiar estos componentes al nuevo proyecto:
# ✅ Dashboard.tsx
# ✅ Empleados.tsx
# ✅ Turnos.tsx
# ✅ Recargos.tsx
# ✅ Novedades.tsx
# ✅ Areas.tsx
# ✅ Cargos.tsx
# ✅ Parametros.tsx

# Copiar toda la carpeta de UI (Shadcn)
# ✅ src/components/ui/
```

**Importante**: Cada componente necesitará ajustes menores:
- Cambiar rutas de importación si es necesario
- Actualizar llamadas a API para usar la nueva estructura
- Eliminar referencias a MongoDB/OptaPlanner

### FASE 4: Migrar Utilidades (5 min)

```bash
# Del proyecto anterior copiar:
# ✅ src/utils/api.ts (ya migrado parcialmente)
# ❌ src/utils/offline.ts (no es necesario al inicio)
```

### FASE 5: Testing (15 min)

1. **Iniciar el nuevo proyecto**

```bash
# Terminal 1 - Backend
cd C:\Users\jccpp\Documents\proyecto-nomina\backend
npm run dev

# Terminal 2 - Frontend  
cd C:\Users\jccpp\Documents\proyecto-nomina\frontend
npm run dev
```

2. **Verificar funcionalidades clave**

- [ ] Login funciona
- [ ] Listar empleados
- [ ] Crear turno
- [ ] Calcular recargos
- [ ] Ver dashboard

## 📋 Checklist Completa de Migración

### Antes de empezar
- [ ] Hacer backup de BD actual
- [ ] Documentar configuraciones especiales
- [ ] Listar usuarios administradores

### Backend
- [ ] Instalar dependencias (`npm install`)
- [ ] Configurar `.env`
- [ ] Ejecutar migraciones Prisma
- [ ] Importar datos desde BD anterior
- [ ] Crear usuario admin
- [ ] Probar endpoints principales

### Frontend
- [ ] Instalar dependencias (`npm install`)
- [ ] Copiar componentes funcionales
- [ ] Ajustar rutas de API
- [ ] Probar login
- [ ] Probar navegación
- [ ] Verificar que carga datos

### Verificación Final
- [ ] Todos los empleados se ven correctamente
- [ ] Los turnos se pueden crear
- [ ] Los recargos se calculan bien
- [ ] Los reportes funcionan
- [ ] El dashboard muestra datos

## 🔄 Migración Paso a Paso Detallada

### 1. Exportar Datos del Proyecto Anterior

Crear este script en el proyecto anterior:

```javascript
// C:\Users\jccpp\Downloads\Interfaz Web Sistema Nómina\backend\scripts\exportar-datos.js

const prisma = require('../prisma/client');
const fs = require('fs');

async function exportar() {
  try {
    const empleados = await prisma.empleado.findMany({ include: { cargo: true } });
    const areas = await prisma.area.findMany();
    const turnos = await prisma.turno.findMany();
    const cargos = await prisma.cargo.findMany();
    const usuarios = await prisma.usuario.findMany();
    
    const data = {
      empleados,
      areas,
      turnos,
      cargos,
      usuarios
    };
    
    fs.writeFileSync('datos-exportados.json', JSON.stringify(data, null, 2));
    console.log('✅ Datos exportados exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

exportar();
```

### 2. Importar Datos al Nuevo Proyecto

Crear este script en el nuevo proyecto:

```javascript
// C:\Users\jccpp\Documents\proyecto-nomina\backend\scripts\importar-datos.js

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importar() {
  try {
    const data = JSON.parse(fs.readFileSync('datos-exportados.json', 'utf8'));
    
    console.log('Importando cargos...');
    for (const cargo of data.cargos) {
      await prisma.cargo.upsert({
        where: { id_cargo: cargo.id_cargo },
        update: {},
        create: cargo
      });
    }
    
    console.log('Importando áreas...');
    for (const area of data.areas) {
      await prisma.area.upsert({
        where: { id_area: area.id_area },
        update: {},
        create: area
      });
    }
    
    console.log('Importando turnos...');
    for (const turno of data.turnos) {
      await prisma.turno.upsert({
        where: { id_turno: turno.id_turno },
        update: {},
        create: turno
      });
    }
    
    console.log('✅ Datos importados exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importar();
```

## 🎨 Migrar Componentes de UI

### Ejemplo: Migrar componente Empleados

**Antes (proyecto anterior):**
```typescript
// src/components/Empleados.tsx
import { api } from '../utils/api';

// ... código complejo con muchas dependencias
```

**Después (nuevo proyecto):**
```typescript
// frontend/src/components/Empleados.tsx
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// ... código simplificado
```

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: Prisma no encuentra el schema

**Solución:**
```bash
cd backend
npm run prisma:generate
```

### Problema 2: Error de conexión a BD

**Solución:**
```bash
# Verificar que PostgreSQL esté corriendo
# Revisar DATABASE_URL en .env
# Verificar permisos del usuario
```

### Problema 3: Componentes no encuentran las rutas

**Solución:**
- Actualizar todas las rutas de API a `http://localhost:5000/api`
- Verificar que el backend esté corriendo
- Revisar CORS en backend

## 📊 Comparación: Antes vs Después

| Aspecto | Proyecto Anterior | Proyecto Nuevo |
|---------|-------------------|----------------|
| Bases de datos | PostgreSQL + MongoDB | Solo PostgreSQL |
| Servicios | 3 (Frontend, Backend, OptaPlanner) | 2 (Frontend, Backend) |
| Lenguajes | JavaScript, Java | Solo JavaScript |
| Dependencias | ~150+ paquetes | ~40 paquetes |
| Tiempo de inicio | ~2-3 minutos | ~10 segundos |
| Complejidad | Alta | Media |
| Mantenibilidad | Difícil | Fácil |

## ✅ Verificación Post-Migración

Ejecutar estos tests después de migrar:

```bash
# 1. Backend responde
curl http://localhost:5000/health

# 2. Empleados
curl http://localhost:5000/api/empleados

# 3. Turnos
curl http://localhost:5000/api/turnos

# 4. Dashboard
curl http://localhost:5000/api/dashboard
```

## 🎯 Próximos Pasos

Una vez completada la migración:

1. **Eliminar el proyecto anterior** (o moverlo a una carpeta de respaldo)
2. **Configurar Git** en el nuevo proyecto
3. **Documentar cambios específicos** de tu implementación
4. **Entrenar al equipo** en la nueva arquitectura

## 📞 ¿Necesitas ayuda?

Si encuentras problemas durante la migración:
1. Revisa esta guía completa
2. Verifica los logs del backend
3. Consulta la documentación de Prisma
4. Pregunta en el equipo

---

**Tiempo estimado total de migración**: 1-2 horas

**Dificultad**: Media

**Recomendación**: Hacer la migración en un entorno de prueba primero.

