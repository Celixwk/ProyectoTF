export interface EmpleadoCompleto {
  id_empleado: number;
  nombre_completo: string;
  cedula: string;
  edad: number | null;
  sexo: 'M' | 'F' | null;
  vehiculo: string | null;
  estado: boolean;
  id_cargo: number;
  nombre_cargo: string;
  salario_base: string;
  areas_permitidas: number[];
  created_at: string;
  updated_at: string;
}

export interface TurnoAsignado {
  id_detalle_turno: number;
  fecha: string;
  dia_semana: string;
  es_festivo: boolean;
  es_domingo: boolean;
  id_turno: number;
  codigo_turno: string;
  hora_entrada: string;
  hora_salida: string;
  tipo_turno: string;
  thl: string | null;
  id_area: number;
  nombre_area: string;
  id_labor_mes: number;
  id_empleado: number;
  nombre_completo: string;
  cedula: string;
  nombre_cargo: string;
  salario_base: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarioDia {
  id_calendario: number;
  fecha: string;
  es_festivo: boolean;
  es_domingo: boolean;
  nombre_festivo: string | null;
  tipo_festivo: string | null;
}

export interface DetalleNovedad {
  id_detalle_novedad: number;
  id_novedad_empleado: number;
  fecha: string;
  cantidad: number;
  observaciones: string | null;
}

export interface NovedadCompleta {
  id_novedad_empleado: number;
  id_empleado: number;
  id_novedad_tipo: number;
  fecha_solicitud: string;
  fecha_registro: string;
  fecha_vencimiento: string | null;
  etapa: 'Solicitada' | 'En Revision' | 'Aprobada' | 'Rechazada';
  nombre_completo: string;
  cedula: string;
  nombre_cargo: string;
  tipo: string;
  codigo_novedad: string;
  afecta_pago: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  detalle_novedad?: DetalleNovedad[];
  observaciones?: string;
  usuario_registro?: string;
  created_at: string;
  updated_at: string;
  id_novedad_registro?: number;
  empleado?: string;
  cantidad?: number | string;
}

export interface RecargoCompleto {
  id_recargo: number;
  fecha_inicio: string;
  fecha_fin: string;
  total_horas: string;
  total_dinero: string;
  dominicales: number;
  festivos: number;
  rno: string;
  rnf: string;
  heon: string;
  heod: string;
  hefd: string;
  hefn: string;
  id_detalle_turno: number;
  fecha: string;
  codigo_turno: string;
  hora_entrada: string;
  hora_salida: string;
  nombre_area: string;
  id_empleado: number;
  nombre_completo: string;
  cedula: string;
  salario_base: string;
  id_labor_mes: number;
  created_at: string;
  updated_at: string;
}

export interface EmpleadoActivoArea {
  id_empleado: number;
  nombre_completo: string;
  cedula: string;
  estado: boolean;
  nombre_cargo: string;
  salario_base: string;
  areas_permitidas: number[];
  cantidad_areas: number;
}

export interface ResumenLaborMes {
  id_labor_mes: number;
  fecha_inicio: string;
  fecha_fin: string;
  periodo: string;
  id_empleado: number;
  nombre_completo: string;
  cedula: string;
  nombre_cargo: string;
  salario_base: string;
  horas_ordinarias: string;
  total_horas: string;
  total_recargos: string;
  total_turnos: number;
  total_dominicales: number;
  total_festivos: number;
  created_at: string;
  updated_at: string;
}

export interface Empleado {
  id_empleado: number;
  nombre1: string;
  nombre2?: string;
  apellido1: string;
  apellido2?: string;
  cedula: string;
  edad?: number;
  sexo?: 'M' | 'F';
  vehiculo?: string;
  estado: boolean;
  id_cargo: number;
  areas_permitidas?: number[];
  created_at: string;
  updated_at: string;
  cargo?: Cargo;
}

export interface Cargo {
  id_cargo: number;
  nombre_cargo: string;
  salario_base: string;
  areas_permitidas?: number[];
  created_at: string;
  updated_at: string;
}

export interface Area {
  id_area: number;
  nombre_area: string;
  max_trabajadores: number;
  created_at: string;
  updated_at: string;
}

export interface Turno {
  id_turno: number;
  codigo: string;
  hora_entrada: string;
  hora_salida: string;
  tipo_turno: string;
  duracion_horas?: number;
  estado: boolean;
  created_at: string;
  updated_at: string;
  hora_entrada_2?: string | null;
  hora_salida_2?: string | null;
}

export interface TipoNovedad {
  id_novedad_tipo: number;
  codigo: string;
  nombre_novedad: string;
  afecta_pago: boolean;
  created_at: string;
  updated_at: string;
}

export interface TipoRecargo {
  id_tipo_recargo: number;
  codigo: string;
  nombre_recargo: string;
  porcentaje_recargo: string;
  created_at: string;
  updated_at: string;
}

export interface EstadoEmpleado {
  id_estado: number;
  nombre_estado: string;
  created_at: string;
  updated_at: string;
}

export interface Usuario {
  id_usuario: number;
  usuario: string;
  nombre_completo: string;
  tipo_usuario: 'administrador' | 'supervisor' | 'empleado';
  estado: boolean;
  fecha_creacion: string;
  empleado?: Empleado;
}

export interface DashboardEstadisticas {
  empleados: {
    total: number;
    activos: number;
    inactivos: number;
  };
  configuracion: {
    cargos: number;
    areas: number;
    turnos: number;
  };
  operacion: {
    turnosHoy: number;
    novedadesPendientes: number;
    recargosMesActual: number;
  };
}

export interface AlertaMotor {
  tipo: 'error' | 'advertencia' | 'info';
  codigo:
  | 'EMPLEADOS_SIN_ASIGNACION'
  | 'AREA_SIN_PERSONAL'
  | 'AREA_DEFICIT_PERSONAL'
  | 'DIAS_CONSECUTIVOS_EXCEDIDOS'
  | 'DESCANSOS_FALTANTES'
  | 'DESCANSOS_ADVERTENCIA_PROGRESIVA';
  mensaje: string;
  area?: number;
  empleado?: number;
  acciones_sugeridas?: string[];
  empleados_sugeridos?: { id: number; nombre: string }[];
}

export interface ResultadoProgramacion {
  exito: boolean;
  fecha: string;
  asignaciones_realizadas: number;
  huecos_pendientes: number;
  alertas: AlertaMotor[];
  detalles_asignacion?: {
    id_empleado: number;
    nombre_empleado: string;
    id_area: number;
    nombre_area: string;
    codigo_turno: string;
  }[];
}

export interface OpcionesProgramacion {
  maxDiasConsecutivos?: number;
  evitarRefuerzos?: boolean;
  ignorarReglasBlandas?: boolean;
  prioridadesAreas?: Record<number, number>;
  promedioAsignaciones?: number;
  descansosProgramados?: Record<number, number[]>;
}

export interface LoginResponse {
  mensaje: string;
  token: string;
  usuario: Usuario;
}

export interface PaginacionResponse<T> {
  empleados?: T[];
  turnos?: T[];
  novedades?: T[];
  recargos?: T[];
  paginacion: {
    total: number;
    pagina: number;
    limit: number;
    totalPaginas: number;
  };
}

export interface ApiError {
  error: string;
  errores?: Array<{
    campo: string;
    mensaje: string;
    valor: any;
  }>;
}