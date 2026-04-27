import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { areasService, turnosService, programacionService, alertasService, parametrizacionService } from '@/services/api.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, CalendarDays, CheckCircle2, LayoutDashboard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ModalInfoNovedadesGeneracion } from '@/utils/modalInfoNovedadesGeneracion';
import { BotonEliminarProgramacion } from '@/utils/botonEliminarProgramacion';
import { VisualizacionAlertas, procesarAlertas } from '@/utils/VisualizacionAlertas';
import { cn } from '@/lib/utils';
import type { Area, Turno } from '@/types/api.types';

export default function ProgramacionAreas() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // --- NUEVO ESTADO PARA RANGO DE FECHAS ---
    const hoy = new Date();
    const [fechaInicio, setFechaInicio] = useState(hoy.toISOString().split('T')[0]);
    // Por defecto, fin es 15 días después
    const defaultFin = new Date(hoy);
    defaultFin.setDate(hoy.getDate() + 15);
    const [fechaFin, setFechaFin] = useState(defaultFin.toISOString().split('T')[0]);
    // -----------------------------------------

    const [paso, setPaso] = useState<'inicio' | 'configuracion' | 'resultado'>('inicio');
    const [mostrarDialogoNovedades, setMostrarDialogoNovedades] = useState(false);
    
    // El frontend ya no administra configAreas, lo carga de los parametros globales
    const { data: configTurnosAreaParam } = useQuery({
        queryKey: ['parametro-turnos-areas'],
        queryFn: () => parametrizacionService.obtener('CONFIGURACION_TURNOS_AREA'),
    });

    const configGlobalAreas = useMemo(() => {
        if (!configTurnosAreaParam?.valor_texto) return {};
        try {
            const raw = JSON.parse(configTurnosAreaParam.valor_texto);
            const parsed: Record<number, { turnosIds: number[] }> = {};
            Object.keys(raw).forEach(key => parsed[Number(key)] = { turnosIds: raw[Number(key)] });
            return parsed;
        } catch (e) { return {}; }
    }, [configTurnosAreaParam]);

    const [programacionGenerada, setProgramacionGenerada] = useState<any[]>([]);
    const [alertasMotor, setAlertasMotor] = useState<any[]>([]);
    const [fechasRecienGeneradas, setFechasRecienGeneradas] = useState<string[]>([]);
    const [balancearHoras, setBalancearHoras] = useState(true);

    const { data: areasRaw, isLoading: areasLoading } = useQuery<Area[]>({
        queryKey: ['areas'],
        queryFn: () => areasService.listar()
    });

    const { data: turnosRaw, isLoading: turnosLoading } = useQuery<Turno[]>({
        queryKey: ['turnos'],
        queryFn: () => turnosService.listar({ estado: true })
    });

    // Validar rango (max 45 días)
    const diasSeleccionados = useMemo(() => {
        if (!fechaInicio || !fechaFin) return 0;
        const d1 = new Date(fechaInicio);
        const d2 = new Date(fechaFin);
        return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, [fechaInicio, fechaFin]);

    const rangoInvalido = diasSeleccionados < 1 || diasSeleccionados > 45;

    // Obtener mes/año del inicio para consultas de novedades (referencial)
    const dateInicioObj = new Date(fechaInicio);
    const mesReferencia = dateInicioObj.getMonth() + 1;
    const anioReferencia = dateInicioObj.getFullYear();

    const { data: novedadesData, isLoading: novedadesLoading } = useQuery({
        queryKey: ['novedades-periodo', mesReferencia, anioReferencia], // Ojo: esto es aproximado, idealmente backend filtraría por rango exacto
        queryFn: async () => {
            // Usamos el servicio existente, aunque sea por mes completo, sirve para advertir
            const res = await programacionService.obtenerNovedades(mesReferencia, anioReferencia);
            return Array.isArray(res) ? res : (res.data || []);
        },
        enabled: paso === 'inicio' && !isNaN(mesReferencia)
    });

    // Validar existencia (ahora por rango)
    const { data: programacionExistente, isLoading: verificandoExistente } = useQuery({
        queryKey: ['verificar-programacion-rango', fechaInicio, fechaFin],
        queryFn: async () => {
            // Reutilizamos 'listarPorPeriodo' para ver si hay algo, ya que 'verificarProgramacionExistente' era por mes
            // Opcionalmente podemos cambiar el backend de verificarProgramacionExistente, pero listar es suficiente.
            const data = await programacionService.listarPorPeriodo(fechaInicio, fechaFin);
            const lista = Array.isArray(data) ? data : (data.data || []);
            return { existe: lista.length > 0, total_registros: lista.length };
        },
        enabled: paso === 'inicio' && !rangoInvalido && !!fechaInicio && !!fechaFin,
        staleTime: 0
    });

    const areas = useMemo(() => {
        if (!areasRaw) return [];
        return areasRaw.filter(a => a.id_area !== 13); // Filtrar un área específica si es regla de negocio
    }, [areasRaw]);


    const infoDias = useMemo(() => {
        if (diasSeleccionados < 1 || diasSeleccionados > 60) return [];
        const dias = [];
        // Ajustamos zona horaria para evitar desfases al iterar

        // Iterar asegurando UTC o local consistente
        // Truco simple: usar strings YYYY-MM-DD
        const dCurrent = new Date(fechaInicio + 'T12:00:00');
        const dEnd = new Date(fechaFin + 'T12:00:00');

        while (dCurrent <= dEnd) {
            dias.push({
                numero: dCurrent.getDate(),
                nombreDia: dCurrent.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
                fechaISO: dCurrent.toISOString().split('T')[0],
                mesNombre: dCurrent.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
            });
            dCurrent.setDate(dCurrent.getDate() + 1);
        }
        return dias;
    }, [fechaInicio, fechaFin, diasSeleccionados]);

    const alertasSeparadas = useMemo(() => procesarAlertas(alertasMotor), [alertasMotor]);

    // Ya no se pre-configuran turnos localmente, se usa la variable global.

    useEffect(() => {
        if (fechasRecienGeneradas.length > 0) {
            const timer = setTimeout(() => {
                setFechasRecienGeneradas([]);
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [fechasRecienGeneradas]);



    const generarMutation = useMutation({
        mutationFn: async () => {
            const result = await programacionService.generarAutomatica({
                fechaInicio,
                fechaFin,
                configuracion: configGlobalAreas,
                balancearHoras
            });
            const data = await programacionService.listarPorPeriodo(fechaInicio, fechaFin);
            const fechasAfectadas = result.fechasProcesadas || infoDias.map(d => d.fechaISO);
            return { data, alertas: result.alertas || [], fechasAfectadas };
        },
        onSuccess: async (res: any) => {
            setProgramacionGenerada(Array.isArray(res.data) ? res.data : (res.data.data || []));
            setAlertasMotor(res.alertas);
            setFechasRecienGeneradas(res.fechasAfectadas);

            // Guardar alertas (siempre llamar para que si hay 0 alertas, se borren las viejas del rango)
            try {
                await alertasService.guardar(mesReferencia, anioReferencia, res.alertas || [], fechaInicio, fechaFin);
            } catch (error) {
                console.error('Error guardando alertas:', error);
            }

            setPaso('resultado');
            toast.success('Programación generada exitosamente');
            queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
            queryClient.invalidateQueries({ queryKey: ['programacion-periodo'] });
            queryClient.invalidateQueries({ queryKey: ['programacion-mensual'] });
            queryClient.invalidateQueries({ queryKey: ['verificar-programacion'] });
            queryClient.invalidateQueries({ queryKey: ['alertas-programacion'] });
        },
        onError: (err: any) => toast.error(`Error al generar: ${err.message || 'Error desconocido'}`)
    });

    const handleIniciarProceso = () => {
        if (programacionExistente?.existe) {
            // Advertir si ya hay datos
            if (!window.confirm(`Existe programación con ${programacionExistente.total_registros} registros en este rango. Si continuas SE BORRARÁN para generar de nuevo. ¿Continuar?`)) {
                return;
            }
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Motor de Programación</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    {paso === 'inicio' && 'Defina el rango de fechas a programar (ej: Quincena).'}
                    {paso === 'configuracion' && 'Seleccione los turnos habilitados por cada área de trabajo.'}
                    {paso === 'resultado' && 'Revise la distribución del personal asignado automáticamente.'}
                </p>
            </div>

            {paso === 'inicio' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <Card className="bg-slate-50 dark:bg-slate-800 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="dark:text-slate-300">Fecha Inicio</Label>
                                    <Input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => {
                                            setFechaInicio(e.target.value);
                                            setPaso('inicio');
                                            setProgramacionGenerada([]);
                                        }}
                                        className="bg-white dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="dark:text-slate-300">Fecha Fin</Label>
                                    <Input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => {
                                            setFechaFin(e.target.value);
                                            setPaso('inicio');
                                            setProgramacionGenerada([]);
                                        }}
                                        className="bg-white dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
                                    />
                                </div>
                            </div>

                            {/* Información del rango */}
                            <div className="mt-4 flex items-center gap-2 text-sm">
                                <div className={cn("px-3 py-1 rounded-full font-medium",
                                    rangoInvalido ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400"
                                )}>
                                    {diasSeleccionados} días seleccionados
                                </div>
                                {rangoInvalido && (
                                    <span className="text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        El rango debe ser entre 1 y 45 días
                                    </span>
                                )}
                            </div>

                        </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 bg-white dark:bg-slate-800 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors">
                        <CardContent className="pt-6 flex flex-col items-center justify-center text-center py-12 gap-4">
                            <div className="h-16 w-16 bg-indigo-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center">
                                <CalendarDays className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold dark:text-slate-200">Configurar Distribución</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Se validarán novedades antes de proceder</p>
                            </div>
                            <Button
                                size="lg"
                                onClick={handleIniciarProceso}
                                disabled={novedadesLoading || verificandoExistente || rangoInvalido || !fechaInicio || !fechaFin}
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
                    <div className="flex flex-col border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                        <div className="bg-slate-50 dark:bg-slate-800/80 p-6 border-b dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Todo listo para generar</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Los turnos a asignar para cada área se tomarán de la <strong>Configuración Global del Sistema</strong>.
                            </p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700 p-4 rounded-lg items-center justify-between">
                                <div className="space-y-1">
                                    <div className="font-bold text-slate-900 dark:text-slate-200 tracking-wider flex items-center gap-2 text-sm uppercase">
                                        Rango a programar: {fechaInicio} al {fechaFin}
                                    </div>
                                    <p className="text-xs text-slate-500">Asegúrese de haber revisado las novedades del periodo.</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800/50 p-4 border dark:border-slate-700 rounded-xl shadow-sm border-indigo-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setBalancearHoras(!balancearHoras)}>
                                <Checkbox
                                    checked={balancearHoras}
                                    onCheckedChange={(checked) => setBalancearHoras(checked as boolean)}
                                    className="h-6 w-6"
                                />
                                <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-300 block">Equilibrar Horas Asignadas</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">El motor intentará llegar a la meta de horas maximizando la distribución equitativa.</span>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="outline" size="lg" onClick={() => setPaso('inicio')}>Cambiar Rango</Button>
                                <Button size="lg" className="px-10 bg-indigo-600 hover:bg-indigo-700" onClick={() => generarMutation.mutate()} disabled={generarMutation.isPending}>
                                    {generarMutation.isPending ? 'Generando...' : 'Proceder y Generar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {paso === 'resultado' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 p-6 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-600 p-2 rounded-full">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-400">Programación Lista</h2>
                                <p className="text-emerald-700 dark:text-emerald-300 text-sm">Se ha guardado la asignación automática en la base de datos.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <BotonEliminarProgramacion
                                mes={mesReferencia}
                                anio={anioReferencia}
                                onSuccess={() => {
                                    setPaso('inicio');
                                    setProgramacionGenerada([]);
                                    queryClient.invalidateQueries({ queryKey: ['verificar-programacion'] });
                                }}
                            />
                            <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={() => navigate(`/gestion-mensual?mes=${mesReferencia}&anio=${anioReferencia}`)}>
                                <LayoutDashboard className="h-4 w-4 mr-2" /> IR A GESTIÓN MENSUAL ({anioReferencia}-{mesReferencia})
                            </Button>
                        </div>
                    </div>

                    {alertasSeparadas.alertasEmpleados.length > 0 && (
                        <VisualizacionAlertas alertas={alertasMotor} />
                    )}

                    {areas.map((area) => {
                        const turnosActivos = configGlobalAreas[area.id_area]?.turnosIds || [];
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

                                <div className="border dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                                    <div className="bg-slate-800 dark:bg-slate-900 text-white px-5 py-3 font-bold uppercase text-xs tracking-widest">
                                        {area.nombre_area}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/80">
                                                    <th className="border dark:border-slate-700 p-3 text-left w-28 sticky left-0 bg-slate-100 dark:bg-slate-900 z-10 text-[11px] font-bold text-slate-600 dark:text-slate-400">TURNO</th>
                                                    {infoDias.map((dia) => {
                                                        const esRegenerado = fechasRecienGeneradas.includes(dia.fechaISO);
                                                        return (
                                                            <th
                                                                key={dia.fechaISO}
                                                                className={cn(
                                                                    "border dark:border-slate-700 p-2 text-center text-[10px] min-w-[120px] transition-colors duration-1000",
                                                                    esRegenerado ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-800" : "text-slate-500 dark:text-slate-400"
                                                                )}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className={cn("font-bold", esRegenerado ? "text-emerald-700 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400")}>
                                                                        {dia.nombreDia}
                                                                    </span>
                                                                    <span className={esRegenerado ? "text-emerald-600 dark:text-emerald-500" : ""}>
                                                                        {dia.numero} {dia.mesNombre}
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
                                                        <tr key={tId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                            <td className="border dark:border-slate-700 p-3 font-bold text-indigo-700 dark:text-indigo-400 sticky left-0 bg-white dark:bg-slate-900 z-10 text-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
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
                                                                            "border dark:border-slate-700 p-2 min-h-[60px] transition-colors duration-1000",
                                                                            esRegenerado && "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50"
                                                                        )}
                                                                    >
                                                                        <div className="flex flex-col gap-1">
                                                                            {asignados.length > 0 ? asignados.map((asig, idx) => (
                                                                                <div key={idx} className={cn(
                                                                                    "px-1.5 py-1 border rounded text-[9px] leading-tight font-medium truncate",
                                                                                    esRegenerado
                                                                                        ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                                                                                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                                                                )}>
                                                                                    {asig.nombre_empleado || asig.empleado?.nombre_completo || 'Empleado'}
                                                                                </div>
                                                                            )) : <span className="text-slate-200 dark:text-slate-700 text-center text-xs">-</span>}
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
                nombreMes={dateInicioObj.toLocaleString('es-ES', { month: 'long' })}
            />
        </div>
    );
}