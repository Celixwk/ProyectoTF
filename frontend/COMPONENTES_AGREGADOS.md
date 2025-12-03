# Componentes UI Agregados

Este documento lista los componentes UI adicionales que se han agregado al frontend para completar la funcionalidad.

## Componentes UI Disponibles

### ✅ Componentes Base (Ya estaban)
- `button.tsx` - Botones con variantes
- `card.tsx` - Tarjetas de contenido
- `input.tsx` - Campos de entrada
- `label.tsx` - Etiquetas para formularios
- `tabs.tsx` - Pestañas de navegación
- `dropdown-menu.tsx` - Menús desplegables

### ✅ Componentes Nuevos Agregados

#### 1. **Dialog** (`dialog.tsx`)
Componente modal para mostrar contenido en overlay.

**Uso:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger>Abrir</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descripción</DialogDescription>
    </DialogHeader>
    {/* Contenido */}
    <DialogFooter>
      <Button>Cerrar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 2. **Select** (`select.tsx`)
Componente de selección desplegable.

**Uso:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Selecciona..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opción 1</SelectItem>
    <SelectItem value="option2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

#### 3. **Table** (`table.tsx`)
Componente de tabla reutilizable.

**Uso:**
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Columna 1</TableHead>
      <TableHead>Columna 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Dato 1</TableCell>
      <TableCell>Dato 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### 4. **AlertDialog** (`alert-dialog.tsx`)
Diálogo de confirmación para acciones importantes.

**Uso:**
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger>Eliminar</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction>Eliminar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

#### 5. **Skeleton** (`skeleton.tsx`)
Componente de carga/esqueleto para estados de carga.

**Uso:**
```tsx
import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-12 w-full" />
<Skeleton className="h-8 w-1/2" />
```

### ✅ Componentes de Sistema

#### 6. **ErrorBoundary** (`ErrorBoundary.tsx`)
Componente para capturar y manejar errores de React.

**Ya está integrado en `main.tsx`**, pero puedes usarlo también en componentes específicos:

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary"

<ErrorBoundary>
  <TuComponente />
</ErrorBoundary>
```

## Utilidades Disponibles

Todas en `src/lib/utils.ts`:

- `cn()` - Función para combinar clases de Tailwind
- `formatCurrency()` - Formatear dinero en pesos colombianos
- `formatDate()` - Formatear fechas completas
- `formatDateShort()` - Formatear fechas cortas
- `formatTime()` - Formatear horas
- `getNombreCompleto()` - Obtener nombre completo
- `getIniciales()` - Obtener iniciales
- `validarCedula()` - Validar cédula colombiana

## Configuración

### Variables de Entorno

Archivo `.env.example` creado con:
- `VITE_API_URL` - URL base de la API (default: `http://localhost:5000/api`)

Para usar, copia a `.env`:
```bash
cp .env.example .env
```

## Próximos Pasos Sugeridos

1. **Crear formularios** con React Hook Form + Zod usando los componentes Dialog
2. **Implementar tablas** en las páginas de listado usando el componente Table
3. **Agregar confirmaciones** con AlertDialog para acciones destructivas
4. **Mejorar estados de carga** usando Skeleton en lugar de spinners simples
5. **Validar formularios** con Zod schemas para mejor experiencia de usuario

## Dependencias Instaladas

Todos los componentes usan dependencias ya instaladas en `package.json`:
- `@radix-ui/react-dialog`
- `@radix-ui/react-select`
- `@radix-ui/react-alert-dialog`
- `class-variance-authority`
- `clsx` y `tailwind-merge`

No se requiere instalación adicional.

