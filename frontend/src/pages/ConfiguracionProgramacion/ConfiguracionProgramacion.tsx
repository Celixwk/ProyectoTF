import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultasService, empleadosService, areasService, novedadesService, programacionService, parametrizacionService, turnosService } from '@/services/api.service';
import { BannerNecesidadRegenerar } from '@/utils/BannerNecesidadRegenerar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Users, Settings2, ArrowRight, Calendar as CalendarIcon, AlertCircle, Trash2, Search, Clock } from 'lucide-react';
import { format, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { EmpleadoCompleto, Area, Turno } from '@/types/api.types';

const parseFechaSinAjuste = (fechaStr: string) => {
  if (!fechaStr) return null;
  const [y, m, d] = fechaStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function ConfiguracionProgramacion() {
  const queryClient = useQueryClient();
  const [idEmpleadoSeleccionado, setIdEmpleadoSeleccionado] = useState<number | null>(null);
  const [busquedaEmpleado, setBusquedaEmpleado] = useState('');
  const [tipoSeleccionado, setTipoSeleccionado] = useState<number | undefined>(undefined);
  const [novedades, setNovedades] = useState<Array<{ fecha: Date; id_tipo: number; id_novedad_empleado?: number }>>([]);
  const [areasPermitidas, setAreasPermitidas] = useState<number[]>([]);
  const [maxTrabajadoresPorArea, setMaxTrabajadoresPorArea] = useState<Record<number, string>>({});
  const [cambiosPendientes, setCambiosPendientes] = useState<Map<string, any>>(new Map());
  const [bannerIgnorado, setBannerIgnorado] = useState(false);
  const [metaHorasInput, setMetaHorasInput] = useState<string>('');
  const [inicioNocturnoInput, setInicioNocturnoInput] = useState<string>('');
  const [maximoExtrasInput, setMaximoExtrasInput] = useState<string>('');
  const [maxDiasConsecutivosInput, setMaxDiasConsecutivosInput] = useState<string>('');
  
  // States para turnos globales y preferencias
  const [configAreasTurnos, setConfigAreasTurnos] = useState<Record<number, number[]>>({}); // area -> turnoIds
  const [preferenciasEmpleados, setPreferenciasEmpleados] = useState<Record<number, Record<number, number | null>>>({}); // idEmpleado -> area -> turnoId

  const isSaving = useRef(false);

  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-01'));
  const [fechaFin, setFechaFin] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'));

  const mesActual = useMemo(() => parseInt(fechaInicio.split('-')[1]), [fechaInicio]);
  const anioActual = useMemo(() => parseInt(fechaInicio.split('-')[0]), [fechaInicio]);

  useEffect(() => {
    setBannerIgnorado(false);
  }, [mesActual, anioActual]);

  const { data: alertasMotor = [], refetch: refetchAlertas } = useQuery({
    queryKey: ['validar-programacion', fechaInicio, fechaFin],
    queryFn: async () => {
      return programacionService.validarPeriodo(fechaInicio, fechaFin);
    },
    staleTime: 0
  });

  const { data: metaHorasData, refetch: refetchMetaHoras } = useQuery({
    queryKey: ['parametro-meta-horas'],
    queryFn: () => parametrizacionService.obtener('META_HORAS_PERIODO'),
    staleTime: 60_000
  });

  const { data: inicioNocturnaData, refetch: refetchInicioNocturna } = useQuery({
    queryKey: ['parametro-inicio-nocturna'],
    queryFn: () => parametrizacionService.obtener('HORA_INICIO_NOCTURNA'),
    staleTime: 60_000
  });

  const { data: maximoExtrasData, refetch: refetchMaximoExtras } = useQuery({
    queryKey: ['parametro-maximo-extras'],
    queryFn: () => parametrizacionService.obtener('MAXIMO_HORAS_EXTRAS'),
    staleTime: 60_000
  });

  const { data: maxDiasConsecutivosData, refetch: refetchMaxDiasConsecutivos } = useQuery({
    queryKey: ['parametro-dias-consecutivos'],
    queryFn: () => parametrizacionService.obtener('MAX_DIAS_CONSECUTIVOS'),
    staleTime: 60_000
  });

  const { data: turnosSistema } = useQuery({
    queryKey: ['turnos'],
    queryFn: () => turnosService.listar(),
    staleTime: 60_000,
  });

  const { data: configTurnosAreaParam, refetch: refetchTurnosAreas } = useQuery({
    queryKey: ['parametro-turnos-areas'],
    queryFn: () => parametrizacionService.obtener('CONFIGURACION_TURNOS_AREA'),
  });

  const { data: configTurnosEmpleadoParam, refetch: refetchTurnosEmpleados } = useQuery({
    queryKey: ['parametro-turnos-empleados'],
    queryFn: () => parametrizacionService.obtener('PREFERENCIAS_EMPLEADOS_TURNOS'),
  });

  useEffect(() => {
    if (configTurnosAreaParam?.valor_texto) {
      try {
        setConfigAreasTurnos(JSON.parse(configTurnosAreaParam.valor_texto));
      } catch (e) { console.error(e); }
    }
  }, [configTurnosAreaParam]);

  useEffect(() => {
    if (configTurnosEmpleadoParam?.valor_texto) {
      try {
        setPreferenciasEmpleados(JSON.parse(configTurnosEmpleadoParam.valor_texto));
      } catch (e) { console.error(e); }
    }
  }, [configTurnosEmpleadoParam]);

  useEffect(() => {
    if (metaHorasData?.horas_maximas !== undefined) {
      setMetaHorasInput(String(Number(metaHorasData.horas_maximas)));
    }
  }, [metaHorasData]);

  useEffect(() => {
    // Si no existe, sugerir 21 (9:00 PM)
    if (inicioNocturnaData?.horas_maximas !== undefined) {
      setInicioNocturnoInput(String(Number(inicioNocturnaData.horas_maximas)));
    } else if (!inicioNocturnaData) {
      setInicioNocturnoInput('21');
    }
  }, [inicioNocturnaData]);

  useEffect(() => {
    // Si no existe, sugerir 48 horas como máximo legal general
    if (maximoExtrasData?.horas_maximas !== undefined) {
      setMaximoExtrasInput(String(Number(maximoExtrasData.horas_maximas)));
    } else if (!maximoExtrasData) {
      setMaximoExtrasInput('48');
    }
  }, [maximoExtrasData]);

  useEffect(() => {
    if (maxDiasConsecutivosData?.horas_maximas !== undefined) {
      setMaxDiasConsecutivosInput(String(Number(maxDiasConsecutivosData.horas_maximas)));
    } else if (!maxDiasConsecutivosData) {
      setMaxDiasConsecutivosInput('3');
    }
  }, [maxDiasConsecutivosData]);

  const { data: tiposNovedadData } = useQuery({
    queryKey: ['tipos-novedades'],
    queryFn: () => novedadesService.listarTipos(),
    staleTime: 60_000
  });

  const tiposNovedad = useMemo(() => {
    if (!tiposNovedadData) return [];
    const PALETAS = [
      { color: 'bg-blue-600 text-white', bgPill: 'bg-blue-600' },
      { color: 'bg-emerald-600 text-white', bgPill: 'bg-emerald-600' },
      { color: 'bg-rose-600 text-white', bgPill: 'bg-rose-600' },
      { color: 'bg-amber-500 text-black', bgPill: 'bg-amber-500' },
      { color: 'bg-slate-800 text-white', bgPill: 'bg-slate-800' },
      { color: 'bg-violet-600 text-white', bgPill: 'bg-violet-600' },
      { color: 'bg-pink-600 text-white', bgPill: 'bg-pink-600' },
      { color: 'bg-cyan-600 text-white', bgPill: 'bg-cyan-600' },
    ];
    return tiposNovedadData.map((t: any, index: number) => {
      const paleta = PALETAS[index % PALETAS.length];
      return {
        id: t.id_novedad_tipo,
        nombre: t.nombre_novedad,
        color: paleta.color,
        bgPill: paleta.bgPill,
        corta: t.codigo || t.nombre_novedad.substring(0, 3).toUpperCase()
      };
    });
  }, [tiposNovedadData]);

  useEffect(() => {
    if (tiposNovedad.length > 0 && (!tipoSeleccionado || !tiposNovedad.find((t: any) => t.id === tipoSeleccionado))) {
      setTipoSeleccionado(tiposNovedad[0].id);
    }
  }, [tiposNovedad, tipoSeleccionado]);

  const guardarMetaHorasMutation = useMutation({
    mutationFn: (horas: number) => parametrizacionService.guardar('META_HORAS_PERIODO', { horas_maximas: horas }),
    onSuccess: () => {
      refetchMetaHoras();
      toast.success('Meta de horas guardada correctamente');
    },
    onError: () => toast.error('Error al guardar la meta de horas'),
  });

  const guardarInicioNocturnaMutation = useMutation({
    mutationFn: (hora: number) => parametrizacionService.guardar('HORA_INICIO_NOCTURNA', { horas_maximas: hora }),
    onSuccess: () => {
      refetchInicioNocturna();
      toast.success('Hora inicio de jornada nocturna guardada');
    },
    onError: () => toast.error('Error guardando inicio nocturno'),
  });

  const guardarMaximoExtrasMutation = useMutation({
    mutationFn: (horas: number) => parametrizacionService.guardar('MAXIMO_HORAS_EXTRAS', { horas_maximas: horas }),
    onSuccess: () => {
      refetchMaximoExtras();
      toast.success('Máximo de horas extras guardado');
    },
    onError: () => toast.error('Error guardando máximo de extras'),
  });

  const guardarMaxDiasConsecutivosMutation = useMutation({
    mutationFn: (dias: number) => parametrizacionService.guardar('MAX_DIAS_CONSECUTIVOS', { horas_maximas: dias }),
    onSuccess: () => {
      refetchMaxDiasConsecutivos();
      toast.success('Límite de días consecutivos guardado');
    },
    onError: () => toast.error('Error guardando límite de días consecutivos'),
  });

  const guardarTurnosAreasMutation = useMutation({
    mutationFn: (turnos: Record<number, number[]>) => parametrizacionService.guardar('CONFIGURACION_TURNOS_AREA', { valor_texto: JSON.stringify(turnos) }),
    onSuccess: () => {
      refetchTurnosAreas();
      toast.success('Configuración de turnos para áreas guardada');
    },
    onError: () => toast.error('Error guardando turnos de áreas'),
  });

  const guardarPreferenciasEmpleadosMutation = useMutation({
    mutationFn: (preferencias: Record<number, Record<number, number | null>>) => parametrizacionService.guardar('PREFERENCIAS_EMPLEADOS_TURNOS', { valor_texto: JSON.stringify(preferencias) }),
    onSuccess: () => {
      refetchTurnosEmpleados();
    },
  });

  const fechaConflicto = useMemo(() => {
    const conflictos = alertasMotor.filter((a: any) => a.tipo === 'NOVEDAD');
    if (conflictos.length === 0) return null;

    const fechas = conflictos.map((a: any) => parseFechaSinAjuste(a.fecha));
    const fechasValidas = fechas.filter((f): f is Date => f !== null);

    if (fechasValidas.length === 0) return null;
    return new Date(Math.min(...fechasValidas.map(f => f.getTime())));
  }, [alertasMotor]);

  const { data: empleadosData } = useQuery({
    queryKey: ['empleados-completos', { estado: true, limit: 1000 }],
    queryFn: () =>
      consultasService.obtenerEmpleadosCompletos({
        estado: true,
        limit: 1000,
      }),
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: () => areasService.listar(),
  });

  const { data: novedadesMes } = useQuery({
    queryKey: ['novedades-completas', idEmpleadoSeleccionado, fechaInicio, fechaFin],
    queryFn: () => consultasService.obtenerNovedadesCompletas({
      id_empleado: idEmpleadoSeleccionado!,
      inicio: fechaInicio,
      fin: fechaFin
    }),
    enabled: !!idEmpleadoSeleccionado && !!fechaInicio && !!fechaFin
  });

  const empleados = empleadosData?.empleados || [];

  const empleadosFiltrados = useMemo(() => {
    const term = busquedaEmpleado.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!term) return empleados;
    return empleados.filter((e: EmpleadoCompleto) =>
      e.nombre_completo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(term)
    );
  }, [empleados, busquedaEmpleado]);

  const empleadoSeleccionado = empleados?.find((e: any) => e.id_empleado === idEmpleadoSeleccionado);

  const diasEnRango = useMemo(() => {
    try {
      return eachDayOfInterval({ start: parseISO(fechaInicio), end: parseISO(fechaFin) });
    } catch {
      return [];
    }
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    if (areas?.length) {
      const maximos: Record<number, string> = {};
      areas.forEach(area => {
        maximos[area.id_area] = area.max_trabajadores?.toString() || '0';
      });
      setMaxTrabajadoresPorArea(maximos);
    }
  }, [areas]);

  useEffect(() => {
    if (!idEmpleadoSeleccionado || !empleadoSeleccionado) {
      setNovedades([]);
      setAreasPermitidas([]);
      setCambiosPendientes(new Map());
      return;
    }
    if (isSaving.current) return;

    setAreasPermitidas(empleadoSeleccionado.areas_permitidas || []);
    const dataArray = Array.isArray(novedadesMes) ? novedadesMes : (novedadesMes?.novedades || []);
    const actualesEnDb = dataArray
      .filter((n: any) => Number(n.id_empleado) === idEmpleadoSeleccionado)
      .map((n: any) => ({
        fecha: parseFechaSinAjuste(n.fecha)!,
        id_tipo: n.id_novedad_tipo,
        id_novedad_empleado: n.id_novedad_empleado
      }));

    setNovedades(actualesEnDb);
    setCambiosPendientes(new Map());
  }, [idEmpleadoSeleccionado, empleadoSeleccionado, novedadesMes]);

  const handleDiaToggle = (fecha: Date) => {
    if (!tipoSeleccionado) return;
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    setNovedades(prev => {
      const existe = prev.find(n => isSameDay(n.fecha, fecha));
      const nuevosCambios = new Map(cambiosPendientes);

      if (existe) {
        if (existe.id_tipo === tipoSeleccionado) {
          nuevosCambios.set(fechaStr, {
            fecha: fechaStr,
            id_tipo: existe.id_tipo,
            id_novedad_empleado: existe.id_novedad_empleado,
            tipo: 'eliminar'
          });
          setCambiosPendientes(nuevosCambios);
          return prev.filter(n => !isSameDay(n.fecha, fecha));
        }
        nuevosCambios.set(fechaStr, {
          fecha: fechaStr,
          id_tipo: tipoSeleccionado,
          id_novedad_empleado: existe.id_novedad_empleado,
          tipo: 'modificar'
        });
        setCambiosPendientes(nuevosCambios);
        return prev.map(n => isSameDay(n.fecha, fecha) ? { ...n, id_tipo: tipoSeleccionado } : n);
      }

      nuevosCambios.set(fechaStr, { fecha: fechaStr, id_tipo: tipoSeleccionado, tipo: 'crear' });
      setCambiosPendientes(nuevosCambios);
      return [...prev, { fecha, id_tipo: tipoSeleccionado }];
    });
  };

  const handleLimpiarMes = () => {
    if (novedades.length === 0) return;
    const nuevosCambios = new Map(cambiosPendientes);
    novedades.forEach(n => {
      const key = format(n.fecha, 'yyyy-MM-dd');
      nuevosCambios.set(key, {
        fecha: key,
        id_tipo: n.id_tipo,
        id_novedad_empleado: n.id_novedad_empleado,
        tipo: 'eliminar'
      });
    });
    setCambiosPendientes(nuevosCambios);
    setNovedades([]);
    toast.info("Días marcados para eliminar localmente. Presione Guardar.");
  };

  const handleCapacidadChange = (id_area: number, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setMaxTrabajadoresPorArea(prev => ({ ...prev, [id_area]: numericValue }));
  };

  const guardarCapacidadesGlobales = async () => {
    const entries = Object.entries(maxTrabajadoresPorArea);
    try {
      const promesas = entries.map(([id, val]) =>
        areasService.actualizar(Number(id), { max_trabajadores: parseInt(val) || 0 })
      );
      await Promise.all(promesas);
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success("Capacidades actualizadas");
    } catch {
      toast.error("Error al actualizar capacidades");
    }
  };

  const guardarTodoMutation = useMutation({
    mutationFn: async (payload: { idEmpleado: number, areas: number[] }) => {
      isSaving.current = true;
      await empleadosService.actualizar(payload.idEmpleado, { areas_permitidas: payload.areas });
      if (cambiosPendientes.size > 0) {
        const operaciones = Array.from(cambiosPendientes.values());
        await novedadesService.sincronizar({
          id_empleado: payload.idEmpleado,
          operaciones
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['empleados-completos'] });
      await queryClient.invalidateQueries({ queryKey: ['novedades-completas'] });
      await queryClient.invalidateQueries({ queryKey: ['programacion-mensual'] });
      await queryClient.invalidateQueries({ queryKey: ['programacion-consolidado'] });

      await queryClient.invalidateQueries({ queryKey: ['validar-programacion'] });
      await refetchAlertas();

      setCambiosPendientes(new Map());
      setBannerIgnorado(false);
      toast.success('Configuración sincronizada correctamente');
      setTimeout(() => { isSaving.current = false; }, 500);
    },
    onError: () => {
      isSaving.current = false;
      toast.error('Error al sincronizar configuración');
    }
  });

  const hayCambiosEnAreas = JSON.stringify([...areasPermitidas].sort()) !== JSON.stringify([...(empleadoSeleccionado?.areas_permitidas || [])].sort());
  const hayCambiosPendientes = cambiosPendientes.size > 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Programación Técnica</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestión de disponibilidad y capacidades</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block px-1">Inicio</span>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block px-1">Fin</span>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
          <div className="hidden sm:block text-slate-300 dark:text-slate-600"><ArrowRight className="h-5 w-5" /></div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800/50 min-w-[140px] text-center">
            <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-300 uppercase">Días en Rango</p>
            <p className="text-lg font-black text-indigo-700 dark:text-indigo-400">{diasEnRango.length}</p>
          </div>
        </div>
      </header>

      {!bannerIgnorado && fechaConflicto && (
        <BannerNecesidadRegenerar
          fechaCorte={fechaConflicto}
          mes={mesActual}
          anio={anioActual}
          modo="aviso"
          onIgnore={() => setBannerIgnorado(true)}
        />
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm border-slate-200">
        <div className="max-w-md space-y-2">
          <Label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" /> Colaborador
          </Label>
          <Select
            value={idEmpleadoSeleccionado?.toString() || ""}
            onValueChange={v => {
              isSaving.current = false;
              setIdEmpleadoSeleccionado(parseInt(v));
              setBusquedaEmpleado('');
            }}
          >
            <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 dark:text-white">
              <SelectValue placeholder="Seleccione un empleado..." />
            </SelectTrigger>
            <SelectContent className="w-[var(--radix-select-trigger-width)]">
              <div
                className="flex items-center px-3 pb-2 border-b dark:border-slate-700"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Search className="h-4 w-4 mr-2 text-slate-400" />
                <input
                  className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                  placeholder="Escriba para filtrar..."
                  value={busquedaEmpleado}
                  onChange={(e) => setBusquedaEmpleado(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto mt-1 p-1">
                {empleadosFiltrados.length > 0 ? (
                  empleadosFiltrados.map((e: EmpleadoCompleto) => (
                    <SelectItem
                      key={e.id_empleado}
                      value={e.id_empleado.toString()}
                      className="py-3"
                    >
                      <span className="font-bold uppercase text-xs">
                        {e.nombre_completo}
                      </span>
                      <span className="ml-2 text-indigo-600 font-mono text-xs">
                        [{e.cedula}]
                      </span>
                    </SelectItem>
                  ))
                ) : (
                  <div className="py-6 text-center text-sm text-slate-500 italic">
                    Sin resultados para "{busquedaEmpleado}"
                  </div>
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>

      {idEmpleadoSeleccionado ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-1 shadow-lg border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-800/80 border-b dark:border-slate-700 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Settings2 className="h-4 w-4" /> Áreas de Cobertura
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-white dark:bg-slate-800">
              <div className="space-y-2">
                {areas?.map((area: Area) => {
                  const isChecked = areasPermitidas.includes(area.id_area);
                  const prefObj = preferenciasEmpleados[idEmpleadoSeleccionado] || {};
                  const turnoPrefId = prefObj[area.id_area] || null;

                  return (
                  <div
                    key={area.id_area}
                    className={`flex flex-col space-y-2 p-4 rounded-xl border transition-all ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-50 dark:ring-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}
                  >
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setAreasPermitidas(prev => prev.includes(area.id_area) ? prev.filter(id => id !== area.id_area) : [...prev, area.id_area])}>
                      <Checkbox checked={isChecked} className="h-5 w-5 rounded-md" />
                      <span className={`text-sm font-bold flex-1 ${isChecked ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>{area.nombre_area}</span>
                    </div>
                    {isChecked && configAreasTurnos[area.id_area]?.length > 0 && (
                      <div className="pl-8 pt-1 flex items-center gap-2">
                        <Label className="text-[10px] uppercase text-indigo-500 font-bold whitespace-nowrap">Turno Fijo (Opc.):</Label>
                        <Select
                          value={turnoPrefId ? turnoPrefId.toString() : "none"}
                          onValueChange={(val) => {
                            const valId = val === "none" ? null : parseInt(val);
                            setPreferenciasEmpleados(prev => {
                              const newPrefs = { ...prev };
                              if (!newPrefs[idEmpleadoSeleccionado]) newPrefs[idEmpleadoSeleccionado] = {};
                              newPrefs[idEmpleadoSeleccionado][area.id_area] = valId;
                              guardarPreferenciasEmpleadosMutation.mutate(newPrefs);
                              return newPrefs;
                            });
                          }}
                        >
                          <SelectTrigger className="h-7 text-[10px] font-bold flex-1 bg-white border-indigo-200">
                            <SelectValue placeholder="Libre (Auto)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-slate-500 italic text-xs">Libre (Auto)</SelectItem>
                            {configAreasTurnos[area.id_area]?.map(tId => {
                              const t = turnosSistema?.find((ts: Turno) => ts.id_turno === tId);
                              if (!t) return null;
                              return (
                                <SelectItem key={t.id_turno} value={t.id_turno.toString()}>
                                  <span className="font-black text-indigo-600">{t.tipo_turno}</span> 
                                  <span className="text-[10px] text-slate-500 ml-2">
                                    [{t.hora_entrada?.substring(0,5)} - {t.hora_salida?.substring(0,5)}
                                    {t.hora_entrada_2 && t.hora_salida_2 ? ` y ${t.hora_entrada_2.substring(0,5)} - ${t.hora_salida_2.substring(0,5)}` : ''}]
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-lg border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/80 dark:bg-slate-800/80 border-b dark:border-slate-700 gap-4 py-3">
              <div className="flex items-center gap-4">
                <CardTitle className="text-sm font-bold text-slate-700 dark:text-slate-300">Calendario de Disponibilidad</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLimpiarMes}
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 font-bold text-xs uppercase"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Limpiar Mes
                </Button>
              </div>
              <div className="flex bg-white dark:bg-slate-800 px-2 py-1 rounded-xl border dark:border-slate-700 shadow-sm items-center">
                <Select
                  value={tipoSeleccionado?.toString() || ""}
                  onValueChange={v => setTipoSeleccionado(parseInt(v))}
                >
                  <SelectTrigger className="h-8 text-xs font-bold w-[200px] border-none bg-transparent shadow-none focus:ring-0 dark:text-slate-300">
                    <SelectValue placeholder="Seleccione Novedad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposNovedad.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()} className="text-xs font-bold py-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${t.bgPill}`}></span>
                          {t.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {diasEnRango.map(fecha => {
                  const fechaISO = format(fecha, 'yyyy-MM-dd');
                  const novedad = novedades.find(n => format(n.fecha, 'yyyy-MM-dd') === fechaISO);
                  const tipo = tiposNovedad.find((t: any) => t.id === novedad?.id_tipo);
                  return (
                    <div
                      key={fechaISO}
                      onClick={() => handleDiaToggle(fecha)}
                      className={`h-20 border-2 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative group shadow-sm ${novedad ? `${tipo?.color} border-transparent scale-[1.02]` : 'bg-white dark:bg-slate-900/50 hover:border-indigo-300 border-slate-50 dark:border-slate-700 text-slate-900 dark:text-slate-300'}`}
                    >
                      <span className="text-[10px] font-bold opacity-60 uppercase mb-1">{format(fecha, 'eee', { locale: es })}</span>
                      <span className="text-lg font-black">{format(fecha, 'dd')}</span>
                      {novedad && <span className="text-[9px] font-black tracking-tighter mt-1">{tipo?.corta}</span>}
                      {cambiosPendientes.has(fechaISO) && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full shadow-sm" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 pt-6 border-t">
                <Button
                  className="w-full h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  onClick={() => guardarTodoMutation.mutate({ idEmpleado: idEmpleadoSeleccionado!, areas: areasPermitidas })}
                  disabled={guardarTodoMutation.isPending || (!hayCambiosEnAreas && !hayCambiosPendientes)}
                >
                  <Save className="h-6 w-6 mr-3" /> {guardarTodoMutation.isPending ? 'SINCRONIZANDO...' : 'GUARDAR CAMBIOS'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-80 flex flex-col items-center justify-center border-4 border-dashed dark:border-slate-700 rounded-3xl text-slate-300 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/30">
          <CalendarIcon className="h-12 w-12 mb-4 opacity-20 text-indigo-600 dark:text-indigo-400" />
          <p className="font-bold text-lg">Seleccione un colaborador para configurar</p>
        </div>
      )}

      <Card className="border-violet-100 dark:border-slate-700 bg-violet-50/20 dark:bg-slate-800/50 rounded-2xl overflow-hidden mt-6 shadow-md">
        <CardHeader className="py-4 border-b border-violet-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/80 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black text-violet-900 dark:text-violet-400 flex items-center gap-2 tracking-widest uppercase">
            <Settings2 className="h-4 w-4" /> Parámetros para Programación y Recargos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-2xl">
            Defina las variables fijas de control. Estos valores se utilizan automáticamente en todos los cálculos del sistema, como el reporte de desgloses y recargos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* META HORAS PERIODO */}
            <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-xl">
              <div>
                <Label className="text-[11px] uppercase text-slate-500 font-bold block mb-1">
                  Meta de Horas por Periodo <Clock className="inline h-3 w-3 ml-1 text-violet-500" />
                </Label>
                <span className="text-xs text-slate-400 leading-tight block mb-3">Horas base programables en la vigencia. Ej: 192 (mes).</span>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={metaHorasInput}
                  onChange={(e) => setMetaHorasInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej: 192"
                  className="w-full h-10 bg-white dark:bg-slate-800 rounded-lg px-3 font-semibold text-violet-700 dark:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all border border-slate-200 dark:border-slate-700"
                />
                <Button
                  onClick={() => {
                    const val = parseInt(metaHorasInput);
                    if (!isNaN(val) && val > 0) guardarMetaHorasMutation.mutate(val);
                    else toast.error('Ingrese un número válido mayor a 0');
                  }}
                  disabled={guardarMetaHorasMutation.isPending}
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-violet-600 hover:bg-violet-700 rounded-lg"
                  title="Guardar"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* HORA INICIO NOCTURNO */}
            <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-xl">
              <div>
                <Label className="text-[11px] uppercase text-slate-500 font-bold block mb-1">
                  Inicio Jornada Nocturna <Clock className="inline h-3 w-3 ml-1 text-slate-800" />
                </Label>
                <span className="text-xs text-slate-400 leading-tight block mb-3">Hora militar (0-23) desde donde inicia el recargo nocturno. Ej: 21.</span>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={inicioNocturnoInput}
                  onChange={(e) => setInicioNocturnoInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej: 21"
                  className="w-full h-10 bg-white dark:bg-slate-800 rounded-lg px-3 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                />
                <Button
                  onClick={() => {
                    const val = parseInt(inicioNocturnoInput);
                    if (!isNaN(val) && val >= 0 && val <= 23) guardarInicioNocturnaMutation.mutate(val);
                    else toast.error('Ingrese hora militar válida (0-23)');
                  }}
                  disabled={guardarInicioNocturnaMutation.isPending}
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-slate-800 hover:bg-slate-900 rounded-lg"
                  title="Guardar"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* MAXIMO HORAS EXTRAS */}
            <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-xl">
              <div>
                <Label className="text-[11px] uppercase text-slate-500 font-bold block mb-1">
                  Máximo Legal Horas Extras <AlertCircle className="inline h-3 w-3 ml-1 text-rose-500" />
                </Label>
                <span className="text-xs text-slate-400 leading-tight block mb-3">Límite de horas extras laborables por periodo. Ej: 48 (quincena/mes).</span>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={maximoExtrasInput}
                  onChange={(e) => setMaximoExtrasInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej: 48"
                  className="w-full h-10 bg-white dark:bg-slate-800 rounded-lg px-3 font-semibold text-rose-700 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all border border-slate-200 dark:border-slate-700"
                />
                <Button
                  onClick={() => {
                    const val = parseInt(maximoExtrasInput);
                    if (!isNaN(val) && val >= 0) guardarMaximoExtrasMutation.mutate(val);
                    else toast.error('Ingrese un número válido');
                  }}
                  disabled={guardarMaximoExtrasMutation.isPending}
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-rose-600 hover:bg-rose-700 rounded-lg"
                  title="Guardar"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* MAXIMO DIAS CONSECUTIVOS */}
            <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 rounded-xl">
              <div>
                <Label className="text-[11px] uppercase text-slate-500 font-bold block mb-1">
                  Días Consecutivos <CalendarIcon className="inline h-3 w-3 ml-1 text-slate-800" />
                </Label>
                <span className="text-xs text-slate-400 leading-tight block mb-3">Límite de días seguidos en la misma área antes de forzar rotación. Ej: 3.</span>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={maxDiasConsecutivosInput}
                  onChange={(e) => setMaxDiasConsecutivosInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej: 3"
                  className="w-full h-10 bg-white dark:bg-slate-800 rounded-lg px-3 font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                />
                <Button
                  onClick={() => {
                    const val = parseInt(maxDiasConsecutivosInput);
                    if (!isNaN(val) && val >= 1) guardarMaxDiasConsecutivosMutation.mutate(val);
                    else toast.error('Ingrese un número válido mayor a 0');
                  }}
                  disabled={guardarMaxDiasConsecutivosMutation.isPending}
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-slate-800 hover:bg-slate-900 rounded-lg"
                  title="Guardar"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      <Card className="border-indigo-100 dark:border-slate-700 bg-indigo-50/30 dark:bg-slate-800/50 rounded-2xl overflow-hidden mt-6 shadow-md">
        <CardHeader className="py-4 border-b border-indigo-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/80 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black text-indigo-900 dark:text-indigo-400 flex items-center gap-2 tracking-widest uppercase">
            <Settings2 className="h-4 w-4" /> Capacidad Máxima por Área
          </CardTitle>
          <Button size="sm" onClick={guardarCapacidadesGlobales} className="bg-indigo-600 hover:bg-indigo-700 font-bold h-8 text-[10px]">
            <Save className="h-3 w-3 mr-2" /> ACTUALIZAR CAPACIDADES
          </Button>
        </CardHeader>
        <CardContent className="p-6 bg-white dark:bg-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {areas?.map((area: Area) => (
              <div key={area.id_area} className="p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm space-y-2">
                <Label className="text-[10px] uppercase text-slate-400 font-black block leading-tight">{area.nombre_area}</Label>
                <div className="relative group">
                  <input
                    type="text"
                    value={maxTrabajadoresPorArea[area.id_area] ?? ""}
                    onChange={(e) => handleCapacidadChange(area.id_area, e.target.value)}
                    placeholder="0"
                    className={`w-full h-10 bg-indigo-50/50 dark:bg-slate-800 rounded-xl px-3 font-black text-indigo-700 dark:text-indigo-400 text-lg focus:outline-none focus:ring-2 transition-all border-none ${(!maxTrabajadoresPorArea[area.id_area] || parseInt(maxTrabajadoresPorArea[area.id_area]) === 0) ? 'ring-2 ring-rose-300 bg-rose-50 dark:bg-rose-900/20' : 'focus:ring-indigo-300'}`}
                  />
                  {(!maxTrabajadoresPorArea[area.id_area] || parseInt(maxTrabajadoresPorArea[area.id_area]) === 0) && (
                    <AlertCircle className="absolute right-2 top-2.5 h-5 w-5 text-rose-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-100 dark:border-slate-700 bg-emerald-50/20 dark:bg-slate-800/50 rounded-2xl overflow-hidden mt-6 shadow-md mb-6">
        <CardHeader className="py-4 border-b border-emerald-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/80 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black text-emerald-900 dark:text-emerald-400 flex items-center gap-2 tracking-widest uppercase">
            <Settings2 className="h-4 w-4" /> Configuración de Turnos por Área
          </CardTitle>
          <Button size="sm" onClick={() => guardarTurnosAreasMutation.mutate(configAreasTurnos)} className="bg-emerald-600 hover:bg-emerald-700 font-bold h-8 text-[10px]" disabled={guardarTurnosAreasMutation.isPending}>
            <Save className="h-3 w-3 mr-2" /> GUARDAR TURNOS
          </Button>
        </CardHeader>
        <CardContent className="p-6 bg-white dark:bg-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {areas?.filter((a: Area) => a.nombre_area.toUpperCase() !== 'REFUERZOS').map((area: Area) => (
              <div key={area.id_area} className="p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-emerald-100 dark:border-slate-700 shadow-sm space-y-3">
                <Label className="text-xs uppercase text-emerald-900 dark:text-emerald-400 font-black block leading-tight">{area.nombre_area}</Label>
                <div className="flex flex-wrap gap-2">
                  {turnosSistema?.map((turno: Turno) => {
                    const isSelected = configAreasTurnos[area.id_area]?.includes(turno.id_turno);
                    return (
                      <Button
                        key={turno.id_turno}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setConfigAreasTurnos(prev => {
                            const newConfig = { ...prev };
                            if (!newConfig[area.id_area]) newConfig[area.id_area] = [];
                            if (isSelected) {
                              newConfig[area.id_area] = newConfig[area.id_area].filter(id => id !== turno.id_turno);
                            } else {
                              newConfig[area.id_area] = [...newConfig[area.id_area], turno.id_turno];
                            }
                            return newConfig;
                          });
                        }}
                        className={`h-8 font-bold text-xs ${isSelected ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800'}`}
                      >
                        {turno.tipo_turno}
                        <span className="opacity-60 ml-1 font-normal text-[9px] hidden sm:inline">
                          [{turno.hora_entrada?.substring(0,5)} - {turno.hora_salida?.substring(0,5)}
                          {turno.hora_entrada_2 && turno.hora_salida_2 ? ` y ${turno.hora_entrada_2.substring(0,5)} - ${turno.hora_salida_2.substring(0,5)}` : ''}]
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}