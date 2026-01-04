import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { areasService, turnosService, programacionService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowRight, CheckCircle2, Users, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import type { Area, Turno } from '@/types/api.types';

const useNovedadesMock = (fechaInicio: string, fechaFin: string) => {
    return {
        data: {
            novedades: [
                { id_empleado: 1, nombre: 'Juan Pérez', tipo: 'Incapacidad', dias: 3, fecha_inicio: '2024-05-10' },
                { id_empleado: 2, nombre: 'Ana Gómez', tipo: 'Licencia', dias: 5, fecha_inicio: '2024-05-12' }
            ]
        },
        isLoading: false
    };
};

export default function ProgramacionAreas() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const hoy = new Date();
    const [mes, setMes] = useState(hoy.getMonth() + 1);
    const [anio, setAnio] = useState(hoy.getFullYear());
    const [paso, setPaso] = useState<'inicio' | 'configuracion'>('inicio');
    const [mostrarDialogoNovedades, setMostrarDialogoNovedades] = useState(false);
    const [configAreas, setConfigAreas] = useState<Record<number, { max: number; turnosIds: number[] }>>({});

    const { data: areas, isLoading: areasLoading } = useQuery<Area[]>({
        queryKey: ['areas'],
        queryFn: () => areasService.listar()
    });

    const { data: turnosRaw, isLoading: turnosLoading } = useQuery<Turno[]>({
        queryKey: ['turnos'],
        queryFn: () => turnosService.listar({ estado: true })
    });

    const turnos = useMemo(() => {
        if (!turnosRaw) return [];
        return turnosRaw.filter(t => t.id_turno !== 1 && t.id_turno !== 2 && t.id_turno !== 3);
    }, [turnosRaw]);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() + i);

    useEffect(() => {
        if (areas && turnos.length >= 2 && Object.keys(configAreas).length === 0) {
            const initialConfig: Record<number, { max: number; turnosIds: number[] }> = {};
            const defaultTurnosIds = turnos.slice(0, 2).map(t => t.id_turno);
            areas.forEach((area: Area) => {
                initialConfig[area.id_area] = { max: 5, turnosIds: defaultTurnosIds };
            });
            setConfigAreas(initialConfig);
        }
    }, [areas, turnos]);

    const generarMutation = useMutation({
        mutationFn: async () => {
            return programacionService.generarAutomatica({ mes, anio, configuracion: configAreas });
        },
        onSuccess: () => {
            toast.success('Programación generada correctamente');
            queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
            navigate('/programacion');
        },
        onError: () => toast.error('Error al generar la programación')
    });

    const formatTime = (time?: string | null | Date): string => {
        if (!time) return '';
        if (time instanceof Date && !isNaN(time.getTime())) {
            const hh = String(time.getHours()).padStart(2, '0');
            const mm = String(time.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
        }
        const str = String(time).trim();
        const isoMatch = str.match(/T?(\d{1,2}):(\d{2})/);
        if (isoMatch) {
            const hh = isoMatch[1].padStart(2, '0');
            const mm = isoMatch[2].padStart(2, '0');
            return `${hh}:${mm}`;
        }
        const timeMatch = str.match(/^(\d{1,2}):(\d{2})/);
        if (timeMatch) {
            const hh = timeMatch[1].padStart(2, '0');
            const mm = timeMatch[2];
            return `${hh}:${mm}`;
        }
        return '';
    };

    const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
    const fechaFin = `${anio}-${String(mes).padStart(2, '0')}-28`;
    const { data: novedadesData } = useNovedadesMock(fechaInicio, fechaFin);

    const handleIniciarProceso = () => {
        if (novedadesData?.novedades && novedadesData.novedades.length > 0) setMostrarDialogoNovedades(true);
        else setPaso('configuracion');
    };

    if (areasLoading || turnosLoading) return <div className="p-8 text-center text-muted-foreground">Cargando configuración...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Generador de Programación</h1>
                <p className="text-gray-500">
                    {paso === 'inicio' ? 'Seleccione el periodo y configure los parámetros iniciales.' : 'Defina los cupos y turnos permitidos por cada área.'}
                </p>
            </div>

            {paso === 'inicio' ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <Card className="bg-slate-50 border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Mes de Programación</Label>
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
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed border-2 bg-white">
                        <CardContent className="pt-6 flex flex-col items-center justify-center text-center py-12 gap-4">
                            <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center">
                                <CalendarDays className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div className="space-y-2 max-w-md">
                                <h3 className="text-xl font-semibold">Iniciar Nueva Programación</h3>
                                <p className="text-muted-foreground">Se generará la programación para <strong>{meses[mes - 1]} de {anio}</strong>.</p>
                            </div>
                            <Button size="lg" onClick={handleIniciarProceso} className="mt-4 px-8">
                                Comenzar Configuración <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between bg-white p-4 border rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-full"><Users className="h-5 w-5 text-indigo-600" /></div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Periodo Seleccionado</p>
                                <p className="font-bold text-gray-900">{meses[mes - 1]} {anio}</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setPaso('inicio')}>Cambiar Periodo</Button>
                    </div>

                    <div className="grid gap-4">
                        {areas?.map((area) => (
                            <Card key={area.id_area} className="overflow-hidden border-l-4 border-l-indigo-500 shadow-sm">
                                <CardHeader className="bg-gray-50/50 pb-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-lg">{area.nombre_area}</CardTitle>
                                            <CardDescription>Configuración de cupos y horarios</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white p-2 rounded-md border shadow-sm">
                                            <Label className="text-xs font-semibold text-gray-500 uppercase">Máx. Personas</Label>
                                            <Input
                                                type="number"
                                                className="w-20 h-8 text-right font-bold"
                                                value={configAreas[area.id_area]?.max ?? 0}
                                                onChange={(e) => setConfigAreas(prev => ({ ...prev, [area.id_area]: { ...prev[area.id_area], max: parseInt(e.target.value || '0') } }))}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-4">
                                    <div className="grid md:grid-cols-[1fr_200px] gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-sm text-muted-foreground">Turnos permitidos:</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {turnos.map((turno: Turno) => {
                                                    const isSelected = configAreas[area.id_area]?.turnosIds?.includes(turno.id_turno);
                                                    const h1 = formatTime(turno.hora_entrada);
                                                    const s1 = formatTime(turno.hora_salida);
                                                    const h2 = formatTime(turno.hora_entrada_2 ?? null);
                                                    const s2 = formatTime(turno.hora_salida_2 ?? null);
                                                    const horarioPrincipal = (h1 && s1) ? `${h1}-${s1}` : 'Horario no definido';
                                                    const horarioSecundario = (h2 && s2) ? ` / ${h2}-${s2}` : '';

                                                    return (
                                                        <div
                                                            key={turno.id_turno}
                                                            onClick={() => {
                                                                const currentIds = configAreas[area.id_area]?.turnosIds || [];
                                                                const newIds = isSelected ? currentIds.filter(id => id !== turno.id_turno) : [...currentIds, turno.id_turno];
                                                                setConfigAreas(prev => ({ ...prev, [area.id_area]: { ...prev[area.id_area], turnosIds: newIds } }));
                                                            }}
                                                            className={`cursor-pointer select-none px-3 py-2 rounded-md border text-sm flex items-center gap-2 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium ring-1 ring-indigo-200' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                        >
                                                            <Checkbox checked={Boolean(isSelected)} onCheckedChange={() => { }} />
                                                            <div className="flex flex-col items-start">
                                                                <span className="font-bold leading-none">{turno.tipo_turno}</span>
                                                                <span className="text-[10px] opacity-70 mt-1 uppercase">
                                                                    {horarioPrincipal}{horarioSecundario}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="hidden md:block border-l pl-6 space-y-2">
                                            <p className="text-xs font-medium text-gray-400 uppercase">Estado</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Users className="h-4 w-4" />
                                                <span>{configAreas[area.id_area]?.max ?? 0} Cupos</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                <span>{configAreas[area.id_area]?.turnosIds?.length ?? 0} Activos</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="sticky bottom-4 bg-white/95 backdrop-blur-sm p-4 border rounded-xl shadow-xl flex justify-between items-center mt-8">
                        <div className="text-sm font-medium text-gray-600">Periodo: <span className="text-indigo-600">{meses[mes - 1]} {anio}</span></div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setPaso('inicio')}>Cancelar</Button>
                            <Button size="lg" onClick={() => generarMutation.mutate()} disabled={generarMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 px-8">
                                {generarMutation.isPending ? 'Procesando...' : 'Generar Programación'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Dialog open={mostrarDialogoNovedades} onOpenChange={setMostrarDialogoNovedades}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600"><AlertTriangle className="h-5 w-5" /> Atención: Novedades</DialogTitle>
                        <DialogDescription>Los siguientes empleados no serán asignados durante sus fechas de novedad.</DialogDescription>
                    </DialogHeader>
                    <div className="h-[200px] w-full rounded-md border p-4 bg-gray-50 overflow-y-auto">
                        {novedadesData?.novedades?.map((nov: any, i: number) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                                <span className="font-medium text-gray-700">{nov.nombre}</span>
                                <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold">{nov.tipo}</span>
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="sm:justify-between flex gap-2">
                        <Button variant="ghost" onClick={() => navigate('/configuracion-programacion')}>Revisar Empleados</Button>
                        <Button onClick={() => { setMostrarDialogoNovedades(false); setPaso('configuracion'); }}>Entendido, Continuar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}