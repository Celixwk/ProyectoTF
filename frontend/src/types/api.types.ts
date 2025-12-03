/**
 * TIPOS TYPESCRIPT BASADOS EN LAS VISTAS DE LA BASE DE DATOS
 * Estos tipos representan exactamente la estructura de las vistas SQL
 */

// ========== VISTA: vw_empleados_completos ==========
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
  salario_base: string; // Decimal as string
  areas_permitidas: number[] | null;
  created_at: string;
  updated_at: string;
}

// ========== VISTA: vw_turnos_asignados ==========
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
  thl: string | null; // Total horas laboradas
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

// ========== VISTA: vw_novedades_completas ==========
export interface NovedadCompleta {
  id_novedad_registro: number;
  fecha_solicitud: string;
  fecha_registro: string;
  fecha_vencimiento: string | null;
  etapa: 'pendiente' | 'aprobada' | 'rechazada' | 'completada';
  id_empleado: number;
  empleado: string;
  cedula: string;
  nombre_cargo: string;
  id_novedad_tipo: number | null;
  codigo_novedad: string | null;
  tipo: string | null;
  afecta_pago: boolean | null;
  fecha_inicio: string | null;
  cantidad: string | null;
  observaciones: string | null;
  usuario_registro: string;
  created_at: string;
  updated_at: string;
}

// ========== VISTA: vw_recargos_completos ==========
export interface RecargoCompleto {
  id_recargo: number;
  fecha_inicio: string;
  fecha_fin: string;
  total_horas: string;
  total_dinero: string;
  dominicales: number;
  festivos: number;
  rno: string; // Recargo Nocturno Ordinario
  rnf: string; // Recargo Nocturno Festivo
  heon: string; // HE Ordinaria Nocturna
  heod: string; // HE Ordinaria Diurna
  hefd: string; // HE Festiva Diurna
  hefn: string; // HE Festiva Nocturna
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

// ========== VISTA: vw_empleados_activos_areas ==========
export interface EmpleadoActivoArea {
  id_empleado: number;
  nombre_completo: string;
  cedula: string;
  estado: boolean;
  nombre_cargo: string;
  salario_base: string;
  areas_permitidas: number[] | null;
  cantidad_areas: number;
}

// ========== VISTA: vw_resumen_labor_mes ==========
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

// ========== MODELOS PRINCIPALES (para CRUD) ==========

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
  created_at: string;
  updated_at: string;
}

export interface Area {
  id_area: number;
  nombre_area: string;
  created_at: string;
  updated_at: string;
}

export interface Turno {
  id_turno: number;
  codigo: string;
  hora_entrada: string;
  hora_salida: string;
  tipo_turno: string;
  estado: boolean;
  created_at: string;
  updated_at: string;
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

// ========== RESPUESTAS DE API ==========

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
    limite: number;
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

