import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultasService, empleadosService, areasService, novedadesService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Users, Settings2, ArrowRight, Calendar as CalendarIcon, AlertCircle, Trash2 } from 'lucide-react';
import { format, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { EmpleadoCompleto, Area } from '@/types/api.types';

const TIPOS_NOVEDAD = [
  { id: 6, nombre: 'Descanso', color: 'bg-blue-600 text-white', corta: 'DES' },
  { id: 1, nombre: 'Vacaciones', color: 'bg-emerald-600 text-white', corta: 'VAC' },
  { id: 2, nombre: 'Incapacidad', color: 'bg-rose-600 text-white', corta: 'INC' },
  { id: 3, nombre: 'Licencia', color: 'bg-amber-500 text-black', corta: 'LIC' },
  { id: 4, nombre: 'Suspensión', color: 'bg-slate-800 text-white', corta: 'SUS' },
];

export default function ConfiguracionProgramacion() {
  const queryClient = useQueryClient();
  const [idEmpleadoSeleccionado, setIdEmpleadoSeleccionado] = useState<number | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<number>(6);
  const [novedades, setNovedades] = useState<Array<{ fecha: Date; id_tipo: number }>>([]);
  const [areasPermitidas, setAreasPermitidas] = useState<number[]>([]);
  const [maxTrabajadoresPorArea, setMaxTrabajadoresPorArea] = useState<Record<number, string>>({});
  const [cambiosPendientes, setCambiosPendientes] = useState<Map<string, any>>(new Map());
  const isSaving = useRef(false);

  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-01'));
  const [fechaFin, setFechaFin] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'));

  const { data: empleadosData } = useQuery({
    queryKey: ['empleados-completos'],
    queryFn: () => consultasService.obtenerEmpleadosCompletos({ estado: true }),
  });

  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: () => areasService.listar(),
  });

  const { data: novedadesMes } = useQuery({
    queryKey: ['novedades-mes', fechaInicio, fechaFin],
    queryFn: () => consultasService.listarNovedades({ inicio: fechaInicio, fin: fechaFin }),
    enabled: !!fechaInicio && !!fechaFin
  });

  const empleados = empleadosData?.empleados || [];
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
    if (!idEmpleadoSeleccionado) {
      setNovedades([]);
      setAreasPermitidas([]);
      setCambiosPendientes(new Map());
      return;
    }

    if (isSaving.current) return;

    if (empleadoSeleccionado) {
      setAreasPermitidas(empleadoSeleccionado.areas_permitidas || []);

      const actualesEnDb = novedadesMes?.success
        ? novedadesMes.data
          .filter((n: any) => n.id_empleado === idEmpleadoSeleccionado)
          .flatMap((n: any) => {
            if (!n.detalle_novedad || n.detalle_novedad.length === 0) return [];

            return n.detalle_novedad.map((d: any) => ({
              fecha: parseISO(d.fecha),
              id_tipo: n.id_novedad_tipo
            }));
          })
        : [];

      setNovedades(actualesEnDb);
      setCambiosPendientes(new Map());
    }
  }, [idEmpleadoSeleccionado, empleadoSeleccionado, novedadesMes]);

  const handleDiaToggle = (fecha: Date) => {
    const fechaStr = format(fecha, 'yyyy-MM-dd');

    setNovedades(prev => {
      const existe = prev.find(n => isSameDay(n.fecha, fecha));
      const nuevosCambios = new Map(cambiosPendientes);

      if (existe) {
        if (existe.id_tipo === tipoSeleccionado) {
          nuevosCambios.set(fechaStr, { fecha: fechaStr, id_tipo: existe.id_tipo, tipo: 'eliminar' });
          setCambiosPendientes(nuevosCambios);
          return prev.filter(n => !isSameDay(n.fecha, fecha));
        }
        nuevosCambios.set(fechaStr, { fecha: fechaStr, id_tipo: tipoSeleccionado, tipo: 'modificar' });
        setCambiosPendientes(nuevosCambios);
        return prev.map(n => isSameDay(n.fecha, fecha) ? { ...n, id_tipo: tipoSeleccionado } : n);
      }

      nuevosCambios.set(fechaStr, { fecha: fechaStr, id_tipo: tipoSeleccionado, tipo: 'crear' });
      setCambiosPendientes(nuevosCambios);
      return [...prev, { fecha, id_tipo: tipoSeleccionado }];
    });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados-completos'] });
      queryClient.invalidateQueries({ queryKey: ['novedades-mes'] });
      setCambiosPendientes(new Map());
      toast.success('Configuración sincronizada correctamente');
      setTimeout(() => { isSaving.current = false; }, 500);
    },
    onError: () => {
      isSaving.current = false;
      toast.error('Error al sincronizar configuración');
    }
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Programación Técnica</h1>
          <p className="text-slate-500 font-medium">Gestión de disponibilidad y capacidades</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border shadow-sm">
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
          <div className="hidden sm:block text-slate-300"><ArrowRight className="h-5 w-5" /></div>
          <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 min-w-[140px] text-center">
            <p className="text-[10px] font-black text-indigo-400 uppercase">Días en Rango</p>
            <p className="text-lg font-black text-indigo-700">{diasEnRango.length}</p>
          </div>
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl border shadow-sm border-slate-200">
        <div className="max-w-md space-y-2">
          <Label className="font-bold text-slate-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" /> Colaborador
          </Label>
          <Select
            value={idEmpleadoSeleccionado?.toString() || ""}
            onValueChange={v => {
              isSaving.current = false;
              setIdEmpleadoSeleccionado(parseInt(v));
            }}
          >
            <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
              <SelectValue placeholder="Seleccione un empleado..." />
            </SelectTrigger>
            <SelectContent>
              {empleados.map((e: EmpleadoCompleto) => (
                <SelectItem key={e.id_empleado} value={e.id_empleado.toString()}>{e.nombre_completo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {idEmpleadoSeleccionado ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="lg:col-span-1 shadow-lg border-slate-200 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-700">
                <Settings2 className="h-4 w-4" /> Áreas de Cobertura
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-white">
              <div className="space-y-2">
                {areas?.map((area: Area) => (
                  <div
                    key={area.id_area}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${areasPermitidas.includes(area.id_area) ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-50' : 'hover:bg-slate-50 border-slate-100'}`}
                    onClick={() => setAreasPermitidas(prev => prev.includes(area.id_area) ? prev.filter(id => id !== area.id_area) : [...prev, area.id_area])}
                  >
                    <Checkbox checked={areasPermitidas.includes(area.id_area)} className="h-5 w-5 rounded-md" />
                    <span className={`text-sm font-bold ${areasPermitidas.includes(area.id_area) ? 'text-indigo-900' : 'text-slate-500'}`}>{area.nombre_area}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-lg border-slate-200 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/80 border-b gap-4 py-3">
              <div className="flex items-center gap-4">
                <CardTitle className="text-sm font-bold text-slate-700">Calendario de Disponibilidad</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const nuevosCambios = new Map(cambiosPendientes);
                    novedades.forEach(n => {
                      const key = format(n.fecha, 'yyyy-MM-dd');
                      nuevosCambios.set(key, { fecha: key, id_tipo: n.id_tipo, tipo: 'eliminar' });
                    });
                    setCambiosPendientes(nuevosCambios);
                    setNovedades([]);
                  }}
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 font-bold text-xs uppercase"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Limpiar Mes
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 bg-white p-1 rounded-full border shadow-sm">
                {TIPOS_NOVEDAD.map(t => (
                  <button
                    key={t.id}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${tipoSeleccionado === t.id ? `${t.color} scale-105 shadow-md` : 'text-slate-400 hover:text-slate-600'}`}
                    onClick={() => setTipoSeleccionado(t.id)}
                  >
                    {t.nombre}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {diasEnRango.map(fecha => {
                  const novedad = novedades.find(n => isSameDay(n.fecha, fecha));
                  const tipo = TIPOS_NOVEDAD.find(t => t.id === novedad?.id_tipo);
                  return (
                    <div
                      key={fecha.toISOString()}
                      onClick={() => handleDiaToggle(fecha)}
                      className={`h-20 border-2 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative group shadow-sm ${novedad ? `${tipo?.color} border-transparent scale-[1.02]` : 'bg-white hover:border-indigo-300 border-slate-50'}`}
                    >
                      <span className="text-[10px] font-bold opacity-60 uppercase mb-1">{format(fecha, 'eee', { locale: es })}</span>
                      <span className="text-lg font-black">{format(fecha, 'dd')}</span>
                      {novedad && <span className="text-[9px] font-black tracking-tighter mt-1">{tipo?.corta}</span>}
                      {cambiosPendientes.has(format(fecha, 'yyyy-MM-dd')) && (
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
                  disabled={guardarTodoMutation.isPending || (cambiosPendientes.size === 0 && JSON.stringify(areasPermitidas) === JSON.stringify(empleadoSeleccionado?.areas_permitidas))}
                >
                  <Save className="h-6 w-6 mr-3" /> {guardarTodoMutation.isPending ? 'SINCRONIZANDO...' : 'GUARDAR CAMBIOS'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-80 flex flex-col items-center justify-center border-4 border-dashed rounded-3xl text-slate-300 bg-slate-50/30">
          <CalendarIcon className="h-12 w-12 mb-4 opacity-20 text-indigo-600" />
          <p className="font-bold text-lg">Seleccione un colaborador para configurar</p>
        </div>
      )}

      <Card className="border-indigo-100 bg-indigo-50/30 rounded-2xl overflow-hidden mt-6 shadow-md">
        <CardHeader className="py-4 border-b border-indigo-100 bg-white/50 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black text-indigo-900 flex items-center gap-2 tracking-widest uppercase">
            <Settings2 className="h-4 w-4" /> Capacidad Máxima por Área
          </CardTitle>
          <Button size="sm" onClick={guardarCapacidadesGlobales} className="bg-indigo-600 hover:bg-indigo-700 font-bold h-8 text-[10px]">
            <Save className="h-3 w-3 mr-2" /> ACTUALIZAR CAPACIDADES
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {areas?.map((area: Area) => (
              <div key={area.id_area} className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm space-y-2">
                <Label className="text-[10px] uppercase text-slate-400 font-black block leading-tight">{area.nombre_area}</Label>
                <div className="relative group">
                  <input
                    type="text"
                    value={maxTrabajadoresPorArea[area.id_area] ?? ""}
                    onChange={(e) => handleCapacidadChange(area.id_area, e.target.value)}
                    placeholder="0"
                    className={`w-full h-10 bg-indigo-50/50 rounded-xl px-3 font-black text-indigo-700 text-lg focus:outline-none focus:ring-2 transition-all border-none ${(!maxTrabajadoresPorArea[area.id_area] || parseInt(maxTrabajadoresPorArea[area.id_area]) === 0) ? 'ring-2 ring-rose-300 bg-rose-50' : 'focus:ring-indigo-300'}`}
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
    </div>
  );
}