import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { areasService, turnosService, programacionService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, CalendarDays, CheckCircle2, Trash2, AlertCircle, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import type { Area, Turno } from '@/types/api.types';

export default function ProgramacionAreas() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const hoy = new Date();
    const [mes, setMes] = useState(hoy.getMonth() + 1);
    const [anio, setAnio] = useState(hoy.getFullYear());
    const [paso, setPaso] = useState<'inicio' | 'configuracion' | 'resultado'>('inicio');
    const [mostrarDialogoNovedades, setMostrarDialogoNovedades] = useState(false);
    const [configAreas, setConfigAreas] = useState<Record<number, { turnosIds: number[] }>>({});
    const [programacionGenerada, setProgramacionGenerada] = useState<any[]>([]);
    const [alertasMotor, setAlertasMotor] = useState<any[]>([]);
    const { data: areasRaw, isLoading: areasLoading } = useQuery<Area[]>({
        queryKey: ['areas'],
        queryFn: () => areasService.listar()
    });
    const { data: turnosRaw, isLoading: turnosLoading } = useQuery<Turno[]>({
        queryKey: ['turnos'],
        queryFn: () => turnosService.listar({ estado: true })
    });
    const { data: novedadesData, isLoading: novedadesLoading } = useQuery({
        queryKey: ['novedades-periodo', mes, anio],
        queryFn: () => programacionService.obtenerNovedades(mes, anio),
        enabled: paso === 'inicio'
    });
    const areas = useMemo(() => {
        if (!areasRaw) return [];
        return areasRaw.filter(a => !a.nombre_area.toLowerCase().includes('refuerzo'));
    }, [areasRaw]);
    const turnos = useMemo(() => {
        if (!turnosRaw) return [];
        return turnosRaw.filter(t => ![1, 2, 3].includes(t.id_turno));
    }, [turnosRaw]);
    const infoDias = useMemo(() => {
        const total = new Date(anio, mes, 0).getDate();
        return Array.from({ length: total }, (_, i) => {
            const fecha = new Date(anio, mes - 1, i + 1);
            return {
                numero: i + 1,
                nombreDia: fecha.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
                fechaISO: fecha.toISOString().split('T')[0]
            };
        });
    }, [mes, anio]);
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() + i);
    useEffect(() => {
        if (areas.length > 0 && turnos.length > 0 && Object.keys(configAreas).length === 0) {
            const initialConfig: Record<number, { turnosIds: number[] }> = {};
            const tIds: Record<string, number> = { T1: 5, T2: 6, T3: 7, T5: 8, T6: 9, T8: 11, T11: 14, T13: 15 };
            areas.forEach((area) => {
                let idsSeleccionados: number[] = [];
                switch (area.id_area) {
                    case 1:
                        idsSeleccionados = [tIds.T1, tIds.T11];
                        break;
                    case 2:
                        idsSeleccionados = [tIds.T3, tIds.T5, tIds.T11, tIds.T13];
                        break;
                    case 3:
                        idsSeleccionados = [tIds.T5, tIds.T6, tIds.T11];
                        break;
                    case 4:
                        idsSeleccionados = [tIds.T3, tIds.T5];
                        break;
                    case 5:
                        idsSeleccionados = [tIds.T1, tIds.T5, tIds.T11];
                        break;
                    case 6:
                        idsSeleccionados = [tIds.T5, tIds.T11, tIds.T13];
                        break;
                    case 7:
                        idsSeleccionados = [tIds.T5, tIds.T11, tIds.T13];
                        break;
                    case 8:
                        idsSeleccionados = [tIds.T5, tIds.T11];
                        break;
                    case 9:
                        idsSeleccionados = [tIds.T13, tIds.T11, tIds.T5];
                        break;
                    case 10:
                        idsSeleccionados = [tIds.T5, tIds.T11];
                        break;
                    case 11:
                        idsSeleccionados = [tIds.T2, tIds.T5, tIds.T6, tIds.T8, tIds.T11];
                        break;
                    case 12:
                        idsSeleccionados = [tIds.T2, tIds.T3, tIds.T5, tIds.T6, tIds.T11];
                        break;
                    default:
                        idsSeleccionados = [tIds.T5, tIds.T11];
                }
                initialConfig[area.id_area] = { turnosIds: idsSeleccionados.filter(id => id !== undefined) };
            });
            setConfigAreas(initialConfig);
        }
    }, [areas, turnos, configAreas]);
    const formatTime = (time: string | null | undefined): string => {
        if (!time) return '--:--';
        const formatted = time.includes('T') ? time.split('T')[1] : time;
        return formatted.substring(0, 5);
    };
    const generarMutation = useMutation({
        mutationFn: async () => {
            const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const fin = new Date(anio, mes, 0).toISOString().split('T')[0];
            await programacionService.generarAutomatica({ mes, anio, configuracion: configAreas });
            return programacionService.listarPorPeriodo(inicio, fin);
        },
        onSuccess: (data: any) => {
            setProgramacionGenerada(Array.isArray(data) ? data : (data.data || []));
            setPaso('resultado');
            toast.success('Programación generada exitosamente');
            queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
            queryClient.invalidateQueries({ queryKey: ['programacion-periodo'] });
        },
        onError: () => toast.error('Error al generar la programación')
    });
    const eliminarMutation = useMutation({
        mutationFn: () => programacionService.eliminarMes(mes, anio),
        onSuccess: () => {
            toast.success('Programación eliminada del periodo');
            setPaso('inicio');
            setProgramacionGenerada([]);
            queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
        },
        onError: () => toast.error('No se pudo eliminar la programación')
    });
    const handleIniciarProceso = () => {
        if (novedadesData && novedadesData.length > 0) {
            setMostrarDialogoNovedades(true);
        } else {
            setPaso('configuracion');
        }
    };
    const handleExportar = () => {
        const filas: any[] = [];
        areas.forEach(area => {
            const cfg = configAreas[area.id_area];
            const turnosIds = cfg?.turnosIds || [];
            turnosIds.forEach(tId => {
                const turnoInfo = turnos.find(t => t.id_turno === tId);
                infoDias.forEach(dia => {
                    const asignados = programacionGenerada.filter((p: any) =>
                        Number(p.id_area) === area.id_area &&
                        Number(p.id_turno) === tId &&
                        p.fecha.split('T')[0] === dia.fechaISO
                    );
                    if (asignados.length === 0) {
                        filas.push({
                            Área: area.nombre_area,
                            Turno: turnoInfo?.tipo_turno || `T${tId}`,
                            Fecha: dia.fechaISO,
                            Empleado: ''
                        });
                    } else {
                        asignados.forEach((asig: any) => {
                            filas.push({
                                Área: area.nombre_area,
                                Turno: turnoInfo?.tipo_turno || `T${tId}`,
                                Fecha: dia.fechaISO,
                                Empleado: asig.nombre_empleado || asig.empleado?.nombre_completo || ''
                            });
                        });
                    }
                });
            });
        });
        const ws = XLSX.utils.json_to_sheet(filas);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Programacion');
        XLSX.writeFile(wb, `programacion_${meses[mes - 1]}_${anio}.xlsx`);
    };
    if (areasLoading || turnosLoading) return <div className="p-8 text-center text-slate-500">Cargando parámetros del sistema ...</div>;
    return (
        <div className="space-y-6 max-w-full mx-auto pb-20 px-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Motor de Programación</h1>
                <p className="text-slate-500">
                    {paso === 'inicio' && 'Defina el periodo de tiempo a programar. '}
                    {paso === 'configuracion' && 'Seleccione los turnos habilitados por cada área de trabajo. '}
                    {paso === 'resultado' && 'Revise la distribución del personal asignado automáticamente. '}
                </p>
            </div>
            {paso === 'inicio' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <Card className="bg-slate-50 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Mes de Programación</Label>
                                    <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v))}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {meses.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Año</Label>
                                    <Select value={String(anio)} onValueChange={(v) => setAnio(parseInt(v))}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {anios.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-dashed border-2 bg-white hover:border-indigo-200 transition-colors">
                        <CardContent className="pt-6 flex flex-col items-center justify-center text-center py-12 gap-4">
                            <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center">
                                <CalendarDays className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold">Configurar Distribución</h3>
                                <p className="text-sm text-slate-500">Se validarán novedades antes de proceder</p>
                            </div>
                            <Button size="lg" onClick={handleIniciarProceso} disabled={novedadesLoading} className="px-8">
                                {novedadesLoading ? 'Verificando Novedades ...' : 'Siguiente Paso'} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
            {paso === 'configuracion' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between bg-white p-4 border rounded-lg shadow-sm">
                        <div className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            Periodo: {meses[mes - 1]} {anio}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setPaso('inicio')}>Cambiar Periodo</Button>
                    </div>
                    <div className="grid gap-4">
                        {areas.map((area) => (
                            <Card key={area.id_area} className="border-l-4 border-l-indigo-500 overflow-hidden shadow-sm">
                                <CardHeader className="pb-3 bg-slate-50/50">
                                    <CardTitle className="text-lg text-slate-800">{area.nombre_area}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex flex-wrap gap-3">
                                        {turnos.map((turno) => {
                                            const isSelected = configAreas[area.id_area]?.turnosIds?.includes(turno.id_turno);
                                            return (
                                                <div
                                                    key={turno.id_turno}
                                                    onClick={() => {
                                                        const currentIds = configAreas[area.id_area]?.turnosIds || [];
                                                        const newIds = isSelected ? currentIds.filter(id => id !== turno.id_turno) : [...currentIds, turno.id_turno];
                                                        setConfigAreas(prev => ({ ...prev, [area.id_area]: { turnosIds: newIds } }));
                                                    }}
                                                    className={`cursor-pointer px-4 py-3 rounded-lg border text-sm flex items-center gap-3 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' : 'bg-white hover:border-slate-300'}`}
                                                >
                                                    <Checkbox checked={Boolean(isSelected)} onCheckedChange={() => { }} />
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700">{turno.tipo_turno}</span>
                                                        <span className="text-[11px] text-slate-500">{formatTime(turno.hora_entrada)} - {formatTime(turno.hora_salida)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm p-4 border rounded-xl shadow-2xl flex justify-end gap-3 z-50">
                        <Button variant="outline" onClick={() => setPaso('inicio')}>Atrás</Button>
                        <Button size="lg" className="px-10 bg-indigo-600 hover:bg-indigo-700" onClick={() => generarMutation.mutate()} disabled={generarMutation.isPending}>
                            {generarMutation.isPending ? 'Generando...' : 'Generar Programación'}
                        </Button>
                    </div>
                </div>
            )}
            {paso === 'resultado' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between bg-emerald-50 p-6 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-600 p-2 rounded-full">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-emerald-900">Programación Lista</h2>
                                <p className="text-emerald-700 text-sm">Se ha guardado la asignación automática en la base de datos.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => {
                                if (confirm("¿Estás seguro de eliminar esta programación? Se borrarán todos los registros de este mes en la DB.")) {
                                    eliminarMutation.mutate();
                                }
                            }} disabled={eliminarMutation.isPending}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                {eliminarMutation.isPending ? 'Borrando...' : 'Descartar y Borrar'}
                            </Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate(`/programacion/gestion?mes=${mes}&anio=${anio}`)}>
                                <LayoutDashboard className="h-4 w-4 mr-2" /> Ir a Gestión Mensual
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportar}>
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 10l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Exportar
                            </Button>
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <strong>Nota de Gestión:</strong> Los resultados mostrados son automáticos. Si desea realizar cambios manuales, mover empleados de refuerzo o ajustar turnos específicos, por favor diríjase a la ventana de <strong>Gestión Mensual</strong>.
                        </div>
                    </div>
                    {alertasMotor.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-500" />Problemas Detectados en la Generación</h3>
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {alertasMotor.map((grupo: any, idx: number) => (
                                    <Card key={idx} className="border-amber-100 bg-amber-50/30 overflow-hidden">
                                        <div className="bg-amber-100 px-3 py-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider flex justify-between items-center">
                                            <span>Fecha: {grupo.fecha}</span>
                                            <span className="bg-amber-200 px-1.5 py-0.5 rounded text-amber-900">{grupo.alertas.length} avisos</span>
                                        </div>
                                        <CardContent className="p-3 space-y-2">
                                            {grupo.alertas.map((alerta: any, aIdx: number) => (
                                                <div key={aIdx} className="flex items-start gap-2 text-[11px]">
                                                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${alerta.tipo === 'error' ? 'bg-red-500' : alerta.tipo === 'advertencia' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                                    <div className="space-y-0.5">
                                                        <p className="font-semibold text-slate-800 leading-tight">{alerta.mensaje}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="space-y-6">
                        {areas.map((area) => (
                            <div key={area.id_area} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                <div className="bg-slate-800 text-white px-5 py-3 font-bold uppercase text-xs tracking-widest">{area.nombre_area}</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <th className="border p-3 text-left w-28 sticky left-0 bg-slate-100 z-10 text-[11px] font-bold text-slate-600">TURNO</th>
                                                {infoDias.map((dia) => (
                                                    <th key={dia.fechaISO} className="border p-2 text-center text-[10px] min-w-[120px] text-slate-500">
                                                        <div className="flex flex-col">
                                                            <span className="text-indigo-600 font-bold">{dia.nombreDia}</span>
                                                            <span>{dia.numero} de {meses[mes - 1].substring(0, 3)}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {configAreas[area.id_area]?.turnosIds?.map((tId) => {
                                                const turnoInfo = turnos.find(t => t.id_turno === tId);
                                                return (
                                                    <tr key={tId} className="hover:bg-slate-50/50">
                                                        <td className="border p-3 font-bold text-indigo-700 sticky left-0 bg-white z-10 text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{turnoInfo?.tipo_turno}</td>
                                                        {infoDias.map((dia) => {
                                                            const asignados = programacionGenerada.filter((p: any) =>
                                                                Number(p.id_area) === area.id_area &&
                                                                Number(p.id_turno) === tId &&
                                                                p.fecha.split('T')[0] === dia.fechaISO
                                                            );
                                                            return (
                                                                <td key={dia.fechaISO} className="border p-2 min-h-[60px]">
                                                                    <div className="flex flex-col gap-1">
                                                                        {asignados.length > 0 ? asignados.map((asig: any, idx: number) => (
                                                                            <div key={idx} className="px-1.5 py-1 border border-slate-200 rounded text-[9px] leading-tight bg-slate-50 text-slate-700 font-medium truncate">
                                                                                {asig.nombre_empleado || asig.empleado?.nombre_completo || 'Empleado'}
                                                                            </div>
                                                                        )) : <span className="text-slate-200 text-center text-xs"> -</span>}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Card className="border-amber-200 bg-amber-50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-amber-900">Empleados Sin Asignación por Día</h3>
                                <span className="text-xs text-amber-700 bg-amber-100 px-3 py-1 rounded-full font-medium">Arrastra empleados aquí para quitarlos de programación</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-amber-100">
                                            <th className="border p-2 text-left w-28 text-[11px] font-bold text-amber-800">REFUERZOS</th>
                                            {infoDias.map((dia) => (
                                                <th key={dia.fechaISO} className="border p-2 text-center text-[10px] min-w-[120px] text-amber-700">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{dia.nombreDia}</span>
                                                        <span>{dia.numero}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border p-2 text-xs font-bold text-amber-900 bg-amber-50">Disponibles</td>
                                            {infoDias.map((dia) => {
                                                const noAsignados = programacionGenerada.length === 0 ? [] : [];
                                                return (
                                                    <td key={dia.fechaISO} className="border p-2 bg-white min-h-[60px]">
                                                        <div className="flex flex-col gap-1">
                                                            {noAsignados.length > 0 ? noAsignados.map((emp: any) => (
                                                                <div key={emp.id_empleado} className="px-1.5 py-1 border border-amber-200 rounded text-[9px] leading-tight bg-amber-50 text-amber-800 font-medium truncate">
                                                                    {emp.nombre_completo}
                                                                </div>
                                                            )) : <span className="text-slate-300 text-center text-xs"> -</span>}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            <Dialog open={mostrarDialogoNovedades} onOpenChange={setMostrarDialogoNovedades}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <CalendarDays className="h-5 w-5" />
                            Novedades en el Periodo
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-slate-500 mb-2">Se detectaron bloqueos o novedades para {meses[mes - 1]}. El motor los excluirá de la asignación.</div>
                    <div className="max-h-[300px] overflow-y-auto border rounded-md bg-slate-50">
                        {novedadesData?.map((nov: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 border-b last:border-0">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-800 text-xs">{nov.nombre_completo || nov.nombre}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{nov.tipo || 'Novedad registrada'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="ghost" onClick={() => navigate('/novedades')}>Ver en detalle</Button>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setMostrarDialogoNovedades(false); setPaso('configuracion'); }}>Entendido, Continuar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
