import api from '../config/api.config';
import type {
  EmpleadoCompleto,
  TurnoAsignado,
  NovedadCompleta,
  RecargoCompleto,
  ResumenLaborMes,
  LoginResponse,
  Cargo,
  Area,
  Turno,
  EstadoEmpleado,
} from '../types/api.types';

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

export const consultasService = {
  obtenerEmpleadosCompletos: async (params?: {
    estado?: boolean;
    busqueda?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<{ success: boolean, data: { empleados: any[]; paginacion: any } }>('/vistas/empleados-completos', { params });
    const content = response.data.data;

    const empleadosMapeados: EmpleadoCompleto[] = (content.empleados || []).map((e: any) => {
      let areasPermitidas: number[] = [];
      if (Array.isArray(e.areas_permitidas)) {
        areasPermitidas = e.areas_permitidas.map(Number);
      } else if (typeof e.areas_permitidas === 'string') {
        areasPermitidas = e.areas_permitidas
          .split(',')
          .map((n: string) => parseInt(n.trim()))
          .filter((n: number) => !isNaN(n));
      } else if (typeof e.areas === 'string' && e.areas) {
        areasPermitidas = e.areas
          .split(',')
          .map((n: string) => parseInt(n.trim()))
          .filter((n: number) => !isNaN(n));
      }

      return {
        id_empleado: e.id_empleado,
        nombre_completo: e.nombre_completo,
        cedula: e.cedula,
        edad: e.edad,
        sexo: e.sexo,
        vehiculo: e.vehiculo,
        estado: e.estado,
        id_cargo: e.id_cargo,
        nombre_cargo: e.nombre_cargo,
        salario_base: e.salario_base?.toString() || '0',
        areas_permitidas: areasPermitidas,
        created_at: e.created_at,
        updated_at: e.updated_at
      };
    });

    return { ...content, empleados: empleadosMapeados };
  },

  listarNovedades: async (params?: { inicio?: string; fin?: string; id_empleado?: number }) => {
    const { data } = await api.get('/novedades', { params });
    return data.data || data;
  },

  guardarNovedadesMasivas: async (payload: {
    id_empleado: number;
    fecha_inicio: string;
    fecha_fin: string;
    novedades: Array<{ fecha: string; id_tipo: number }>
  }) => {
    const { data } = await api.post('/novedades/masivo', payload);
    return data;
  },

  obtenerTurnosAsignados: async (params?: {
    id_empleado?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<any>('/turnos/asignados', { params });
    const content = data.data || data;
    const turnosMapeados: TurnoAsignado[] = (content.turnos || []).map((t: any) => ({
      id_detalle_turno: t.id_detalle_programacion,
      fecha: t.fecha,
      dia_semana: new Date(t.fecha).toLocaleDateString('es-ES', { weekday: 'long' }),
      es_festivo: t.tipo_dia === 'Festivo',
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
    return { ...content, turnos: turnosMapeados };
  },

  obtenerNovedadesCompletas: async (params?: {
    id_empleado?: number;
    etapa?: string;
    inicio?: string;
    fin?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<any>('/novedades', { params });
    const content = data.data || data;
    const dataArray = Array.isArray(content) ? content : (content.novedades || []);

    const novedadesAplanadas: NovedadCompleta[] = dataArray.flatMap((n: any) => {
      if (n.detalle_novedad && Array.isArray(n.detalle_novedad) && n.detalle_novedad.length > 0) {
        return n.detalle_novedad.map((d: any) => ({
          ...n,
          id_novedad_empleado: n.id_novedad_empleado,
          id_empleado: n.id_empleado,
          id_novedad_tipo: n.id_novedad_tipo,
          nombre_completo: n.nombre_completo || (n.empleado ? `${n.empleado.nombre1} ${n.empleado.apellido1}` : ''),
          cedula: n.cedula || n.empleado?.cedula || '',
          nombre_cargo: n.nombre_cargo || n.empleado?.cargo?.nombre_cargo || '',
          tipo: n.tipo_novedad?.nombre_novedad || '',
          codigo_novedad: n.tipo_novedad?.codigo || '',
          afecta_pago: n.tipo_novedad?.afecta_pago || false,
          fecha: d.fecha,
          fecha_inicio: n.fecha_inicio || n.fecha_solicitud,
          fecha_fin: n.fecha_fin,
          usuario_registro: n.usuario?.usuario || '',
        }));
      }

      return [{
        ...n,
        fecha: n.fecha_inicio || n.fecha_solicitud,
        nombre_completo: n.nombre_completo || (n.empleado ? `${n.empleado.nombre1} ${n.empleado.apellido1}` : ''),
        tipo: n.tipo_novedad?.nombre_novedad || '',
        codigo_novedad: n.tipo_novedad?.codigo || '',
        afecta_pago: n.tipo_novedad?.afecta_pago || false,
      } as NovedadCompleta];
    });

    return Array.isArray(content) ? novedadesAplanadas : { ...content, novedades: novedadesAplanadas };
  },

  obtenerRecargosCompletas: async (params?: {
    id_empleado?: number;
    fecha_inicio?: string;
    fecha_fin?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get<any>('/recargos', { params });
    const content = data.data || data;
    const recargosMapeados: RecargoCompleto[] = (content.recargos || []).map((r: any) => ({
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
      heod: r.heod?.toString(),
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
    return { ...content, recargos: recargosMapeados };
  },

  obtenerEmpleadosActivosAreas: async () => {
    const { data } = await api.get<any>('/dashboard/empleados-activos');
    const content = data.data || data;
    return content.map((e: any) => ({
      id_empleado: e.id_empleado,
      nombre_completo: e.nombre_completo,
      cedula: e.cedula,
      estado: true,
      nombre_cargo: e.nombre_cargo || '',
      salario_base: e.salario_base?.toString() || '0',
      areas_permitidas: e.areas ? e.areas.split(', ').map(Number) : [],
      cantidad_areas: e.areas ? e.areas.split(', ').length : 0
    }));
  },

  obtenerResumenLaborMes: async (params?: { id_empleado?: number; fecha_inicio?: string; fecha_fin?: string; }) => {
    const { data } = await api.get<any>('/recargos/resumen', { params });
    return (data.data || data) as ResumenLaborMes[];
  },
};

export const vistasService = {
  obtenerEmpleadosCompletos: consultasService.obtenerEmpleadosCompletos,
};

export const empleadosService = {
  listar: async (params?: any) => {
    const { data } = await api.get('/empleados', { params });
    return data.data || data;
  },
  obtener: async (id: number) => {
    const { data } = await api.get(`/empleados/${id}`);
    const res = data.data || data;
    return {
      ...res,
      areas_permitidas: res.areas_permitidas ? res.areas_permitidas.map((a: any) => typeof a === 'object' ? a.id_area : a) : []
    };
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
    return data.data || data;
  },
};

export const cargosService = {
  listar: async () => {
    const { data } = await api.get<{ success: boolean; data: Cargo[] }>('/cargos');
    return data.data;
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
    const { data } = await api.get<{ success: boolean; data: Area[] }>('/areas');
    return data.data;
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
    const { data } = await api.get<any>('/turnos', { params });
    const content = data.data || data;
    return content.map((t: any) => ({
      id_turno: t.id_turno,
      tipo_turno: t.tipo_turno || '',
      hora_entrada: t.hora_entrada || null,
      hora_salida: t.hora_salida || null,
      hora_entrada_2: t.hora_entrada_2 || null,
      hora_salida_2: t.hora_salida_2 || null,
      duracion_horas: t.duracion_horas,
      estado: t.estado,
      created_at: t.created_at,
      updated_at: t.updated_at
    }));
  },
  crear: async (turno: Partial<Turno>) => {
    const { data } = await api.post('/turnos', turno);
    return data;
  },
  asignar: async (asignacion: any) => {
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
    const { data } = await api.get<any>('/novedades/tipos');
    return data.data || data;
  },
  crearTipo: async (tipo: any) => {
    const { data } = await api.post('/novedades/tipos', tipo);
    return data;
  },
  actualizarTipo: async (id: number, tipo: any) => {
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
  sincronizar: async (payload: {
    id_empleado: number;
    operaciones: Array<{
      fecha: string;
      id_tipo: number;
      tipo: 'crear' | 'modificar' | 'eliminar';
    }>;
  }) => {
    const { data } = await api.post('/novedades/sincronizar', payload);
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
    const { data } = await api.get<any>('/recargos/tipos');
    return data.data || data;
  },
  calcular: async (idDetalleTurno: number) => {
    const { data } = await api.post(`/recargos/calcular/${idDetalleTurno}`);
    return data;
  },
  obtenerResumen: async (idEmpleado: number, fechaInicio: string, fechaFin: string) => {
    const { data } = await api.get('/recargos/resumen', {
      params: { id_empleado: idEmpleado, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    });
    return data.data || data;
  },
};


export const estadosService = {
  listar: async () => {
    const { data } = await api.get<{ success: boolean; data: EstadoEmpleado[] }>('/estados');
    return data.data;
  },
  crear: async (estado: Partial<EstadoEmpleado>) => {
    const { data } = await api.post('/estados', estado);
    return data;
  },
  actualizar: async (id: number, estado: Partial<EstadoEmpleado>) => {
    const { data } = await api.put(`/estados/${id}`, estado);
    return data;
  },
  eliminar: async (id: number) => {
    const { data } = await api.delete(`/estados/${id}`);
    return data;
  },
};

export const dashboardService = {
  obtenerEstadisticas: async (): Promise<any> => {
    const { data } = await api.get('/dashboard/estadisticas');
    return data.data;
  },
  obtenerTurnosHoy: async (): Promise<any[]> => {
    const { data } = await api.get('/dashboard/turnos-hoy');
    return data.data || [];
  },
  obtenerRecargosPorMes: async (anio?: number): Promise<any[]> => {
    const { data } = await api.get('/dashboard/recargos-por-mes', { params: { anio } });
    return data.data || [];
  },
  obtenerEmpleadosActivos: async (params: { limite: number }): Promise<any[]> => {
    const { data } = await api.get('/dashboard/empleados-activos', { params });
    return data.data || [];
  },
};

export const configuracionApi = {
  obtenerMaestros: () => api.get('/configuracion/maestros'),
  guardarMaximos: (configs: any) => api.post('/configuracion/areas/maximos', { configs }),
  guardarDescansos: (data: any) => api.post('/configuracion/descansos', data),
  obtenerDescansoEmpleado: (id: number, mes: number, anio: number) =>
    api.get(`/configuracion/descanso-individual?id_empleado=${id}&mes=${mes}&anio=${anio}`)
};

export const calendarioService = {
  listar: async (params?: any) => {
    const { data } = await api.get<any>('/calendario', { params });
    return data.data || data;
  },
  obtenerFestivos: async (anio: number) => {
    const { data } = await api.get<any>(`/calendario/festivos/${anio}`);
    return data.data || data;
  },
  crearFestivo: async (festivo: any) => {
    const { data } = await api.post('/calendario/festivos', festivo);
    return data;
  },
  sincronizarDomingos: async (anio: number) => {
    const { data } = await api.post('/calendario/sincronizar-domingos', { anio });
    return data;
  },
};

export const programacionService = {
  verificarProgramacionExistente: async (mes: number, anio: number) => {
    const { data } = await api.get('/programacion/verificar-existente', {
      params: { mes, anio }
    });
    return data;
  },
  generarAutomatica: async (payload: { mes: number; anio: number; configuracion: any; id_usuario_registro?: number }) => {
    const { data } = await api.post('/programacion/generar', payload);
    return data.data || data;
  },
  regenerarDesdeFecha: async (payload: {
    fechaInicio: string;
    configuracion: any;
    idUsuario?: number;
  }) => {
    const { data } = await api.post('/programacion/regenerar-desde', {
      fecha_inicio: payload.fechaInicio,
      configuracion: payload.configuracion,
      id_usuario_registro: payload.idUsuario
    });
    return data;
  },
  guardarCambios: async (cambios: Array<{
    id_detalle_programacion: number;
    id_empleado: number;
    empleado: string;
    fecha: string;
    id_area_origen: number;
    id_turno_origen: number;
    id_area_destino: number;
    id_turno_destino: number;
  }>) => {
    const { data } = await api.post('/programacion/guardar-cambios', { cambios });
    return data;
  },
  listarPorPeriodo: async (inicio: string, fin: string) => {
    const { data } = await api.get('/programacion/detalle', { params: { inicio, fin } });
    return data.data || data;
  },
  validarPeriodo: async (inicio: string, fin: string): Promise<any[]> => {
    const { data } = await api.get<any>('/programacion/validar', {
      params: { inicio, fin }
    });
    return data.data || data;
  },
  eliminarMes: async (mes: number, anio: number) => {
    const { data } = await api.delete('/programacion/eliminar', {
      data: { mes, anio }
    });
    return data.data || data;
  },
  generarDia: async (fecha: string, idUsuarioRegistro?: number) => {
    const { data } = await api.post('/programacion/generar', { fecha, id_usuario_registro: idUsuarioRegistro });
    return data.data || data;
  },
  obtenerNovedades: async (mes: number, anio: number) => {
    const { data } = await api.get('/programacion/novedades-periodo', {
      params: { mes, anio }
    });
    return data.data || data;
  },
  obtenerEmpleadosNoAsignadosPorDia: async (mes: number, anio: number) => {
    const { data } = await api.get('/programacion/empleados-no-asignados-por-dia', {
      params: { mes, anio }
    });
    return data.data;
  },
  obtenerEmpleadosConAreas: async () => {
    const { data } = await api.get('/programacion/empleados-con-areas');
    return data.data || [];
  },
};

export const alertasService = {
  guardar: async (mes: number, anio: number, alertas: any[]) => {
    const { data } = await api.post('/alertas', { mes, anio, alertas });
    return data;
  },
  obtener: async (mes: number, anio: number) => {
    const { data } = await api.get('/alertas', { params: { mes, anio } });
    return data.data || data;
  },
  eliminar: async (mes: number, anio: number) => {
    const { data } = await api.delete('/alertas', { data: { mes, anio } });
    return data;
  },
};

const services = {
  authService,
  consultasService,
  vistasService,
  empleadosService,
  cargosService,
  areasService,
  turnosService,
  novedadesService,
  recargosService,
  estadosService,
  dashboardService,
  configuracionApi,
  calendarioService,
  programacionService,
  alertasService,
};

export default services;