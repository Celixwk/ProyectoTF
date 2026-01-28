import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { buildProgramacionWorkbook } from '@/utils/exportarExcel';
import { areasService, turnosService, programacionService, alertasService } from '@/services/api.service';
import { ModalNovedadRapida } from '@/utils/ModalNovedadRapida';
import { BotonEliminarProgramacion } from '@/utils/botonEliminarProgramacion';
import { BannerNecesidadRegenerar } from '@/utils/BannerNecesidadRegenerar';
import { VisualizacionAlertas, procesarAlertas } from '@/utils/VisualizacionAlertas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, ArrowRight, Search, ChevronLeft, AlertCircle, FileSpreadsheet, Loader2, Save, Undo2, UserSearch } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Area, Turno } from '@/types/api.types';

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

const parseFechaSinAjuste = (fechaStr: string) => {
    if (!fechaStr) return null;
    const [y, m, d] = fechaStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
};

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
    const [fechasRecienGeneradas, setFechasRecienGeneradas] = useState<string[]>([]);
    const [bannerIgnorado, setBannerIgnorado] = useState(false);
    const [filtroEmpleado, setFiltroEmpleado] = useState('');
    const [modalNovedadOpen, setModalNovedadOpen] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<{ id: number; nombre: string } | null>(null);
    const [fechaParaNovedad, setFechaParaNovedad] = useState<string | null>(null);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i);

    const { data: areasRaw } = useQuery<Area[]>({ queryKey: ['areas'], queryFn: () => areasService.listar() });
    const { data: turnosRaw } = useQuery<Turno[]>({ queryKey: ['turnos'], queryFn: () => turnosService.listar({ estado: true }) });

    useEffect(() => {
        if (fechasRecienGeneradas.length > 0) {
            const timer = setTimeout(() => setFechasRecienGeneradas([]), 15000);
            return () => clearTimeout(timer);
        }
    }, [fechasRecienGeneradas]);

    useEffect(() => {
        setBannerIgnorado(false);
    }, [mes, anio]);

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

    const { data: alertasMotor = [] } = useQuery({
        queryKey: ['alertas-programacion', mes, anio],
        queryFn: () => alertasService.obtener(mes, anio),
        enabled: paso === 'detalle',
        staleTime: 5 * 60 * 1000
    });

    const { data: validacionAlertas = [], refetch: refetchAlertas } = useQuery({
        queryKey: ['validar-programacion', mes, anio],
        queryFn: async () => {
            const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const fin = new Date(anio, mes, 0).toISOString().split('T')[0];
            return programacionService.validarPeriodo(inicio, fin);
        },
        enabled: paso === 'detalle'
    });

    const alertasSeparadas = useMemo(() => {
        const alertasProcesadas = procesarAlertas(alertasMotor);
        return {
            alertasEmpleados: alertasProcesadas.alertasEmpleados.filter(alerta => alerta.codigo !== 'EMPLEADOS_SIN_ASIGNACION'),
            alertasPorArea: alertasProcesadas.alertasPorArea
        };
    }, [alertasMotor]);

    const fechaConflictoPersistente = useMemo(() => {
        const conflictos = validacionAlertas.filter((a: any) => a.tipo === 'NOVEDAD');
        if (conflictos.length === 0) return null;
        const fechas = conflictos.map((a: any) => parseFechaSinAjuste(a.fecha));
        const fechasValidas = fechas.filter((f): f is Date => f !== null);
        if (fechasValidas.length === 0) return null;
        return new Date(Math.min(...fechasValidas.map(f => f.getTime())));
    }, [validacionAlertas]);

    const programacion = useMemo(() => {
        let base = !programacionOriginal || cambiosLocales.length === 0
            ? [...programacionOriginal]
            : programacionOriginal.map((asig: any) => {
                const cambio = cambiosLocales.find(c => c.id_detalle_programacion === asig.id_detalle_programacion);
                if (cambio) {
                    if (cambio.id_area_destino === -1) return { ...asig, _eliminado: true };
                    return { ...asig, id_area: cambio.id_area_destino, id_turno: cambio.id_turno_destino, fecha: cambio.fecha, _modificado: true };
                }
                return asig;
            }).filter((asig: any) => !asig._eliminado);

        const nuevosTurnos = cambiosLocales
            .filter(c => c.id_area_origen === -1 && c.id_area_destino !== -1)
            .map(c => ({
                id_detalle_programacion: c.id_detalle_programacion,
                id_empleado: c.id_empleado,
                nombre_empleado: c.empleado,
                empleado: { nombre_completo: c.empleado, id_empleado: c.id_empleado },
                id_area: c.id_area_destino,
                id_turno: c.id_turno_destino,
                fecha: c.fecha,
                _modificado: true
            }));

        base = [...base, ...nuevosTurnos];

        if (filtroEmpleado.trim()) {
            const search = filtroEmpleado.toLowerCase();
            return base.filter((p: any) => (p.nombre_empleado || p.empleado?.nombre_completo || '').toLowerCase().includes(search));
        }
        return base;
    }, [programacionOriginal, cambiosLocales, filtroEmpleado]);

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
        if (!programacionOriginal || !Array.isArray(programacionOriginal)) return config;
        areas.forEach(area => {
            const turnosUsados = new Set(programacionOriginal.filter((p: any) => Number(p.id_area) === area.id_area).map((p: any) => Number(p.id_turno)));
            config[area.id_area] = Array.from(turnosUsados).sort((a, b) => a - b);
        });
        return config;
    }, [programacionOriginal, areas]);

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
        const idEmp = asignacion.id_empleado || asignacion.empleado?.id_empleado;
        if (!idEmp) {
            console.error("No se pudo encontrar el ID del empleado en el objeto:", asignacion);
            toast.error("Error de datos: Empleado sin ID identificable.");
            e.preventDefault();
            return;
        }

        const nombre = asignacion.nombre_empleado || asignacion.empleado?.nombre_completo || asignacion.nombre_completo || 'Empleado';

        setEmpleadoArrastrado({
            ...asignacion,
            id_area_origen: idArea,
            id_turno_origen: idTurno,
            id_empleado: idEmp,
            nombre_empleado: nombre
        });

        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, idAreaDestino: number, idTurnoDestino: number, fechaDestino: string) => {
        e.preventDefault();
        if (!empleadoArrastrado) return;
        if (!empleadoArrastrado.id_empleado) {
            toast.error("Error crítico: Se perdió el ID del empleado al arrastrar.");
            return;
        }

        const yaTieneAsignacion = programacion.some((p: any) =>
            p.id_empleado === empleadoArrastrado.id_empleado &&
            p.fecha.split('T')[0] === fechaDestino &&
            p.id_detalle_programacion !== empleadoArrastrado.id_detalle_programacion
        );

        if (yaTieneAsignacion) {
            toast.error(`${empleadoArrastrado.nombre_empleado || 'El empleado'} ya tiene un turno ese día`);
            setEmpleadoArrastrado(null);
            return;
        }

        const fechaOrigen = empleadoArrastrado.fecha?.split('T')[0] || fechaDestino;
        if (empleadoArrastrado.id_area_origen === idAreaDestino && empleadoArrastrado.id_turno_origen === idTurnoDestino && fechaOrigen === fechaDestino) {
            setEmpleadoArrastrado(null);
            return;
        }

        const cambioId = `${Date.now()}-${Math.random()}`;
        const esDesdeRefuerzo = empleadoArrastrado.id_area_origen === -1;
        const idDetalle = esDesdeRefuerzo ? 99999999 : (empleadoArrastrado.id_detalle_programacion || 0);

        const nuevoCambio: CambioLocal = {
            id: cambioId,
            id_detalle_programacion: idDetalle,
            empleado: empleadoArrastrado.nombre_empleado,
            id_empleado: empleadoArrastrado.id_empleado,
            fecha: fechaDestino,
            id_area_origen: empleadoArrastrado.id_area_origen,
            id_turno_origen: empleadoArrastrado.id_turno_origen,
            id_area_destino: idAreaDestino,
            id_turno_destino: idTurnoDestino
        };

        setCambiosLocales(prev => [...prev, nuevoCambio]);
        setEmpleadoArrastrado(null);
        toast.success(`${nuevoCambio.empleado} asignado`);
    };

    const handleDropRefuerzo = (e: React.DragEvent, fechaDestino: string) => {
        e.preventDefault();
        if (!empleadoArrastrado) return;
        if (!empleadoArrastrado.id_empleado) return;
        if (empleadoArrastrado.id_area_origen === -1) {
            setEmpleadoArrastrado(null);
            return;
        }

        const cambioId = `${Date.now()}-${Math.random()}`;
        const nuevoCambio: CambioLocal = {
            id: cambioId,
            id_detalle_programacion: empleadoArrastrado.id_detalle_programacion,
            empleado: empleadoArrastrado.nombre_empleado,
            id_empleado: empleadoArrastrado.id_empleado,
            fecha: fechaDestino,
            id_area_origen: empleadoArrastrado.id_area_origen,
            id_turno_origen: empleadoArrastrado.id_turno_origen,
            id_area_destino: -1,
            id_turno_destino: -1
        };

        setCambiosLocales(prev => [...prev, nuevoCambio]);
        setEmpleadoArrastrado(null);
    };

    const handleRevertirCambios = () => {
        setCambiosLocales([]);
        toast.info('Cambios revertidos');
    };

    const handleConsultar = () => {
        setPaso('detalle');
        setCambiosLocales([]);
        setBannerIgnorado(false);
        setFiltroEmpleado('');
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

    const handleGuardarCambios = async () => {
        try {
            const cambiosInvalidos = cambiosLocales.filter(c => !c.id_empleado);
            if (cambiosInvalidos.length > 0) {
                console.error("Cambios inválidos detectados:", cambiosInvalidos);
                toast.error(`Error: Hay ${cambiosInvalidos.length} cambios sin ID de empleado válido.`);
                return;
            }

            toast.loading('Guardando cambios...');
            await programacionService.guardarCambios(cambiosLocales);
            const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const fin = new Date(anio, mes, 0).toISOString().split('T')[0];
            const nuevasAlertas = await programacionService.validarPeriodo(inicio, fin);
            await alertasService.guardar(mes, anio, nuevasAlertas);
            setCambiosLocales([]);
            queryClient.invalidateQueries({ queryKey: ['programacion-mensual'] });
            queryClient.invalidateQueries({ queryKey: ['alertas-programacion'] });
            queryClient.invalidateQueries({ queryKey: ['no-asignados-dia'] });
            toast.dismiss();
            toast.success('Cambios aplicados');
        } catch (error) {
            toast.dismiss();
            toast.error('Error al guardar los cambios');
            console.error(error);
        }
    };

    return (
        <div className="space-y-6 max-w-full mx-auto pb-6 px-6">
            {paso === 'seleccion' ? (
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión Mensual</h1>
                    <p className="text-slate-500">Seleccione el periodo</p>
                </div>
            ) : null}

            {paso === 'seleccion' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card className="bg-white border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Mes de Consulta</Label>
                                    <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{meses.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Año</Label>
                                    <Select value={String(anio)} onValueChange={(v) => setAnio(parseInt(v))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{anios.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700" size="lg" onClick={handleConsultar}><Search className="mr-2 h-4 w-4" /> Consultar Programación</Button>
                        </CardContent>
                    </Card>
                    <div className="bg-slate-50 border-dashed border-2 rounded-xl p-8 text-center">
                        <CalendarDays className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">¿No hay programación generada?</h3>
                        <p className="text-slate-500 mb-6">Debe generar primero la distribución automática en el motor de áreas.</p>
                        <Button variant="outline" onClick={() => navigate('/programacion-areas')}>Ir a Programación Áreas <ArrowRight className="ml-2 h-4 w-4" /></Button>
                    </div>
                </div>
            )}

            {paso === 'detalle' && (
                <div className="flex flex-col min-h-screen">
                    {cargandoProg ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                            <p className="text-slate-500 text-sm">Cargando programación ...</p>
                        </div>
                    ) : programacionOriginal.length === 0 ? (
                        <div className="space-y-6 mt-6">
                            <div className="flex flex-col gap-2 mb-4">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión Mensual</h1>
                                <p className="text-slate-500">Gestionando programación de {meses[mes - 1]} {anio}</p>
                            </div>
                            <div className="flex justify-start bg-white p-4 border rounded-xl shadow-sm">
                                <Button variant="ghost" onClick={() => setPaso('seleccion')}><ChevronLeft className="mr-2 h-4 w-4" /> Cambiar Periodo</Button>
                            </div>
                            <Card className="p-12 text-center border-dashed">
                                <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                                <h3 className="text-xl font-bold">Sin Registros</h3>
                                <p className="text-slate-500 mb-4">No se encontró programación para {meses[mes - 1]} del {anio}.</p>
                                <Button onClick={() => navigate('/programacion-areas')}>Generar Ahora</Button>
                            </Card>
                        </div>
                    ) : (
                        <>
                            <div className="sticky top-0 z-50 flex justify-between items-center bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 p-3 border-b border-slate-300 shadow-sm gap-4">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="sm" onClick={() => setPaso('seleccion')}><ChevronLeft className="mr-2 h-4 w-4" /> Atrás</Button>
                                    <h2 className="text-lg font-bold text-slate-800 hidden md:block">{meses[mes - 1]} {anio}</h2>
                                </div>
                                <div className="flex-1 max-w-sm relative">
                                    <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input placeholder="Buscar..." className="pl-10 h-9" value={filtroEmpleado} onChange={(e) => setFiltroEmpleado(e.target.value)} />
                                </div>
                                <div className="flex gap-2">
                                    {cambiosLocales.length > 0 ? (
                                        <>
                                            <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={handleRevertirCambios}><Undo2 className="mr-2 h-4 w-4" /> Revertir</Button>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleGuardarCambios}><Save className="mr-2 h-4 w-4" /> Guardar ({cambiosLocales.length})</Button>
                                        </>
                                    ) : (
                                        <BotonEliminarProgramacion mes={mes} anio={anio} onSuccess={() => { setCambiosLocales([]); setPaso('seleccion'); queryClient.invalidateQueries({ queryKey: ['verificar-programacion'] }); }} />
                                    )}
                                    <Button variant="outline" size="sm" onClick={handleExportar}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 pb-40">
                                {!bannerIgnorado && fechaConflictoPersistente && (
                                    <BannerNecesidadRegenerar fechaCorte={fechaConflictoPersistente} mes={mes} anio={anio} programacionOriginal={programacionOriginal} areas={areas} modo="gestion" onSuccess={(res) => { refetch(); refetchNoAsignados(); refetchAlertas(); setBannerIgnorado(false); const afectadas = res?.fechasProcesadas || infoDias.filter(d => d.objetoFecha >= fechaConflictoPersistente).map(d => d.fechaISO); setFechasRecienGeneradas(afectadas); toast.success('Programación regenerada exitosamente'); }} onIgnore={() => setBannerIgnorado(true)} />
                                )}

                                {alertasSeparadas.alertasEmpleados.length > 0 && <VisualizacionAlertas alertas={alertasMotor} />}

                                <div className="space-y-8">
                                    {areas.filter(area => (configAreasTurnos[area.id_area] || []).length > 0).map((area) => (
                                        <div key={area.id_area} className="space-y-4">
                                            {alertasSeparadas.alertasPorArea[area.id_area] && (
                                                <VisualizacionAlertas alertas={alertasMotor} mostrarPorArea={true} idArea={area.id_area} nombreArea={area.nombre_area} />
                                            )}
                                            <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                                <div className="bg-slate-800 text-white px-5 py-2 font-bold uppercase text-xs tracking-widest">{area.nombre_area}</div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-slate-50">
                                                                <th className="border p-2 text-left w-24 sticky left-0 bg-slate-100 z-10 text-[10px] font-bold text-slate-600">TURNO</th>
                                                                {infoDias.map((dia) => {
                                                                    const esSucio = fechaConflictoPersistente && dia.objetoFecha >= fechaConflictoPersistente;
                                                                    const esRegenerado = fechasRecienGeneradas.includes(dia.fechaISO);
                                                                    return (
                                                                        <th key={dia.fechaISO} className={cn("border p-1 text-center text-[9px] min-w-[100px] transition-colors duration-500", esSucio ? 'bg-red-50/50 border-x-red-100' : 'text-slate-500', esRegenerado && "bg-emerald-100 border-emerald-300")}>
                                                                            <div className="flex flex-col relative">
                                                                                <span className={cn("font-bold", esSucio ? 'text-red-600 font-black' : 'text-indigo-600', esRegenerado && "text-emerald-700")}>{dia.nombreDia}</span>
                                                                                <span className={cn(esSucio ? 'text-red-700 font-black text-[9px]' : '', esRegenerado && "text-emerald-600")}>{dia.numero}</span>
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
                                                                        <td className="border p-2 font-bold text-indigo-700 sticky left-0 bg-white z-10 text-[10px]">{turnoInfo?.tipo_turno || `T${tId}`}</td>
                                                                        {infoDias.map((dia) => {
                                                                            const asignados = programacion.filter((p: any) => Number(p.id_area) === area.id_area && Number(p.id_turno) === tId && p.fecha.split('T')[0] === dia.fechaISO);
                                                                            const tieneNovedad = validacionAlertas.some(a => a.fecha === dia.fechaISO && a.tipo === 'NOVEDAD' && asignados.some((asig: any) => asig.id_empleado === a.id_empleado));
                                                                            return (
                                                                                <td key={dia.fechaISO} className={cn("border p-1 min-h-[40px] transition-all duration-300", tieneNovedad && 'bg-red-200')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, area.id_area, tId, dia.fechaISO)}>
                                                                                    <div className="flex flex-col gap-1">
                                                                                        {asignados.map((asig: any, idx: number) => (
                                                                                            <div key={idx} draggable onDragStart={(e) => handleDragStart(e, asig, area.id_area, tId)} onClick={() => abrirModalNovedad(asig.id_empleado, asig.nombre_empleado || asig.empleado?.nombre_completo, dia.fechaISO)} className={cn("px-1 py-0.5 border rounded text-[9px] cursor-pointer transition-all shadow-sm bg-white border-slate-200 truncate max-w-[95px]", asig._modificado && 'bg-amber-100 border-amber-400', tieneNovedad && 'border-red-500 font-bold')}>
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
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="sticky bottom-0 z-40 bg-white border-t-2 border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <tbody>
                                            <tr className="bg-slate-50">
                                                <td className="border p-2 text-[10px] font-bold w-24 sticky left-0 bg-slate-100 z-10 text-slate-700">REFUERZOS</td>
                                                {infoDias.map((dia) => {
                                                    const noAsignadosBase = noAsignadosPorDia[dia.fechaISO] || [];
                                                    const movidosAqui = cambiosLocales.filter(c => c.fecha === dia.fechaISO && c.id_area_destino === -1);
                                                    const idsMovidosAqui = new Set(movidosAqui.map(c => c.id_empleado));
                                                    const empleadosMovidosAqui = programacionOriginal.filter((p: any) => idsMovidosAqui.has(p.id_empleado)).map((p: any) => ({ ...p, nombre_completo: p.nombre_empleado || p.empleado?.nombre_completo }));
                                                    const poolRefuerzos = [...noAsignadosBase, ...empleadosMovidosAqui];
                                                    const enGrid = new Set(programacion.filter((p: any) => p.fecha.split('T')[0] === dia.fechaISO).map((p: any) => p.id_empleado));
                                                    const listaVisible = poolRefuerzos.filter(e => !enGrid.has(e.id_empleado));
                                                    const unicos = Array.from(new Map(listaVisible.map((item: any) => [item.id_empleado, item])).values());
                                                    return (
                                                        <td key={dia.fechaISO} className="border p-1 bg-white min-w-[100px]" onDragOver={handleDragOver} onDrop={(e) => handleDropRefuerzo(e, dia.fechaISO)}>
                                                            <div className="flex flex-col gap-1 min-h-[30px]">
                                                                {unicos.map((emp: any) => (
                                                                    <div key={emp.id_empleado} draggable onDragStart={(e) => handleDragStart(e, { ...emp, id_detalle_programacion: emp.id_detalle_programacion || 99999999 }, -1, -1)} onClick={() => abrirModalNovedad(emp.id_empleado, emp.nombre_completo, dia.fechaISO)} className="px-1 py-0.5 border border-amber-200 rounded text-[8px] bg-amber-50 cursor-pointer hover:bg-amber-100 truncate max-w-[95px]">
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
                            </div>
                        </>
                    )}
                </div>
            )}

            <ModalNovedadRapida isOpen={modalNovedadOpen} onClose={() => setModalNovedadOpen(false)} empleado={empleadoSeleccionado} fechaSeleccionada={fechaParaNovedad} onSuccess={(fechaCorte) => { refetch(); refetchNoAsignados(); refetchAlertas(); }} />
        </div>
    );
}