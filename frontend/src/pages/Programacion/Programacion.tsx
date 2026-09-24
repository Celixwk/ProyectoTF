import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  areasService, programacionService, consultasService,
  novedadesService, turnosService, parametrizacionService, empleadosService
} from '@/services/api.service';
import { buildProgramacionWorkbook } from '@/utils/exportarExcel';
import { ModalNovedadRapida } from '@/utils/ModalNovedadRapida';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  CalendarDays, Info, UserSearch, X, Loader2, FileSpreadsheet,
  Save, Undo2, Zap, Trash2, Edit2, PlusCircle, AlertTriangle, MapPin
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { parseISO, format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Area } from '@/types/api.types';

interface CambioLocal {
  id: string;
  id_detalle_programacion: number;
  empleado: string;
  id_empleado: number;
  fecha: string;
  id_area_origen: number;
  id_turno_origen: number;
  id_area_destino: number;
  id_turno_destino: number;
}

export default function Programacion() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();


  const pInicio = searchParams.get('fechaInicio');
  const pFin = searchParams.get('fechaFin');
  const esRangoPersonalizado = !!(pInicio || pFin);

  const [filtro, setFiltro] = useState('');
  const [busquedaVista, setBusquedaVista] = useState('');

  // --- Estado de edición ---
  const [cambiosLocales, setCambiosLocales] = useState<CambioLocal[]>([]);
  const [menuCelda, setMenuCelda] = useState<{
    x: number; y: number; emp: any; fecha: string; infoDia: any;
  } | null>(null);
  const [subMenuTurno, setSubMenuTurno] = useState(false);
  const [modalNovedadOpen, setModalNovedadOpen] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<{ id: number; nombre: string } | null>(null);
  const [fechaParaNovedad, setFechaParaNovedad] = useState<string | null>(null);
  const [novedadExistenteParaModal, setNovedadExistenteParaModal] = useState<{ id_novedad_tipo: number } | null>(null);

  // --- Estado de generación ---
  const [modalGenerar, setModalGenerar] = useState(false);
  const [fechaGenerarInicio, setFechaGenerarInicio] = useState('');
  const [fechaGenerarFin, setFechaGenerarFin] = useState('');
  const [balancearHoras, setBalancearHoras] = useState(true);

  // --- Estado para cambiar área ---
  const [modalCambiarArea, setModalCambiarArea] = useState<{
    emp: any; fecha: string; infoDia: any;
  } | null>(null);
  const [nuevaAreaId, setNuevaAreaId] = useState<number | null>(null);
  const [nuevoTurnoId, setNuevoTurnoId] = useState<number | null>(null);

  // --- Estado para conflicto/swap ---
  const [dialogConflicto, setDialogConflicto] = useState<{
    personas: any[];
    cambioTarget: { emp: any; fecha: string; infoDia: any; areaDestino: number; turnoDestino: number };
  } | null>(null);

  // Persistir rango en localStorage
  useEffect(() => {
    if (!pInicio && !pFin) {
      const savedInicio = localStorage.getItem('prog_vista_fechaInicio');
      const savedFin = localStorage.getItem('prog_vista_fechaFin');
      if (savedInicio && savedFin) {
        setSearchParams({ fechaInicio: savedInicio, fechaFin: savedFin });
      }
    }
  }, []);

  useEffect(() => {
    if (pInicio && pFin) {
      localStorage.setItem('prog_vista_fechaInicio', pInicio);
      localStorage.setItem('prog_vista_fechaFin', pFin);
    }
  }, [pInicio, pFin]);

  // Limpiar cambios locales al cambiar el rango
  useEffect(() => {
    setCambiosLocales([]);
  }, [pInicio, pFin]);



  const fechaInicio = useMemo(() => pInicio ?? '', [pInicio]);
  const fechaFin = useMemo(() => pFin ?? '', [pFin]);

  const limpiarFiltros = () => {
    setSearchParams({});
    localStorage.removeItem('prog_vista_fechaInicio');
    localStorage.removeItem('prog_vista_fechaFin');
  };

  // --- Queries ---
  const { data: areasRaw } = useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: () => areasService.listar()
  });

  const areasMap = useMemo(() => {
    const map = new Map<number, string>();
    areasRaw?.forEach((a: Area) => map.set(a.id_area, a.nombre_area));
    return map;
  }, [areasRaw]);

  const { data: estadoValidacion, isLoading: loadingVal } = useQuery({
    queryKey: ['validacion-completa', fechaInicio, fechaFin],
    queryFn: () => programacionService.validarCompleto(fechaInicio, fechaFin),
    enabled: !!pInicio && !!pFin,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const { data: programacion = [], isLoading: loadingProg } = useQuery({
    queryKey: ['programacion-consolidado', fechaInicio, fechaFin],
    queryFn: async () => {
      if (!fechaInicio || !fechaFin) return [];
      const res = await programacionService.listarPorPeriodo(fechaInicio, fechaFin);
      return Array.isArray(res) ? res : (res.data || []);
    },
    enabled: !!pInicio && !!pFin,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  const { data: novedadesData = [] } = useQuery({
    queryKey: ['novedades-lectura', fechaInicio, fechaFin],
    queryFn: () => consultasService.obtenerNovedadesCompletas({ inicio: fechaInicio, fin: fechaFin }),
    enabled: !!pInicio && !!pFin
  });

  const { data: empleadosCompletosData, isLoading: loadingEmpleados } = useQuery({
    queryKey: ['empleados-completos-activos'],
    queryFn: () => consultasService.obtenerEmpleadosCompletos({ estado: true, limit: 1000 }),
    staleTime: 60_000
  });

  const { data: tiposNovedadData } = useQuery({
    queryKey: ['tipos-novedades'],
    queryFn: () => novedadesService.listarTipos(),
    staleTime: 60_000
  });

  const { data: turnosRaw } = useQuery({
    queryKey: ['turnos'],
    queryFn: () => turnosService.listar({ estado: true })
  });

  // Configuración de turnos por área (para filtrar opciones del menú)
  const { data: configTurnosAreaParam } = useQuery({
    queryKey: ['parametro-turnos-areas'],
    queryFn: () => parametrizacionService.obtener('CONFIGURACION_TURNOS_AREA'),
    staleTime: 60_000
  });

  const configGlobalAreas = useMemo(() => {
    if (!configTurnosAreaParam?.valor_texto) return {} as Record<number, { turnosIds: number[] }>;
    try {
      const raw = JSON.parse(configTurnosAreaParam.valor_texto);
      const parsed: Record<number, { turnosIds: number[] }> = {};
      Object.keys(raw).forEach(key => { parsed[Number(key)] = { turnosIds: raw[Number(key)] }; });
      return parsed;
    } catch { return {} as Record<number, { turnosIds: number[] }>; }
  }, [configTurnosAreaParam]);

  // Áreas asignadas del empleado activo en el modal de cambio de área
  const { data: empleadoConfigModal } = useQuery({
    queryKey: ['empleado-areas-modal', modalCambiarArea?.emp?.id_empleado],
    queryFn: () => empleadosService.obtener(modalCambiarArea!.emp.id_empleado),
    enabled: !!modalCambiarArea?.emp?.id_empleado,
    staleTime: 60_000
  });

  // Verificar si ya existe programación en el rango a generar
  const { data: progExistenteGenerar } = useQuery({
    queryKey: ['verificar-prog-generar', fechaGenerarInicio, fechaGenerarFin],
    queryFn: async () => {
      const data = await programacionService.listarPorPeriodo(fechaGenerarInicio, fechaGenerarFin);
      const lista = Array.isArray(data) ? data : (data.data || []);
      return { existe: lista.length > 0, total: lista.length };
    },
    enabled: !!fechaGenerarInicio && !!fechaGenerarFin && fechaGenerarInicio <= fechaGenerarFin,
    staleTime: 0
  });

  const turnos = useMemo(() => {
    if (!turnosRaw) return [];
    // @ts-ignore
    return (turnosRaw as any[]).filter((t: any) => ![1, 2, 3].includes(t.id_turno));
  }, [turnosRaw]);

  const { tiposNovedadMap, leyendaTipos } = useMemo(() => {
    const map = new Map<string, any>();
    const leyenda: any[] = [];
    if (!tiposNovedadData) return { tiposNovedadMap: map, leyendaTipos: leyenda };

    const PALETAS = [
      { color: 'bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800' },
      { color: 'bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800' },
      { color: 'bg-rose-200 text-rose-900 border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800' },
      { color: 'bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800' },
      { color: 'bg-violet-200 text-violet-900 border-violet-300 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-800' },
      { color: 'bg-pink-200 text-pink-900 border-pink-300 dark:bg-pink-900/50 dark:text-pink-300 dark:border-pink-800' },
      { color: 'bg-cyan-200 text-cyan-900 border-cyan-300 dark:bg-cyan-900/50 dark:text-cyan-300 dark:border-cyan-800' },
      { color: 'bg-slate-800 text-white border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800' },
    ];

    (tiposNovedadData as any[]).forEach((t: any, index: number) => {
      const paleta = PALETAS[index % PALETAS.length];
      const code = t.codigo || t.nombre_novedad.substring(0, 3).toUpperCase();
      const obj = {
        label: code,
        color: paleta.color,
        full: t.nombre_novedad,
        id_tipo: t.id_novedad_tipo
      };
      map.set(code, obj);
      map.set(t.id_novedad_tipo.toString(), obj);
      leyenda.push(obj);
    });
    return { tiposNovedadMap: map, leyendaTipos: leyenda };
  }, [tiposNovedadData]);

  const diasDelRango = useMemo(() => {
    if (!fechaInicio || !fechaFin) return [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)) return [];
    try {
      const start = parseISO(fechaInicio);
      const end = parseISO(fechaFin);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
      const dias = [];
      let current = start;
      let safeGuard = 0;
      while (current <= end && safeGuard < 62) {
        dias.push({
          dia: current.getDate(),
          fechaISO: current.toISOString().split('T')[0],
          nombre: format(current, 'EEE', { locale: es }).toUpperCase().replace('.', ''),
          mesNombre: format(current, 'MMM', { locale: es }).toUpperCase().replace('.', ''),
          esFinDeSemana: current.getDay() === 0 || current.getDay() === 6
        });
        current = addDays(current, 1);
        safeGuard++;
      }
      return dias;
    } catch (e) {
      return [];
    }
  }, [fechaInicio, fechaFin]);

  // Aplicar cambios locales encima de los datos originales
  const programacionConCambios = useMemo(() => {
    if (cambiosLocales.length === 0) return programacion;
    
    const modificados = (programacion as any[])
      .map((asig: any) => {
        const cambio = cambiosLocales.find(c =>
          c.id_detalle_programacion === asig.id_detalle_programacion &&
          asig.id_detalle_programacion !== 0
        );
        if (!cambio) return asig;
        if (cambio.id_area_destino === -1) {
          return {
            ...asig,
            id_area: -1,
            id_turno: -1,
            turno: null,
            _modificado: true
          };
        }
        const nuevoTurno = (turnosRaw as any[])?.find((t: any) => t.id_turno === cambio.id_turno_destino);
        return {
          ...asig,
          id_area: cambio.id_area_destino,
          id_turno: cambio.id_turno_destino,
          turno: nuevoTurno ? { ...nuevoTurno } : asig.turno,
          _modificado: true
        };
      });

    const nuevos = cambiosLocales
      .filter(c => c.id_detalle_programacion === 0)
      .map(c => {
        if (c.id_area_destino === -1) {
          return {
            id_detalle_programacion: 0,
            id_empleado: c.id_empleado,
            fecha: c.fecha,
            id_area: -1,
            id_turno: -1,
            nombre_empleado: c.empleado,
            turno: null,
            _modificado: true
          };
        }
        const nuevoTurno = (turnosRaw as any[])?.find((t: any) => t.id_turno === c.id_turno_destino);
        return {
          id_detalle_programacion: 0,
          id_empleado: c.id_empleado,
          fecha: c.fecha,
          id_area: c.id_area_destino,
          id_turno: c.id_turno_destino,
          nombre_empleado: c.empleado,
          turno: nuevoTurno ? { ...nuevoTurno } : null,
          _modificado: true
        };
      });

    return [...modificados, ...nuevos];
  }, [programacion, cambiosLocales, turnosRaw]);

  const datosProcesados = useMemo(() => {
    const empleadosMap: Record<number, {
      id_empleado: number;
      nombre: string;
      cedula: string;
      dias: Record<string, any>;
    }> = {};

    const listaEmpleados = Array.isArray(empleadosCompletosData)
      ? empleadosCompletosData
      : (empleadosCompletosData as any)?.empleados || [];

    listaEmpleados.forEach((emp: any) => {
      empleadosMap[emp.id_empleado] = {
        id_empleado: emp.id_empleado,
        nombre: emp.nombre_completo || `${emp.nombre1 || ''} ${emp.apellido1 || ''}`.trim() || 'Empleado',
        cedula: emp.cedula || '',
        dias: {},
        // @ts-ignore
        descansosRaw: emp.descansos || [],
        // @ts-ignore
        areaIds: new Set<number>(emp.areas_permitidas || []),
        // @ts-ignore
        areaDays: new Map<number, number>(),
      };
    });

    (programacionConCambios as any[]).forEach((asig: any) => {
      const idEmp = Number(asig.id_empleado);
      const fecha = asig.fecha.split('T')[0];
      const idArea = Number(asig.id_area);
      const nombreArea = areasMap.get(idArea) || 'General';
      const abreviacionArea = nombreArea.substring(0, 8).trimEnd();
      const esRefuerzo = !asig.turno?.hora_entrada;

      if (!empleadosMap[idEmp]) {
        empleadosMap[idEmp] = {
          id_empleado: idEmp,
          nombre: asig.nombre_empleado || asig.empleado?.nombre_completo || 'Empleado',
          cedula: asig.cedula_empleado || asig.empleado?.cedula || '',
          dias: {},
          // @ts-ignore
          descansosRaw: asig.empleado?.descansos || [],
          // @ts-ignore
          areaIds: new Set<number>(),
          // @ts-ignore
          areaDays: new Map<number, number>(),
        };
      }

      // @ts-ignore
      if (idArea) empleadosMap[idEmp].areaIds.add(idArea);
      // @ts-ignore
      const areaDays: Map<number, number> = empleadosMap[idEmp].areaDays;
      // @ts-ignore
      areaDays.set(idArea, (areaDays.get(idArea) || 0) + 1);

      if (asig.empleado?.descansos) {
        // @ts-ignore
        empleadosMap[idEmp].descansosRaw = asig.empleado.descansos;
      }

      let horaFormateada = 'Sin horario';

      const hsEntrada = asig.hora_entrada_real || asig.turno?.hora_entrada;
      const hsSalida = asig.hora_salida_real || asig.turno?.hora_salida;

      if (!esRefuerzo && hsEntrada) {
        const esReal = !!(asig.hora_entrada_real || asig.hora_salida_real);
        const entrada = hsEntrada.includes('T') ? hsEntrada.split('T')[1] : hsEntrada;
        const salida = hsSalida?.includes('T') ? hsSalida.split('T')[1] : hsSalida;
        horaFormateada = `${entrada.substring(0, 5)} - ${salida?.substring(0, 5) || '??'}`;
        if (asig.turno?.hora_entrada_2 && asig.turno?.hora_salida_2) {
          const ent2 = asig.turno.hora_entrada_2.includes('T') ? asig.turno.hora_entrada_2.split('T')[1] : asig.turno.hora_entrada_2;
          const sal2 = asig.turno.hora_salida_2.includes('T') ? asig.turno.hora_salida_2.split('T')[1] : asig.turno.hora_salida_2;
          horaFormateada += ` \n ${ent2.substring(0, 5)} - ${sal2.substring(0, 5)}`;
        }
        if (esReal) horaFormateada = `🔴 ${horaFormateada} (Modificado)`;
      }

      let diasDescanso: number[] = [];
      const descansos = asig.empleado?.descansos || [];
      if (descansos.length > 0) {
        const dateObj = new Date(fecha);
        const y = dateObj.getUTCFullYear();
        const m = dateObj.getUTCMonth() + 1;
        const descMes = descansos.find((d: any) => d.anio === y && d.mes === m);
        if (descMes) {
          try {
            diasDescanso = Array.isArray(descMes.dias_descanso)
              ? descMes.dias_descanso
              : JSON.parse(descMes.dias_descanso as string);
          } catch { diasDescanso = []; }
        }
      }

      const diaNumero = new Date(fecha).getUTCDate();
      const esDescanso = diasDescanso.includes(diaNumero);

      if (esDescanso) {
        empleadosMap[idEmp].dias[fecha] = {
          tipo: 'DESCANSO',
          valor: 'DES',
          estilo: 'bg-indigo-100 text-indigo-800 border-indigo-200 font-bold opacity-60',
          detalle: 'Descanso Programado',
          subvalor: '',
          id_area: idArea,
          id_turno: Number(asig.id_turno) || 0,
          id_detalle_programacion: asig.id_detalle_programacion || 0,
        };
      } else {
        empleadosMap[idEmp].dias[fecha] = {
          tipo: 'TURNO',
          id_area: idArea,
          id_turno: Number(asig.id_turno) || 0,
          id_detalle_programacion: asig.id_detalle_programacion || 0,
          valor: esRefuerzo ? 'LIBRE' : (asig.turno?.tipo_turno || 'T?'),
          subvalor: abreviacionArea,
          areaCompleta: nombreArea,
          detalle: esRefuerzo ? 'Disponible / Sin Turno' : asig.turno?.tipo_turno,
          hora: horaFormateada,
          esModificado: !!(asig.hora_entrada_real || asig.hora_salida_real),
          _modificado: !!asig._modificado,
          estilo: esRefuerzo
            ? 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold'
            : (asig.hora_entrada_real || asig.hora_salida_real)
              ? 'bg-red-50 hover:bg-rose-100 text-rose-900 border-rose-300 shadow-sm'
              : 'bg-white hover:bg-indigo-50 text-indigo-900 border-slate-200'
        };
      }
    });

    const listaNovedades = Array.isArray(novedadesData)
      ? novedadesData
      : (novedadesData as any).novedades || [];

    (listaNovedades as any[]).forEach((nov: any) => {
      if (!empleadosMap[nov.id_empleado]) {
        empleadosMap[nov.id_empleado] = {
          id_empleado: nov.id_empleado,
          nombre: nov.nombre_completo || (nov.empleado ? `${nov.empleado.nombre1} ${nov.empleado.apellido1}` : 'Empleado'),
          cedula: nov.cedula || nov.cedula_empleado || '',
          dias: {},
          // @ts-ignore
          areaIds: new Set<number>()
        };
      }
      const fecha = nov.fecha?.split('T')[0];
      if (fecha) {
        const tipoId = nov.id_novedad_tipo?.toString();
        const tipoNov = tiposNovedadMap.get(tipoId) ||
          tiposNovedadMap.get(nov.codigo_novedad) ||
          { label: 'NOV', color: 'bg-slate-200 text-slate-900 border-slate-300', full: nov.tipo || 'Novedad' };

        empleadosMap[nov.id_empleado].dias[fecha] = {
          tipo: 'NOVEDAD',
          valor: tipoNov.label,
          estilo: tipoNov.color,
          detalle: tipoNov.full,
          subvalor: '',
          id_area: 0,
          id_turno: 0,
          id_detalle_programacion: 0,
          id_novedad_tipo: nov.id_novedad_tipo || 0,
        };
      }
    });

    let resultado = Object.values(empleadosMap);

    if (filtro.trim()) {
      resultado = resultado.filter(e => e.id_empleado.toString() === filtro);
    }

    return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [programacionConCambios, novedadesData, areasMap, filtro, tiposNovedadMap, empleadosCompletosData]);

  // --- Handlers de edición ---
  const aplicarCambioLocal = (cambio: CambioLocal) => {
    setCambiosLocales(prev => {
      const key = cambio.id_detalle_programacion !== 0
        ? `EXISTING-${cambio.id_detalle_programacion}`
        : `NEW-${cambio.id_empleado}-${cambio.fecha}`;
      const mapa = new Map(prev.map(c => [
        c.id_detalle_programacion !== 0
          ? `EXISTING-${c.id_detalle_programacion}`
          : `NEW-${c.id_empleado}-${c.fecha}`,
        c
      ]));
      mapa.set(key, cambio);
      return Array.from(mapa.values());
    });
  };

  const handleGuardarCambios = async () => {
    if (cambiosLocales.length === 0) return;
    try {
      toast.loading('Guardando cambios...');
      await programacionService.guardarCambios(cambiosLocales);
      setCambiosLocales([]);
      await queryClient.invalidateQueries({ queryKey: ['programacion-consolidado'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['novedades-lectura'], exact: false });
      toast.dismiss();
      toast.success('Cambios guardados correctamente');
    } catch {
      toast.dismiss();
      toast.error('Error al guardar cambios');
    }
  };

  const handleRevertirCambios = () => {
    setCambiosLocales([]);
    toast.info('Cambios revertidos');
  };

  const handleEliminarTurno = (emp: any, fecha: string, infoDia: any) => {
    setMenuCelda(null);
    aplicarCambioLocal({
      id: `${Date.now()}-${Math.random()}`,
      id_detalle_programacion: infoDia.id_detalle_programacion || 0,
      empleado: emp.nombre,
      id_empleado: emp.id_empleado,
      fecha,
      id_area_origen: infoDia.id_area || 0,
      id_turno_origen: infoDia.id_turno || 0,
      id_area_destino: -1,
      id_turno_destino: -1
    });
    toast.success('Turno marcado para eliminar — guarda para confirmar');
  };

  const handleEliminarNovedad = async (emp: any, fecha: string) => {
    setMenuCelda(null);
    try {
      await novedadesService.sincronizar({
        id_empleado: emp.id_empleado,
        operaciones: [{ fecha, id_tipo: 0, tipo: 'eliminar' }]
      });
      await queryClient.invalidateQueries({ queryKey: ['novedades-lectura'], exact: false });
      await queryClient.invalidateQueries({ queryKey: ['programacion-consolidado'], exact: false });
      toast.success('Novedad eliminada correctamente');
    } catch {
      toast.error('Error al eliminar la novedad');
    }
  };

  // Busca personas ya ocupando ese área+turno+fecha (excluye al empleado actual)
  const obtenerOcupantes = (areaId: number, turnoId: number, fecha: string, excludeEmpId: number) => {
    return (programacionConCambios as any[]).filter(p =>
      Number(p.id_area) === areaId &&
      Number(p.id_turno) === turnoId &&
      p.fecha.split('T')[0] === fecha &&
      Number(p.id_empleado) !== excludeEmpId
    );
  };

  // Ejecuta el cambioLocal para un empleado (área + turno destino)
  const ejecutarCambio = (emp: any, fecha: string, infoDia: any, areaDestino: number, turnoDestino: number) => {
    aplicarCambioLocal({
      id: `${Date.now()}-${Math.random()}`,
      id_detalle_programacion: infoDia.id_detalle_programacion || 0,
      empleado: emp.nombre,
      id_empleado: emp.id_empleado,
      fecha,
      id_area_origen: infoDia.id_area || 0,
      id_turno_origen: infoDia.id_turno || 0,
      id_area_destino: areaDestino,
      id_turno_destino: turnoDestino
    });
  };

  // Intenta aplicar un cambio: verifica conflicto primero
  const handleAplicarCambioConVerificacion = (
    emp: any, fecha: string, infoDia: any, areaDestino: number, turnoDestino: number
  ) => {
    setMenuCelda(null);
    setSubMenuTurno(false);
    setModalCambiarArea(null);
    setNuevaAreaId(null);
    setNuevoTurnoId(null);

    const ocupantes = obtenerOcupantes(areaDestino, turnoDestino, fecha, emp.id_empleado);
    if (ocupantes.length === 0) {
      ejecutarCambio(emp, fecha, infoDia, areaDestino, turnoDestino);
      toast.success('Turno cambiado — guarda para confirmar');
      return;
    }
    // Hay conflicto → mostrar dialog
    setDialogConflicto({ personas: ocupantes, cambioTarget: { emp, fecha, infoDia, areaDestino, turnoDestino } });
  };

  // Confirmar swap: entra el nuevo, y el desplazado toma el turno anterior del nuevo (si existía)
  const confirmarSwap = (personaADesplazar: any) => {
    if (!dialogConflicto) return;
    const { cambioTarget: { emp, fecha, infoDia, areaDestino, turnoDestino } } = dialogConflicto;
    ejecutarCambio(emp, fecha, infoDia, areaDestino, turnoDestino);
    
    // Si la persona que entró venía de otro turno (no estaba LIBRE)
    // entonces la persona desplazada toma ese turno.
    // Si estaba LIBRE, entonces la persona desplazada queda LIBRE (-1).
    const nuevoAreaDestino = (infoDia.id_area > 0 && infoDia.tipo === 'TURNO') ? infoDia.id_area : -1;
    const nuevoTurnoDestino = (infoDia.id_turno > 0 && infoDia.tipo === 'TURNO') ? infoDia.id_turno : -1;

    // Actualizar asignación del desplazado
    aplicarCambioLocal({
      id: `${Date.now()}-${Math.random()}`,
      id_detalle_programacion: personaADesplazar.id_detalle_programacion || 0,
      empleado: personaADesplazar.nombre_empleado || personaADesplazar.empleado?.nombre_completo || '',
      id_empleado: personaADesplazar.id_empleado,
      fecha,
      id_area_origen: areaDestino,
      id_turno_origen: turnoDestino,
      id_area_destino: nuevoAreaDestino,
      id_turno_destino: nuevoTurnoDestino
    });
    setDialogConflicto(null);
    const nombreDesplazado = (personaADesplazar.nombre_empleado || personaADesplazar.empleado?.nombre_completo || '').split(' ').slice(0, 2).join(' ');
    
    if (nuevoAreaDestino === -1) {
      toast.success(`Reemplazo aplicado — ${nombreDesplazado} queda libre el ${fecha}`, { duration: 6000 });
    } else {
      toast.success(`Reemplazo aplicado — ${nombreDesplazado} tomó el turno anterior`, { duration: 6000 });
    }
  };

  // Confirmar sin desplazar (agregar igualmente cuando hay varios en el turno)
  const confirmarAgregacion = () => {
    if (!dialogConflicto) return;
    const { cambioTarget: { emp, fecha, infoDia, areaDestino, turnoDestino } } = dialogConflicto;
    ejecutarCambio(emp, fecha, infoDia, areaDestino, turnoDestino);
    setDialogConflicto(null);
    toast.success('Turno cambiado — guarda para confirmar');
  };

  // --- Mutación de generación ---
  const generarMutation = useMutation({
    mutationFn: async () => {
      const configParam = await parametrizacionService.obtener('CONFIGURACION_TURNOS_AREA');
      const configuracion: Record<number, { turnosIds: number[] }> = {};
      if (configParam?.valor_texto) {
        try {
          const raw = JSON.parse(configParam.valor_texto);
          Object.keys(raw).forEach(k => { configuracion[Number(k)] = { turnosIds: raw[Number(k)] }; });
        } catch { /* usar config vacía */ }
      }
      return await programacionService.generarAutomatica({
        fechaInicio: fechaGenerarInicio,
        fechaFin: fechaGenerarFin,
        configuracion,
        balancearHoras
      });
    },
    onSuccess: () => {
      setModalGenerar(false);
      // Actualizar la vista al rango generado
      setSearchParams({ fechaInicio: fechaGenerarInicio, fechaFin: fechaGenerarFin });
      queryClient.invalidateQueries({ queryKey: ['programacion-consolidado'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['novedades-lectura'], exact: false });
      toast.success('Programación generada correctamente');
    },
    onError: (err: any) => toast.error(`Error al generar: ${err.message || 'Error desconocido'}`)
  });

  // --- Exportar Excel ---
  const handleExportar = async () => {
    if (!fechaInicio || !fechaFin || programacion.length === 0 || !areasRaw) return;

    const areasParaExportar = areasRaw;

    const empIdsPermitidos = new Set(datosProcesados.map(e => e.id_empleado));
    const progParaExportar = (programacion as any[]).filter((p: any) => empIdsPermitidos.has(Number(p.id_empleado)));

    const infoDiasExport = diasDelRango.map(d => ({
      fechaISO: d.fechaISO,
      numero: d.dia,
      nombreDia: d.nombre,
      esFestivo: false,
    }));

    const listaNovedadesExport = Array.isArray(novedadesData)
      ? novedadesData
      : (novedadesData as any)?.novedades || [];

    const wb = await buildProgramacionWorkbook({
      areas: areasParaExportar,
      turnos,
      infoDias: infoDiasExport,
      programacion: progParaExportar,
      novedades: listaNovedadesExport,
      tiposNovedad: tiposNovedadData as any[] ?? [],
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horario_${fechaInicio}_al_${fechaFin}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingVal || (estadoValidacion?.completo && loadingProg)) {
    return (
      <div className="py-20 text-center text-slate-400 text-xl flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        Verificando estado de la programación...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full mx-auto pb-20 px-4 sm:px-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Programación de Turnos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {esRangoPersonalizado
              ? `Vista personalizada: ${fechaInicio} al ${fechaFin}`
              : 'Vista consolidada de asignaciones y novedades.'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          {/* Selector de rango */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold px-1">RANGO</span>
            <Input
              type="date"
              className="w-auto h-8 text-xs dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
              value={pInicio || ''}
              onChange={(e) => {
                const params: any = {};
                if (e.target.value) params.fechaInicio = e.target.value;
                if (pFin) params.fechaFin = pFin;
                setSearchParams(params);
              }}
            />
            <span className="text-slate-300 dark:text-slate-600">-</span>
            <Input
              type="date"
              className="w-auto h-8 text-xs dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
              value={pFin || ''}
              onChange={(e) => {
                const params: any = {};
                if (pInicio) params.fechaInicio = pInicio;
                if (e.target.value) params.fechaFin = e.target.value;
                setSearchParams(params);
              }}
            />
            {(pInicio || pFin) && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-rose-500" onClick={limpiarFiltros}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Guardar / Revertir cambios pendientes */}
          {cambiosLocales.length > 0 && (
            <>
              <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={handleRevertirCambios}>
                <Undo2 className="mr-2 h-4 w-4" /> Revertir
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleGuardarCambios}>
                <Save className="mr-2 h-4 w-4" /> Guardar ({cambiosLocales.length})
              </Button>
            </>
          )}

          {/* Botón Generar */}
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 font-bold text-white"
            onClick={() => {
              setFechaGenerarInicio(pInicio || '');
              setFechaGenerarFin(pFin || '');
              setModalGenerar(true);
            }}
          >
            <Zap className="mr-2 h-4 w-4" /> Generar
          </Button>

          {/* Exportar Excel */}
          <Button
            onClick={handleExportar}
            disabled={programacion.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold text-white"
          >
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Buscador de empleado */}
      {programacion.length > 0 && (
        <div className="max-w-sm">
          <Select
            value={filtro || ""}
            onValueChange={(v) => {
              setFiltro(v === "__TODOS__" ? '' : v);
              setBusquedaVista('');
            }}
          >
            <SelectTrigger className="h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-200">
              <SelectValue placeholder="Buscar colaborador..." />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)]">
              <div className="flex items-center px-3 pb-2 border-b dark:border-slate-700" onPointerDown={(e) => e.stopPropagation()}>
                <UserSearch className="h-4 w-4 mr-2 text-slate-400" />
                <input
                  className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                  placeholder="Escriba para filtrar..."
                  value={busquedaVista}
                  onChange={(e) => setBusquedaVista(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto mt-1 p-1">
                <SelectItem value="__TODOS__" className="py-2 font-medium text-slate-500 italic">
                  Todos los colaboradores
                </SelectItem>
                {datosProcesados
                  .filter((e: any) => {
                    if (!busquedaVista.trim()) return true;
                    const term = busquedaVista.toLowerCase();
                    return e.nombre.toLowerCase().includes(term) || e.cedula.includes(term);
                  })
                  .map((e: any) => (
                    <SelectItem key={e.id_empleado} value={e.id_empleado.toString()} className="py-2.5">
                      <span className="font-bold uppercase text-xs">{e.nombre}</span>
                      <span className="ml-2 text-indigo-600 font-mono text-xs">[{e.cedula}]</span>
                    </SelectItem>
                  ))
                }
              </div>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Banner informativo / estado vacío */}
      {(!pInicio || !pFin) ? (
        <Card className="border-dashed dark:border-slate-700 py-20 text-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex justify-center mb-6">
            <CalendarDays className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-medium text-slate-700 dark:text-slate-400">Seleccione un rango de fechas</h3>
          <p className="text-slate-400 dark:text-slate-500 max-w-md mx-auto mt-2 text-base">
            Ingrese las fechas de inicio y fin para visualizar la programación, o use el botón <strong>Generar</strong> para crear una nueva.
          </p>
        </Card>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 rounded-lg p-4 flex gap-3 items-start">
          <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <h5 className="font-bold text-blue-700 dark:text-blue-400 text-base mb-1">Vista interactiva</h5>
            <p className="text-blue-600/90 dark:text-blue-300/90 text-sm">
              Clic derecho sobre una celda para <strong>cambiar el turno</strong>, <strong>agregar novedad</strong> o <strong>eliminar</strong> el turno.
              Los cambios se acumulan hasta que presione <strong>Guardar</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Grid principal ── */}
      {(pInicio && pFin) && (
        (loadingProg || loadingEmpleados) ? (
          <div className="py-20 text-center text-slate-400 text-xl flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            Cargando datos frescos...
          </div>
        ) : (
          <div className="border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-base">Personal Programado</span>
              <Badge variant="secondary" className="bg-slate-700 dark:bg-slate-800 text-slate-100 dark:text-slate-300 border-0">
                {datosProcesados.length} Colaboradores
              </Badge>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-30 shadow-sm">
                  <tr>
                    <th className="sticky left-0 top-0 z-40 bg-slate-50 dark:bg-slate-900 border-b border-r dark:border-slate-700 p-4 text-left w-64 font-bold text-slate-700 dark:text-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">
                      COLABORADOR
                    </th>
                    {diasDelRango.map(dia => (
                      <th key={dia.fechaISO} className={cn(
                        "sticky top-0 z-30 border-b border-r dark:border-slate-700 min-w-[56px] p-2 text-center font-medium",
                        dia.esFinDeSemana
                          ? "bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold">{dia.nombre}</span>
                          <span className={cn("text-base font-bold", dia.esFinDeSemana && "text-slate-400 dark:text-slate-500")}>{dia.dia}</span>
                          {esRangoPersonalizado && <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">{dia.mesNombre}</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datosProcesados.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 border-r border-b dark:border-slate-700 px-4 py-3 font-medium text-slate-700 dark:text-slate-300 truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-col">
                          <span className="truncate text-sm font-bold">{emp.nombre}</span>
                          {emp.cedula && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{emp.cedula}</span>}
                        </div>
                      </td>
                      {diasDelRango.map(dia => {
                        let infoDia = emp.dias[dia.fechaISO];

                        // Verificar si es día de descanso sin asignación
                        if (!infoDia) {
                          let diasDescanso: number[] = [];
                          const dateObj = new Date(dia.fechaISO + 'T12:00:00');
                          const y = dateObj.getFullYear();
                          const m = dateObj.getMonth() + 1;
                          const diaNumero = dateObj.getDate();
                          // @ts-ignore
                          const descansos = emp.descansosRaw || [];
                          const descMes = descansos.find((d: any) => d.anio === y && d.mes === m);
                          if (descMes) {
                            try {
                              diasDescanso = Array.isArray(descMes.dias_descanso)
                                ? descMes.dias_descanso
                                : JSON.parse(descMes.dias_descanso as string);
                            } catch { diasDescanso = []; }
                          }
                          if (diasDescanso.includes(diaNumero)) {
                            infoDia = {
                              tipo: 'DESCANSO',
                              valor: 'DES',
                              estilo: 'bg-indigo-100/50 text-indigo-800 border-indigo-200 font-bold opacity-60',
                              detalle: 'Descanso Programado',
                              subvalor: '',
                              id_area: 0, id_turno: 0, id_detalle_programacion: 0
                            };
                          }
                        }

                        if (!infoDia) {
                          infoDia = {
                            tipo: 'LIBRE',
                            valor: 'LIBRE',
                            estilo: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
                            detalle: 'Disponible / Sin Turno',
                            subvalor: '',
                            id_area: 0, id_turno: 0, id_detalle_programacion: 0
                          };
                        }

                        // Se eliminó el filtro estricto de área para permitir ver turnos de otras áreas y modificarlos.

                        let bgColorClass = 'bg-white dark:bg-slate-800';
                        if (infoDia.tipo === 'DESCANSO') {
                          bgColorClass = 'bg-indigo-50/50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 font-bold opacity-60 cursor-default';
                        } else if (infoDia.tipo === 'LIBRE') {
                          bgColorClass = 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold cursor-context-menu';
                        } else if (infoDia.tipo === 'NOVEDAD') {
                          bgColorClass = infoDia.estilo;
                        } else if (infoDia.tipo === 'TURNO') {
                          bgColorClass = cn(
                            'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-2 dark:border-slate-600 cursor-context-menu',
                            infoDia._modificado && 'ring-2 ring-amber-400 ring-inset'
                          );
                        }

                        const esInteractiva = infoDia.tipo === 'TURNO' || infoDia.tipo === 'NOVEDAD' || infoDia.tipo === 'LIBRE';

                        return (
                          <td
                            key={dia.fechaISO}
                            className={cn(
                              "border-r border-b dark:border-slate-700 p-0 text-center h-[70px] w-14 relative group",
                              dia.esFinDeSemana ? "bg-slate-50/50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800"
                            )}
                            onContextMenu={(e) => {
                              if (!esInteractiva) return;
                              e.preventDefault();
                              setSubMenuTurno(false);
                              setMenuCelda({ x: e.clientX, y: e.clientY, emp, fecha: dia.fechaISO, infoDia });
                            }}
                          >
                            <div className={cn("w-full h-full flex flex-col items-center justify-center transition-all p-1 border dark:border-slate-700", bgColorClass)}>
                              {/* Tooltip hover */}
                              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-2 w-max max-w-[220px] bg-slate-900 text-white p-3 rounded-lg shadow-2xl pointer-events-none">
                                <div className="text-base font-bold mb-1">{infoDia.detalle}</div>
                                {infoDia.tipo === 'TURNO' && (
                                  <>
                                    <div className="text-sm font-medium text-slate-200">Horario: {infoDia.hora}</div>
                                    <div className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{infoDia.areaCompleta}</div>
                                  </>
                                )}
                                {esInteractiva && (
                                  <div className="text-xs text-slate-400 mt-1 italic">Clic derecho para editar</div>
                                )}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                              </div>

                              <span className={cn(
                                "font-black leading-tight max-w-full px-1",
                                infoDia.valor === 'LIBRE' || infoDia.valor === 'DES' ? 'text-[11px]' : 'text-[13px]'
                              )}>
                                {infoDia.valor}
                              </span>
                              {infoDia.tipo === 'TURNO' && infoDia.areaCompleta && infoDia.valor !== 'LIBRE' && (
                                <span className="text-[8px] font-bold opacity-80 leading-tight mt-0.5 max-w-[95%] text-center break-words line-clamp-2">
                                  {infoDia.areaCompleta}
                                </span>
                              )}
                              {infoDia._modificado && (
                                <span className="text-[8px] text-amber-500 font-bold leading-none">✏</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── Leyenda ── */}
      <div className="flex flex-col gap-4 pt-8 border-t dark:border-slate-700">
        <div className="flex flex-wrap gap-4 justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <span className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">LIBRE</span>
            Disponible
          </div>
          {leyendaTipos.map((tipo: any) => (
            <div key={tipo.label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <span className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border", tipo.color)}>{tipo.label}</span>
              {tipo.full}
            </div>
          ))}
        </div>
      </div>

      {/* ── Menú contextual de celda ── */}
      {menuCelda && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => { setMenuCelda(null); setSubMenuTurno(false); }}
            onContextMenu={(e) => { e.preventDefault(); setMenuCelda(null); setSubMenuTurno(false); }}
          />
          <div
            className="fixed z-[101] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-md overflow-visible min-w-[200px] py-1"
            style={{
              top: Math.min(menuCelda.y, window.innerHeight - 170),
              left: Math.min(menuCelda.x, window.innerWidth - 220)
            }}
          >
            {/* Cabecera del menú */}
            <div className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b dark:border-slate-700 mb-1">
              {menuCelda.emp.nombre.split(' ').slice(0, 2).join(' ')} — {menuCelda.fecha}
            </div>

            {/* Cambiar Turno (sub-menú) — solo cuando hay área asignada */}
            {menuCelda.infoDia.tipo === 'TURNO' && menuCelda.infoDia.valor !== 'LIBRE' && (
              <div className="relative">
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between gap-2 transition-colors text-slate-700 dark:text-slate-300"
                  onClick={() => setSubMenuTurno(v => !v)}
                >
                  <span className="flex items-center gap-2">
                    <Edit2 className="w-3.5 h-3.5" /> Cambiar Turno
                  </span>
                  <span className="text-slate-400">›</span>
                </button>
                {subMenuTurno && (
                  <div className="absolute left-full top-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-md overflow-y-auto min-w-[160px] max-h-60 py-1 z-[102]">
                    {(() => {
                      const turnosConfigArea = configGlobalAreas[menuCelda.infoDia.id_area]?.turnosIds || [];
                      const todosLosTurnos = (turnosRaw as any[]) || [];
                      const lista = turnosConfigArea.length > 0
                        ? todosLosTurnos.filter((t: any) => turnosConfigArea.includes(t.id_turno))
                        : todosLosTurnos.filter((t: any) => ![1, 2, 3].includes(t.id_turno));
                      return lista.map((t: any) => {
                        const ocupantes = obtenerOcupantes(
                          menuCelda.infoDia.id_area, t.id_turno, menuCelda.fecha, menuCelda.emp.id_empleado
                        );
                        const esActual = t.id_turno === menuCelda.infoDia.id_turno;
                        return (
                          <button
                            key={t.id_turno}
                            className={cn(
                              "w-full text-left px-3 py-2 text-sm transition-colors",
                              esActual
                                ? "bg-indigo-100 dark:bg-indigo-900/50 font-bold text-indigo-700 dark:text-indigo-300 cursor-default"
                                : "hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300"
                            )}
                            disabled={esActual}
                            onClick={() => handleAplicarCambioConVerificacion(
                              menuCelda.emp, menuCelda.fecha, menuCelda.infoDia,
                              menuCelda.infoDia.id_area, t.id_turno
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{t.tipo_turno}</span>
                              {ocupantes.length > 0 && (
                                <span className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1 rounded font-bold">
                                  {ocupantes.length} asig.
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Cambiar Área y Turno — disponible para TURNO, NOVEDAD y LIBRE */}
            {(menuCelda.infoDia.tipo === 'TURNO' || menuCelda.infoDia.tipo === 'NOVEDAD' || menuCelda.infoDia.tipo === 'LIBRE') && (
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors"
                onClick={() => {
                  setModalCambiarArea({ emp: menuCelda.emp, fecha: menuCelda.fecha, infoDia: menuCelda.infoDia });
                  setNuevaAreaId(menuCelda.infoDia.id_area || null);
                  setNuevoTurnoId(null);
                  setMenuCelda(null);
                  setSubMenuTurno(false);
                }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {menuCelda.infoDia.tipo === 'LIBRE' || menuCelda.infoDia.tipo === 'NOVEDAD'
                  ? 'Asignar Área y Turno'
                  : 'Cambiar Área y Turno'}
              </button>
            )}

            {/* Modificar novedad (solo si la celda ya es NOVEDAD) */}
            {menuCelda.infoDia.tipo === 'NOVEDAD' && (
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2 text-indigo-700 dark:text-indigo-300 transition-colors"
                onClick={() => {
                  setMenuCelda(null);
                  setEmpleadoSeleccionado({ id: menuCelda.emp.id_empleado, nombre: menuCelda.emp.nombre });
                  setFechaParaNovedad(menuCelda.fecha);
                  setNovedadExistenteParaModal({ id_novedad_tipo: menuCelda.infoDia.id_novedad_tipo || 0 });
                  setModalNovedadOpen(true);
                }}
              >
                <Edit2 className="w-3.5 h-3.5" /> Modificar Novedad
              </button>
            )}

            {/* Agregar novedad (solo si NO es ya una novedad) */}
            {menuCelda.infoDia.tipo !== 'NOVEDAD' && (
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors"
                onClick={() => {
                  setMenuCelda(null);
                  setEmpleadoSeleccionado({ id: menuCelda.emp.id_empleado, nombre: menuCelda.emp.nombre });
                  setFechaParaNovedad(menuCelda.fecha);
                  setNovedadExistenteParaModal(null);
                  setModalNovedadOpen(true);
                }}
              >
                <PlusCircle className="w-3.5 h-3.5" /> Agregar Novedad
              </button>
            )}

            {/* Eliminar turno (solo TURNO activo) */}
            {menuCelda.infoDia.tipo === 'TURNO' && menuCelda.infoDia.valor !== 'LIBRE' && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2 transition-colors border-t dark:border-slate-700 mt-1"
                onClick={() => handleEliminarTurno(menuCelda.emp, menuCelda.fecha, menuCelda.infoDia)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar Turno
              </button>
            )}

            {/* Eliminar novedad (solo NOVEDAD) */}
            {menuCelda.infoDia.tipo === 'NOVEDAD' && (
              <button
                className="w-full text-left px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center gap-2 transition-colors border-t dark:border-slate-700 mt-1"
                onClick={() => handleEliminarNovedad(menuCelda.emp, menuCelda.fecha)}
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar Novedad
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Modal de novedad rápida ── */}
      {modalNovedadOpen && empleadoSeleccionado && (
        <ModalNovedadRapida
          isOpen={modalNovedadOpen}
          onClose={() => { setModalNovedadOpen(false); setNovedadExistenteParaModal(null); }}
          empleado={empleadoSeleccionado}
          fechaSeleccionada={fechaParaNovedad || diasDelRango[0]?.fechaISO || ''}
          novedadExistente={novedadExistenteParaModal ?? undefined}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['novedades-lectura'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['programacion-consolidado'], exact: false });
          }}
        />
      )}

      {/* ── Modal de generación ── */}
      <Dialog open={modalGenerar} onOpenChange={(open) => { if (!generarMutation.isPending) setModalGenerar(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-600" /> Generar Programación Automática
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha Inicio</Label>
                <Input type="date" value={fechaGenerarInicio} onChange={e => setFechaGenerarInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Fecha Fin</Label>
                <Input type="date" value={fechaGenerarFin} onChange={e => setFechaGenerarFin(e.target.value)} />
              </div>
            </div>

            {fechaGenerarInicio && fechaGenerarFin && fechaGenerarInicio <= fechaGenerarFin && (
              <p className="text-xs text-slate-500 text-center">
                {Math.floor((new Date(fechaGenerarFin).getTime() - new Date(fechaGenerarInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1} días seleccionados
              </p>
            )}

            <div
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setBalancearHoras(v => !v)}
            >
              <Checkbox checked={balancearHoras} onCheckedChange={(v) => setBalancearHoras(v as boolean)} className="h-5 w-5" />
              <div>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300 block">Equilibrar Horas Asignadas</span>
                <span className="text-xs text-slate-500">Distribuye equitativamente las horas entre empleados.</span>
              </div>
            </div>

            {progExistenteGenerar?.existe && (
              <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                ⚠️ Ya existe programación en este rango ({progExistenteGenerar.total} registros). Al generar se reemplazará.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalGenerar(false)} disabled={generarMutation.isPending}>
              Cancelar
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={
                !fechaGenerarInicio || !fechaGenerarFin ||
                generarMutation.isPending ||
                fechaGenerarInicio > fechaGenerarFin
              }
              onClick={() => generarMutation.mutate()}
            >
              {generarMutation.isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                : <><Zap className="mr-2 h-4 w-4" /> Generar</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Cambiar Área y Turno ── */}
      <Dialog
        open={!!modalCambiarArea}
        onOpenChange={(open) => {
          if (!open) { setModalCambiarArea(null); setNuevaAreaId(null); setNuevoTurnoId(null); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-indigo-600" /> Cambiar Área y Turno
            </DialogTitle>
          </DialogHeader>

          {modalCambiarArea && (() => {
            const areasAsignadas: number[] = empleadoConfigModal?.areas_permitidas || [];
            // Áreas con config de turnos (de configGlobalAreas) + resto de areasRaw
            // Ordenar: primero las asignadas al empleado, luego las demás
            const todasAreas = areasRaw || [];
            const areasOrdenadas = [
              ...todasAreas.filter(a => areasAsignadas.includes(a.id_area)),
              ...todasAreas.filter(a => !areasAsignadas.includes(a.id_area)),
            ];

            // Turnos para el área seleccionada
            const turnosConfigArea = nuevaAreaId ? (configGlobalAreas[nuevaAreaId]?.turnosIds || []) : [];
            const todosLosTurnosRaw = (turnosRaw as any[]) || [];
            const turnosParaArea: any[] = nuevaAreaId
              ? (turnosConfigArea.length > 0
                  ? todosLosTurnosRaw.filter((x: any) => turnosConfigArea.includes(x.id_turno))
                  : todosLosTurnosRaw)
              : [];

            return (
              <div className="space-y-4 py-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Empleado: <strong className="text-slate-800 dark:text-slate-200">{modalCambiarArea.emp.nombre}</strong>
                  {' — '}{modalCambiarArea.fecha}
                </p>

                {/* Selector de área — todas las áreas con badge de asignada */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Nueva Área
                    {areasAsignadas.length > 0 && (
                      <span className="ml-2 text-xs text-slate-400 font-normal">
                        ({areasAsignadas.length} área{areasAsignadas.length > 1 ? 's' : ''} asignada{areasAsignadas.length > 1 ? 's' : ''} al empleado)
                      </span>
                    )}
                  </Label>
                  <Select
                    value={nuevaAreaId?.toString() || ''}
                    onValueChange={(v) => { setNuevaAreaId(Number(v)); setNuevoTurnoId(null); }}
                  >
                    <SelectTrigger className="dark:bg-slate-900/50 dark:border-slate-700">
                      <SelectValue placeholder="Seleccionar área..." />
                    </SelectTrigger>
                    <SelectContent>
                      {areasAsignadas.length > 0 && (
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Asignadas al empleado
                        </div>
                      )}
                      {areasOrdenadas.flatMap((area, index) => {
                        const esAsignada = areasAsignadas.includes(area.id_area);
                        const esActual = area.id_area === modalCambiarArea.infoDia.id_area;
                        const primeraNoAsignada = areasOrdenadas.findIndex(a => !areasAsignadas.includes(a.id_area)) === index;
                        const items: React.ReactNode[] = [];
                        if (!esAsignada && primeraNoAsignada && areasAsignadas.length > 0) {
                          items.push(
                            <div key={`sep-otras`} className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t dark:border-slate-700 mt-1">
                              Otras áreas
                            </div>
                          );
                        }
                        items.push(
                          <SelectItem key={area.id_area.toString()} value={area.id_area.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{area.nombre_area}</span>
                              {esAsignada && (
                                <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded font-bold">
                                  Asignada
                                </span>
                              )}
                              {esActual && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">
                                  Actual
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                        return items;
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de turno — filtrado por área seleccionada (o todos si no hay config) */}
                {nuevaAreaId && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Nuevo Turno
                      {turnosConfigArea.length === 0 && nuevaAreaId && (
                        <span className="ml-2 text-xs text-slate-400 font-normal">(todos los disponibles)</span>
                      )}
                    </Label>
                    <Select
                      value={nuevoTurnoId?.toString() || ''}
                      onValueChange={(v) => setNuevoTurnoId(Number(v))}
                    >
                      <SelectTrigger className="dark:bg-slate-900/50 dark:border-slate-700">
                        <SelectValue placeholder="Seleccionar turno..." />
                      </SelectTrigger>
                      <SelectContent>
                        {turnosParaArea.map((t: any) => {
                          const ocupantes = obtenerOcupantes(
                            nuevaAreaId, t.id_turno, modalCambiarArea.fecha, modalCambiarArea.emp.id_empleado
                          );
                          return (
                            <SelectItem key={t.id_turno} value={t.id_turno.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{t.tipo_turno}</span>
                                {ocupantes.length > 0 && (
                                  <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1 rounded font-bold">
                                    {ocupantes.length} ya asignado{ocupantes.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Aviso de ocupación previa */}
                {nuevaAreaId && nuevoTurnoId && (() => {
                  const ocup = obtenerOcupantes(nuevaAreaId, nuevoTurnoId, modalCambiarArea.fecha, modalCambiarArea.emp.id_empleado);
                  if (ocup.length === 0) return null;
                  return (
                    <div className="flex gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Este turno ya tiene {ocup.length} persona(s) asignada(s):</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {ocup.map((p: any) => (
                            <li key={p.id_empleado}>{p.nombre_empleado || p.empleado?.nombre_completo}</li>
                          ))}
                        </ul>
                        <p className="mt-1 text-xs">Al confirmar podrás elegir si reemplazar a alguno o simplemente agregarte.</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setModalCambiarArea(null); setNuevaAreaId(null); setNuevoTurnoId(null); }}
            >
              Cancelar
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!nuevaAreaId || !nuevoTurnoId}
              onClick={() => {
                if (modalCambiarArea && nuevaAreaId && nuevoTurnoId) {
                  handleAplicarCambioConVerificacion(
                    modalCambiarArea.emp, modalCambiarArea.fecha, modalCambiarArea.infoDia,
                    nuevaAreaId, nuevoTurnoId
                  );
                }
              }}
            >
              Confirmar Cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog de conflicto / swap ── */}
      <Dialog open={!!dialogConflicto} onOpenChange={(open) => { if (!open) setDialogConflicto(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" /> Turno ya ocupado
            </DialogTitle>
          </DialogHeader>

          {dialogConflicto && (() => {
            const { personas, cambioTarget } = dialogConflicto;
            const areaNombre = areasMap.get(cambioTarget.areaDestino) || `Área ${cambioTarget.areaDestino}`;
            const turnoObj = (turnosRaw as any[])?.find((t: any) => t.id_turno === cambioTarget.turnoDestino);
            const turnoNombre = (turnoObj as any)?.tipo_turno || `Turno ${cambioTarget.turnoDestino}`;
            return (
              <div className="space-y-3 py-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  El turno <strong className="text-slate-900 dark:text-white">{turnoNombre}</strong> en{' '}
                  <strong className="text-slate-900 dark:text-white">{areaNombre}</strong> del{' '}
                  <strong className="text-slate-900 dark:text-white">{cambioTarget.fecha}</strong> ya tiene{' '}
                  {personas.length === 1 ? 'una persona asignada' : `${personas.length} personas asignadas`}:
                </p>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700 divide-y dark:divide-slate-700">
                  {personas.map((p: any) => {
                    const nombreDesplazado = p.nombre_empleado || p.empleado?.nombre_completo || 'Empleado';
                    return (
                      <div key={p.id_empleado} className="flex items-center justify-between px-3 py-2 gap-3">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                            {nombreDesplazado}
                          </span>
                          <span className="text-xs text-rose-500 font-medium">quedará sin turno el {cambioTarget.fecha}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 h-7 shrink-0"
                          onClick={() => confirmarSwap(p)}
                        >
                          Reemplazar
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  También puedes agregar a <strong>{cambioTarget.emp.nombre.split(' ')[0]}</strong> sin desplazar a nadie (si el área acepta más de uno).
                </p>
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogConflicto(null)}>Cancelar</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={confirmarAgregacion}>
              Agregar sin reemplazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
