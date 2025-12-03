/**
 * SERVICIO DE API - Consumo de endpoints usando las VISTAS
 * Las vistas ya tienen JOINs y datos pre-procesados
 */

import api from '../config/api.config';
import type {
  EmpleadoCompleto,
  TurnoAsignado,
  NovedadCompleta,
  RecargoCompleto,
  EmpleadoActivoArea,
  ResumenLaborMes,
  LoginResponse,
  DashboardEstadisticas,
  Cargo,
  Area,
  Turno,
  TipoNovedad,
  TipoRecargo,
  CalendarioDia,
} from '../types/api.types';

// ========== AUTENTICACIÓN ==========

export const authService = {
  login: async (usuario: string, contrasenia: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', { usuario, contrasenia });
    return data;
  },

  obtenerPerfil: async () => {
    const { data } = await api.get('/auth/perfil');
    return data;
  },

  cambiarContrasenia: async (contraseniaActual: string, contraseniaNueva: string) => {
    const { data } = await api.put('/auth/cambiar-contrasenia', {
      contraseniaActual,
      contraseniaNueva,
    });
    return data;
  },
};

// ========== VISTAS (Datos pre-procesados) ==========

export const vistasService = {
  // Empleados completos (con cargo y toda la info)
  obtenerEmpleadosCompletos: async (params?: {
    estado?: boolean;
    busqueda?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<{ empleados: EmpleadoCompleto[]; paginacion: any }>(
      '/vistas/empleados-completos',
      { params }
    );
    return data;
  },

  // Turnos asignados (con empleado, área, calendario)
  obtenerTurnosAsignados: async (params?: {
    id_empleado?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<{ turnos: TurnoAsignado[]; total: number }>(
      '/vistas/turnos-asignados',
      { params }
    );
    return data;
  },

  // Novedades completas (con empleado, tipo, usuario)
  obtenerNovedadesCompletas: async (params?: {
    id_empleado?: number;
    etapa?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<{ novedades: NovedadCompleta[]; total: number }>(
      '/vistas/novedades-completas',
      { params }
    );
    return data;
  },

  // Recargos completos (con empleado, turno, cálculos)
  obtenerRecargosCompletos: async (params?: {
    id_empleado?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<{ recargos: RecargoCompleto[]; total: number }>(
      '/vistas/recargos-completos',
      { params }
    );
    return data;
  },

  // Empleados activos con áreas
  obtenerEmpleadosActivosAreas: async () => {
    const { data } = await api.get<EmpleadoActivoArea[]>('/vistas/empleados-activos-areas');
    return data;
  },

  // Resumen labor mes
  obtenerResumenLaborMes: async (params?: {
    id_empleado?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) => {
    const { data } = await api.get<ResumenLaborMes[]>('/vistas/resumen-labor-mes', { params });
    return data;
  },
};

// ========== CRUD NORMAL ==========

export const empleadosService = {
  listar: async (params?: any) => {
    const { data } = await api.get('/empleados', { params });
    return data;
  },

  obtener: async (id: number) => {
    const { data } = await api.get(`/empleados/${id}`);
    return data;
  },

  crear: async (empleado: any) => {
    const { data } = await api.post('/empleados', empleado);
    return data;
  },

  actualizar: async (id: number, empleado: any) => {
    const { data } = await api.put(`/empleados/${id}`, empleado);
    return data;
  },

  eliminar: async (id: number) => {
    const { data } = await api.delete(`/empleados/${id}`);
    return data;
  },

  obtenerActivos: async () => {
    const { data } = await api.get('/empleados/activos');
    return data;
  },
};

export const cargosService = {
  listar: async () => {
    const { data } = await api.get<Cargo[]>('/cargos');
    return data;
  },

  crear: async (cargo: Partial<Cargo>) => {
    const { data } = await api.post('/cargos', cargo);
    return data;
  },

  actualizar: async (id: number, cargo: Partial<Cargo>) => {
    const { data } = await api.put(`/cargos/${id}`, cargo);
    return data;
  },

  eliminar: async (id: number) => {
    const { data } = await api.delete(`/cargos/${id}`);
    return data;
  },
};

export const areasService = {
  listar: async () => {
    const { data } = await api.get<Area[]>('/areas');
    return data;
  },

  crear: async (area: Partial<Area>) => {
    const { data } = await api.post('/areas', area);
    return data;
  },

  actualizar: async (id: number, area: Partial<Area>) => {
    const { data } = await api.put(`/areas/${id}`, area);
    return data;
  },

  eliminar: async (id: number) => {
    const { data } = await api.delete(`/areas/${id}`);
    return data;
  },
};

export const turnosService = {
  listar: async (params?: { estado?: boolean }) => {
    const { data } = await api.get<Turno[]>('/turnos', { params });
    return data;
  },

  crear: async (turno: Partial<Turno>) => {
    const { data } = await api.post('/turnos', turno);
    return data;
  },

  asignar: async (asignacion: {
    id_empleado: number;
    id_turno: number;
    id_area: number;
    fecha: string;
    fecha_inicio: string;
    fecha_fin: string;
  }) => {
    const { data } = await api.post('/turnos/asignar', asignacion);
    return data;
  },

  actualizar: async (id: number, turno: Partial<Turno>) => {
    const { data } = await api.put(`/turnos/${id}`, turno);
    return data;
  },

  eliminar: async (id: number) => {
    const { data } = await api.delete(`/turnos/${id}`);
    return data;
  },
};

export const novedadesService = {
  listarTipos: async () => {
    const { data } = await api.get<TipoNovedad[]>('/novedades/tipos');
    return data;
  },

  crearTipo: async (tipo: { codigo: string; nombre_novedad: string; afecta_pago: boolean }) => {
    const { data } = await api.post('/novedades/tipos', tipo);
    return data;
  },

  actualizarTipo: async (id: number, tipo: { nombre_novedad?: string; afecta_pago?: boolean }) => {
    const { data } = await api.put(`/novedades/tipos/${id}`, tipo);
    return data;
  },

  eliminarTipo: async (id: number) => {
    const { data } = await api.delete(`/novedades/tipos/${id}`);
    return data;
  },

  crear: async (novedad: any) => {
    const { data } = await api.post('/novedades', novedad);
    return data;
  },

  actualizarEstado: async (id: number, etapa: string) => {
    const { data } = await api.put(`/novedades/${id}/estado`, { etapa });
    return data;
  },

  eliminar: async (id: number) => {
    const { data } = await api.delete(`/novedades/${id}`);
    return data;
  },
};

export const recargosService = {
  listarTipos: async () => {
    const { data } = await api.get<TipoRecargo[]>('/recargos/tipos');
    return data;
  },

  calcular: async (idDetalleTurno: number) => {
    const { data } = await api.post(`/recargos/calcular/${idDetalleTurno}`);
    return data;
  },

  obtenerResumen: async (idEmpleado: number, fechaInicio: string, fechaFin: string) => {
    const { data } = await api.get('/recargos/resumen', {
      params: { id_empleado: idEmpleado, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    });
    return data;
  },
};

export const dashboardService = {
  obtenerEstadisticas: async () => {
    const { data } = await api.get<DashboardEstadisticas>('/dashboard/estadisticas');
    return data;
  },

  obtenerTurnosHoy: async () => {
    const { data } = await api.get('/dashboard/turnos-hoy');
    return data;
  },

  obtenerRecargosPorMes: async (anio?: number) => {
    const { data } = await api.get('/dashboard/recargos-por-mes', {
      params: { anio },
    });
    return data;
  },

  obtenerEmpleadosActivos: async (params?: { limite?: number; mes?: number; anio?: number }) => {
    const { data } = await api.get('/dashboard/empleados-activos', { params });
    return data;
  },

  obtenerDistribucionAreas: async (params?: { mes?: number; anio?: number }) => {
    const { data } = await api.get('/dashboard/distribucion-areas', { params });
    return data;
  },
};

export const calendarioService = {
  listar: async (params?: { anio?: number; mes?: number; es_festivo?: boolean }) => {
    const { data } = await api.get<CalendarioDia[]>('/calendario', { params });
    return data;
  },

  obtenerFestivos: async (anio: number) => {
    const { data } = await api.get<CalendarioDia[]>(`/calendario/festivos/${anio}`);
    return data;
  },

  crearFestivo: async (festivo: { fecha: string; nombre_festivo: string; tipo_festivo?: string }) => {
    const { data } = await api.post('/calendario/festivos', festivo);
    return data;
  },

  sincronizarDomingos: async (anio: number) => {
    const { data } = await api.post('/calendario/sincronizar-domingos', { anio });
    return data;
  },
};

export const programacionService = {
  generarAutomatica: async (
    mes: number, 
    anio: number, 
    descansos?: Record<string, number[]>,
    maximosPorArea?: Record<number, number>
  ) => {
    const { data } = await api.post('/programacion/generar', { 
      mes, 
      anio, 
      descansos,
      maximos_por_area: maximosPorArea
    });
    return data;
  },
  eliminarMes: async (mes: number, anio: number) => {
    const { data } = await api.delete('/programacion/eliminar', { params: { mes, anio } });
    return data;
  },
};

