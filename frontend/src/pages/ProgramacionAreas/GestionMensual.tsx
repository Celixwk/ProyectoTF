import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { buildProgramacionWorkbook } from '@/utils/exportarExcel';
import { areasService, turnosService, programacionService, alertasService, consultasService } from '@/services/api.service';
import { ModalNovedadRapida } from '@/utils/ModalNovedadRapida';
import { BannerNecesidadRegenerar } from '@/utils/BannerNecesidadRegenerar';
import { VisualizacionAlertas, procesarAlertas } from '@/utils/VisualizacionAlertas';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CalendarDays, ArrowRight, Search, ChevronLeft, AlertCircle, FileSpreadsheet, Loader2, Save, Undo2, Calendar, Lock, Users } from 'lucide-react';
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
    const [searchParams, setSearchParams] = useSearchParams();

    // Estado principal ahora basado en rango de fechas
    const [fechaInicio, setFechaInicio] = useState(searchParams.get('fechaInicio') || '');
    const [fechaFin, setFechaFin] = useState(searchParams.get('fechaFin') || '');

    // Determinar paso inicial. Si hay fechas en URL, vamos a detalle.
    const [paso, setPaso] = useState<'seleccion' | 'detalle'>(
        (searchParams.get('fechaInicio') && searchParams.get('fechaFin')) ? 'detalle' : 'seleccion'
    );

    const [cambiosLocales, setCambiosLocales] = useState<CambioLocal[]>([]);
    const [empleadoArrastrado, setEmpleadoArrastrado] = useState<any>(null);
    const [fechasRecienGeneradas, setFechasRecienGeneradas] = useState<string[]>([]);
    const [bannerIgnorado, setBannerIgnorado] = useState(false);
    const [filtroEmpleado, setFiltroEmpleado] = useState('');
    const [busquedaSelect, setBusquedaSelect] = useState('');

    const [modalNovedadOpen, setModalNovedadOpen] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<{ id: number; nombre: string } | null>(null);
    const [fechaParaNovedad, setFechaParaNovedad] = useState<string | null>(null);

    const [cambioPendiente, setCambioPendiente] = useState<CambioLocal[] | null>(null);
    const [advertenciasPendientes, setAdvertenciasPendientes] = useState<string[]>([]);

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
    }, [fechaInicio, fechaFin]);

    // Query principal de programación
    const { data: programacionOriginal = [], isLoading: cargandoProg, refetch } = useQuery({
        queryKey: ['programacion-rango', fechaInicio, fechaFin],
        queryFn: async () => {
            if (!fechaInicio || !fechaFin) return [];
            const res = await programacionService.listarPorPeriodo(fechaInicio, fechaFin);
            return Array.isArray(res) ? res : (res.data || []);
        },
        enabled: paso === 'detalle' && !!fechaInicio && !!fechaFin,
        staleTime: 0
    });

    const { data: noAsignadosPorDia = {}, refetch: refetchNoAsignados } = useQuery({
        queryKey: ['no-asignados-dia', fechaInicio, fechaFin],
        queryFn: () => programacionService.obtenerEmpleadosNoAsignadosPorDia(undefined, undefined, fechaInicio, fechaFin),
        enabled: paso === 'detalle' && !!fechaInicio && !!fechaFin
    });

    const { data: alertasMotor = [] } = useQuery({
        queryKey: ['alertas-programacion', fechaInicio, fechaFin],
        queryFn: () => alertasService.obtener(undefined, undefined, fechaInicio, fechaFin),
        enabled: paso === 'detalle' && !!fechaInicio && !!fechaFin,
        staleTime: 5 * 60 * 1000
    });

    const { data: validacionAlertas = [], refetch: refetchAlertas } = useQuery({
        queryKey: ['validar-programacion', fechaInicio, fechaFin],
        queryFn: async () => programacionService.validarPeriodo(fechaInicio, fechaFin),
        enabled: paso === 'detalle' && !!fechaInicio && !!fechaFin
    });

    // QUERY ESTADO DEL MES (SEGURIDAD)
    const { data: estadoMes = 'Abierto' } = useQuery({
        queryKey: ['estado-mes', fechaInicio],
        queryFn: async () => {
            if (!fechaInicio) return 'Abierto';
            const [y, m] = fechaInicio.split('-').map(Number);
            return await programacionService.obtenerEstadoMes(m, y);
        },
        enabled: !!fechaInicio
    });
    const esModoLectura = estadoMes === 'Cerrado';

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
            cedula: emp.cedula || '',
            areas_habilitadas: emp.areas_permitidas || []
        }));
    }, [empleadosData]);

    const empleadosFiltradosSelect = useMemo(() => {
        const term = (busquedaSelect || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!term) return empleadosInfo;
        return empleadosInfo.filter((e: any) => {
            const nombre = (e.nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cedula = (e.cedula || '').toLowerCase();
            return nombre.includes(term) || cedula.includes(term);
        });
    }, [empleadosInfo, busquedaSelect]);

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
                // Priorizar fecha del cambio
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
                fecha: c.fecha, // Fecha destino
                _modificado: true
            }));

        base = [...base, ...nuevosDesdeRefuerzo];

        if (filtroEmpleado.trim()) {
            return base.filter((p: any) =>
                String(p.id_empleado) === filtroEmpleado
            );
        }
        return base;
    }, [programacionOriginal, cambiosLocales, filtroEmpleado]);

    // Helper para validaciones internas (drag & drop)
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

    // Generador de días basado en rango
    const infoDias = useMemo(() => {
        if (!fechaInicio || !fechaFin) return [];
        const start = new Date(fechaInicio);
        const end = new Date(fechaFin);
        start.setUTCHours(0, 0, 0, 0); // Asegurar UTC
        end.setUTCHours(23, 59, 59, 999);

        const dias = [];
        const current = new Date(start);

        // Iterar hasta llegar a fechaFin
        while (current <= end) {
            dias.push({
                numero: current.getUTCDate(), // Usar UTC date para evitar desfases
                nombreDia: current.toLocaleDateString('es-ES', { weekday: 'short', timeZone: 'UTC' }).toUpperCase().replace(".", ""),
                fechaISO: current.toISOString().split('T')[0],
                objetoFecha: new Date(current) // Clon
            });
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return dias;
    }, [fechaInicio, fechaFin]);

    const handleConsultar = () => {
        if (!fechaInicio || !fechaFin) {
            toast.error("Seleccione ambas fechas");
            return;
        }
        if (fechaInicio > fechaFin) {
            toast.error("La fecha inicio no puede ser mayor a la fin");
            return;
        }
        // Actualizar URL
        setSearchParams({ fechaInicio, fechaFin });
        setPaso('detalle');
        setCambiosLocales([]);
        setBannerIgnorado(false);
        setFiltroEmpleado('');
        refetch();
    };

    // --- Drag & Drop Handlers (Similares, ajustados para usar fechaISO directa) ---

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
            const generarKey = (c: CambioLocal) => {
                if (c.id_detalle_programacion && c.id_detalle_programacion !== 0) {
                    return `EXISTING-${c.id_detalle_programacion}`;
                }
                return `NEW-${c.id_empleado}-${c.fecha}`;
            };

            const mapa = new Map(prev.map(c => [generarKey(c), c]));
            nuevos.forEach(n => {
                mapa.set(generarKey(n), n);
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

        // Evitar soltar en el mismo lugar
        if (empleadoArrastrado.id_area_origen === idAreaDestino &&
            empleadoArrastrado.id_turno_origen === idTurnoDestino &&
            fechaOrigen === fechaNorm) {
            setEmpleadoArrastrado(null);
            return;
        }

        // VALIDACIÓN DE DOBLE ASIGNACIÓN (Anti-Robo)
        // Verificar si el empleado ya está asignado en OTRA área ese mismo día
        // Excepción: Si es un movimiento dentro del mismo día (reubicación voluntaria), permitimos (el usuario sabe lo que hace al arrastrar desde el grid)
        // Pero si viene de Refuerzos (id_area_origen === -1) y ya está en el grid, es un error de visualización -> BLOQUEAR.

        if (empleadoArrastrado.id_area_origen === -1) {
            // 1. Validar que esté DISPONIBLE ese día específico (no sea descanso ni novedad)
            // Usamos noAsignadosPorDia que trae la verdad del backend sobre disponibilidad
            const disponiblesHabil = noAsignadosPorDia[fechaNorm] || [];
            const esHabil = disponiblesHabil.some((p: any) => Number(p.id_empleado) === Number(empleadoArrastrado.id_empleado));

            if (!esHabil) {
                // Si no está en la lista de disponibles, averiguar por qué para dar buen feedback
                // Chequear novedades/descansos es complejo aquí sin data, pero podemos asumir que si no está disponible y no está asignado, es descanso/novedad.
                // OJO: Podría estar asignado ya? el backend lo excluye de noAsignadosPorDia si está asignado.

                // Verificamos asignación existente (Anti-Robo)
                const yaTieneTurno = obtenerProgramacionParaValidar().find(p =>
                    p.id_empleado === empleadoArrastrado.id_empleado &&
                    p.fecha.split('T')[0] === fechaNorm &&
                    !p._eliminado
                );

                if (yaTieneTurno) {
                    const nombreArea = yaTieneTurno.nombre_area || yaTieneTurno.area?.nombre_area || 'otra área';
                    toast.error(`⚠️ CONFLICTO: ${empleadoArrastrado.nombre_empleado} ya trabaja el día ${fechaNorm} en ${nombreArea}.`);
                    setEmpleadoArrastrado(null);
                    return;
                } else {
                    // Si no tiene turno y no está disponible, es Descanso o Novedad
                    toast.error(`⛔ NO DISPONIBLE: ${empleadoArrastrado.nombre_empleado} tiene descanso o novedad el día ${fechaNorm}.`);
                    setEmpleadoArrastrado(null);
                    return;
                }
            }
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
            // Swap
            cambiosAGenerar.push(
                { id: cambioId, id_detalle_programacion: empleadoArrastrado.id_detalle_programacion || 0, empleado: empleadoArrastrado.nombre_empleado, id_empleado: empleadoArrastrado.id_empleado, fecha: fechaNorm, id_area_origen: empleadoArrastrado.id_area_origen, id_turno_origen: empleadoArrastrado.id_turno_origen, id_area_destino: idAreaDestino, id_turno_destino: idTurnoDestino },
                { id: cambioId, id_detalle_programacion: destinoDirecto.id_detalle_programacion, empleado: destinoDirecto.nombre_empleado || destinoDirecto.empleado?.nombre_completo || 'Empleado', id_empleado: destinoDirecto.id_empleado, fecha: fechaOrigen, id_area_origen: idAreaDestino, id_turno_origen: idTurnoDestino, id_area_destino: empleadoArrastrado.id_area_origen, id_turno_destino: empleadoArrastrado.id_turno_origen }
            );
        } else {
            // Movimiento simple
            cambiosAGenerar.push({ id: cambioId, id_detalle_programacion: empleadoArrastrado.id_detalle_programacion || 0, empleado: empleadoArrastrado.nombre_empleado, id_empleado: empleadoArrastrado.id_empleado, fecha: fechaNorm, id_area_origen: empleadoArrastrado.id_area_origen, id_turno_origen: empleadoArrastrado.id_turno_origen, id_area_destino: idAreaDestino, id_turno_destino: idTurnoDestino });
        }

        let advertenciasFinales: string[] = [];
        for (const cambio of cambiosAGenerar) {
            const infoEmp = empleadosInfo.find(e => Number(e.id_empleado) === Number(cambio.id_empleado));
            const advs = validarMovimiento(
                cambio.id_empleado,
                cambio.fecha,
                cambio.id_area_destino,
                programacionBase,
                infoEmp,
                cambio.id_empleado === empleadoArrastrado.id_empleado ? fechaOrigen : cambio.fecha,
                cambio.id_area_origen
            );
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


    const handleRevertirCambios = () => { setCambiosLocales([]); toast.info('Cambios revertidos'); };

    // Exportar Excel ajustado a rango
    const handleExportar = () => {
        // Nota: buildProgramacionWorkbook necesitaría ajuste si depende de 'mes'/'anio' explícito para headers
        // pero usa 'infoDias' así que debería funcionar si le pasamos infoDias correcto.
        const wb = buildProgramacionWorkbook({ areas, turnos, infoDias, programacion, configAreasTurnos });
        XLSX.writeFile(wb, `programacion_${fechaInicio}_al_${fechaFin}.xlsx`);
    };

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

            console.log('🔍 Validando período:', { fechaInicio, fechaFin });
            const alertasNuevas = await programacionService.validarPeriodo(fechaInicio, fechaFin);

            console.log('💾 Enviando alertas a guardar...');
            // Extraer mes/anio del inicio para consistencia o guardar multi-mes si el endpoint lo soporta (lo soporta ahora)
            // Pasamos fechaInicio/Fin para que el backend sepa borrar el rango exacto
            const dInicio = new Date(fechaInicio);
            await alertasService.guardar(dInicio.getMonth() + 1, dInicio.getFullYear(), alertasNuevas, fechaInicio, fechaFin);

            console.log('✅ Alertas guardadas');

            setCambiosLocales([]);
            queryClient.removeQueries({ queryKey: ['alertas-programacion'] });

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['programacion-rango'] }),
                queryClient.invalidateQueries({ queryKey: ['no-asignados-dia'] }),
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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión Mensual / Por Rango</h1>
                    <p className="text-slate-500">Seleccione el rango de fechas a gestionar</p>
                </div>
            ) : null}

            {paso === 'seleccion' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <Card className="bg-white border shadow-sm">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Fecha Inicio</Label>
                                    <Input
                                        type="date"
                                        value={fechaInicio}
                                        onChange={(e) => setFechaInicio(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fecha Fin</Label>
                                    <Input
                                        type="date"
                                        value={fechaFin}
                                        onChange={(e) => setFechaFin(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700"
                                size="lg"
                                onClick={handleConsultar}
                            >
                                <Search className="mr-2 h-4 w-4" /> Consultar Programación
                            </Button>
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
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión del Periodo</h1>
                                <p className="text-slate-500">Del {fechaInicio} al {fechaFin}</p>
                            </div>
                            <div className="flex justify-start bg-white p-4 border rounded-xl shadow-sm">
                                <Button variant="ghost" onClick={() => { setPaso('seleccion'); setSearchParams({}); }}><ChevronLeft className="mr-2 h-4 w-4" /> Cambiar Periodo</Button>
                            </div>
                            <Card className="p-12 text-center border-dashed">
                                <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                                <h3 className="text-xl font-bold">Sin Registros</h3>
                                <p className="text-slate-500 mb-4">No se encontró programación para este rango.</p>
                                <Button onClick={() => navigate('/programacion-areas')}>Generar Ahora</Button>
                            </Card>
                        </div>
                    ) : (
                        <>
                            <div className="sticky top-0 z-50 flex justify-between items-center bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 p-3 border-b border-slate-300 shadow-sm gap-4">
                                <div className="flex items-center gap-4">
                                    <Button variant="ghost" size="sm" onClick={() => { setPaso('seleccion'); setSearchParams({}); }}><ChevronLeft className="mr-2 h-4 w-4" /> Atrás</Button>
                                    <h2 className="text-lg font-bold text-slate-800 hidden md:block">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-500" />
                                            {fechaInicio} <span className="text-slate-400">➜</span> {fechaFin}
                                        </div>
                                    </h2>
                                </div>
                                <div className="flex-1 max-w-sm relative flex flex-col items-center">
                                    <div className="w-full flex items-center justify-between">
                                        <Select
                                            value={filtroEmpleado || "todos"}
                                            onValueChange={v => {
                                                setFiltroEmpleado(v === "todos" ? "" : v);
                                                setBusquedaSelect('');
                                            }}
                                        >
                                            <SelectTrigger className="h-9 bg-white border-slate-200">
                                                <div className="flex items-center text-slate-700">
                                                    <Users className="h-4 w-4 mr-2 text-indigo-500" />
                                                    <SelectValue placeholder="Seleccione un empleado..." />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="w-[var(--radix-select-trigger-width)]">
                                                <div
                                                    className="flex items-center px-3 pb-2 border-b"
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                >
                                                    <Search className="h-4 w-4 mr-2 text-slate-400" />
                                                    <input
                                                        className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                                                        placeholder="Escriba para filtrar..."
                                                        value={busquedaSelect}
                                                        onChange={(e) => setBusquedaSelect(e.target.value)}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="max-h-[300px] overflow-y-auto mt-1 p-1">
                                                    <SelectItem value="todos" className="py-2 text-slate-600 font-medium">
                                                        Todos los empleados
                                                    </SelectItem>
                                                    {empleadosFiltradosSelect.length > 0 ? (
                                                        empleadosFiltradosSelect.map((e: any) => (
                                                            <SelectItem
                                                                key={e.id_empleado}
                                                                value={e.id_empleado.toString()}
                                                                className="py-3"
                                                            >
                                                                <span className="font-bold uppercase text-xs">
                                                                    {e.nombre}
                                                                </span>
                                                                {e.cedula && (
                                                                    <span className="ml-2 text-indigo-600 font-mono text-xs">
                                                                        [{e.cedula}]
                                                                    </span>
                                                                )}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-center text-sm text-slate-500">
                                                            No se encontraron empleados.
                                                        </div>
                                                    )}
                                                </div>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {esModoLectura && (
                                        <div className="flex items-center gap-2 bg-rose-100 text-rose-800 px-3 py-1 rounded-md border border-rose-200 text-xs font-bold mr-2">
                                            <Lock className="w-3 h-3" /> PERIODO CERRADO - SOLO LECTURA
                                        </div>
                                    )}
                                    {!esModoLectura && cambiosLocales.length > 0 ? (
                                        <>
                                            <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-50" onClick={handleRevertirCambios}><Undo2 className="mr-2 h-4 w-4" /> Revertir</Button>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleGuardarCambios}><Save className="mr-2 h-4 w-4" /> Guardar ({cambiosLocales.length})</Button>
                                        </>
                                    ) : (
                                        // TODO: Ajustar BotonEliminarProgramacion para rango si es necesario, o ocultarlo en modo rango
                                        <div />
                                    )}
                                    <Button variant="outline" size="sm" onClick={handleExportar}><FileSpreadsheet className="mr-2 h-4 w-4" /> Excel</Button>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 pb-40">
                                {!bannerIgnorado && fechaConflictoPersistente && (
                                    <BannerNecesidadRegenerar fechaCorte={fechaConflictoPersistente} mes={new Date(fechaInicio).getMonth() + 1} anio={new Date(fechaInicio).getFullYear()} programacionOriginal={programacionOriginal} areas={areas} modo="gestion" onSuccess={(res) => { refetch(); refetchNoAsignados(); refetchAlertas(); setBannerIgnorado(false); const afectadas = res?.fechasProcesadas || infoDias.filter(d => d.objetoFecha >= fechaConflictoPersistente).map(d => d.fechaISO); setFechasRecienGeneradas(afectadas); toast.success('Programación regenerada'); }} onIgnore={() => setBannerIgnorado(true)} />
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
                                                                                            <div key={idx} draggable={!esModoLectura} onDragStart={(e) => !esModoLectura && handleDragStart(e, asig, area.id_area, tId)} onClick={() => abrirModalNovedad(asig.id_empleado, asig.nombre_empleado || asig.empleado?.nombre_completo, dia.fechaISO)} className={cn("px-1 py-0.5 border rounded text-[9px] cursor-pointer shadow-sm bg-white truncate max-w-[95px]", asig._modificado && 'bg-amber-100 border-amber-400', tieneNovedad && 'border-red-500', esModoLectura && 'cursor-default opacity-90')}>
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

                            <div className="sticky bottom-0 z-40 bg-white border-t-2 border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4">
                                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <span>REFUERZOS DISPONIBLES</span>
                                    <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Arrastre al día deseado</span>
                                </h3>

                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {(() => {
                                        // 1. Consolidar empleados únicos y contar disponibilidad
                                        const consolidados = new Map<number, any>();

                                        infoDias.forEach(dia => {
                                            const poolDia = noAsignadosPorDia[dia.fechaISO] || [];
                                            // Aplicar los mismos filtros de visibilidad (ocultar si ya se movieron al grid)
                                            // Nota: La lógica de 'movidosAGridIds' es global para el render, 
                                            // pero aquí necesitamos saber si el empleado está disponible *en general* (al menos 1 día).

                                            poolDia.forEach((emp: any) => {
                                                if (!consolidados.has(emp.id_empleado)) {
                                                    consolidados.set(emp.id_empleado, { ...emp, _diasDisponibles: 0 });
                                                }
                                                const current = consolidados.get(emp.id_empleado);

                                                // Verificar si para ESTE día específico ya fue asignado visualmente (Anti-Robo visual)
                                                // Si ya lo moví al grid en ESTE día, no cuenta como disponible para este día
                                                const yaEnGridHoy = cambiosLocales.some(c =>
                                                    c.id_empleado === emp.id_empleado &&
                                                    c.fecha === dia.fechaISO &&
                                                    c.id_area_destino !== -1
                                                );

                                                if (!yaEnGridHoy) {
                                                    current._diasDisponibles++;
                                                }
                                            });
                                        });

                                        // 2. Convertir a array y filtrar los que ya no tienen días (porque se asignaron todos)
                                        const listaFinal = Array.from(consolidados.values())
                                            .filter(e => e._diasDisponibles > 0)
                                            .sort((a, b) => b._diasDisponibles - a._diasDisponibles); // Priorizar los que tienen más disponibilidad

                                        if (listaFinal.length === 0) {
                                            return <div className="text-xs text-slate-400 italic p-2">No hay personal disponible para refuerzos en este periodo.</div>;
                                        }

                                        return listaFinal.map(emp => (
                                            <div
                                                key={emp.id_empleado}
                                                draggable={!esModoLectura}
                                                onDragStart={(e) => !esModoLectura && handleDragStart(e, { ...emp, id_detalle_programacion: 0 }, -1, -1)}
                                                onClick={() => abrirModalNovedad(emp.id_empleado, emp.nombre_completo, infoDias[0]?.fechaISO)} // Usar primer día por defecto para el modal info
                                                className={cn(
                                                    "flex flex-col gap-1 min-w-[140px] max-w-[160px] p-2 border border-slate-200 rounded-md bg-white hover:border-indigo-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
                                                    esModoLectura && "cursor-default opacity-80"
                                                )}
                                            >
                                                <div className="flex justify-between items-start gap-1">
                                                    <span className="text-xs font-semibold text-slate-700 truncate" title={emp.nombre_completo}>
                                                        {emp.nombre_completo}
                                                    </span>
                                                    {(emp.horas_acumuladas !== undefined && emp.meta_periodo) && (
                                                        <span className={cn(
                                                            "text-[9px] font-bold px-1 rounded-sm ml-1",
                                                            emp.horas_acumuladas > emp.meta_periodo ? "bg-red-100 text-red-700" :
                                                                emp.horas_acumuladas < (emp.meta_periodo - 12) ? "bg-amber-100 text-amber-700" :
                                                                    "bg-green-100 text-green-700"
                                                        )} title="Horas acumuladas / Meta periodo">
                                                            {emp.horas_acumuladas} / {emp.meta_periodo}h
                                                        </span>
                                                    )}
                                                    <span className="flex items-center justify-center bg-indigo-50 text-indigo-700 text-[9px] font-bold h-4 min-w-[1rem] px-1 rounded-full border border-indigo-100" title="Días disponibles en este rango">
                                                        {emp._diasDisponibles}
                                                    </span>
                                                </div>

                                                {emp.areas && emp.areas.length > 0 && (
                                                    <div className="flex flex-wrap gap-0.5 mt-1 max-h-[32px] overflow-hidden">
                                                        {emp.areas.slice(0, 3).map((a: any) => ( // Max 3 badges visuales
                                                            <span key={a.id_area} className="px-1 text-[8px] rounded bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                                                {a.nombre_area}
                                                            </span>
                                                        ))}
                                                        {emp.areas.length > 3 && <span className="text-[8px] text-slate-400">+{emp.areas.length - 3}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </>
                    )}

                    {modalNovedadOpen && empleadoSeleccionado && (
                        <ModalNovedadRapida
                            isOpen={modalNovedadOpen}
                            onClose={() => setModalNovedadOpen(false)}
                            empleado={empleadoSeleccionado}
                            fechaSeleccionada={fechaParaNovedad || infoDias[0]?.fechaISO}
                            onSuccess={() => { refetch(); refetchNoAsignados(); refetchAlertas(); }}
                        />
                    )}

                    <ModalConfirmacionCambio
                        open={!!cambioPendiente}
                        onOpenChange={(open) => !open && setCambioPendiente(null)}
                        advertencias={advertenciasPendientes}
                        onConfirm={() => { if (cambioPendiente) { aplicarCambios(cambioPendiente); setCambioPendiente(null); setAdvertenciasPendientes([]); } }}
                    />
                </div>
            )}
        </div>
    );
}