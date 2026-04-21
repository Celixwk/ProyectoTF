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
  todos: EmpleadoOrdenado[];
}

export interface EmpleadoDisponible extends EmpleadoOrdenado {
  disponible: boolean;
  razonNoDisponible?: string;
  tipoNovedad?: string;
  id_labor_mes?: number;
  horas_acumuladas?: number;
  meta_periodo?: number;
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
  id_asignacion?: number;
  id_labor_mes?: number;
  id_empleado: number;
  cedula?: string;
  id_area: number;
  id_turno: number;
  fecha: Date;
  hora_entrada?: Date;
  hora_salida?: Date;
  periodos?: PeriodoTurno[];
  nombre_empleado?: string;
  nombre_area?: string;
  codigo_turno?: string;
}

export interface Alerta {
  alert_id?: string;
  timestamp?: string;
  tipo: 'error' | 'advertencia' | 'info';
  codigo?: string;
  mensaje: string;
  area?: number;
  empleado?: number;
  fecha?: Date;
  detalles?: any;
  acciones_sugeridas?: string[];
  empleados_sugeridos?: { id: number; nombre: string }[];
  audit_id?: string;
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
  guardado?: {
    realizado: boolean;
    razon?: string;
    guardadas?: number;
    errores?: number;
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
  rotacionForzada?: boolean;
  priorizarEspecialistas?: boolean;
  ignorarReglasBlandas?: boolean;
  maxDiasConsecutivosArea?: number;
  maxDiasConsecutivos?: number;
  descansosRequeridos?: Map<number, number>;
  idUsuario?: number;
  configuracion?: Record<number, { turnosIds: number[] }>;
  preferenciasTurnos?: Record<number, Record<number, number | null>>;
  balancearHoras?: boolean;
  maximoHorasExtras?: number;
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
    periodos?: PeriodoTurno[];
    duracion_horas?: number;
  }>;
  maximosPorArea: Map<number, number>;
  descansos?: Map<number, number[]>;
  programacionAnterior?: Asignacion[];
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

export interface PeriodoTurno {
  hora_entrada: Date;
  hora_salida: Date;
}

export interface Turno {
  id_turno: number;
  codigo?: string;
  hora_entrada: Date;
  hora_salida: Date;
  periodos?: PeriodoTurno[];
  duracion_horas?: number | null;
  hora_entrada_2?: Date;
  hora_salida_2?: Date;
}