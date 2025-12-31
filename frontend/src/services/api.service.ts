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

// ========== CONSULTAS ESPERCIALIZADAS (Reemplaza VISTAS) ==========

export const consultasService = {
  // Ahora usa el endpoint de empleados con filtros
  obtenerEmpleadosCompletos: async (params?: {
    estado?: boolean;
    busqueda?: string;
    page?: number;
    limit?: number;
  }) => {
    // Usamos el endpoint estándar de empleados
    const { data } = await api.get<{ empleados: any[]; paginacion: any }>(
      '/empleados',
      { params }
    );

    // Mapeo de datos para mantener compatibilidad con UI
    const empleadosMapeados: EmpleadoCompleto[] = (data.empleados || []).map(e => ({
      id_empleado: e.id_empleado,
      nombre_completo: `${e.nombre1} ${e.nombre2 || ''} ${e.apellido1} ${e.apellido2 || ''}`.trim().replace(/\s+/g, ' '),
      cedula: e.cedula,
      edad: e.edad,
      sexo: e.sexo,
      vehiculo: e.vehiculo ? 'Si' : 'No', // Ajuste según tipo en vista vs modelo
      estado: e.estado === 1 || e.estado === true, // Handling int/bool variations
      id_cargo: e.id_cargo,
      nombre_cargo: e.cargo?.nombre_cargo || 'Sin Cargo',
      salario_base: e.cargo?.salario_base?.toString() || '0',
      areas_permitidas: e.empleado_area?.map((ea: any) => ea.id_area) || [],
      created_at: e.created_at,
      updated_at: e.updated_at
    }));

    return { ...data, empleados: empleadosMapeados };
  },

  // Turnos asignados -> /api/turnos/asignados
  obtenerTurnosAsignados: async (params?: {
    id_empleado?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<{ turnos: any[]; total: number }>(
      '/turnos/asignados',
      { params }
    );

    const turnosMapeados: TurnoAsignado[] = (data.turnos || []).map(t => ({
      id_detalle_turno: t.id_detalle_programacion,
      fecha: t.fecha,
      dia_semana: new Date(t.fecha).toLocaleDateString('es-ES', { weekday: 'long' }),
      es_festivo: t.tipo_dia === 'Festivo', // Lógica aproximada
      es_domingo: new Date(t.fecha).getDay() === 0,
      id_turno: t.id_turno,
      codigo_turno: t.turno?.tipo_turno || '',
      hora_entrada: t.turno?.hora_entrada,
      hora_salida: t.turno?.hora_salida,
      tipo_turno: t.turno?.tipo_turno || '',
      thl: t.total_horas_laboradas?.toString(),
      id_area: t.id_area,
      nombre_area: t.area?.nombre_area || '',
      id_labor_mes: t.id_labor_mes,
      id_empleado: t.id_empleado,
      nombre_completo: t.empleado ? `${t.empleado.nombre1} ${t.empleado.apellido1}` : '',
      cedula: t.empleado?.cedula || '',
      nombre_cargo: t.empleado?.cargo?.nombre_cargo || '',
      salario_base: t.empleado?.cargo?.salario_base?.toString() || '',
      created_at: t.created_at,
      updated_at: t.updated_at
    }));

    return { ...data, turnos: turnosMapeados };
  },

  // Novedades -> /api/novedades
  obtenerNovedadesCompletas: async (params?: {
    id_empleado?: number;
    etapa?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<{ novedades: any[]; total: number }>(
      '/novedades',
      { params }
    );

    const novedadesMapeadas: NovedadCompleta[] = (data.novedades || []).map(n => ({
      id_novedad_registro: n.id_novedad_registro || n.id_novedad_empleado,
      fecha_solicitud: n.fecha_solicitud,
      fecha_registro: n.fecha_registro,
      fecha_vencimiento: n.fecha_vencimiento,
      etapa: n.etapa,
      id_empleado: n.id_empleado,
      empleado: n.empleado ? `${n.empleado.nombre1} ${n.empleado.apellido1}` : '',
      cedula: n.empleado?.cedula || '',
      nombre_cargo: n.empleado?.cargo?.nombre_cargo || '',
      id_novedad_tipo: n.id_novedad_tipo,
      codigo_novedad: n.tipo_novedad?.codigo || '',
      tipo: n.tipo_novedad?.nombre_novedad || '',
      afecta_pago: n.tipo_novedad?.afecta_pago,
      fecha_inicio: n.fecha_solicitud, // Asumiendo inicio = solicitud si no hay otro campo
      cantidad: '0', // Falta en modelo base pero requerido por tipo
      observaciones: '',
      usuario_registro: n.usuario?.usuario || '',
      created_at: n.created_at,
      updated_at: n.updated_at
    }));

    return { ...data, novedades: novedadesMapeadas };
  },

  // Recargos -> /api/recargos
  obtenerRecargosCompletos: async (params?: {
    id_empleado?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<{ recargos: any[]; total: number }>(
      '/recargos',
      { params }
    );

    const recargosMapeados: RecargoCompleto[] = (data.recargos || []).map(r => ({
      id_recargo: r.id_recargo,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      total_horas: r.total_horas?.toString(),
      total_dinero: r.total_dinero?.toString(),
      dominicales: r.dominicales,
      festivos: r.festivos,
      rno: r.rno?.toString(),
      rnf: r.rnf?.toString(),
      heon: r.heon?.toString(),
      heod: r.heod?.toString(), // Check schema if exists
      hefd: r.hefd?.toString(),
      hefn: r.hefn?.toString(),
      id_detalle_turno: r.id_detalle_programacion,
      fecha: r.detalle_programacion?.fecha,
      codigo_turno: r.detalle_programacion?.turno?.tipo_turno,
      hora_entrada: r.detalle_programacion?.turno?.hora_entrada,
      hora_salida: r.detalle_programacion?.turno?.hora_salida,
      nombre_area: r.detalle_programacion?.area?.nombre_area,
      id_empleado: r.detalle_programacion?.id_empleado,
      nombre_completo: r.detalle_programacion?.empleado ? `${r.detalle_programacion.empleado.nombre1} ${r.detalle_programacion.empleado.apellido1}` : '',
      cedula: r.detalle_programacion?.empleado?.cedula,
      salario_base: r.detalle_programacion?.empleado?.cargo?.salario_base?.toString(),
      id_labor_mes: r.detalle_programacion?.id_labor_mes,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    return { ...data, recargos: recargosMapeados };
  },

  // Empleados activos
  obtenerEmpleadosActivosAreas: async () => {
    // Usamos el endpoint especifico de activos o el general filtrado
    const { data } = await api.get<any[]>('/empleados/activos');

    const mapped: EmpleadoActivoArea[] = data.map(e => ({
      id_empleado: e.id_empleado,
      nombre_completo: `${e.nombre1} ${e.nombre2 || ''} ${e.apellido1} ${e.apellido2 || ''}`.trim().replace(/\s+/g, ' '),
      cedula: e.cedula,
      estado: true,
      nombre_cargo: e.cargo?.nombre_cargo || '',
      salario_base: e.cargo?.salario_base?.toString() || '0',
      areas_permitidas: e.empleado_area?.map((ea: any) => ea.id_area) || [],
      cantidad_areas: e.empleado_area?.length || 0
    }));

    return mapped;
  },

  // Resumen labor mes -> Dashboard o Recargos resumen
  obtenerResumenLaborMes: async (params?: {
    id_empleado?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
  }) => {
    const { data } = await api.get<any[]>('/recargos/resumen', { params });
    // This mapping depends heavily on what /recargos/resumen returns. 
    // Assuming it returns something similar to ResumenLaborMes
    return data as ResumenLaborMes[];
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

