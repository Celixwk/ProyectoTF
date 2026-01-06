import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { areasService, turnosService, programacionService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2 } from 'lucide-react';
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
            const mesStr = String(mes).padStart(2, '0');
            const diaStr = String(i + 1).padStart(2, '0');
            return {
                numero: i + 1,
                nombreDia: fecha.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
                fechaISO: `${anio}-${mesStr}-${diaStr}`
            };
        });
    }, [mes, anio]);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() + i);

    useEffect(() => {
        if (areas.length > 0 && turnos.length > 0 && Object.keys(configAreas).length === 0) {
            const initialConfig: Record<number, { turnosIds: number[] }> = {};
            const tIds = { T1: 5, T2: 6, T3: 7, T5: 8, T6: 9, T8: 11, T11: 14, T13: 15 };

            areas.forEach((area) => {
                let ids: number[] = [];
                switch (area.id_area) {
                    case 1: ids = [tIds.T1, tIds.T11]; break;
                    case 2: ids = [tIds.T3, tIds.T5, tIds.T11, tIds.T13]; break;
                    case 11: ids = [tIds.T2, tIds.T5, tIds.T6, tIds.T8, tIds.T11]; break;
                    default: ids = [tIds.T5, tIds.T11];
                }
                initialConfig[area.id_area] = { turnosIds: ids.filter(id => id !== undefined) };
            });
            setConfigAreas(initialConfig);
        }
    }, [areas, turnos]);

    const generarMutation = useMutation({
        mutationFn: async () => {
            const res = await programacionService.generarAutomatica({ mes, anio, configuracion: configAreas });

            // Si el motor devuelve alertas, las guardamos
            if (res.data?.alertas) setAlertasMotor(res.data.alertas);

            // Esperar un breve instante para asegurar que la DB procesó todo antes del GET
            await new Promise(resolve => setTimeout(resolve, 500));

            const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const fin = new Date(anio, mes, 0).toISOString().split('T')[0];
            return programacionService.listarPorPeriodo(inicio, fin);
        },
        onSuccess: (data: any) => {
            // Normalizar los datos que vienen del servicio de listado
            const registros = Array.isArray(data) ? data : (data.data || []);
            setProgramacionGenerada(registros);
            setPaso('resultado');
            toast.success('Programación procesada con éxito');
        },
        onError: () => toast.error('Error al ejecutar el motor de reglas')
    });

    const handleIniciarProceso = () => {
        if (novedadesData && novedadesData.length > 0) setMostrarDialogoNovedades(true);
        else setPaso('configuracion');
    };

    if (areasLoading || turnosLoading) return <div className="p-8 text-center">Cargando...</div>;

    return (
        <div className="space-y-6 max-w-full mx-auto pb-20 px-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900">Motor de Programación</h1>
                <p className="text-slate-500">Gestión de asignación automática.</p>
            </div>

            {paso === 'inicio' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <Card className="bg-slate-50 border-none shadow-sm">
                        <CardContent className="pt-6 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Mes</Label>
                                <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v))}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>{meses.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Año</Label>
                                <Select value={String(anio)} onValueChange={(v) => setAnio(parseInt(v))}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>{anios.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-center py-6">
                        <Button size="lg" onClick={handleIniciarProceso} disabled={novedadesLoading}>
                            {novedadesLoading ? 'Cargando...' : 'Siguiente Paso'} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {paso === 'configuracion' && (
                <div className="space-y-6 max-w-5xl mx-auto">
                    <div className="flex items-center justify-between bg-white p-4 border rounded-lg">
                        <div className="font-bold uppercase tracking-wider">Periodo: {meses[mes - 1]} {anio}</div>
                        <Button variant="outline" size="sm" onClick={() => setPaso('inicio')}>Cambiar</Button>
                    </div>
                    <div className="grid gap-4">
                        {areas.map((area) => (
                            <Card key={area.id_area} className="border-l-4 border-l-indigo-500">
                                <CardHeader className="py-3 bg-slate-50/50"><CardTitle className="text-md">{area.nombre_area}</CardTitle></CardHeader>
                                <CardContent className="pt-4 flex flex-wrap gap-2">
                                    {turnos.map((turno) => {
                                        const isSelected = configAreas[area.id_area]?.turnosIds?.includes(turno.id_turno);
                                        return (
                                            <div key={turno.id_turno} className={`p-2 border rounded-md flex items-center gap-2 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-400' : 'bg-white'}`}
                                                onClick={() => {
                                                    const current = configAreas[area.id_area]?.turnosIds || [];
                                                    const next = isSelected ? current.filter(id => id !== turno.id_turno) : [...current, turno.id_turno];
                                                    setConfigAreas({ ...configAreas, [area.id_area]: { turnosIds: next } });
                                                }}>
                                                <Checkbox checked={!!isSelected} />
                                                <div className="text-[10px]">
                                                    <div className="font-bold">{turno.tipo_turno}</div>
                                                    <div className="text-slate-500">{turno.hora_entrada.substring(0, 5)} - {turno.hora_salida.substring(0, 5)}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="sticky bottom-4 bg-white/95 p-4 border rounded-xl shadow-lg flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setPaso('inicio')}>Atrás</Button>
                        <Button size="lg" onClick={() => generarMutation.mutate()} disabled={generarMutation.isPending}>
                            {generarMutation.isPending ? 'Procesando...' : 'Generar Programación'}
                        </Button>
                    </div>
                </div>
            )}

            {paso === 'resultado' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between bg-emerald-50 p-4 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="text-emerald-600" />
                            <div><h2 className="font-bold text-emerald-900">Programación Exitosa</h2><p className="text-xs text-emerald-700">Registros procesados.</p></div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setPaso('configuracion')}>Re-ajustar</Button>
                            <Button size="sm" className="bg-emerald-600" onClick={() => navigate('/programacion')}>Ver Calendario</Button>
                        </div>
                    </div>

                    {alertasMotor.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50">
                            <CardContent className="pt-4 text-[10px] max-h-40 overflow-y-auto">
                                <div className="font-bold text-amber-800 mb-2 flex items-center gap-1"><AlertTriangle size={12} /> Observaciones del motor:</div>
                                {alertasMotor.map((g, i) => (
                                    <div key={i} className="mb-1"><strong>{g.fecha}:</strong> {g.alertas.map((a: any) => a.mensaje).join(', ')}</div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {areas.map((area) => (
                        <div key={area.id_area} className="border rounded-xl overflow-hidden bg-white mb-6">
                            <div className="bg-slate-800 text-white p-2 text-[10px] font-bold uppercase">{area.nombre_area}</div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="border p-2 text-left sticky left-0 bg-slate-50 z-10 text-[10px]">TURNO</th>
                                            {infoDias.map(d => <th key={d.fechaISO} className="border p-2 text-[9px] min-w-[100px]">{d.nombreDia} {d.numero}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(configAreas[area.id_area]?.turnosIds || []).map(tId => {
                                            const t = turnos.find(x => x.id_turno === tId);
                                            return (
                                                <tr key={tId}>
                                                    <td className="border p-2 font-bold text-indigo-700 sticky left-0 bg-white text-[10px]">{t?.tipo_turno}</td>
                                                    {infoDias.map(dia => {
                                                        const asignados = programacionGenerada.filter(p =>
                                                            Number(p.id_area) === area.id_area &&
                                                            Number(p.id_turno) === tId &&
                                                            p.fecha.includes(dia.fechaISO)
                                                        );
                                                        return (
                                                            <td key={dia.fechaISO} className="border p-1">
                                                                {asignados.map((a, idx) => (
                                                                    <div key={idx} className="bg-slate-50 border p-1 rounded text-[9px] mb-1 truncate">
                                                                        {a.nombre_empleado || a.empleado?.nombre_completo}
                                                                    </div>
                                                                ))}
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
            )}
        </div>
    );
}