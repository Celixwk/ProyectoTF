# 📋 Qué Copiar del Proyecto Anterior

Este documento lista **exactamente** qué archivos y carpetas copiar del proyecto anterior para completar el nuevo sistema.

## 📍 Ubicaciones

- **Proyecto Anterior**: `C:\Users\jccpp\Downloads\Interfaz Web Sistema Nómina\`
- **Proyecto Nuevo**: `C:\Users\jccpp\Documents\proyecto-nomina\`

---

## ✅ YA COPIADO (No necesitas copiar esto)

Estos elementos ya están en el nuevo proyecto:

- [x] Schema de Prisma (`backend/src/prisma/schema.prisma`)
- [x] Lógica de cálculo de recargos (`backend/src/services/recargos/`)
- [x] Constantes de recargos (`backend/src/utils/recargo.constants.js`)
- [x] Estructura de carpetas completa
- [x] package.json para backend y frontend
- [x] Documentación base (README, MIGRACION)

---

## 📦 FRONTEND - Componentes a Copiar

### 🎨 Componentes de UI (Shadcn) - COPIAR TODO

```bash
# Copiar esta carpeta completa:
FROM: src\components\ui\
TO:   frontend\src\components\ui\
```

**Archivos a copiar (48 archivos)**:
- accordion.tsx
- alert-dialog.tsx
- alert.tsx
- avatar.tsx
- badge.tsx
- button.tsx
- calendar.tsx
- card.tsx
- checkbox.tsx
- dialog.tsx
- dropdown-menu.tsx
- form.tsx
- input.tsx
- label.tsx
- popover.tsx
- select.tsx
- separator.tsx
- sheet.tsx
- skeleton.tsx
- switch.tsx
- table.tsx
- tabs.tsx
- textarea.tsx
- toast.tsx
- tooltip.tsx
- (y otros 23 archivos más)

### 📄 Componentes de Páginas - REVISAR Y COPIAR

**COPIAR ESTOS (son buenos)**:

```bash
# Dashboard
FROM: src\components\Dashboard.tsx
TO:   frontend\src\components\Dashboard.tsx

# Empleados
FROM: src\components\Empleados.tsx
TO:   frontend\src\components\Empleados.tsx

# Cargos
FROM: src\components\Cargos.tsx
TO:   frontend\src\components\Cargos.tsx

# Areas
FROM: src\components\Areas.tsx
TO:   frontend\src\components\Areas.tsx

# Turnos
FROM: src\components\Turnos.tsx
TO:   frontend\src\components\Turnos.tsx

# Novedades
FROM: src\components\Novedades.tsx
TO:   frontend\src\components\Novedades.tsx

# Recargos
FROM: src\components\Recargos.tsx
TO:   frontend\src\components\Recargos.tsx

# TopBar
FROM: src\components\TopBar.tsx
TO:   frontend\src\components\TopBar.tsx

# LoginScreen
FROM: src\components\LoginScreen.tsx
TO:   frontend\src\components\LoginScreen.tsx

# ErrorBoundary
FROM: src\components\ErrorBoundary.tsx
TO:   frontend\src\components\ErrorBoundary.tsx
```

**NO COPIAR ESTOS (están obsoletos o duplicados)**:
- ❌ PlanificacionAvanzada.tsx (dependía de OptaPlanner)
- ❌ PlanificacionModals.tsx (dependía de OptaPlanner)
- ❌ ParametrosProgramacion.tsx (obsoleto)
- ❌ ConfiguracionSistema.tsx (refactorizar más adelante)
- ❌ prev_Turnos.tsx (archivo de backup)

### 🎣 Hooks Personalizados

```bash
FROM: src\hooks\usePersistentSort.ts
TO:   frontend\src\hooks\usePersistentSort.ts
```

### 🛠️ Utilidades

```bash
# API helper (REVISAR Y AJUSTAR)
FROM: src\utils\api.ts
TO:   frontend\src\utils\api.ts

# Nota: Eliminar referencias a MongoDB y ajustar URLs
```

### 🎨 Estilos

```bash
FROM: src\index.css
TO:   frontend\src\index.css

FROM: src\styles\globals.css
TO:   frontend\src\styles\globals.css
```

### 📱 Archivos de Configuración Frontend

```bash
FROM: vite.config.ts
TO:   frontend\vite.config.ts

