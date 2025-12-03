import { z } from 'zod';

// Esquema de validación para Empleado
export const empleadoSchema = z.object({
  nombre1: z.string().min(1, 'El primer nombre es requerido').max(50),
  nombre2: z.string().max(50).optional().or(z.literal('')),
  apellido1: z.string().min(1, 'El primer apellido es requerido').max(50),
  apellido2: z.string().max(50).optional().or(z.literal('')),
  cedula: z.string().min(5, 'La cédula debe tener al menos 5 caracteres').max(20),
  edad: z.coerce.number().int().min(18, 'La edad debe ser mayor a 18').max(100, 'La edad debe ser menor a 100').optional().nullable(),
  sexo: z.enum(['M', 'F']).optional().nullable(),
  vehiculo: z.string().max(50).optional().or(z.literal('')),
  id_cargo: z.coerce.number().int().min(1, 'El cargo es requerido'),
  areas_permitidas: z.array(z.number()).optional(),
});

export type EmpleadoFormData = z.infer<typeof empleadoSchema>;

// Esquema de validación para Cargo
export const cargoSchema = z.object({
  nombre_cargo: z.string().min(1, 'El nombre del cargo es requerido').max(100),
  salario_base: z.coerce.number().min(0, 'El salario debe ser mayor o igual a 0'),
  areas_permitidas: z.array(z.number()).optional(),
});

export type CargoFormData = z.infer<typeof cargoSchema>;

// Esquema de validación para Área
export const areaSchema = z.object({
  nombre_area: z.string().min(1, 'El nombre del área es requerido').max(100),
});

export type AreaFormData = z.infer<typeof areaSchema>;

// Esquema de validación para Turno
export const turnoSchema = z.object({
  codigo: z.string().min(1, 'El código del turno es requerido').max(20).regex(/^T\d+$/, 'El código debe empezar con T seguido de números (ej: T1, T2, T11)'),
  tipo_turno: z.string().max(50).optional().or(z.literal('')),
  hora_entrada: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  hora_salida: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  estado: z.boolean().optional().default(true),
});

export type TurnoFormData = z.infer<typeof turnoSchema>;

// Esquema de validación para Tipo de Novedad
export const tipoNovedadSchema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(20),
  nombre_novedad: z.string().min(1, 'El nombre es requerido').max(100),
  afecta_pago: z.boolean(),
});

export type TipoNovedadFormData = z.infer<typeof tipoNovedadSchema>;

