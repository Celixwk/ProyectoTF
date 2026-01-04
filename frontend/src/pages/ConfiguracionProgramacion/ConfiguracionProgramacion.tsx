import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultasService, empleadosService, areasService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Users, Info, Settings2, ArrowRight, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
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
        maximos[area.id_area] = localStorage.getItem(`max_trabajadores_${area.id_area}`) || '5';
      });
      setMaxTrabajadoresPorArea(maximos);
    }
  }, [areas]);

  useEffect(() => {
    if (idEmpleadoSeleccionado && empleadoSeleccionado) {
      setAreasPermitidas(empleadoSeleccionado.areas_permitidas || []);
    }
  }, [idEmpleadoSeleccionado, empleadoSeleccionado]);

  const handleDiaToggle = (fecha: Date) => {
    setNovedades(prev => {
      const existe = prev.find(n => isSameDay(n.fecha, fecha));
      if (existe) {
        if (existe.id_tipo === tipoSeleccionado) return prev.filter(n => !isSameDay(n.fecha, fecha));
        return prev.map(n => isSameDay(n.fecha, fecha) ? { ...n, id_tipo: tipoSeleccionado } : n);
      }
      return [...prev, { fecha, id_tipo: tipoSeleccionado }];
    });
  };

  const handleCapacidadChange = (id_area: number, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setMaxTrabajadoresPorArea(prev => ({ ...prev, [id_area]: numericValue }));
  };

  const guardarCapacidadesGlobales = () => {
    const ids = Object.keys(maxTrabajadoresPorArea);
    for (const id of ids) {
      const val = maxTrabajadoresPorArea[Number(id)];
      if (!val || parseInt(val) <= 0) {
        toast.error("Capacidad no válida", {
          description: "Todas las áreas deben tener una capacidad mínima de 1 trabajador."
        });
        return;
      }
    }

    Object.entries(maxTrabajadoresPorArea).forEach(([id, val]) => {
      localStorage.setItem(`max_trabajadores_${id}`, val);
    });
    toast.success("Capacidades de área actualizadas correctamente");
  };

  const guardarTodoMutation = useMutation({
    mutationFn: async (payload: any) => {
      await empleadosService.actualizar(payload.idEmpleado, { areas_permitidas: payload.areas });
      localStorage.setItem(`nov_${payload.idEmpleado}_${fechaInicio}`, JSON.stringify(payload.novedades));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados-completos'] });
      toast.success('Configuración guardada exitosamente');
    }
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Programación Técnica</h1>
          <p className="text-slate-500 font-medium">Gestión de periodos, áreas y novedades</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border shadow-sm">
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Fin</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
          <div className="hidden sm:block text-slate-300"><ArrowRight className="h-5 w-5" /></div>
          <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 min-w-[140px] text-center">
            <p className="text-[10px] font-black text-indigo-400 uppercase">Días Totales</p>
            <p className="text-lg font-black text-indigo-700">{diasEnRango.length}</p>
          </div>
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl border shadow-sm border-slate-200">
        <div className="max-w-md space-y-2">
          <Label className="font-bold text-slate-700 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" /> Colaborador a Gestionar
          </Label>
          <Select value={idEmpleadoSeleccionado?.toString()} onValueChange={v => setIdEmpleadoSeleccionado(parseInt(v))}>
            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 focus:ring-indigo-500">
              <SelectValue placeholder="Busque por nombre o cargo..." />
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
                <Settings2 className="h-4 w-4" /> Áreas Permitidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-white">
              <div className="space-y-2">
                {areas?.map((area: Area) => (
                  <div
                    key={area.id_area}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${areasPermitidas.includes(area.id_area) ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-50' : 'hover:bg-slate-50 border-slate-100 opacity-70'}`}
                    onClick={() => setAreasPermitidas(prev => prev.includes(area.id_area) ? prev.filter(id => id !== area.id_area) : [...prev, area.id_area])}
                  >
                    <Checkbox checked={areasPermitidas.includes(area.id_area)} className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-indigo-600" />
                    <span className={`text-sm font-bold ${areasPermitidas.includes(area.id_area) ? 'text-indigo-900' : 'text-slate-500'}`}>{area.nombre_area}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-lg border-slate-200 rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/80 border-b gap-4 py-3">
              <CardTitle className="text-sm font-bold text-slate-700">Calendario de Novedades</CardTitle>
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
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 pt-6 border-t">
                <Button className="w-full h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xl shadow-indigo-200" onClick={() => guardarTodoMutation.mutate({ idEmpleado: idEmpleadoSeleccionado, areas: areasPermitidas, novedades })}>
                  <Save className="h-6 w-6 mr-3" /> GUARDAR CAMBIOS DEL EMPLEADO
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-80 flex flex-col items-center justify-center border-4 border-dashed rounded-3xl text-slate-300 bg-slate-50/30">
          <CalendarIcon className="h-12 w-12 mb-4 opacity-20 text-indigo-600" />
          <p className="font-bold text-lg">Seleccione un colaborador para configurar</p>
          <p className="text-sm font-medium">Defina el rango de fechas arriba antes de empezar</p>
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
          <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-slate-500 bg-white/50 p-3 rounded-xl border border-dashed border-slate-200">
            <Info className="h-4 w-4 text-indigo-400" />
            <span>Nota: Los cambios en esta sección son globales y afectan al algoritmo de asignación para todas las áreas.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}