FROM: index.html
TO:   frontend\index.html

FROM: tailwind.config.js (si existe)
TO:   frontend\tailwind.config.js

FROM: postcss.config.js (si existe)
TO:   frontend\postcss.config.js
```

---

## 🔧 BACKEND - Componentes a Copiar

### 🎮 Controladores - REVISAR Y COPIAR (Eliminar duplicados)

**COPIAR ESTOS (buenos controladores)**:

```bash
FROM: backend\controllers\auth.controller.js
TO:   backend\src\controllers\auth.controller.js

FROM: backend\controllers\empleado.controller.js
TO:   backend\src\controllers\empleado.controller.js

FROM: backend\controllers\turno.controller.js
TO:   backend\src\controllers\turno.controller.js

FROM: backend\controllers\cargo.controller.js
TO:   backend\src\controllers\cargo.controller.js

FROM: backend\controllers\area.controller.js
TO:   backend\src\controllers\area.controller.js

FROM: backend\controllers\novedad.controller.js
TO:   backend\src\controllers\novedad.controller.js

FROM: backend\controllers\recargo.controller.js
TO:   backend\src\controllers\recargo.controller.js

FROM: backend\controllers\dashboard.controller.js
TO:   backend\src\controllers\dashboard.controller.js

FROM: backend\controllers\festivo.controller.js
TO:   backend\src\controllers\festivo.controller.js

FROM: backend\controllers\calendario.controller.js
TO:   backend\src\controllers\calendario.controller.js
```

**NO COPIAR (obsoletos o duplicados)**:
- ❌ parametro.controller.js vs parametros.controller.js (DUPLICADO - copiar solo uno)
- ❌ programacionAvanzada.controller.js (dependía de OptaPlanner)
- ❌ refuerzo.controller.js (revisar si es necesario)

### 🛣️ Rutas - COPIAR Y AJUSTAR

```bash
FROM: backend\routes\auth.routes.js
TO:   backend\src\routes\auth.routes.js

FROM: backend\routes\empleados.routes.js
TO:   backend\src\routes\empleados.routes.js

FROM: backend\routes\turnos.routes.js
TO:   backend\src\routes\turnos.routes.js

FROM: backend\routes\cargos.routes.js
TO:   backend\src\routes\cargos.routes.js

FROM: backend\routes\areas.routes.js
TO:   backend\src\routes\areas.routes.js

FROM: backend\routes\novedades.routes.js
TO:   backend\src\routes\novedades.routes.js

FROM: backend\routes\recargos.routes.js
TO:   backend\src\routes\recargos.routes.js

FROM: backend\routes\dashboard.routes.js
TO:   backend\src\routes\dashboard.routes.js

FROM: backend\routes\festivos.routes.js
TO:   backend\src\routes\festivos.routes.js

FROM: backend\routes\calendario.routes.js
TO:   backend\src\routes\calendario.routes.js
```

**NO COPIAR**:
- ❌ programacion.routes.js (OptaPlanner)

### 🔐 Middlewares

```bash
FROM: backend\middleware\auth.middleware.js
TO:   backend\src\middlewares\auth.middleware.js

FROM: backend\middleware\validation.middleware.js
TO:   backend\src\middlewares\validation.middleware.js

FROM: backend\middleware\security.middleware.js
TO:   backend\src\middlewares\security.middleware.js
```

### 🧰 Utilidades Backend

```bash
FROM: backend\utils\calendarioFestivos.js
TO:   backend\src\utils\calendarioFestivos.js
```

### 📊 Scripts Útiles

```bash
FROM: backend\scripts\crear-admin.js
TO:   backend\src\scripts\crear-admin.js

FROM: backend\scripts\cargar-empleados.js
TO:   backend\src\scripts\cargar-empleados.js

FROM: backend\scripts\sincronizar-calendario.js
TO:   backend\src\scripts\sincronizar-calendario.js
```

**NO COPIAR** (obsoletos):
- ❌ Scripts de inspección (countEmpleados, inspectDatos, etc)
- ❌ Scripts de OptaPlanner

---

## 🗄️ BASE DE DATOS - Migración de Datos

### Opción 1: Usar la BD Existente

Si tienes datos importantes en la BD anterior:

```bash
# 1. Hacer backup
pg_dump -U postgres nomina > backup.sql

