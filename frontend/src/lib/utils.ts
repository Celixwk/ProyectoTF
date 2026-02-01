import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatear dinero en pesos colombianos
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Formatear fechas
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

// Formatear horas
export function formatTime(time: string): string {
  const date = new Date(time);
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Obtener nombre completo
export function getNombreCompleto(
  nombre1: string,
  nombre2?: string,
  apellido1?: string,
  apellido2?: string
): string {
  return [nombre1, nombre2, apellido1, apellido2]
    .filter(Boolean)
    .join(' ');
}

// Obtener iniciales
export function getIniciales(nombre: string): string {
  return nombre
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Validar cédula colombiana básica
export function validarCedula(cedula: string): boolean {
  return /^\d{7,10}$/.test(cedula);
}

