import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { programacionService, parametrizacionService, turnosService, consultasService, recargosService, empleadosService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CalendarDays, FileSpreadsheet, Loader2, Calculator, Info, FileText, Search, Users, Save, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  calcularPeriodo,
  fmtH,
  PARAMETROS_DEFAULT,
} from '@/utils/calculadoraRecargos';
import { FestivosColombia } from '@/utils/FestivosColombia';
import { exportarRecargosExcel, exportarRecargosPDF } from '@/utils/exportadorRecargos';
import type { TurnoParaCalculo } from '@/utils/calculadoraRecargos';
import type { EmpleadoCompleto, Turno } from '@/types/api.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { ModalAjusteHoras } from '@/utils/ModalAjusteHoras';
import { PencilLine } from 'lucide-react';

const extraerHora = (hora: string | null | undefined): string => {
  if (!hora) return '';
  if (hora.includes('T')) {
    const parteHora = hora.split('T')[1];
    if (parteHora) return parteHora.substring(0, 5);
  }
  return hora.substring(0, 5);
};

// Columnas de recargos para la tabla
const COLS = [
  { key: 'D', label: 'D', title: 'Dominicales Diurnos', color: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' },
  { key: 'F', label: 'F', title: 'Festivos Diurnos', color: 'text-orange-700 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50' },
  { key: 'RNO', label: 'R N O', title: 'Recargo Nocturno Ordinario', color: 'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50' },
  { key: 'RNF', label: 'R N F', title: 'Recargo Nocturno Festivo', color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50' },
  { key: 'HEOD', label: 'HEOD', title: 'H. Extra Ordinaria Diurna', color: 'text-rose-700 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50' },
  { key: 'HEON', label: 'HEON', title: 'H. Extra Ordinaria Nocturna', color: 'text-rose-700 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50' },
  { key: 'HEFD', label: 'HEFD', title: 'H. Extra Festiva Diurna', color: 'text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50' },
  { key: 'HEFN', label: 'HEFN', title: 'H. Extra Festiva Nocturna', color: 'text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50' },
  { key: 'thl', label: 'THL', title: 'Total Horas Laboradas', color: 'text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50 font-bold' },
] as const;

type ColKey = typeof COLS[number]['key'];

export default function ReporteRecargos() {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [empSeleccionado, setEmpSeleccionado] = useState<EmpleadoCompleto | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [modalHorasOpen, setModalHorasOpen] = useState(false);
  const [asignacionAjuste, setAsignacionAjuste] = useState<any | null>(null);

  // ─── PARÁMETROS DE CONFIGURACIÓN ───────────────────────────────────────────
  const { data: dataNocturna } = useQuery({
    queryKey: ['parametro-inicio-nocturna'],
    queryFn: () => parametrizacionService.obtener('HORA_INICIO_NOCTURNA'),
    staleTime: 60_000,
  });
  const { data: dataMaxExtras } = useQuery({
    queryKey: ['parametro-maximo-extras'],
    queryFn: () => parametrizacionService.obtener('MAXIMO_HORAS_EXTRAS'),
    staleTime: 60_000,
  });
  const { data: dataMeta } = useQuery({
    queryKey: ['parametro-meta-horas'],
    queryFn: () => parametrizacionService.obtener('META_HORAS_PERIODO'),
    staleTime: 60_000,
  });

  const parametros = useMemo(() => ({
    horaInicioNocturna: dataNocturna?.horas_maximas !== undefined ? Number(dataNocturna.horas_maximas) : PARAMETROS_DEFAULT.horaInicioNocturna,
    horaFinNocturna: PARAMETROS_DEFAULT.horaFinNocturna,
    maximoHorasExtras: dataMaxExtras?.horas_maximas !== undefined ? Number(dataMaxExtras.horas_maximas) : PARAMETROS_DEFAULT.maximoHorasExtras,
  }), [dataNocturna, dataMaxExtras]);

  const metaHoras = dataMeta?.horas_maximas !== undefined ? Number(dataMeta.horas_maximas) : 192;

  // ─── EMPLEADOS ──────────────────────────────────────────────────────────────
  const { data: empData } = useQuery({
    queryKey: ['empleados-para-recargos'],
    queryFn: () => consultasService.obtenerEmpleadosCompletos({ estado: true, limit: 500 }),
    staleTime: 300_000,
  });
  const empleados: EmpleadoCompleto[] = empData?.empleados || [];

  const empleadosFiltrados = useMemo(() => {
    const term = (busqueda || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!term) return empleados;
    return empleados.filter(e => {
      const nombre = (e.nombre_completo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cedula = (e.cedula || '').toLowerCase();
      return nombre.includes(term) || cedula.includes(term);
    });
  }, [empleados, busqueda]);

  // ─── TURNOS CATÁLOGO ────────────────────────────────────────────────────────
  const { data: turnosCatalogo = [] } = useQuery<Turno[]>({
    queryKey: ['turnos-catalogo'],
    queryFn: () => turnosService.listar(),
    staleTime: 300_000,
  });

  const turnoMap = useMemo(() => {
    const m = new Map<number, Turno>();
    turnosCatalogo.forEach(t => m.set(t.id_turno, t));
    return m;
  }, [turnosCatalogo]);

  // ─── PROGRAMACIÓN DEL PERIODO ───────────────────────────────────────────────
  const { data: progData = [], isLoading: cargandoProg, refetch: refetchProg } = useQuery({
    queryKey: ['programacion-recargos', fechaInicio, fechaFin],
    queryFn: async () => {
      const res = await programacionService.listarPorPeriodo(fechaInicio, fechaFin);
      return Array.isArray(res) ? res : (res.data || []);
    },
    enabled: !!fechaInicio && !!fechaFin,
    staleTime: 0,
  });

  // ─── DETALLE DEL EMPLEADO SELECCIONADO (con edad y sexo desde BD) ─────────
  const { data: detalleEmp } = useQuery({
    queryKey: ['empleado-detalle-recargos', empSeleccionado?.id_empleado],
    queryFn: () => empleadosService.obtener(empSeleccionado!.id_empleado),
    enabled: !!empSeleccionado,
    staleTime: 300_000,
  });

  // ─── NOVEDADES DEL PERIODO ──────────────────────────────────────────────────
  const { data: novedadesData = [] } = useQuery({
    queryKey: ['novedades-recargos', fechaInicio, fechaFin, empSeleccionado?.id_empleado],
    queryFn: async () => {
      const res = await consultasService.obtenerNovedadesCompletas({
        inicio: fechaInicio,
        fin: fechaFin,
        id_empleado: empSeleccionado!.id_empleado
      });
      return Array.isArray(res) ? res : (res.novedades || []);
    },
    enabled: !!fechaInicio && !!fechaFin && !!empSeleccionado,
    staleTime: 0,
  });

  // ─── PROCESADO DE DATOS ─────────────────────────────────────────────────────
  const { turnos: turnosFiltrados, empleadoInfo } = useMemo(() => {
    if (!empSeleccionado || !fechaInicio || !fechaFin) return { turnos: [], empleadoInfo: null };

    const turnosBrutos = progData.filter((d: any) => d.id_empleado === empSeleccionado.id_empleado);
    const turnosBrutosMap = new Map<string, any>();
    turnosBrutos.forEach((d: any) => {
        if (d.fecha) turnosBrutosMap.set(d.fecha.split('T')[0], d);
    });

    const novedadesMap = new Map<string, any>();
    novedadesData.forEach((n: any) => {
        if (n.fecha) novedadesMap.set(n.fecha.split('T')[0], n);
    });

    const turnos: TurnoParaCalculo[] = [];
    const start = new Date(`${fechaInicio}T12:00:00Z`);
    const end = new Date(`${fechaFin}T12:00:00Z`);

    let current = new Date(start);
    while (current <= end) {
        const fechaIso = current.toISOString().split('T')[0];
        const esDomingo = current.getUTCDay() === 0;
        const { esFestivo } = FestivosColombia.esFestivo(fechaIso);

        const d = turnosBrutosMap.get(fechaIso);
        
        if (d) {
            const catalogoTurno = turnoMap.get(d.id_turno);
            turnos.push({
                fecha: fechaIso,
                hora_entrada: extraerHora(d.hora_entrada_real || d.turno?.hora_entrada || catalogoTurno?.hora_entrada || d.hora_entrada),
                hora_salida: extraerHora(d.hora_salida_real || d.turno?.hora_salida || catalogoTurno?.hora_salida || d.hora_salida),
                hora_entrada_2: extraerHora(d.turno?.hora_entrada_2 || catalogoTurno?.hora_entrada_2),
                hora_salida_2: extraerHora(d.turno?.hora_salida_2 || catalogoTurno?.hora_salida_2),
                es_festivo: esFestivo,
                es_domingo: esDomingo,
                codigo_turno: d.turno?.tipo_turno || d.codigo_turno || catalogoTurno?.codigo || '',
                tipo_turno: d.turno?.tipo_turno || d.tipo_turno || catalogoTurno?.tipo_turno || '',
            });
        } else {
            const nov = novedadesMap.get(fechaIso);
            if (nov) {
                turnos.push({
                    fecha: fechaIso,
                    hora_entrada: '',
                    hora_salida: '',
                    es_festivo: esFestivo,
                    es_domingo: esDomingo,
                    codigo_turno: nov.codigo_novedad || 'NOV',
                    tipo_turno: nov.tipo || 'NOVEDAD'
                });
            } else {
                turnos.push({
                    fecha: fechaIso,
                    hora_entrada: '',
                    hora_salida: '',
                    es_festivo: esFestivo,
                    es_domingo: esDomingo,
                    codigo_turno: 'D',
                    tipo_turno: 'DESCANSO'
                });
            }
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }

    // Ordenar por fecha
    turnos.sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Enriquecer con los datos completos del empleado (edad, sexo)
    const infoCompleta = empSeleccionado
      ? {
          ...empSeleccionado,
          edad: detalleEmp?.edad ?? empSeleccionado.edad ?? null,
          sexo: detalleEmp?.sexo ?? empSeleccionado.sexo ?? null,
        }
      : null;

    return {
      turnos,
      empleadoInfo: infoCompleta,
    };
  }, [empSeleccionado, progData, turnoMap, detalleEmp]);

  // Motor de cálculo de recargos
  const { filas, totales } = useMemo(() =>
    calcularPeriodo(turnosFiltrados, metaHoras, parametros),
    [turnosFiltrados, metaHoras, parametros]
  );

  const [guardando, setGuardando] = useState(false);

  const handleGuardarMasivo = async () => {
    if (!empSeleccionado || !fechaInicio || !fechaFin || filas.length === 0) {
      toast.error('Datos incompletos para guardar los recargos', {
        description: 'Asegúrese de seleccionar un empleado y un periodo válido.'
      });
      return;
    }

    setGuardando(true);
    try {
      await recargosService.guardarMasivo({
        id_empleado: empSeleccionado.id_empleado,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        filas: filas
      });

      toast.success('Recargos guardados correctamente', {
        description: `Se han registrado los recargos de ${empSeleccionado.nombre_completo} en base de datos.`
      });
    } catch (error: any) {
      toast.error('Error al guardar recargos', {
        description: error?.response?.data?.error || error.message || 'Error desconocido'
      });
    } finally {
      setGuardando(false);
    }
  };

  /** Guarda automáticamente y luego ejecuta la acción indicada (export / print) */
  const ejecutarAccion = async (accion: () => void | Promise<void>) => {
    if (empSeleccionado && fechaInicio && fechaFin && filas.length > 0) {
        // Wait! We can safely disable auto-saving before print to avoid bugs if not needed.
    }
    await accion();
  };

  const handleAbrirAjuste = (fechaStr: string) => {
      if (!empSeleccionado) return;
      const asig = progData.find((p: any) => p.id_empleado === empSeleccionado.id_empleado && p.fecha.startsWith(fechaStr));
      if (asig && asig.id_detalle_programacion) {
          setAsignacionAjuste(asig);
          setModalHorasOpen(true);
      } else {
          toast.info("No hay una asignación válida para este día para ajustar o es una novedad.");
      }
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header – oculto al imprimir */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
            Reporte de Horas y Recargos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Desglose de horas, dominicales, nocturnos y extras por empleado</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg px-3 py-2">
            <Calculator className="h-4 w-4 text-indigo-500" />
            <span>Inicio nocturno: <strong className="dark:text-slate-300">{parametros.horaInicioNocturna}:00</strong></span>
            <span className="mx-1">·</span>
            <span>Máx. extras: <strong className="dark:text-slate-300">{parametros.maximoHorasExtras}h</strong></span>
          </div>
          {empSeleccionado && filas.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                onClick={handleGuardarMasivo}
                disabled={guardando}
              >
                {guardando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar Recargos
              </Button>
              <Button variant="outline" className="bg-white" onClick={() => ejecutarAccion(() => exportarRecargosPDF({ empleadoInfo: empSeleccionado, fechaInicio, fechaFin, filas, totales, COLS: [...COLS] }))}>
                <FileText className="w-4 h-4 mr-2 text-red-500" />
                Exportar PDF
              </Button>
              <Button variant="outline" className="bg-white" onClick={() => ejecutarAccion(() => exportarRecargosExcel({ empleadoInfo: empSeleccionado, fechaInicio, fechaFin, filas, totales, COLS: [...COLS] }))}>
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Exportar Excel
              </Button>
              <Button variant="outline" className="bg-white" onClick={() => ejecutarAccion(() => { setTimeout(() => window.print(), 300); })}>
                <Printer className="w-4 h-4 mr-2 text-slate-600" />
                Imprimir
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros – ocultos al imprimir */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-700 dark:bg-slate-800 print:hidden">
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="md:col-span-1">
              <Label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-indigo-500" /> Colaborador
              </Label>
              <Select
                value={empSeleccionado?.id_empleado.toString() || ""}
                onValueChange={v => {
                  const emp = empleados.find((e: EmpleadoCompleto) => e.id_empleado.toString() === v);
                  if (emp) {
                    setEmpSeleccionado(emp);
                    setBusqueda('');
                  }
                }}
              >
                <SelectTrigger className="h-10 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 dark:text-slate-200">
                  <SelectValue placeholder="Seleccione un colaborador..." />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <div
                    className="flex items-center px-3 pb-2 border-b dark:border-slate-700"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Search className="h-4 w-4 mr-2 text-slate-400" />
                    <input
                      className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                      placeholder="Escriba para filtrar..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto mt-1 p-1">
                    {empleadosFiltrados.length > 0 ? (
                      empleadosFiltrados.map((e: EmpleadoCompleto) => (
                        <SelectItem
                          key={e.id_empleado}
                          value={e.id_empleado.toString()}
                          className="py-3"
                        >
                          <span className="font-bold uppercase text-xs">
                            {e.nombre_completo}
                          </span>
                          <span className="ml-2 text-indigo-600 font-mono text-xs">
                            [{e.cedula}]
                          </span>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="py-6 text-center text-sm text-slate-500 italic">
                        Sin resultados para "{busqueda}"
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>


        </CardContent>
      </Card>

      {/* Información de parámetros */}
      {!empSeleccionado && (
        <Card className="border-dashed dark:border-slate-700 py-20 text-center bg-slate-50/50 dark:bg-slate-800/30 print:hidden">
          <div className="flex justify-center mb-4">
            <CalendarDays className="h-14 w-14 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-400">Seleccione un empleado</h3>
          <p className="text-slate-400 dark:text-slate-500 max-w-md mx-auto mt-1 text-sm">
            Busque por nombre o cédula para ver el desglose de recargos en el periodo seleccionado.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {COLS.map(c => (
              <div key={c.key} className={cn("px-3 py-1.5 rounded-full text-xs font-bold border", c.color)}>
                {c.label} — {c.title}
              </div>
            ))}
          </div>
        </Card>
      )}

      {empSeleccionado && cargandoProg && (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3 print:hidden">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          Calculando recargos...
        </div>
      )}

      {empSeleccionado && !cargandoProg && (
        <>
          {/* Cabecera de empleado Excel */}
          <div className="bg-white border-2 border-slate-400 overflow-hidden mb-4">
            <table className="w-full text-sm font-sans border-collapse">
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-100 w-24">Cédula:</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold bg-slate-200 text-center">{empleadoInfo?.cedula}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-100 w-20">Cargo:</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold text-center" colSpan={3}>{empleadoInfo?.nombre_cargo}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-100 w-16">Edad:</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold text-center w-16">{empleadoInfo?.edad || '-'}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-100 w-16">Sexo:</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold text-center w-16">{empleadoInfo?.sexo || '-'}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-100" colSpan={3}>Nombres y apellidos:</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold text-center" colSpan={4}>{empleadoInfo?.nombre_completo}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-100 text-right">Salario</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold text-center w-32" colSpan={2}>
                    {Number(empleadoInfo?.salario_base).toLocaleString('es-CO')}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-[#a4d4a4]" colSpan={2}>Periodo desde:</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold text-center bg-white" colSpan={3}>
                    {fechaInicio ? format(new Date(fechaInicio + 'T12:00:00'), 'dd/MM/yyyy', { locale: es }) : ''}
                  </td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-[#a4d4a4] text-center" colSpan={2}>hasta:</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-semibold text-center bg-white" colSpan={3}>
                    {fechaFin ? format(new Date(fechaFin + 'T12:00:00'), 'dd/MM/yyyy', { locale: es }) : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabla de desglose */}
          <div className="overflow-x-auto bg-white border-2 border-slate-400 mb-8 print:overflow-visible">
            <table className="w-full border-collapse text-sm font-sans" id="tabla-reporte-recargos">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400">
                  <th className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-800 w-28">Fecha</th>
                  <th className="border border-slate-400 px-1 py-1.5 text-center font-bold text-slate-800 w-10">T</th>
                  <th className="border border-slate-400 px-2 py-1.5 text-center font-bold text-slate-800 w-36">Horario</th>
                  {COLS.map(c => (
                    <th key={c.key} title={c.title} className="border border-slate-400 px-1 py-1.5 text-center font-bold text-slate-800 h-8 whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  <th className="border border-slate-400 px-1 py-1.5 text-center font-bold text-slate-800 w-12">VHE</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => {
                  const esRojo = fila.diaSemana === 'Dom' || fila.esFestivo;
                  const colorDia = esRojo ? "text-red-600" : "text-slate-800";

                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="border border-slate-300 px-2 py-1">
                        <span className={cn("font-medium", colorDia)}>
                          {(fila.diaSemana || '').toLowerCase()} {(() => {
                            if (!fila.fecha) return '';
                            const d = new Date(fila.fecha + 'T12:00:00');
                            return isNaN(d.getTime()) ? '' : format(d, 'dd/MM/yyyy', { locale: es });
                          })()}
                        </span>
                      </td>
                      <td className={cn("border border-slate-300 px-1 py-1 text-center font-medium", esRojo && fila.codigoTurno !== 'D' ? "text-red-500" : "")}>
                        {fila.esDescanso ? "D" : fila.codigoTurno}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-center">
                        {fila.esDescanso
                          ? <span className="text-red-500 font-medium">Descansa</span>
                          : (
                              <button 
                                onClick={() => handleAbrirAjuste(fila.fecha)}
                                className="group flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 mx-auto font-mono text-xs hover:text-indigo-600 hover:bg-slate-100 px-2 py-0.5 rounded transition-all w-max"
                                title="Ajustar Horas Reales"
                              >
                                {fila.horario}
                                <PencilLine className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                              </button>
                            )
                        }
                      </td>
                      {COLS.map(c => {
                        const val = fila[c.key as ColKey] as number;
                        return (
                          <td key={c.key} className={cn("border border-slate-300 px-1 py-1 text-center", esRojo && val > 0 ? "text-red-500 font-semibold" : "text-slate-700")}>
                            {val > 0 ? fmtH(val) : ""}
                          </td>
                        );
                      })}
                      <td className="border border-slate-300 px-1 py-1 text-center text-slate-500">-</td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Fila de totales */}
              <tfoot>
                <tr>
                  <td className="border border-slate-400 bg-slate-100 px-2 py-1.5 font-bold uppercase text-right" colSpan={3}>
                    TOTAL
                  </td>
                  {COLS.map(c => {
                    const val = totales[c.key as ColKey] as number;
                    return (
                      <td key={c.key} className="border border-slate-400 bg-white px-1 py-1.5 text-center font-semibold text-slate-800">
                        {val > 0 ? fmtH(val) : ""}
                      </td>
                    );
                  })}
                  <td className="border border-slate-400 bg-white px-1 py-1.5 text-center"></td>
                </tr>
                {/* Fila de conversiones falsas en domingos/festivos, solo hardcodeado simulando el Excel */}
                <tr>
                  <td className="border-0 px-2 py-1.5" colSpan={3}></td>
                  {COLS.map(c => {
                    const val = totales[c.key as ColKey] as number;
                    // El usuario de excel convierte D y F dividiendo entre 8
                    let textoInferior = "";
                    if ((c.key === 'D' || c.key === 'F') && val > 0) {
                      textoInferior = (val / 8).toLocaleString('es-CO', { minimumFractionDigits: 2 });
                    }
                    return (
                      <td key={c.key} className="border-0 px-1 py-1.5 text-center text-slate-800">
                        {textoInferior}
                      </td>
                    );
                  })}
                  <td className="border-0 px-1 py-1.5 text-center"></td>
                </tr>
              </tfoot>
            </table>

            {/* Firmas en la parte inferior de la vista */}
            <div className="grid grid-cols-2 mt-20 mb-10 px-10 print:mt-3 print:mb-2">
              <div className="text-center">
                <div className="border-t-2 border-black mx-10 pt-1 font-bold">Coordinador Operativo</div>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-black mx-10 pt-1 font-bold">Funcionario</div>
              </div>
            </div>
          </div>

          {filas.length === 0 && (
            <div className="py-14 text-center text-slate-400">
              <Info className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>No se encontró programación para este empleado en el periodo seleccionado.</p>
            </div>
          )}

          {/* Resumen de totales en tarjetas – oculto al imprimir */}
          {filas.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 print:hidden">
              {COLS.filter(c => (totales[c.key as ColKey] as number) > 0).map(c => (
                <Card key={c.key} className={cn("border shadow-sm", c.color)}>
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-[11px] uppercase font-black opacity-70">{c.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    <div className="text-2xl font-black">{fmtH(totales[c.key as ColKey] as number)}</div>
                    <div className="text-[10px] opacity-60 font-medium">horas</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      
      <ModalAjusteHoras
          isOpen={modalHorasOpen}
          onClose={() => setModalHorasOpen(false)}
          asignacion={asignacionAjuste}
          onSuccess={() => { refetchProg(); }}
      />
    </div>
  );
}