# 2. Configurar nuevo proyecto para usar la misma BD
# Editar: backend\.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/nomina"

# 3. Sincronizar schema
cd backend
npm run prisma:db:pull
npm run prisma:generate
```

### Opción 2: Migrar Datos a Nueva BD

```bash
# 1. Exportar datos
# Usar el script en docs/MIGRACION.md

# 2. Importar a nueva BD
# Usar el script de importación
```

---

## 📝 Archivos de Configuración

### Backend

```bash
# Variables de entorno (CREAR NUEVO basado en .env.example)
# NO copiar directamente el .env viejo, tiene cosas obsoletas

# Copiar estos si existen:
FROM: backend\.eslintrc.js (si existe)
TO:   backend\.eslintrc.js

FROM: backend\.prettierrc (si existe)
TO:   backend\.prettierrc
```

### Frontend

```bash
FROM: tsconfig.json
TO:   frontend\tsconfig.json

FROM: tsconfig.node.json
TO:   frontend\tsconfig.node.json
```

---

## ❌ NO COPIAR (Obsoletos o Innecesarios)

### Carpetas Completas a IGNORAR:

- ❌ `optaplanner-service\` - Ya no se usa Java
- ❌ `backend\config\mongodb.js` - Ya no usamos MongoDB
- ❌ `backend\models\` - MongoDB models (obsoleto)
- ❌ `backend\services\optaplanner*` - Servicios de Java
- ❌ `node_modules\` - Se reinstala con npm install

### Archivos a IGNORAR:

- ❌ Cualquier archivo .log
- ❌ package-lock.json (se regenera)
- ❌ .env (crear nuevo con .env.example)
- ❌ Archivos de backup (.bak, .old, etc)

---

## 🚀 Orden Recomendado de Copia

### 1. PRIMERO - Frontend UI (15 min)

```bash
# Copiar toda la carpeta ui
xcopy /E /I "ruta_anterior\src\components\ui" "proyecto-nomina\frontend\src\components\ui"
```

### 2. SEGUNDO - Componentes Principales (30 min)

Copiar uno por uno los componentes listados arriba, ajustando imports si es necesario.

### 3. TERCERO - Backend Controllers y Routes (45 min)

Copiar controllers y routes, ajustando paths:
- Cambiar rutas relativas
- Eliminar referencias a MongoDB
- Eliminar referencias a OptaPlanner

### 4. CUARTO - Middlewares y Utils (15 min)

Copiar middlewares y utilidades auxiliares.

### 5. QUINTO - Configuración (10 min)

Copiar archivos de configuración (vite, tailwind, etc).

### 6. FINALMENTE - Datos (30 min)

Migrar datos de la base de datos.

---

## ✅ Checklist de Archivos Copiados

Usa este checklist para verificar que copiaste todo:

### Frontend
- [ ] Carpeta completa `ui/` (48 archivos)
- [ ] Dashboard.tsx
- [ ] Empleados.tsx
- [ ] Cargos.tsx
- [ ] Areas.tsx
- [ ] Turnos.tsx
- [ ] Novedades.tsx
- [ ] Recargos.tsx
- [ ] TopBar.tsx
- [ ] LoginScreen.tsx
- [ ] ErrorBoundary.tsx
- [ ] Hooks (usePersistentSort)
- [ ] Utils (api.ts ajustado)
- [ ] Estilos (index.css, globals.css)
- [ ] Config (vite.config.ts, tailwind, tsconfig)

### Backend
- [ ] 10 Controllers principales
- [ ] 10 Routes correspondientes
- [ ] 3 Middlewares
- [ ] Utils (calendarioFestivos)
- [ ] Scripts útiles (crear-admin, etc)

### Base de Datos
- [ ] Datos migrados O BD configurada

---

## 📞 Ayuda

Si tienes dudas sobre si copiar un archivo específico:

**PREGÚNTATE**:
1. ¿Depende de MongoDB? → NO COPIAR
2. ¿Depende de OptaPlanner/Java? → NO COPIAR
3. ¿Es un duplicate (parametro vs parametros)? → COPIAR SOLO UNO
4. ¿Es un backup o .log? → NO COPIAR
5. ¿Es un componente UI funcional? → COPIAR

---

**Tiempo total estimado**: 2-3 horas (dependiendo de ajustes necesarios)

