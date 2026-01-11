import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { buildProgramacionWorkbook } from '@/utils/exportarExcel';
import { areasService, turnosService, programacionService } from '@/services/api.service';
import { ModalNovedadRapida } from '@/utils/ModalNovedadRapida';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, ArrowRight, Search, ChevronLeft, AlertCircle, FileSpreadsheet, Loader2, Trash2, Save, Undo2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Area, Turno } from '@/types/api.types';

interface CambioLocal {
    id: string;
    id_detalle_programacion: number;
    empleado: string;
    fecha: string;
    id_area_origen: number;
    id_turno_origen: number;
    id_area_destino: number;
    id_turno_destino: number;
}

export default function GestionMensual() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const hoy = new Date();
    const [mes, setMes] = useState(parseInt(searchParams.get('mes') || String(hoy.getMonth() + 1)));
    const [anio, setAnio] = useState(parseInt(searchParams.get('anio') || String(hoy.getFullYear())));
    const [paso, setPaso] = useState<'seleccion' | 'detalle'>(searchParams.get('mes') ? 'detalle' : 'seleccion');
    const [cambiosLocales, setCambiosLocales] = useState<CambioLocal[]>([]);
    const [empleadoArrastrado, setEmpleadoArrastrado] = useState<any>(null);

    const [modalNovedadOpen, setModalNovedadOpen] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<{ id: number; nombre: string } | null>(null);
    const [fechaParaNovedad, setFechaParaNovedad] = useState<string | null>(null);
    const [fechaCorteNovedades, setFechaCorteNovedades] = useState<Date | null>(null);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i);

    const { data: areasRaw } = useQuery<Area[]>({ queryKey: ['areas'], queryFn: () => areasService.listar() });
    const { data: turnosRaw } = useQuery<Turno[]>({ queryKey: ['turnos'], queryFn: () => turnosService.listar({ estado: true }) });

    const { data: programacionOriginal = [], isLoading: cargandoProg, refetch } = useQuery({
        queryKey: ['programacion-mensual', mes, anio],
        queryFn: async () => {
            const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const fin = new Date(anio, mes, 0).toISOString().split('T')[0];
            const res = await programacionService.listarPorPeriodo(inicio, fin);
            return Array.isArray(res) ? res : (res.data || []);
        },
        enabled: paso === 'detalle',
        staleTime: 0
    });

    const { data: noAsignadosPorDia = {}, refetch: refetchNoAsignados } = useQuery({
        queryKey: ['no-asignados-dia', mes, anio],
        queryFn: () => programacionService.obtenerEmpleadosNoAsignadosPorDia(mes, anio),
        enabled: paso === 'detalle'
    });

    const { data: alertasMotor = [], refetch: refetchAlertas } = useQuery({
        queryKey: ['validar-programacion', mes, anio],
        queryFn: async () => {
            const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const fin = new Date(anio, mes, 0).toISOString().split('T')[0];
            return programacionService.validarPeriodo(inicio, fin);
        },
        enabled: paso === 'detalle'
    });

    const programacion = useMemo(() => {
        if (!programacionOriginal || cambiosLocales.length === 0) return programacionOriginal;
        return programacionOriginal.map((asig: any) => {
            const cambio = cambiosLocales.find(c => c.id_detalle_programacion === asig.id_detalle_programacion);
            if (cambio) {
                if (cambio.id_area_destino === -1) return { ...asig, _eliminado: true };
                return {
                    ...asig,
                    id_area: cambio.id_area_destino,
                    id_turno: cambio.id_turno_destino,
                    fecha: cambio.fecha,
                    _modificado: true
                };
            }
            return asig;
        }).filter((asig: any) => !asig._eliminado);
    }, [programacionOriginal, cambiosLocales]);

    const areas = useMemo(() => {
        if (!areasRaw) return [];
        return areasRaw.filter(a => a.id_area !== 13);
    }, [areasRaw]);

    const turnos = useMemo(() => {
        if (!turnosRaw) return [];
        return turnosRaw.filter(t => ![1, 2, 3].includes(t.id_turno));
    }, [turnosRaw]);

    const configAreasTurnos = useMemo(() => {
        const config: Record<number, number[]> = {};
        if (!programacion || !Array.isArray(programacion)) return config;
        areas.forEach(area => {
            const turnosUsados = new Set(programacion.filter((p: any) => Number(p.id_area) === area.id_area).map((p: any) => Number(p.id_turno)));
            config[area.id_area] = Array.from(turnosUsados).sort((a, b) => a - b);
        });
        return config;
    }, [programacion, areas]);

    const infoDias = useMemo(() => {
        const ultimoDia = new Date(anio, mes, 0).getDate();
        return Array.from({ length: ultimoDia }, (_, i) => {
            const fecha = new Date(anio, mes - 1, i + 1);
            return {
                numero: i + 1,
                nombreDia: fecha.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase().replace(".", ""),
                fechaISO: fecha.toISOString().split('T')[0],
                objetoFecha: fecha
            };
        });
    }, [mes, anio]);

    const handleDragStart = (e: React.DragEvent, asignacion: any, idArea: number, idTurno: number) => {
        setEmpleadoArrastrado({ ...asignacion, id_area_origen: idArea, id_turno_origen: idTurno });
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, idAreaDestino: number, idTurnoDestino: number, fechaDestino: string) => {
        e.preventDefault();
        if (!empleadoArrastrado) return;
        const fechaOrigen = empleadoArrastrado.fecha.split('T')[0];

        if (empleadoArrastrado.id_area_origen === idAreaDestino && empleadoArrastrado.id_turno_origen === idTurnoDestino && fechaOrigen === fechaDestino) {
            setEmpleadoArrastrado(null);
            return;
        }

        const destinoAsignacion = programacion.find((p: any) => Number(p.id_area) === idAreaDestino && Number(p.id_turno) === idTurnoDestino && p.fecha.split('T')[0] === fechaDestino);
        const cambioId = `${Date.now()}-${Math.random()}`;

        if (destinoAsignacion) {
            const nombreArrastrado = empleadoArrastrado.nombre_empleado || empleadoArrastrado.empleado?.nombre_completo || 'Desconocido';
            const nombreDestino = destinoAsignacion.nombre_empleado || destinoAsignacion.empleado?.nombre_completo || 'Desconocido';
            const cambio1: CambioLocal = {
                id: cambioId, id_detalle_programacion: empleadoArrastrado.id_detalle_programacion, empleado: nombreArrastrado,
                fecha: fechaDestino, id_area_origen: empleadoArrastrado.id_area_origen, id_turno_origen: empleadoArrastrado.id_turno_origen,
                id_area_destino: idAreaDestino, id_turno_destino: idTurnoDestino
            };
            const cambio2: CambioLocal = {
                id: cambioId, id_detalle_programacion: destinoAsignacion.id_detalle_programacion, empleado: nombreDestino,
                fecha: fechaOrigen, id_area_origen: idAreaDestino, id_turno_origen: idTurnoDestino,
                id_area_destino: empleadoArrastrado.id_area_origen, id_turno_destino: empleadoArrastrado.id_turno_origen
            };
            setCambiosLocales(prev => [...prev, cambio1, cambio2]);
        } else {
            const nombreArr = empleadoArrastrado.nombre_empleado || empleadoArrastrado.empleado?.nombre_completo || 'Desconocido';
            const cambio: CambioLocal = {
                id: cambioId, id_detalle_programacion: empleadoArrastrado.id_detalle_programacion, empleado: nombreArr,
                fecha: fechaDestino, id_area_origen: empleadoArrastrado.id_area_origen, id_turno_origen: empleadoArrastrado.id_turno_origen,
                id_area_destino: idAreaDestino, id_turno_destino: idTurnoDestino
            };
            setCambiosLocales(prev => [...prev, cambio]);
        }
        setEmpleadoArrastrado(null);
    };

    const handleDropRefuerzo = (e: React.DragEvent, fechaDestino: string) => {
        e.preventDefault();
        if (!empleadoArrastrado) return;
        const cambioId = `${Date.now()}-${Math.random()}`;
        const nombreArr = empleadoArrastrado.nombre_empleado || empleadoArrastrado.empleado?.nombre_completo || 'Desconocido';
        const cambio: CambioLocal = {
            id: cambioId, id_detalle_programacion: empleadoArrastrado.id_detalle_programacion, empleado: nombreArr,
            fecha: fechaDestino, id_area_origen: empleadoArrastrado.id_area_origen, id_turno_origen: empleadoArrastrado.id_turno_origen,
            id_area_destino: -1, id_turno_destino: -1
        };
        setCambiosLocales(prev => [...prev, cambio]);
        setEmpleadoArrastrado(null);
    };

    const handleRevertirCambios = () => {
        setCambiosLocales([]);
        setFechaCorteNovedades(null);
        toast.info('Cambios revertidos');
    };

    const handleConsultar = () => {
        setPaso('detalle');
        setCambiosLocales([]);
        setFechaCorteNovedades(null);
        refetch();
    };

    const handleExportar = () => {
        const wb = buildProgramacionWorkbook({ areas, turnos, infoDias, programacion, configAreasTurnos });
        XLSX.writeFile(wb, `programacion_${meses[mes - 1]}_${anio}.xlsx`);
    };

    const abrirModalNovedad = (id: number, nombre: string, fecha: string) => {
        setEmpleadoSeleccionado({ id, nombre });
        setFechaParaNovedad(fecha);
        setModalNovedadOpen(true);
    };

    const handleNovedadExitosa = (fechaCorte: Date) => {
        setFechaCorteNovedades(prev => {
            if (!prev || fechaCorte < prev) return fechaCorte;
            return prev;
        });
    };

    return (
        <div className="space-y-6 max-w-full mx-auto pb-20 px-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión Mensual</h1>
                <p className="text-slate-500">
                    {paso === 'seleccion' ? 'Seleccione el periodo' : `Gestionando programación de ${meses[mes - 1]} ${anio}`}
                </p>
            </div>

            {paso === 'seleccion' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card className="bg-white border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Mes de Consulta</Label>
                                    <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {meses.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Año</Label>
                                    <Select value={String(anio)} onValueChange={(v) => setAnio(parseInt(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {anios.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700" size="lg" onClick={handleConsultar}>
                                <Search className="mr-2 h-4 w-4" /> Consultar Programación
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {paso === 'detalle' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 border rounded-xl shadow-sm">
                        <Button variant="ghost" onClick={() => setPaso('seleccion')}><ChevronLeft className="mr-2 h-4 w-4" /> Cambiar Periodo</Button>
                        <div className="flex gap-2">
                            {cambiosLocales.length > 0 && (
                                <>
                                    <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={handleRevertirCambios}><Undo2 className="mr-2 h-4 w-4" /> Revertir Todo</Button>
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => queryClient.invalidateQueries({ queryKey: ['programacion-mensual'] })}><Save className="mr-2 h-4 w-4" /> Guardar Cambios ({cambiosLocales.length})</Button>
                                </>
                            )}
                            <Button variant="outline" size="sm" onClick={handleExportar}><FileSpreadsheet className="mr-2 h-4 w-4" /> Exportar</Button>
                        </div>
                    </div>

                    {fechaCorteNovedades && (
                        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="bg-red-500 p-2 rounded-xl text-white shadow-lg shadow-red-100">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-red-900 uppercase tracking-tight">Novedad Registrada</p>
                                <p className="text-xs text-red-700 font-medium">Se requiere regenerar la cobertura desde el {format(fechaCorteNovedades, "dd 'de' MMMM", { locale: es })}.</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => navigate(`/programacion-areas?mes=${mes}&anio=${anio}`)} className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">
                                    <RefreshCcw className="mr-2 h-4 w-4" /> REGENERAR DESDE {format(fechaCorteNovedades, 'dd/MM')}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setFechaCorteNovedades(null)} className="text-red-700 hover:bg-red-100 font-bold">Ignorar</Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8">
                        {areas.filter(area => (configAreasTurnos[area.id_area] || []).length > 0).map((area) => (
                            <div key={area.id_area} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                <div className="bg-slate-800 text-white px-5 py-3 font-bold uppercase text-xs tracking-widest">{area.nombre_area}</div>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <th className="border p-3 text-left w-28 sticky left-0 bg-slate-100 z-10 text-[11px] font-bold text-slate-600">TURNO</th>
                                                {infoDias.map((dia) => {
                                                    const esSucio = fechaCorteNovedades && dia.objetoFecha >= fechaCorteNovedades;
                                                    return (
                                                        <th key={dia.fechaISO} className={`border p-2 text-center text-[10px] min-w-[120px] transition-colors duration-500 ${esSucio ? 'bg-red-50/50 border-x-red-100' : 'text-slate-500'}`}>
                                                            <div className="flex flex-col relative">
                                                                <span className={`${esSucio ? 'text-red-600 font-black' : 'text-indigo-600 font-bold'}`}>{dia.nombreDia}</span>
                                                                <span className={`${esSucio ? 'text-red-700 font-black text-xs' : ''}`}>{dia.numero}</span>
                                                                {esSucio && <div className="absolute -top-2 left-0 w-full h-0.5 bg-red-400" />}
                                                            </div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {configAreasTurnos[area.id_area]?.map((tId) => {
                                                const turnoInfo = turnos.find(t => t.id_turno === tId);
                                                return (
                                                    <tr key={tId}>
                                                        <td className="border p-3 font-bold text-indigo-700 sticky left-0 bg-white z-10 text-xs">{turnoInfo?.tipo_turno || `T${tId}`}</td>
                                                        {infoDias.map((dia) => {
                                                            const asignados = programacion.filter((p: any) => Number(p.id_area) === area.id_area && Number(p.id_turno) === tId && p.fecha.split('T')[0] === dia.fechaISO);
                                                            const esSucio = fechaCorteNovedades && dia.objetoFecha >= fechaCorteNovedades;

                                                            // DETECCIÓN DE NOVEDAD
                                                            const tieneNovedad = alertasMotor.some(a => a.fecha === dia.fechaISO && a.tipo === 'NOVEDAD' && asignados.some((asig: any) => asig.id_empleado === a.id_empleado));

                                                            return (
                                                                <td
                                                                    key={dia.fechaISO}
                                                                    className={`border p-2 min-h-[60px] transition-all duration-300 ${tieneNovedad
                                                                        ? 'bg-red-300 border-red-500 shadow-inner'
                                                                        : esSucio
                                                                            ? 'bg-red-200'
                                                                            : ''
                                                                        }`}
                                                                    onDragOver={handleDragOver}
                                                                    onDrop={(e) => handleDrop(e, area.id_area, tId, dia.fechaISO)}
                                                                >
                                                                    <div className="flex flex-col gap-1">
                                                                        {asignados.map((asig: any, idx: number) => (
                                                                            <div
                                                                                key={idx}
                                                                                draggable
                                                                                onDragStart={(e) => handleDragStart(e, asig, area.id_area, tId)}
                                                                                onClick={() => abrirModalNovedad(asig.id_empleado, asig.nombre_empleado || asig.empleado?.nombre_completo, dia.fechaISO)}
                                                                                className={`px-1.5 py-1 border rounded text-[9px] cursor-pointer transition-all shadow-sm ${tieneNovedad
                                                                                    ? 'bg-white border-red-600 text-red-700 font-bold'
                                                                                    : asig._modificado
                                                                                        ? 'bg-amber-100 border-amber-400'
                                                                                        : 'bg-white border-slate-200 hover:border-indigo-300'
                                                                                    }`}
                                                                            >
                                                                                {asig.nombre_empleado || asig.empleado?.nombre_completo}
                                                                            </div>
                                                                        ))}
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

                    <Card className={`mt-8 transition-all duration-500 ${fechaCorteNovedades ? 'border-red-200 shadow-md' : 'border-slate-200'}`}>
                        <CardContent className={`p-6 ${fechaCorteNovedades ? 'bg-red-50/10' : 'bg-slate-50'}`}>
                            <h3 className={`text-sm font-bold mb-4 ${fechaCorteNovedades ? 'text-red-900' : 'text-slate-900'}`}>Refuerzos / Disponibles</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className={fechaCorteNovedades ? 'bg-red-50' : 'bg-slate-100'}>
                                            <th className="border p-2 text-left w-28 text-[11px] font-bold">REFUERZOS</th>
                                            {infoDias.map((dia) => (
                                                <th key={dia.fechaISO} className={`border p-2 text-center text-[10px] min-w-[120px] ${fechaCorteNovedades && dia.objetoFecha >= fechaCorteNovedades ? 'bg-red-50 text-red-800 font-bold' : ''}`}>{dia.numero}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border p-2 text-xs font-bold">Disponibles</td>
                                            {infoDias.map((dia) => {
                                                const noAsignados = noAsignadosPorDia[dia.fechaISO] || [];
                                                const esSucio = fechaCorteNovedades && dia.objetoFecha >= fechaCorteNovedades;
                                                return (
                                                    <td key={dia.fechaISO} className={`border p-2 bg-white min-h-[60px] ${esSucio ? 'bg-red-50/20' : ''}`} onDragOver={handleDragOver} onDrop={(e) => handleDropRefuerzo(e, dia.fechaISO)}>
                                                        <div className="flex flex-col gap-1">
                                                            {noAsignados.map((emp: any) => (
                                                                <div
                                                                    key={emp.id_empleado}
                                                                    onClick={() => abrirModalNovedad(emp.id_empleado, emp.nombre_completo, dia.fechaISO)}
                                                                    className="px-1.5 py-1 border border-amber-200 rounded text-[9px] bg-amber-50 cursor-pointer hover:bg-amber-100"
                                                                >
                                                                    {emp.nombre_completo}
                                                                </div>
                                                            ))}
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

            <ModalNovedadRapida
                isOpen={modalNovedadOpen}
                onClose={() => setModalNovedadOpen(false)}
                empleado={empleadoSeleccionado}
                fechaSeleccionada={fechaParaNovedad}
                onSuccess={(fechaCorte) => {
                    refetch();
                    refetchNoAsignados();
                    refetchAlertas();
                    if (fechaCorte) handleNovedadExitosa(fechaCorte);
                }}
            />
        </div>
    );
}