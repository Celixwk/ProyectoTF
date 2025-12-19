/**
 * Tipos TypeScript compartidos para el sistema de programación por capas
 */

export type TipoClasificacion = 'especialista' | 'flexible' | 'comodin';

export interface EmpleadoOrdenado {
  id_empleado: number;
  nombre_completo: string;
  cedula: string;
  total_areas: number;
  clasificacion: TipoClasificacion;
  areas: Array<{
    id_area: number;
    nombre_area: string;
  }>;
  id_estado?: number | null;
  cargo?: {
    id_cargo: number;
    nombre_cargo: string;
  };
  activo?: boolean;
}

export interface EmpleadosClasificados {
  especialistas: EmpleadoOrdenado[];
  flexibles: EmpleadoOrdenado[];
  comodines: EmpleadoOrdenado[];
  todos: EmpleadoOrdenado[]; // Ordenados: especialistas primero, luego flexibles, luego comodines
}

export interface EmpleadoDisponible extends EmpleadoOrdenado {
  disponible: boolean;
  razonNoDisponible?: string;
  tipoNovedad?: string; // 'INCAP', 'LIC', 'AUS', etc.
}

export interface NovedadPorFecha {
  id_empleado: number;
  tipo_novedad: string;
  codigo: string;
  fecha_inicio: Date;
  fecha_fin: Date;
}

export interface AreaPriorizada {
  id_area: number;
  nombre_area: string;
  prioridad: number;
  maximo_trabajadores?: number;
}

export interface Hueco {
  id_area: number;
  nombre_area: string;
  deficit: number;
  prioridad: number;
  trabajadores_actuales: number;
  trabajadores_requeridos: number;
}

export interface Asignacion {
  id_empleado: number;
  id_area: number;
  id_turno: number;
  fecha: Date;
  nombre_empleado?: string;
  nombre_area?: string;
  codigo_turno?: string;
}

export interface Alerta {
  tipo: 'error' | 'advertencia' | 'info';
  mensaje: string;
  area?: number;
  empleado?: number;
  fecha?: Date;
  codigo?: string; // Código único para identificar el tipo de alerta
}

export interface ProgramacionDia {
  fecha: Date;
  asignaciones: Asignacion[];
  alertas: Alerta[];
  resumen: {
    total_asignaciones: number;
    total_empleados: number;
    total_areas: number;
    huecos: Hueco[];
  };
}

export interface ValidacionReglasDuras {
  valido: boolean;
  razon?: string;
  codigo?: string;
}

export interface ValidacionReglasBlandas {
  violaciones: string[];
  advertencias: string[];
}

export interface OpcionesGeneracion {
  rotacionForzada?: boolean; // Deshabilitar reglas temporalmente
  priorizarEspecialistas?: boolean;
  ignorarReglasBlandas?: boolean;
  maxDiasConsecutivosArea?: number; // Por defecto 3
}

export interface ParamsGenerarAsignaciones {
  fecha: Date;
  areas: Array<{
    id_area: number;
    nombre_area: string;
    maximo_trabajadores?: number;
  }>;
  turnos: Array<{
    id_turno: number;
    codigo?: string;
    hora_entrada: Date;
    hora_salida: Date;
    duracion_horas?: number;
  }>;
  maximosPorArea: Map<number, number>;
  descansos?: Map<number, number[]>; // id_empleado -> [días del mes]
  programacionAnterior?: Asignacion[]; // Para verificar días consecutivos
  opciones?: OpcionesGeneracion;
}

export interface ResultadoMotor {
  asignaciones: Asignacion[];
  alertas: Alerta[];
  empleadosSinAsignar: number[];
  huecos: Hueco[];
  estadisticas: {
    total_empleados_disponibles: number;
    total_empleados_asignados: number;
    total_empleados_sin_asignar: number;
    distribucion_por_clasificacion: {
      especialistas: number;
      flexibles: number;
      comodines: number;
    };
  };
}











