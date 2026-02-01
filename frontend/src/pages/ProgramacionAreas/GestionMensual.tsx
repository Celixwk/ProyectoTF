import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { buildProgramacionWorkbook } from '@/utils/exportarExcel';
import { areasService, turnosService, programacionService, alertasService, consultasService } from '@/services/api.service';
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
import { validarMovimiento } from '@/utils/ValidadorMovimientos';
import { ModalConfirmacionCambio } from '@/components/ModalConfirmacionCambio';

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

    const [cambioPendiente, setCambioPendiente] = useState<CambioLocal[] | null>(null);
    const [advertenciasPendientes, setAdvertenciasPendientes] = useState<string[]>([]);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i);

    const { data: areasRaw } = useQuery<Area[]>({ queryKey: ['areas'], queryFn: () => areasService.listar() });
    const { data: turnosRaw } = useQuery<Turno[]>({ queryKey: ['turnos'], queryFn: () => turnosService.listar({ estado: true }) });

    useEffect(() => {
        if (fechasRecienGeneradas.length > 0) {
            const timer = setTimeout(() => {
                setFechasRecienGeneradas([]);
            }, 15000);
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

    const { data: empleadosData } = useQuery({
        queryKey: ['empleados-completos-validacion'],
        queryFn: () => consultasService.obtenerEmpleadosCompletos({ estado: true }),
        enabled: paso === 'detalle',
        staleTime: 0
    });

    const empleadosInfo = useMemo(() => {
        if (!empleadosData?.empleados) return [];
        return empleadosData.empleados.map((emp: any) => ({
            id_empleado: emp.id_empleado,
            nombre: emp.nombre_completo || emp.nombre || 'Empleado',
            areas_habilitadas: emp.areas_permitidas || []
        }));
    }, [empleadosData]);

    const alertasSeparadas = useMemo(() => {
        const alertasProcesadas = procesarAlertas(alertasMotor);
        return {
            alertasEmpleados: alertasProcesadas.alertasEmpleados.filter(
                alerta => alerta.codigo !== 'EMPLEADOS_SIN_ASIGNACION'
            ),
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
        if (!programacionOriginal) return [];
        let base = programacionOriginal.map((asig: any) => {
            const cambio = cambiosLocales.find(c =>
                c.id_detalle_programacion === asig.id_detalle_programacion && asig.id_detalle_programacion !== 0
            );
            if (cambio) {
                if (cambio.id_area_destino === -1) return { ...asig, _eliminado: true };
                return { ...asig, id_area: cambio.id_area_destino, id_turno: cambio.id_turno_destino, fecha: cambio.fecha, _modificado: true };
            }
            return asig;
        }).filter((asig: any) => !asig._eliminado);

        const nuevosDesdeRefuerzo = cambiosLocales
            .filter(c => c.id_area_origen === -1 && c.id_area_destino !== -1)
            .map(c => ({
                id_detalle_programacion: 0,
                id_empleado: c.id_empleado,
                nombre_empleado: c.empleado,
                empleado: { nombre_completo: c.empleado, id_empleado: c.id_empleado },
                id_area: c.id_area_destino,
                id_turno: c.id_turno_destino,
                fecha: c.fecha,
                _modificado: true
            }));

        base = [...base, ...nuevosDesdeRefuerzo];

        if (filtroEmpleado.trim()) {
            const search = filtroEmpleado.toLowerCase();
            return base.filter((p: any) =>
                (p.nombre_empleado || p.empleado?.nombre_completo || '').toLowerCase().includes(search)
            );
        }
        return base;
    }, [programacionOriginal, cambiosLocales, filtroEmpleado]);

    const obtenerProgramacionParaValidar = () => {
        let base = programacionOriginal.map((asig: any) => {
            const cambio = cambiosLocales.find(c => c.id_detalle_programacion === asig.id_detalle_programacion && asig.id_detalle_programacion !== 0);
            if (cambio) {
                if (cambio.id_area_destino === -1) return null;
                return { ...asig, id_area: cambio.id_area_destino, id_turno: cambio.id_turno_destino, fecha: cambio.fecha };
            }
            return asig;
        }).filter(Boolean);

        const nuevos = cambiosLocales
            .filter(c => c.id_area_origen === -1 && c.id_area_destino !== -1)
            .map(c => ({
                id_empleado: c.id_empleado,
                fecha: c.fecha,
                id_area: c.id_area_destino,
                id_turno: c.id_turno_destino
            }));

        return [...base, ...nuevos];
    };

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
        const idEmp = Number(asignacion.id_empleado || asignacion.empleado?.id_empleado);
        const nombre = asignacion.nombre_empleado || asignacion.empleado?.nombre_completo || asignacion.nombre_completo || 'Empleado';

        if (!idEmp || isNaN(idEmp)) {
            toast.error("Error de datos: ID de empleado no encontrado.");
            e.preventDefault();
            return;
        }

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

    const aplicarCambios = (nuevos: CambioLocal[]) => {
        setCambiosLocales(prev => {
            const mapa = new Map(prev.map(c => [`${c.id_empleado}-${c.id_detalle_programacion}`, c]));
            nuevos.forEach(n => {
                mapa.set(`${n.id_empleado}-${n.id_detalle_programacion}`, n);
            });
            return Array.from(mapa.values());
        });
        setEmpleadoArrastrado(null);
        toast.success(`Cambio registrado`);
    };

    const handleDrop = (e: React.DragEvent, idAreaDestino: number, idTurnoDestino: number, fechaDestino: string) => {
        e.preventDefault();
        if (!empleadoArrastrado) return;

        const fechaNorm = fechaDestino.split('T')[0];
        const fechaOrigen = empleadoArrastrado.fecha?.split('T')[0] || fechaNorm;

        if (empleadoArrastrado.id_area_origen === idAreaDestino && empleadoArrastrado.id_turno_origen === idTurnoDestino && fechaOrigen === fechaNorm) {
            setEmpleadoArrastrado(null);
            return;
        }

        const cambioId = `${Date.now()}-${Math.random()}`;
        const cambiosAGenerar: CambioLocal[] = [];
        const programacionBase = obtenerProgramacionParaValidar();
        const areaInfo = areas.find(a => a.id_area === idAreaDestino);
        const maxPermitido = areaInfo?.max_trabajadores ?? 0;

        const empleadosEnAreaHoy = programacionBase.filter(p => Number(p.id_area) === Number(idAreaDestino) && p.fecha.split('T')[0] === fechaNorm);
        const esMismoDiaYArea = empleadoArrastrado.id_area_origen === idAreaDestino && fechaOrigen === fechaNorm;
        const ocupacionGlobal = esMismoDiaYArea ? empleadosEnAreaHoy.length : empleadosEnAreaHoy.length + 1;

        if (maxPermitido > 0 && ocupacionGlobal > maxPermitido) {
            const destinoDirecto = empleadosEnAreaHoy.find(p => Number(p.id_turno) === Number(idTurnoDestino));
            if (!destinoDirecto) {
                toast.error(`⛔ AREA LLENA: El área ${areaInfo?.nombre_area} tiene un límite de ${maxPermitido} personas.`);
                setEmpleadoArrastrado(null);
                return;
            }
            cambiosAGenerar.push(
                { id: cambioId, id_detalle_programacion: empleadoArrastrado.id_detalle_programacion || 0, empleado: empleadoArrastrado.nombre_empleado, id_empleado: empleadoArrastrado.id_empleado, fecha: fechaNorm, id_area_origen: empleadoArrastrado.id_area_origen, id_turno_origen: empleadoArrastrado.id_turno_origen, id_area_destino: idAreaDestino, id_turno_destino: idTurnoDestino },
                { id: cambioId, id_detalle_programacion: destinoDirecto.id_detalle_programacion, empleado: destinoDirecto.nombre_empleado || destinoDirecto.empleado?.nombre_completo || 'Empleado', id_empleado: destinoDirecto.id_empleado, fecha: fechaOrigen, id_area_origen: idAreaDestino, id_turno_origen: idTurnoDestino, id_area_destino: empleadoArrastrado.id_area_origen, id_turno_destino: empleadoArrastrado.id_turno_origen }
            );
        } else {
            cambiosAGenerar.push({ id: cambioId, id_detalle_programacion: empleadoArrastrado.id_detalle_programacion || 0, empleado: empleadoArrastrado.nombre_empleado, id_empleado: empleadoArrastrado.id_empleado, fecha: fechaNorm, id_area_origen: empleadoArrastrado.id_area_origen, id_turno_origen: empleadoArrastrado.id_turno_origen, id_area_destino: idAreaDestino, id_turno_destino: idTurnoDestino });
        }

        let advertenciasFinales: string[] = [];
        for (const cambio of cambiosAGenerar) {
            const infoEmp = empleadosInfo.find(e => Number(e.id_empleado) === Number(cambio.id_empleado));
            const advs = validarMovimiento(cambio.id_empleado, cambio.fecha, cambio.id_area_destino, programacionBase, infoEmp, cambio.id_empleado === empleadoArrastrado.id_empleado ? fechaOrigen : cambio.fecha, cambio.id_area_origen);
            advs.forEach(msg => {
                let limpio = msg.replace(/^⛔\s(PROHIBIDO|CONFLICTO|FATIGA):\s/i, '').replace(/El empleado/i, cambio.empleado);
                if (msg.includes('PROHIBIDO')) advertenciasFinales.push(`⛔ PROHIBIDO: ${limpio}`);
                else if (msg.includes('CONFLICTO')) advertenciasFinales.push(`⛔ CONFLICTO: ${limpio}`);
                else if (msg.includes('FATIGA')) advertenciasFinales.push(`⛔ FATIGA: ${limpio}`);
                else advertenciasFinales.push(msg);
            });
        }

        if (advertenciasFinales.length > 0) {
            setCambioPendiente(cambiosAGenerar);
            setAdvertenciasPendientes(Array.from(new Set(advertenciasFinales)));
            setEmpleadoArrastrado(null);
            return;
        }
        aplicarCambios(cambiosAGenerar);
    };

    const handleDropRefuerzo = (e: React.DragEvent, fechaDestino: string) => {
        e.preventDefault();
        if (!empleadoArrastrado || !empleadoArrastrado.id_empleado) return;
        if (empleadoArrastrado.id_area_origen === -1 && empleadoArrastrado.fecha === fechaDestino) {
            setEmpleadoArrastrado(null);
            return;
        }
        const cambioId = `${Date.now()}-${Math.random()}`;
        const nuevoCambio: CambioLocal = {
            id: cambioId,
            id_detalle_programacion: empleadoArrastrado.id_detalle_programacion || 0,
            empleado: empleadoArrastrado.nombre_empleado,
            id_empleado: empleadoArrastrado.id_empleado,
            fecha: fechaDestino,
            id_area_origen: empleadoArrastrado.id_area_origen,
            id_turno_origen: empleadoArrastrado.id_turno_origen,
            id_area_destino: -1,
            id_turno_destino: -1
        };
        aplicarCambios([nuevoCambio]);
    };

    const handleRevertirCambios = () => { setCambiosLocales([]); toast.info('Cambios revertidos'); };
    const handleConsultar = () => { setPaso('detalle'); setCambiosLocales([]); setBannerIgnorado(false); setFiltroEmpleado(''); refetch(); };
    const handleExportar = () => { const wb = buildProgramacionWorkbook({ areas, turnos, infoDias, programacion, configAreasTurnos }); XLSX.writeFile(wb, `programacion_${meses[mes - 1]}_${anio}.xlsx`); };
    const abrirModalNovedad = (id: number, nombre: string, fecha: string) => { setEmpleadoSeleccionado({ id, nombre }); setFechaParaNovedad(fecha); setModalNovedadOpen(true); };

    const handleGuardarCambios = async () => {
        try {
            if (cambiosLocales.length === 0) return;

            console.log('🎯 INICIO GUARDADO:', new Date().toISOString());
            toast.loading('Sincronizando cambios y revisando cobertura...');


            console.log('💾 Guardando cambios físicos...');
            await programacionService.guardarCambios(cambiosLocales);
            console.log('✅ Cambios guardados');


            console.log('⏳ Pausa de 800ms...');
            await new Promise(resolve => setTimeout(resolve, 800));
            console.log('✅ Pausa completada');


            const inicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
            const fin = new Date(anio, mes, 0).toISOString().split('T')[0];

            console.log('🔍 Validando período:', { inicio, fin });
            const alertasNuevas = await programacionService.validarPeriodo(inicio, fin);
            console.log('📊 ALERTAS RECIBIDAS:', {
                cantidad: alertasNuevas?.length || 0,
                estructura: alertasNuevas?.[0],
                esArray: Array.isArray(alertasNuevas)
            });


            console.log('💾 Enviando alertas a guardar...');
            await alertasService.guardar(mes, anio, alertasNuevas);
            console.log('✅ Alertas guardadas');


            setCambiosLocales([]);
            queryClient.removeQueries({ queryKey: ['alertas-programacion'] });

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['programacion-mensual'] }),
                queryClient.invalidateQueries({ queryKey: ['alertas-programacion'] }),
                queryClient.invalidateQueries({ queryKey: ['no-asignados-dia'] })
            ]);

            refetchAlertas();
            refetch();

            toast.dismiss();
            toast.success('Cambios aplicados y alertas actualizadas');
            console.log('🎉 PROCESO COMPLETADO:', new Date().toISOString());
        } catch (error: any) {
            console.error('❌ ERROR EN handleGuardarCambios:', error);
            toast.dismiss();
            toast.error('Error en la sincronización');
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
                                    <BannerNecesidadRegenerar fechaCorte={fechaConflictoPersistente} mes={mes} anio={anio} programacionOriginal={programacionOriginal} areas={areas} modo="gestion" onSuccess={(res) => { refetch(); refetchNoAsignados(); refetchAlertas(); setBannerIgnorado(false); const afectadas = res?.fechasProcesadas || infoDias.filter(d => d.objetoFecha >= fechaConflictoPersistente).map(d => d.fechaISO); setFechasRecienGeneradas(afectadas); toast.success('Programación regenerada'); }} onIgnore={() => setBannerIgnorado(true)} />
                                )}

                                {alertasSeparadas.alertasEmpleados.length > 0 && <VisualizacionAlertas alertas={alertasMotor} />}

                                <div className="space-y-8">
                                    {areas.filter(area => (configAreasTurnos[area.id_area] || []).length > 0).map((area) => (
                                        <div key={area.id_area} className="space-y-4">
                                            {alertasSeparadas.alertasPorArea[area.id_area] && <VisualizacionAlertas alertas={alertasMotor} mostrarPorArea={true} idArea={area.id_area} nombreArea={area.nombre_area} />}
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
                                                                        <th key={dia.fechaISO} className={cn("border p-1 text-center text-[9px] min-w-[100px]", esSucio ? 'bg-red-50/50' : 'text-slate-500', esRegenerado && "bg-emerald-100")}>
                                                                            <div className="flex flex-col relative">
                                                                                <span className={cn("font-bold", esSucio ? 'text-red-600' : 'text-indigo-600')}>{dia.nombreDia}</span>
                                                                                <span>{dia.numero}</span>
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
                                                                                <td key={dia.fechaISO} className={cn("border p-1 min-h-[40px]", tieneNovedad && 'bg-red-200')} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, area.id_area, tId, dia.fechaISO)}>
                                                                                    <div className="flex flex-col gap-1">
                                                                                        {asignados.map((asig: any, idx: number) => (
                                                                                            <div key={idx} draggable onDragStart={(e) => handleDragStart(e, asig, area.id_area, tId)} onClick={() => abrirModalNovedad(asig.id_empleado, asig.nombre_empleado || asig.empleado?.nombre_completo, dia.fechaISO)} className={cn("px-1 py-0.5 border rounded text-[9px] cursor-pointer shadow-sm bg-white truncate max-w-[95px]", asig._modificado && 'bg-amber-100 border-amber-400', tieneNovedad && 'border-red-500')}>
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

                            <div className="sticky bottom-0 z-40 bg-white border-t-2 border-slate-200 shadow-md">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <tbody>
                                            <tr className="bg-slate-50">
                                                <td className="border p-2 text-[10px] font-bold w-24 sticky left-0 bg-slate-100 z-10">REFUERZOS</td>
                                                {infoDias.map((dia) => {
                                                    const noAsignadosBase = noAsignadosPorDia[dia.fechaISO] || [];
                                                    const poolRefuerzos = [...noAsignadosBase];
                                                    const enGrid = new Set(programacion.filter((p: any) => p.fecha.split('T')[0] === dia.fechaISO).map((p: any) => p.id_empleado));
                                                    const listaVisible = poolRefuerzos.filter(e => !enGrid.has(e.id_empleado));
                                                    return (
                                                        <td key={dia.fechaISO} className="border p-1 bg-white min-w-[100px]" onDragOver={handleDragOver} onDrop={(e) => handleDropRefuerzo(e, dia.fechaISO)}>
                                                            <div className="flex flex-col gap-1 min-h-[30px]">
                                                                {listaVisible.map((emp: any) => (
                                                                    <div key={emp.id_empleado} draggable onDragStart={(e) => handleDragStart(e, { ...emp, id_detalle_programacion: emp.id_detalle_programacion || 0 }, -1, -1)} onClick={() => abrirModalNovedad(emp.id_empleado, emp.nombre_completo, dia.fechaISO)} className="px-1 py-0.5 border border-amber-200 rounded text-[8px] bg-amber-50 cursor-pointer hover:bg-amber-100 truncate">
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
            <ModalNovedadRapida isOpen={modalNovedadOpen} onClose={() => setModalNovedadOpen(false)} empleado={empleadoSeleccionado} fechaSeleccionada={fechaParaNovedad} onSuccess={() => { refetch(); refetchNoAsignados(); refetchAlertas(); }} />
            <ModalConfirmacionCambio open={!!cambioPendiente} onOpenChange={(open) => !open && setCambioPendiente(null)} advertencias={advertenciasPendientes} onConfirm={() => { if (cambioPendiente) { aplicarCambios(cambioPendiente); setCambioPendiente(null); setAdvertenciasPendientes([]); } }} />
        </div>
    );
}