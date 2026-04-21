# Configuración de Programación - Guía Completa

## 📍 Ubicaciones de Configuración

### 1. **Áreas Permitidas por Empleado** 
**Ubicación:** Formulario de Empleado (Página de Empleados)

**Cómo configurar:**
1. Ve a la página **Empleados**
2. Haz clic en **"Nuevo Empleado"** o **"Editar"** en un empleado existente
3. En el formulario, encontrarás la sección **"Áreas Permitidas (Rotación)"**
4. Selecciona las áreas donde el empleado puede rotar usando los checkboxes
5. **Importante:** Cada empleado debe tener al menos una área permitida

**¿Qué hace?**
- Define en qué áreas puede trabajar cada empleado
- El algoritmo de generación automática solo asignará turnos en estas áreas
- Permite controlar la rotación de personal entre diferentes áreas

---

### 2. **Días de Descanso Mensuales**
**Ubicación:** Página de Configuración de Programación

**Cómo configurar:**
1. Ve a **"Config. Programación"** en el menú lateral
2. Selecciona un **empleado** del dropdown
3. Selecciona el **mes** y **año**
4. Haz clic en los días del calendario para marcar/desmarcar días de descanso
5. Opcionalmente agrega **observaciones**
6. Haz clic en **"Guardar Descansos"**

**¿Qué hace?**
- Define qué días del mes cada empleado tendrá descanso
- El algoritmo de generación automática **NO asignará turnos** en estos días
- Se respeta automáticamente al generar programación

---

## 🔧 Archivos Creados/Modificados

### Backend

**Nuevos archivos:**
- `backend/src/controllers/descanso.controller.js` - Controlador para descansos mensuales
- `backend/src/routes/descanso.routes.js` - Rutas API para descansos
- `backend/src/prisma/migrations/add_descansos.sql` - Script SQL para crear tabla

**Archivos modificados:**
- `backend/src/prisma/schema.prisma` - Agregado modelo `DescansoMensual`
- `backend/src/server.js` - Agregada ruta `/api/descansos`
- `backend/src/controllers/programacion.controller.js` - Integrado descansos en generación automática

### Frontend

**Nuevos archivos:**
- `frontend/src/pages/ConfiguracionProgramacion/ConfiguracionProgramacion.tsx` - Página de configuración
- `frontend/src/components/ui/checkbox.tsx` - Componente Checkbox de Shadcn/UI

**Archivos modificados:**
- `frontend/src/components/forms/EmpleadoForm.tsx` - Agregado selector de áreas permitidas
- `frontend/src/pages/Empleados/Empleados.tsx` - Pasa áreas al formulario
- `frontend/src/services/api.service.ts` - Agregado `descansosService`
- `frontend/src/App.tsx` - Agregada ruta de configuración de programación
- `frontend/src/components/layout/Sidebar.tsx` - Agregado enlace en menú

---

## 📋 Endpoints API

### Descansos Mensuales

**GET** `/api/descansos`
- Obtener descanso de un empleado para un mes específico
- Parámetros: `id_empleado`, `mes`, `anio`

**GET** `/api/descansos/empleado/:id_empleado`
- Obtener todos los descansos de un empleado

**POST** `/api/descansos`
- Crear/Actualizar descanso mensual
- Body: `{ id_empleado, mes, anio, dias_descanso: number[], observaciones?: string }`

**DELETE** `/api/descansos`
- Eliminar descanso mensual
- Parámetros: `id_empleado`, `mes`, `anio`

---

## 🗄️ Modelo de Base de Datos

### Tabla: `descanso_mensual`

```sql
CREATE TABLE descanso_mensual (
  id_descanso SERIAL PRIMARY KEY,
  id_empleado INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  anio INTEGER NOT NULL,
  dias_descanso JSON, -- Array de números [1, 5, 15, 20]
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_descanso_empleado_mes UNIQUE (id_empleado, mes, anio),
  FOREIGN KEY (id_empleado) REFERENCES empleado(id_empleado) ON DELETE CASCADE
);
```

---

## 🔄 Integración con Generación Automática

El algoritmo de generación automática ahora:

1. **Consulta descansos mensuales** antes de asignar turnos
2. **Evita asignar turnos** en días de descanso configurados
3. **Respeta áreas permitidas** de cada empleado
4. **Distribuye equitativamente** los turnos entre empleados disponibles

**Flujo:**
```
Para cada día del mes:
  - Si es domingo → No asignar (o lógica especial)
  - Para cada área:
    - Obtener empleados con esta área permitida
    - Rotar empleados
    - Verificar si el empleado tiene descanso ese día
    - Si NO tiene descanso → Asignar turno
    - Si tiene descanso → Saltar empleado
```

---

## 📝 Pasos para Usar

### Configurar Áreas Permitidas:
1. Ir a **Empleados**
2. Editar empleado
3. Seleccionar áreas en **"Áreas Permitidas (Rotación)"**
4. Guardar

### Configurar Descansos:
1. Ir a **Config. Programación**
2. Seleccionar empleado, mes y año
3. Marcar días de descanso en el calendario
4. Guardar

### Generar Programación:
1. Ir a **Programación**
2. Seleccionar mes y año
3. Clic en **"Generar Programación Automática"**
4. El sistema respetará:
   - Áreas permitidas de cada empleado
   - Días de descanso configurados
   - Distribución equitativa

---

## ⚠️ Notas Importantes

1. **Áreas Permitidas:**
   - Si un empleado no tiene áreas asignadas, se asignará a la primera área disponible
   - Es recomendable asignar al menos una área a cada empleado

2. **Descansos:**
   - Los descansos se configuran por mes y año
   - Si no se configuran descansos, el empleado puede trabajar todos los días (excepto domingos)
   - Los descansos se respetan automáticamente en la generación

3. **Generación Automática:**
   - Si ya existe programación para el mes, primero debe eliminarse
   - El algoritmo es heurístico simple (distribución equitativa)
   - Puede mejorarse con algoritmos más avanzados en el futuro

---

## 🚀 Próximos Pasos Sugeridos

1. **Mejorar algoritmo de generación:**
   - Implementar algoritmos genéticos o simulated annealing
   - Considerar preferencias de turnos
   - Optimizar distribución de horas

2. **Reglas adicionales:**
   - Horas máximas por semana
   - Días consecutivos de trabajo
   - Preferencias de turnos por empleado

3. **Validaciones:**
   - Verificar que haya suficientes empleados para cubrir todos los turnos
   - Alertar si un área no tiene empleados disponibles

