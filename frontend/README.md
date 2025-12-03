# Sistema de Nómina - Frontend

Frontend del Sistema de Nómina v2.0 desarrollado con React 18, TypeScript, Vite, Tailwind CSS y Shadcn/UI.

## 🚀 Tecnologías

- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Estilos utility-first
- **Shadcn/UI** - Componentes UI
- **React Query** - Gestión de estado del servidor
- **Zustand** - Estado global (autenticación)
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos
- **Sonner** - Notificaciones toast

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/        # Componentes reutilizables
│   │   ├── layout/       # Layout principal (Sidebar, TopBar)
│   │   └── ui/           # Componentes Shadcn/UI
│   ├── pages/            # Páginas principales
│   │   ├── Login/        # Página de login
│   │   ├── Dashboard/    # Dashboard principal
│   │   ├── Empleados/    # Gestión de empleados
│   │   ├── Turnos/       # Configuración de turnos
│   │   ├── Programacion/ # Programación de turnos
│   │   ├── Recargos/     # Gestión de recargos
│   │   ├── Novedades/    # Gestión de novedades
│   │   └── Configuracion/# Configuración del sistema
│   ├── services/         # Servicios de API
│   ├── store/            # Estado global (Zustand)
│   ├── types/            # Tipos TypeScript
│   ├── lib/              # Utilidades
│   └── config/           # Configuración
├── public/               # Archivos estáticos
└── package.json
```

## 🎯 Características

### ✅ Implementado

- ✅ Autenticación con JWT
- ✅ Layout responsive con Sidebar y TopBar
- ✅ Dashboard con estadísticas y gráficos
- ✅ Módulo de Empleados (usando vista `vw_empleados_completos`)
- ✅ Módulo de Turnos
- ✅ Módulo de Programación (usando vista `vw_turnos_asignados`)
- ✅ Módulo de Recargos (usando vista `vw_recargos_completos`)
- ✅ Módulo de Novedades (usando vista `vw_novedades_completas`)
- ✅ Módulo de Configuración (Cargos, Áreas, Turnos)
- ✅ Integración con vistas de base de datos
- ✅ Tipos TypeScript basados en las vistas SQL

### 🔄 Pendiente

- Formularios de creación/edición (modales)
- Exportación a Excel
- Calendario interactivo completo
- Filtros avanzados
- Paginación mejorada

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## ⚙️ Configuración

Crea un archivo `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

## 📊 Vistas de Base de Datos Utilizadas

El frontend está diseñado para consumir las siguientes vistas SQL:

1. **vw_empleados_completos** - Empleados con toda su información
2. **vw_turnos_asignados** - Turnos con empleados y áreas
3. **vw_novedades_completas** - Novedades con toda la información relacionada
4. **vw_recargos_completos** - Recargos con cálculos y detalles
5. **vw_empleados_activos_areas** - Empleados activos con áreas permitidas
6. **vw_resumen_labor_mes** - Resumen de labor por mes

## 🎨 Componentes UI

Los componentes están basados en Shadcn/UI y Radix UI:

- Button
- Input
- Label
- Card
- Dropdown Menu
- Tabs
- Toast (Sonner)

## 🔐 Autenticación

El sistema usa JWT tokens almacenados en localStorage. El token se envía automáticamente en todas las peticiones mediante interceptores de Axios.

## 📱 Responsive

El diseño es completamente responsive:
- Desktop: Sidebar visible
- Mobile: Sidebar colapsable (pendiente implementar)

## 🚀 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo en `http://localhost:5173`
- `npm run build` - Genera el build de producción
- `npm run preview` - Previsualiza el build de producción
- `npm run lint` - Ejecuta el linter

## 📝 Notas

- El frontend consume las vistas de la base de datos directamente, evitando múltiples queries
- Todos los tipos TypeScript están sincronizados con las vistas SQL
- Se usa React Query para cacheo y sincronización automática
- Zustand para el estado de autenticación (persistente)

