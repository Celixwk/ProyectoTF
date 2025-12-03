# 📊 Modelos de Datos - Sistema de Nómina

## 📋 Índice

1. [Empleado](#empleado)
2. [Cargo](#cargo)
3. [Área](#área)
4. [Turno](#turno)
5. [Usuario](#usuario)
6. [LaborMes](#labor-mes)
7. [DetalleProgramacion](#detalle-programacion)
8. [TipoNovedad](#tipo-novedad)
9. [NovedadEmpleado](#novedad-empleado)
10. [DetalleNovedad](#detalle-novedad)
11. [TipoRecargo](#tipo-recargo)
12. [Recargo](#recargo)
13. [DetalleRecargo](#detalle-recargo)
14. [Calendario](#calendario)
15. [Parametrizacion](#parametrizacion)

---

## Empleado

Representa a un empleado del sistema.

```typescript
interface Empleado {
  id_empleado: number;          // ID único del empleado
  nombre1: string;               // Primer nombre (requerido)
  nombre2?: string;              // Segundo nombre (opcional)
  apellido1: string;             // Primer apellido (requerido)
  apellido2?: string;            // Segundo apellido (opcional)
  cedula: string;                // Cédula única (requerido)
  edad?: number;                 // Edad (18-100)
  sexo?: 'M' | 'F';             // Sexo
  vehiculo?: string;             // Placa del vehículo
  estado: boolean;               // Activo/Inactivo
  id_cargo: number;              // ID del cargo
  areas_permitidas: number[];    // Array de IDs de áreas
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  cargo?: Cargo;
  usuario?: Usuario;
}
```

**Validaciones:**
- `cedula`: Debe ser única en el sistema
- `edad`: Entre 18 y 100 años
- `sexo`: Solo 'M' o 'F'
- `id_cargo`: Debe existir en la tabla Cargo

**Ejemplo:**
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
  "updated_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Cargo

Representa un puesto de trabajo con su salario base.

```typescript
interface Cargo {
  id_cargo: number;              // ID único del cargo
  nombre_cargo: string;          // Nombre del cargo (requerido)
  salario_base: Decimal;         // Salario mensual base
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  empleados?: Empleado[];
}
```

**Validaciones:**
- `nombre_cargo`: Requerido, texto
- `salario_base`: Número positivo, 2 decimales

**Ejemplo:**
```json
{
  "id_cargo": 1,
  "nombre_cargo": "Operario General",
  "salario_base": "1300000.00",
  "created_at": "2024-11-18T00:00:00.000Z",
  "updated_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Área

Representa un área o departamento de trabajo.

```typescript
interface Area {
  id_area: number;               // ID única del área
  nombre_area: string;           // Nombre del área (requerido)
  created_at: Date;
  updated_at: Date;
}
```

**Ejemplo:**
```json
{
  "id_area": 1,
  "nombre_area": "Producción",
  "created_at": "2024-11-18T00:00:00.000Z",
  "updated_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Turno

Representa un turno de trabajo con horarios definidos.

```typescript
interface Turno {
  id_turno: number;              // ID único del turno
  codigo: string;                // Código único del turno
  hora_entrada: Time;            // Hora de inicio (HH:mm:ss)
  hora_salida: Time;             // Hora de fin (HH:mm:ss)
  tipo_turno: string;            // Tipo: Diurno, Nocturno, etc.
  estado: boolean;               // Activo/Inactivo
  created_at: Date;
  updated_at: Date;
}
```

**Validaciones:**
- `codigo`: Debe ser único
- `hora_entrada` y `hora_salida`: Formato HH:mm:ss

**Tipos comunes:**
- Diurno (6:00 - 14:00)
- Tarde (14:00 - 22:00)
- Nocturno (22:00 - 6:00)
- Madrugada (0:00 - 6:00)

**Ejemplo:**
```json
{
  "id_turno": 1,
  "codigo": "DIA",
  "hora_entrada": "1970-01-01T06:00:00.000Z",
  "hora_salida": "1970-01-01T14:00:00.000Z",
  "tipo_turno": "Diurno",
  "estado": true,
  "created_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Usuario

Representa un usuario del sistema con permisos.

```typescript
interface Usuario {
  id_usuario: number;            // ID único del usuario
  usuario: string;               // Nombre de usuario único
  contrasenia: string;           // Contraseña hasheada (bcrypt)
  tipo_usuario: string;          // Rol: admin, supervisor, empleado
  nombre_completo: string;       // Nombre completo del usuario
  estado: boolean;               // Activo/Inactivo
  fecha_creacion: Date;          // Fecha de creación
  id_empleado?: number;          // ID del empleado asociado
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  empleado?: Empleado;
}
```

**Roles disponibles:**
- `administrador` / `admin`: Acceso total
- `supervisor`: Puede gestionar empleados y turnos
- `empleado`: Solo lectura de su información

**Validaciones:**
- `usuario`: Debe ser único
- `contrasenia`: Mínimo 6 caracteres
- `tipo_usuario`: Uno de los roles válidos

**Ejemplo:**
```json
{
  "id_usuario": 1,
  "usuario": "admin",
  "tipo_usuario": "administrador",
  "nombre_completo": "Administrador del Sistema",
  "estado": true,
  "fecha_creacion": "2024-11-18T00:00:00.000Z",
  "id_empleado": null
}
```

---

## Labor Mes

Representa el período mensual de trabajo de un empleado.

```typescript
interface LaborMes {
  id: number;                    // ID único
  fecha_inicio: Date;            // Inicio del período
  fecha_fin: Date;               // Fin del período
  horas_ordinarias: Decimal;     // Horas ordinarias trabajadas
  total_horas: Decimal;          // Total de horas (incluyendo extras)
  total_recargos: Decimal;       // Total en dinero de recargos
  id_empleado: number;           // ID del empleado
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  empleado?: Empleado;
  detalle_programacion?: DetalleProgramacion[];
}
```

**Ejemplo:**
```json
{
  "id": 1,
  "fecha_inicio": "2024-11-01T00:00:00.000Z",
  "fecha_fin": "2024-11-30T00:00:00.000Z",
  "horas_ordinarias": "176.00",
  "total_horas": "195.50",
  "total_recargos": "850000.00",
  "id_empleado": 1,
  "created_at": "2024-11-01T00:00:00.000Z"
}
```

---

## Detalle Programacion

Representa la asignación de un turno específico a un empleado en una fecha.

```typescript
interface DetalleProgramacion {
  id_detalle_turno: number;      // ID único
  fecha: Date;                   // Fecha del turno
  id_area: number;               // Área donde trabajará
  total_horas_laboradas: Decimal;// Horas trabajadas
  fk_id_labor_mes: number;       // ID del labor mes
  fk_id_turno: number;           // ID del turno asignado
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  labor_mes?: LaborMes;
  turno?: Turno;
  area?: Area;
  recargo?: Recargo[];
}
```

**Ejemplo:**
```json
{
  "id_detalle_turno": 1,
  "fecha": "2024-11-20T00:00:00.000Z",
  "id_area": 1,
  "total_horas_laboradas": "8.00",
  "fk_id_labor_mes": 1,
  "fk_id_turno": 1,
  "created_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Tipo Novedad

Representa los tipos de novedades que pueden tener los empleados.

```typescript
interface TipoNovedad {
  id_novedad_tipo: number;       // ID único
  codigo: string;                // Código único
  nombre_novedad: string;        // Nombre descriptivo
  afecta_pago: boolean;          // Si afecta el pago del empleado
  created_at: Date;
  updated_at: Date;
}
```

**Tipos predefinidos:**
- `INCAP`: Incapacidad (afecta pago)
- `VAC`: Vacaciones (no afecta pago)
- `PERM`: Permiso (afecta pago)
- `LIC`: Licencia (no afecta pago)
- `AUS`: Ausencia (afecta pago)
- `SUSP`: Suspensión (afecta pago)

**Ejemplo:**
```json
{
  "id_novedad_tipo": 1,
  "codigo": "INCAP",
  "nombre_novedad": "Incapacidad",
  "afecta_pago": true,
  "created_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Novedad Empleado

Representa una novedad registrada para un empleado.

```typescript
interface NovedadEmpleado {
  id_novedad_registro: number;   // ID único
  fecha_solicitud: Date;         // Fecha de solicitud
  fecha_registro: Date;          // Fecha de registro
  fecha_vencimiento?: Date;      // Fecha de vencimiento
  etapa: string;                 // Estado: pendiente, aprobada, rechazada
  id_usuario: number;            // Usuario que registró
  id_empleado: number;           // Empleado afectado
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  empleado?: Empleado;
  usuario?: Usuario;
  detalle_novedad?: DetalleNovedad[];
}
```

**Estados válidos:**
- `pendiente`: Esperando aprobación
- `aprobada`: Aprobada por supervisor
- `rechazada`: Rechazada
- `completada`: Finalizada

**Ejemplo:**
```json
{
  "id_novedad_registro": 1,
  "fecha_solicitud": "2024-11-15T00:00:00.000Z",
  "fecha_registro": "2024-11-15T00:00:00.000Z",
  "fecha_vencimiento": "2024-11-20T00:00:00.000Z",
  "etapa": "pendiente",
  "id_usuario": 1,
  "id_empleado": 1,
  "created_at": "2024-11-15T00:00:00.000Z"
}
```

---

## Detalle Novedad

Representa el detalle de una novedad (días, fechas, observaciones).

```typescript
interface DetalleNovedad {
  id_detalle_novedad: number;    // ID único
  fecha: Date;                   // Fecha del detalle
  cantidad?: Decimal;            // Cantidad (días, horas, etc.)
  observaciones?: string;        // Observaciones adicionales
  id_novedad_registro: number;   // ID de la novedad
  id_novedad_tipo: number;       // Tipo de novedad
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  novedad_empleado?: NovedadEmpleado;
  tipo_novedad?: TipoNovedad;
}
```

**Ejemplo:**
```json
{
  "id_detalle_novedad": 1,
  "fecha": "2024-11-16T00:00:00.000Z",
  "cantidad": "1.00",
  "observaciones": "Incapacidad médica general",
  "id_novedad_registro": 1,
  "id_novedad_tipo": 1,
  "created_at": "2024-11-15T00:00:00.000Z"
}
```

---

## Tipo Recargo

Representa los tipos de recargos con sus porcentajes.

```typescript
interface TipoRecargo {
  id_tipo_recargo: number;       // ID único
  codigo: string;                // Código único
  nombre_recargo: string;        // Nombre descriptivo
  porcentaje_recargo: Decimal;   // Porcentaje aplicable
  created_at: Date;
  updated_at: Date;
}
```

**Tipos predefinidos:**
- `RNO`: Recargo Nocturno Ordinario (35%)
- `RNF`: Recargo Nocturno Festivo (110%)
- `D`: Dominical (75%)
- `F`: Festivo (75%)
- `HEOD`: Hora Extra Ordinaria Diurna (25%)
- `HEON`: Hora Extra Ordinaria Nocturna (75%)
- `HEFD`: Hora Extra Festiva Diurna (100%)
- `HEFN`: Hora Extra Festiva Nocturna (150%)

**Ejemplo:**
```json
{
  "id_tipo_recargo": 1,
  "codigo": "RNO",
  "nombre_recargo": "Recargo Nocturno Ordinario",
  "porcentaje_recargo": "35.00",
  "created_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Recargo

Representa el cálculo consolidado de recargos de un turno.

```typescript
interface Recargo {
  id_recargo: number;            // ID único
  total_horas: Decimal;          // Total horas con recargo
  total_dinero: Decimal;         // Total en dinero
  dominicales: number;           // Cantidad de dominicales
  festivos: number;              // Cantidad de festivos
  rno: Decimal;                  // Horas RNO
  rnf: Decimal;                  // Horas RNF
  heon: Decimal;                 // Horas HEON
  heod: Decimal;                 // Horas HEOD
  hefd: Decimal;                 // Horas HEFD
  hefn: Decimal;                 // Horas HEFN
  fecha_inicio: Date;            // Inicio del período
  fecha_fin: Date;               // Fin del período
  fk_id_detalle_turno: number;   // ID del detalle turno
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  detalle_programacion?: DetalleProgramacion;
  detalle_recargo?: DetalleRecargo[];
}
```

**Ejemplo:**
```json
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
  "fk_id_detalle_turno": 1,
  "created_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Detalle Recargo

Representa el desglose detallado de cada tipo de recargo calculado.

```typescript
interface DetalleRecargo {
  id_recargo: number;            // ID del recargo
  id_tipo_recargo: number;       // ID del tipo de recargo
  cantidad: Decimal;             // Cantidad de horas
  valor_calculado: Decimal;      // Valor en dinero
  created_at: Date;
  updated_at: Date;
  
  // Relaciones
  recargo?: Recargo;
  tipo_recargo?: TipoRecargo;
}
```

**Ejemplo:**
```json
{
  "id_recargo": 1,
  "id_tipo_recargo": 1,
  "cantidad": "5.50",
  "valor_calculado": "125000.00",
  "created_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Calendario

Representa los días especiales (festivos, domingos).

```typescript
interface Calendario {
  id_calendario: number;         // ID único
  fecha: Date;                   // Fecha del día
  es_festivo: boolean;           // Es día festivo
  es_domingo: boolean;           // Es domingo
  nombre_festivo?: string;       // Nombre del festivo
  tipo_festivo?: string;         // Tipo: nacional, regional, local
  created_at: Date;
  updated_at: Date;
}
```

**Tipos de festivo:**
- `nacional`: Festivo nacional
- `regional`: Festivo regional
- `local`: Festivo local

**Ejemplo:**
```json
{
  "id_calendario": 1,
  "fecha": "2024-11-11T00:00:00.000Z",
  "es_festivo": true,
  "es_domingo": false,
  "nombre_festivo": "Día de la Independencia",
  "tipo_festivo": "nacional",
  "created_at": "2024-11-18T00:00:00.000Z"
}
```

---

## Parametrizacion

Representa parámetros configurables del sistema.

```typescript
interface Parametrizacion {
  id_parametro: number;          // ID único
  nombre_parametro: string;      // Nombre único del parámetro
  valor_numerico?: Decimal;      // Valor numérico
  valor_texto?: string;          // Valor de texto
  descripcion?: string;          // Descripción
  tipo_parametro: string;        // Tipo: numerico, texto, booleano
  categoria?: string;            // Categoría: recargos, novedades, etc.
  activo: boolean;               // Activo/Inactivo
  fecha_vigencia_inicio?: Date;  // Desde cuándo aplica
  fecha_vigencia_fin?: Date;     // Hasta cuándo aplica
  created_at: Date;
  updated_at: Date;
}
```

**Tipos de parámetro:**
- `numerico`: Valores numéricos
- `texto`: Valores de texto
- `booleano`: true/false

**Categorías comunes:**
- `recargos`: Parámetros de cálculo de recargos
- `novedades`: Parámetros de novedades
- `turnos`: Parámetros de turnos
- `general`: Configuración general

**Ejemplo:**
```json
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
  "fecha_vigencia_fin": null,
  "created_at": "2024-11-18T00:00:00.000Z"
}
```

---

## 📐 Diagrama de Relaciones

```
Usuario ──────┐
              │
              ├─> Empleado ──> Cargo
              │      │
              │      └──> LaborMes ──> DetalleProgramacion ──> Turno
              │                 │              │                  │
              │                 │              └──> Area         │
              │                 │                                 │
              │                 └──> Recargo <───────────────────┘
              │                         │
              └──> NovedadEmpleado      └──> DetalleRecargo ──> TipoRecargo
                        │
                        └──> DetalleNovedad ──> TipoNovedad

Calendario (independiente, consultado para cálculos)
Parametrizacion (independiente, configuración general)
```

---

## 🔢 Tipos de Datos

### Decimal
Números con precisión decimal para cálculos monetarios y de horas.
- Formato: `"1300000.00"` (string)
- Precisión: 2 decimales

### Date/DateTime
Fechas y horas en formato ISO 8601.
- Formato: `"2024-11-18T00:00:00.000Z"`
- Zona horaria: UTC

### Time
Horas del día.
- Formato en API: `"06:00:00"` (HH:mm:ss)
- Almacenado como: `"1970-01-01T06:00:00.000Z"`

### Boolean
Valores verdadero/falso.
- Formato: `true` o `false`

---

## 📝 Notas Importantes

1. **IDs autoincrementales**: Todos los modelos tienen IDs autogenerados
2. **Timestamps automáticos**: `created_at` y `updated_at` se generan automáticamente
3. **Soft deletes**: Empleados y turnos se desactivan (`estado: false`) en lugar de eliminarse
4. **Integridad referencial**: Las relaciones están protegidas por foreign keys
5. **Validaciones en API**: La validación se realiza en la capa de API antes de guardar

---

**Para más información, consulta:**
- [Documentación de API](./API_DOCUMENTACION.md)
- [Ejemplos de uso](./EJEMPLOS.md)

