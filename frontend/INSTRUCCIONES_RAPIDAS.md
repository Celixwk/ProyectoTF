# 🚀 Instrucciones Rápidas - Frontend

## Instalación

```bash
cd frontend
npm install
```

## Configuración

Crea un archivo `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

## Iniciar Servidor de Desarrollo

```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## Credenciales por Defecto

- **Usuario**: `admin`
- **Contraseña**: `admin123`

## Estructura de Módulos

### ✅ Módulos Implementados

1. **Login** (`/login`)
   - Autenticación con JWT
   - Persistencia de sesión

2. **Dashboard** (`/dashboard`)
   - Estadísticas generales
   - Gráficos de recargos
   - Turnos del día
   - Empleados más activos

3. **Empleados** (`/empleados`)
   - Listado usando vista `vw_empleados_completos`
   - Búsqueda y filtros
   - Paginación

4. **Turnos** (`/turnos`)
   - Configuración de turnos
   - Listado y gestión

5. **Programación** (`/programacion`)
   - Vista de turnos asignados
   - Usa vista `vw_turnos_asignados`
   - Filtros por fecha y empleado

6. **Recargos** (`/recargos`)
   - Listado usando vista `vw_recargos_completos`
   - Estadísticas y totales
   - Detalle de tipos de recargos

7. **Novedades** (`/novedades`)
   - Listado usando vista `vw_novedades_completas`
   - Filtros por etapa
   - Aprobación/Rechazo

8. **Configuración** (`/configuracion`)
   - Gestión de Cargos
   - Gestión de Áreas
   - Gestión de Turnos

## Vistas de Base de Datos Utilizadas

El frontend consume directamente las vistas SQL:

- `vw_empleados_completos` - Empleados con toda la info
- `vw_turnos_asignados` - Turnos con empleados y áreas
- `vw_novedades_completas` - Novedades completas
- `vw_recargos_completos` - Recargos con cálculos
- `vw_empleados_activos_areas` - Empleados activos
- `vw_resumen_labor_mes` - Resumen mensual

## Tecnologías

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Shadcn/UI
- React Query (cacheo)
- Zustand (estado global)
- Axios (HTTP client)
- React Router (navegación)

## Próximos Pasos

- [ ] Formularios de creación/edición (modales)
- [ ] Exportación a Excel
- [ ] Calendario interactivo completo
- [ ] Validaciones con Zod
- [ ] Mejoras en UX

