import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { areasService, turnosService, programacionService, alertasService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, CalendarDays, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import { ModalInfoNovedadesGeneracion } from '@/utils/modalInfoNovedadesGeneracion';
import { BotonEliminarProgramacion } from '@/utils/botonEliminarProgramacion';
import { VisualizacionAlertas, procesarAlertas } from '@/utils/VisualizacionAlertas';
import { cn } from '@/lib/utils';
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
    const [fechasRecienGeneradas, setFechasRecienGeneradas] = useState<string[]>([]);

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
        queryFn: async () => {
            const res = await programacionService.obtenerNovedades(mes, anio);
            return Array.isArray(res) ? res : (res.data || []);
        },
        enabled: paso === 'inicio'
    });

    const { data: programacionExistente, isLoading: verificandoExistente } = useQuery({
        queryKey: ['verificar-programacion', mes, anio],
        queryFn: () => programacionService.verificarProgramacionExistente(mes, anio),
        enabled: paso === 'inicio',
        staleTime: 0,
        refetchOnMount: 'always'
    });

    const { data: datosCargadosAutomaticamente } = useQuery({
        queryKey: ['cargar-programacion-existente', mes, anio],
        queryFn: async () => {
            const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const fin = new Date(anio, mes, 0).toISOString().split('T')[0];
            return await programacionService.listarPorPeriodo(inicio, fin);
        },
        enabled: !!programacionExistente?.existe && paso === 'inicio'
    });

    const { data: alertasCargadas } = useQuery({
        queryKey: ['cargar-alertas-existentes', mes, anio],
        queryFn: () => alertasService.obtener(mes, anio),
        enabled: !!programacionExistente?.existe && paso === 'inicio'
    });

    // Efecto para cargar datos existentes SIN CAMBIAR DE PANTALLA AUTOMATICAMENTE
    useEffect(() => {
        if (programacionExistente?.existe && datosCargadosAutomaticamente) {
            const dataReal = Array.isArray(datosCargadosAutomaticamente) ? datosCargadosAutomaticamente : (datosCargadosAutomaticamente.data || []);
            setProgramacionGenerada(dataReal);

            const configReconstruida: Record<number, { turnosIds: number[] }> = {};
            dataReal.forEach((reg: any) => {
                const aId = Number(reg.id_area);
                const tId = Number(reg.id_turno);
                if (!configReconstruida[aId]) {
                    configReconstruida[aId] = { turnosIds: [] };
                }
                if (!configReconstruida[aId].turnosIds.includes(tId)) {
                    configReconstruida[aId].turnosIds.push(tId);
                }
            });

            Object.keys(configReconstruida).forEach(key => {
                const k = Number(key);
                configReconstruida[k].turnosIds.sort((a, b) => a - b);
            });

            setConfigAreas(configReconstruida);

            if (alertasCargadas) {
                setAlertasMotor(alertasCargadas);
            }
            // AQUI ESTABA EL ERROR: Se eliminó setPaso('resultado') para que no salte solo.
        }
    }, [programacionExistente, datosCargadosAutomaticamente, alertasCargadas]);

    const areas = useMemo(() => {
        if (!areasRaw) return [];
        return areasRaw.filter(a => a.id_area !== 13);
    }, [areasRaw]);

    const turnos = useMemo(() => {
        if (!turnosRaw) return [];
        return turnosRaw;
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

    const alertasSeparadas = useMemo(() => procesarAlertas(alertasMotor), [alertasMotor]);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() + i);

    useEffect(() => {
        if (areas.length > 0 && turnos.length > 0 && Object.keys(configAreas).length === 0 && !programacionExistente?.existe) {
            const initialConfig: Record<number, { turnosIds: number[] }> = {};
            const getTurnoId = (codigo: string) => {
                const t = turnos.find(turno => turno.tipo_turno === codigo);
                return t ? t.id_turno : undefined;
            };

            areas.forEach((area) => {
                let codigosTurnos: string[] = [];
                switch (area.id_area) {
                    case 1: codigosTurnos = ['T1', 'T11']; break;
                    case 2: codigosTurnos = ['T11', 'T5']; break;
                    case 3: codigosTurnos = ['T5', 'T3']; break;
                    case 4: codigosTurnos = ['T5', 'T11']; break;
                    case 5: codigosTurnos = ['T5', 'T11']; break;
                    case 6: codigosTurnos = ['T5', 'T13', 'T11']; break;
                    case 7: codigosTurnos = ['T11', 'T5', 'T13']; break;
                    case 8: codigosTurnos = ['T11', 'T5']; break;
                    case 9: codigosTurnos = ['T13', 'T11', 'T5']; break;
                    case 10: codigosTurnos = ['T5', 'T11']; break;
                    case 11: codigosTurnos = ['T6', 'T8', 'T2']; break;
                    case 12: codigosTurnos = ['T6']; break;
                    default: codigosTurnos = ['T5', 'T11'];
                }

                const idsSeleccionados = codigosTurnos
                    .map(codigo => getTurnoId(codigo))
                    .filter((id): id is number => id !== undefined);

                initialConfig[area.id_area] = { turnosIds: idsSeleccionados };
            });

            setConfigAreas(initialConfig);
        }
    }, [areas, turnos, programacionExistente]);

    useEffect(() => {
        if (fechasRecienGeneradas.length > 0) {
            const timer = setTimeout(() => {
                setFechasRecienGeneradas([]);
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [fechasRecienGeneradas]);

    const formatTime = (time: string | null | undefined): string => {
        if (!time) return '--:--';
        const formatted = time.includes('T') ? time.split('T')[1] : time;
        return formatted.substring(0, 5);
    };

    const generarMutation = useMutation({
        mutationFn: async () => {
            const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const fin = new Date(anio, mes, 0).toISOString().split('T')[0];
            const result = await programacionService.generarAutomatica({ mes, anio, configuracion: configAreas });
            const data = await programacionService.listarPorPeriodo(inicio, fin);
            const fechasAfectadas = result.fechasProcesadas || infoDias.map(d => d.fechaISO);
            return { data, alertas: result.alertas || [], fechasAfectadas };
        },
        onSuccess: async (res: any) => {
            setProgramacionGenerada(Array.isArray(res.data) ? res.data : (res.data.data || []));
            setAlertasMotor(res.alertas);
            setFechasRecienGeneradas(res.fechasAfectadas);

            if (res.alertas && res.alertas.length > 0) {
                try {
                    await alertasService.guardar(mes, anio, res.alertas);
                } catch (error) {
                    console.error('Error guardando alertas:', error);
                }
            }

            setPaso('resultado');
            toast.success('Programación generada exitosamente');
            queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
            queryClient.invalidateQueries({ queryKey: ['programacion-periodo'] });
            queryClient.invalidateQueries({ queryKey: ['programacion-mensual'] });
            queryClient.invalidateQueries({ queryKey: ['verificar-programacion'] });
            queryClient.invalidateQueries({ queryKey: ['alertas-programacion'] });
        },
        onError: () => toast.error('Error al generar la programación')
    });

    const handleIniciarProceso = () => {
        if (programacionExistente?.existe) {
            // Lógica restaurada de la versión anterior
            toast.error(
                `Ya existe una programación para ${meses[mes - 1]} ${anio} con ${programacionExistente.total_registros} registros.`,
                {
                    duration: 5000,
                    action: {
                        label: 'Ir a Gestión Mensual',
                        onClick: () => navigate(`/gestion-mensual?mes=${mes}&anio=${anio}`)
                    }
                }
            );
            return;
        }

        if (novedadesData && novedadesData.length > 0) {
            setMostrarDialogoNovedades(true);
        } else {
            setPaso('configuracion');
        }
    };

    if (areasLoading || turnosLoading) return <div className="p-8 text-center text-slate-500">Cargando parámetros del sistema...</div>;

    return (
        <div className="space-y-6 max-w-full mx-auto pb-20 px-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Motor de Programación</h1>
                <p className="text-slate-500">
                    {paso === 'inicio' && 'Defina el periodo de tiempo a programar.'}
                    {paso === 'configuracion' && 'Seleccione los turnos habilitados por cada área de trabajo.'}
                    {paso === 'resultado' && 'Revise la distribución del personal asignado automáticamente.'}
                </p>
            </div>

            {paso === 'inicio' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <Card className="bg-slate-50 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Mes de Programación</Label>
                                    <Select value={String(mes)} onValueChange={(v) => { setMes(parseInt(v)); setPaso('inicio'); setProgramacionGenerada([]); }}>
                                        <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {meses.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Año</Label>
                                    <Select value={String(anio)} onValueChange={(v) => { setAnio(parseInt(v)); setPaso('inicio'); setProgramacionGenerada([]); }}>
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
                            <Button
                                size="lg"
                                onClick={handleIniciarProceso}
                                disabled={novedadesLoading || verificandoExistente}
                                className="px-8"
                            >
                                {verificandoExistente ? 'Verificando...' :
                                    novedadesLoading ? 'Verificando Novedades...' :
                                        'Siguiente Paso'}
                                <ArrowRight className="ml-2 h-4 w-4" />
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
                                                        const newIds = isSelected
                                                            ? currentIds.filter(id => id !== turno.id_turno)
                                                            : [...currentIds, turno.id_turno];
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
                            <BotonEliminarProgramacion
                                mes={mes}
                                anio={anio}
                                onSuccess={() => {
                                    setPaso('inicio');
                                    setProgramacionGenerada([]);
                                    queryClient.invalidateQueries({ queryKey: ['verificar-programacion'] });
                                }}
                            />
                            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => navigate(`/gestion-mensual?mes=${mes}&anio=${anio}`)}>
                                <LayoutDashboard className="h-4 w-4 mr-2" /> IR A GESTIÓN MENSUAL
                            </Button>
                        </div>
                    </div>

                    {alertasSeparadas.alertasEmpleados.length > 0 && (
                        <VisualizacionAlertas alertas={alertasMotor} />
                    )}

                    {areas.map((area) => {
                        const turnosActivos = configAreas[area.id_area]?.turnosIds || [];
                        if (turnosActivos.length === 0) return null;

                        return (
                            <div key={area.id_area} className="space-y-4">
                                {alertasSeparadas.alertasPorArea[area.id_area] && (
                                    <VisualizacionAlertas
                                        alertas={alertasMotor}
                                        mostrarPorArea={true}
                                        idArea={area.id_area}
                                        nombreArea={area.nombre_area}
                                    />
                                )}

                                <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                    <div className="bg-slate-800 text-white px-5 py-3 font-bold uppercase text-xs tracking-widest">
                                        {area.nombre_area}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="border p-3 text-left w-28 sticky left-0 bg-slate-100 z-10 text-[11px] font-bold text-slate-600">TURNO</th>
                                                    {infoDias.map((dia) => {
                                                        const esRegenerado = fechasRecienGeneradas.includes(dia.fechaISO);
                                                        return (
                                                            <th
                                                                key={dia.fechaISO}
                                                                className={cn(
                                                                    "border p-2 text-center text-[10px] min-w-[120px] transition-colors duration-1000",
                                                                    esRegenerado ? "bg-emerald-100 border-emerald-300" : "text-slate-500"
                                                                )}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className={cn("font-bold", esRegenerado ? "text-emerald-700" : "text-indigo-600")}>
                                                                        {dia.nombreDia}
                                                                    </span>
                                                                    <span className={esRegenerado ? "text-emerald-600" : ""}>
                                                                        {dia.numero} de {meses[mes - 1].substring(0, 3)}
                                                                    </span>
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {turnosActivos.map((tId) => {
                                                    const turnoInfo = turnosRaw?.find(t => t.id_turno === tId);
                                                    return (
                                                        <tr key={tId} className="hover:bg-slate-50/50">
                                                            <td className="border p-3 font-bold text-indigo-700 sticky left-0 bg-white z-10 text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                                {turnoInfo?.tipo_turno}
                                                            </td>
                                                            {infoDias.map((dia) => {
                                                                const asignados = programacionGenerada.filter(p =>
                                                                    Number(p.id_area) === area.id_area &&
                                                                    Number(p.id_turno) === tId &&
                                                                    p.fecha.split('T')[0] === dia.fechaISO
                                                                );
                                                                const esRegenerado = fechasRecienGeneradas.includes(dia.fechaISO);
                                                                return (
                                                                    <td
                                                                        key={dia.fechaISO}
                                                                        className={cn(
                                                                            "border p-2 min-h-[60px] transition-colors duration-1000",
                                                                            esRegenerado && "bg-emerald-50/50 border-emerald-200"
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-col gap-1">
                                                                            {asignados.length > 0 ? asignados.map((asig, idx) => (
                                                                                <div key={idx} className={cn(
                                                                                    "px-1.5 py-1 border rounded text-[9px] leading-tight font-medium truncate",
                                                                                    esRegenerado
                                                                                        ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                                                                                        : "bg-slate-50 border-slate-200 text-slate-700"
                                                                                )}>
                                                                                    {asig.nombre_empleado || asig.empleado?.nombre_completo || 'Empleado'}
                                                                                </div>
                                                                            )) : <span className="text-slate-200 text-center text-xs">-</span>}
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
                            </div>
                        );
                    })}
                </div>
            )}

            <ModalInfoNovedadesGeneracion
                isOpen={mostrarDialogoNovedades}
                onClose={() => setMostrarDialogoNovedades(false)}
                onContinue={() => {
                    setMostrarDialogoNovedades(false);
                    setPaso('configuracion');
                }}
                novedades={novedadesData || []}
                nombreMes={meses[mes - 1]}
            />
        </div>
    );
}