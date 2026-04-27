import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { areasService, programacionService, consultasService, novedadesService, turnosService } from '@/services/api.service';
import { buildProgramacionWorkbook } from '@/utils/exportarExcel';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, LayoutDashboard, Info, UserSearch, ArrowRight, X, Loader2, FileSpreadsheet } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { parseISO, format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Area } from '@/types/api.types';

export default function Programacion() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hoy = new Date();

  // Params de URL para rango personalizado
  const pInicio = searchParams.get('fechaInicio');
  const pFin = searchParams.get('fechaFin');
  // Ajuste: Consideramos rango personalizado si AL MENOS UNO existe, para evitar saltos de UI
  const esRangoPersonalizado = !!(pInicio || pFin);

  const [mes] = useState(hoy.getMonth() + 1);
  const [anio] = useState(hoy.getFullYear());
  const [filtro, setFiltro] = useState('');
  const [areaFiltro, setAreaFiltro] = useState('TODAS');
  const [busquedaVista, setBusquedaVista] = useState('');

  // Persistir y restaurar rango desde localStorage
  useEffect(() => {
    if (!pInicio && !pFin) {
      const savedInicio = localStorage.getItem('prog_vista_fechaInicio');
      const savedFin = localStorage.getItem('prog_vista_fechaFin');
      if (savedInicio && savedFin) {
        setSearchParams({ fechaInicio: savedInicio, fechaFin: savedFin });
      }
    }
  }, []);

  useEffect(() => {
    if (pInicio && pFin) {
      localStorage.setItem('prog_vista_fechaInicio', pInicio);
      localStorage.setItem('prog_vista_fechaFin', pFin);
    }
  }, [pInicio, pFin]);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const { data: areasRaw } = useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: () => areasService.listar()
  });

  const areasMap = useMemo(() => {
    const map = new Map<number, string>();
    areasRaw?.forEach((a: Area) => map.set(a.id_area, a.nombre_area));
    return map;
  }, [areasRaw]);

  // Lógica de Fechas — ahora solo usa params de URL (rango manual)
  const fechaInicio = useMemo(() => pInicio ?? '', [pInicio]);
  const fechaFin = useMemo(() => pFin ?? '', [pFin]);

  const limparFiltros = () => {
    setSearchParams({});
    localStorage.removeItem('prog_vista_fechaInicio');
    localStorage.removeItem('prog_vista_fechaFin');
  };

  const { data: estadoValidacion, isLoading: loadingVal } = useQuery({

    queryKey: ['validacion-completa', fechaInicio, fechaFin],
    queryFn: () => programacionService.validarCompleto(fechaInicio, fechaFin),
    enabled: !!pInicio && !!pFin,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const { data: programacion = [], isLoading: loadingProg } = useQuery({
    queryKey: ['programacion-consolidado', fechaInicio, fechaFin],
    queryFn: async () => {
      // Evitar llamadas vacías
      if (!fechaInicio || !fechaFin) return [];

      // Carga incondicional de datos para vista consolidada
      const res = await programacionService.listarPorPeriodo(fechaInicio, fechaFin);
      return Array.isArray(res) ? res : (res.data || []);
    },
    enabled: !!pInicio && !!pFin,
    // enabled: !!estadoValidacion?.completo, // Deshabilitado el bloqueo
    staleTime: 0,
    refetchOnMount: 'always', // Forzar recarga al entrar
    refetchOnWindowFocus: true // Sincronizar al volver a la pestaña
  });

  const { data: novedadesData = [] } = useQuery({
    queryKey: ['novedades-lectura', fechaInicio, fechaFin],
    queryFn: () => consultasService.obtenerNovedadesCompletas({
      inicio: fechaInicio,
      fin: fechaFin
    }),
    enabled: !!pInicio && !!pFin
  });

  const { data: tiposNovedadData } = useQuery({
    queryKey: ['tipos-novedades'],
    queryFn: () => novedadesService.listarTipos(),
    staleTime: 60_000
  });

  const { data: turnosRaw } = useQuery({
    queryKey: ['turnos'],
    queryFn: () => turnosService.listar({ estado: true })
  });

  const turnos = useMemo(() => {
    if (!turnosRaw) return [];
    // @ts-ignore
    return turnosRaw.filter(t => ![1, 2, 3].includes(t.id_turno));
  }, [turnosRaw]);

  const { tiposNovedadMap, leyendaTipos } = useMemo(() => {
    const map = new Map<string, any>();
    const leyenda: any[] = [];
    if (!tiposNovedadData) return { tiposNovedadMap: map, leyendaTipos: leyenda };

    const PALETAS = [
      { color: 'bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800' },
      { color: 'bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800' },
      { color: 'bg-rose-200 text-rose-900 border-rose-300 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800' },
      { color: 'bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800' },
      { color: 'bg-violet-200 text-violet-900 border-violet-300 dark:bg-violet-900/50 dark:text-violet-300 dark:border-violet-800' },
      { color: 'bg-pink-200 text-pink-900 border-pink-300 dark:bg-pink-900/50 dark:text-pink-300 dark:border-pink-800' },
      { color: 'bg-cyan-200 text-cyan-900 border-cyan-300 dark:bg-cyan-900/50 dark:text-cyan-300 dark:border-cyan-800' },
      { color: 'bg-slate-800 text-white border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800' },
    ];

    tiposNovedadData.forEach((t: any, index: number) => {
      const paleta = PALETAS[index % PALETAS.length];
      const code = t.codigo || t.nombre_novedad.substring(0, 3).toUpperCase();
      const obj = {
        label: code,
        color: paleta.color,
        full: t.nombre_novedad,
        id_tipo: t.id_novedad_tipo
      };
      map.set(code, obj);
      map.set(t.id_novedad_tipo.toString(), obj);
      leyenda.push(obj);
    });
    return { tiposNovedadMap: map, leyendaTipos: leyenda };
  }, [tiposNovedadData]);

  const diasDelRango = useMemo(() => {
    if (!fechaInicio || !fechaFin) return [];

    // Validación básica de formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)) {
      return [];
    }

    try {
      // Calcular días dinámicamente
      // Ajuste: Crear fechas a mediodía para evitar saltos de zona horaria al iterar
      const start = parseISO(fechaInicio);
      const end = parseISO(fechaFin);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

      const dias = [];
      let current = start;

      // Limite de seguridad (ej. max 60 días para evitar loop infinito)
      let safeGuard = 0;
      while (current <= end && safeGuard < 62) {
        dias.push({
          dia: current.getDate(),
          fechaISO: current.toISOString().split('T')[0],
          nombre: format(current, 'EEE', { locale: es }).toUpperCase().replace('.', ''),
          mesNombre: format(current, 'MMM', { locale: es }).toUpperCase().replace('.', ''),
          esFinDeSemana: current.getDay() === 0 || current.getDay() === 6
        });
        current = addDays(current, 1);
        safeGuard++;
      }
      return dias;
    } catch (e) {
      console.error('Error generando días:', e);
      return [];
    }
  }, [fechaInicio, fechaFin]);

  const datosProcesados = useMemo(() => {
    const empleadosMap: Record<number, {
      id_empleado: number,
      nombre: string,
      cedula: string,
      dias: Record<string, any>
    }> = {};

    programacion.forEach((asig: any) => {
      const idEmp = Number(asig.id_empleado);
      const fecha = asig.fecha.split('T')[0];
      const idArea = Number(asig.id_area);
      const nombreArea = areasMap.get(idArea) || 'General';
      // Abbreviation: up to 8 chars for better readability
      const abreviacionArea = nombreArea.substring(0, 8).trimEnd();
      const esRefuerzo = !asig.turno?.hora_entrada;

      if (!empleadosMap[idEmp]) {
        empleadosMap[idEmp] = {
          id_empleado: idEmp,
          nombre: asig.nombre_empleado || asig.empleado?.nombre_completo || 'Empleado',
          cedula: asig.cedula_empleado || asig.empleado?.cedula || '',
          dias: {},
          // @ts-ignore
          descansosRaw: asig.empleado?.descansos || [],
          // @ts-ignore
          areaIds: new Set<number>(),
          // @ts-ignore
          areaDays: new Map<number, number>(),
        };
      }

      // Registrar área en el set del empleado
      // @ts-ignore
      if (idArea) empleadosMap[idEmp].areaIds.add(idArea);
      // Contar días por área para determinar área dominante
      // @ts-ignore
      const areaDays: Map<number, number> = empleadosMap[idEmp].areaDays;
      // @ts-ignore
      areaDays.set(idArea, (areaDays.get(idArea) || 0) + 1);

      // Asegurarnos de tener los descansos si vienen en esta iteración
      if (asig.empleado?.descansos && (!empleadosMap[idEmp].dias['descansosRaw'])) {
        // @ts-ignore
        empleadosMap[idEmp].descansosRaw = asig.empleado.descansos;
      }

      let horaFormateada = 'Sin horario';
      let esReal = false;
      
      const hsEntrada = asig.hora_entrada_real || asig.turno?.hora_entrada;
      const hsSalida = asig.hora_salida_real || asig.turno?.hora_salida;
      
      if (!esRefuerzo && hsEntrada) {
        if (asig.hora_entrada_real || asig.hora_salida_real) esReal = true;
        
        const entrada = hsEntrada.includes('T') ? hsEntrada.split('T')[1] : hsEntrada;
        const salida = hsSalida?.includes('T') ? hsSalida.split('T')[1] : hsSalida;
        horaFormateada = `${entrada.substring(0, 5)} - ${salida?.substring(0, 5) || '??'}`;
        
        if (asig.turno?.hora_entrada_2 && asig.turno?.hora_salida_2) {
          const ent2 = asig.turno.hora_entrada_2.includes('T') ? asig.turno.hora_entrada_2.split('T')[1] : asig.turno.hora_entrada_2;
          const sal2 = asig.turno.hora_salida_2.includes('T') ? asig.turno.hora_salida_2.split('T')[1] : asig.turno.hora_salida_2;
          horaFormateada += ` \n ${ent2.substring(0,5)} - ${sal2.substring(0,5)}`;
        }
        
        if (esReal) horaFormateada = `🔴 ${horaFormateada} (Modificado)`;
      }

      let diasDescanso: number[] = [];
      const descansos = asig.empleado?.descansos || [];
      if (descansos.length > 0) {
        // Encontrar descanso del mes correspondiente a la fecha
        const dateObj = new Date(fecha);
        const y = dateObj.getUTCFullYear();
        const m = dateObj.getUTCMonth() + 1;
        const descMes = descansos.find((d: any) => d.anio === y && d.mes === m);
        if (descMes) {
          try {
            diasDescanso = Array.isArray(descMes.dias_descanso) ? descMes.dias_descanso : JSON.parse(descMes.dias_descanso as string);
            // console.log(`[DEBUG] Descansos found for ${idEmp}:`, diasDescanso);
          } catch (e) {
            console.error('[DEBUG] Error parsing descansos:', e);
            diasDescanso = [];
          }
        }
      }

      // Si es un día marcado como DESCANSO en la configuración, NO es turno ni refuerzo
      const dateObj = new Date(fecha);
      const diaNumero = dateObj.getUTCDate();
      const esDescanso = diasDescanso.includes(diaNumero);

      if (esDescanso) {
        empleadosMap[idEmp].dias[fecha] = {
          tipo: 'DESCANSO',
          valor: 'DES',
          estilo: 'bg-indigo-100 text-indigo-800 border-indigo-200 font-bold opacity-60',
          detalle: 'Descanso Programado',
          subvalor: ''
        };
      } else {
        empleadosMap[idEmp].dias[fecha] = {
          tipo: 'TURNO',
          id_area: idArea,
          valor: esRefuerzo ? 'LIBRE' : (asig.turno?.tipo_turno || 'T?'),
          subvalor: abreviacionArea,
          areaCompleta: nombreArea,
          detalle: esRefuerzo ? 'Disponible / Sin Turno' : asig.turno?.tipo_turno,
          hora: horaFormateada,
          esModificado: !!(asig.hora_entrada_real || asig.hora_salida_real),
          estilo: esRefuerzo
            ? 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold'
            : (asig.hora_entrada_real || asig.hora_salida_real) ? 'bg-red-50 hover:bg-rose-100 text-rose-900 border-rose-300 shadow-sm' : 'bg-white hover:bg-indigo-50 text-indigo-900 border-slate-200'
        };
      }
    });

    const listaNovedades = Array.isArray(novedadesData) ? novedadesData : (novedadesData.novedades || []);
    listaNovedades.forEach((nov: any) => {
      if (!empleadosMap[nov.id_empleado]) {
        empleadosMap[nov.id_empleado] = {
          id_empleado: nov.id_empleado,
          nombre: nov.nombre_completo || (nov.empleado ? `${nov.empleado.nombre1} ${nov.empleado.apellido1}` : 'Empleado'),
          cedula: nov.cedula || nov.cedula_empleado || '',
          dias: {},
          // @ts-ignore
          areaIds: new Set<number>()
        };
      }

      const fecha = nov.fecha?.split('T')[0];
      if (fecha) {
        const tipoId = nov.id_novedad_tipo?.toString();
        const tipoNov = tiposNovedadMap.get(tipoId) || tiposNovedadMap.get(nov.codigo_novedad) || { label: 'NOV', color: 'bg-slate-200 text-slate-900 border-slate-300', full: nov.tipo || 'Novedad' };

        empleadosMap[nov.id_empleado].dias[fecha] = {
          tipo: 'NOVEDAD',
          valor: tipoNov.label,
          estilo: tipoNov.color,
          detalle: tipoNov.full,
          subvalor: ''
        };
      }
    });

    let resultado = Object.values(empleadosMap);

    // Filtro por empleado seleccionado (id_empleado como string)
    if (filtro.trim()) {
      resultado = resultado.filter(e => e.id_empleado.toString() === filtro);
    }

    // Filtro de Área — inclusivo: si trabajó al menos 1 día en esta área
    if (areaFiltro !== 'TODAS') {
      const idAreaBuscado = Number(areaFiltro);
      resultado = resultado.filter(e => {
        // @ts-ignore
        return e.areaIds && e.areaIds.has(idAreaBuscado);
      });
    }

    return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [programacion, novedadesData, areasMap, filtro, areaFiltro, tiposNovedadMap]);

  const handleExportar = async () => {
    if (!fechaInicio || !fechaFin || programacion.length === 0 || !areasRaw) return;

    // 1. Filtrar áreas si hay un área seleccionada en la UI
    const areasParaExportar = areaFiltro !== 'TODAS'
      ? areasRaw.filter(a => a.id_area === Number(areaFiltro))
      : areasRaw;

    // 2. Filtrar programación para incluir solo a los empleados que pasaron el filtro de UI (texto/búsqueda)
    // @ts-ignore
    const empIdsPermitidos = new Set(datosProcesados.map(e => e.id_empleado));
    const progParaExportar = programacion.filter((p: any) => empIdsPermitidos.has(Number(p.id_empleado)));

    const infoDias = diasDelRango.map(d => ({
      fechaISO: d.fechaISO,
      numero: d.dia,
      nombreDia: d.nombre,
      esFestivo: false,
    }));

    const wb = await buildProgramacionWorkbook({
      areas: areasParaExportar,
      turnos,
      infoDias,
      programacion: progParaExportar
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horario_${fechaInicio}_al_${fechaFin}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingVal || (estadoValidacion?.completo && loadingProg)) {
    return (
      <div className="py-20 text-center text-slate-400 text-xl flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        Verificando estado de la programación...
      </div>
    );
  }

  // BLOQUEO: Si hay huecos, mostrar advertencia y botón a gestión
  // BLOQUEO ELIMINADO: Se permite ver la tabla aunque falten turnos
  /*
  if (estadoValidacion && !estadoValidacion.completo) {
    return (
       ...
    );
  }
  */

  return (
    <div className="space-y-6 max-w-full mx-auto pb-20 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Programación de Turnos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {esRangoPersonalizado
              ? `Vista personalizada: ${fechaInicio} al ${fechaFin}`
              : 'Vista consolidada de asignaciones y novedades.'
            }
          </p>
        </div>


        {/* Controles Agrupados para evitar saltos de layout */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {/* Selector de Rango Manual */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border dark:border-slate-700 shadow-sm">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold px-1">RANGO</span>
            <Input
              type="date"
              className="w-auto h-8 text-xs dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
              value={pInicio || ''}
              onChange={(e) => {
                const params: any = {};
                if (e.target.value) params.fechaInicio = e.target.value;
                if (pFin) params.fechaFin = pFin;
                setSearchParams(params);
              }}
            />
            <span className="text-slate-300 dark:text-slate-600">-</span>
            <Input
              type="date"
              className="w-auto h-8 text-xs dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
              value={pFin || ''}
              onChange={(e) => {
                const params: any = {};
                if (pInicio) params.fechaInicio = pInicio;
                if (e.target.value) params.fechaFin = e.target.value;
                setSearchParams(params);
              }}
            />
            {(pInicio || pFin) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-400 hover:text-rose-500"
                onClick={limparFiltros}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border dark:border-slate-700 shadow-sm">
            <Select value={areaFiltro} onValueChange={setAreaFiltro}>
              <SelectTrigger className="w-full sm:w-[180px] h-8 text-xs bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 dark:text-slate-200">
                <SelectValue placeholder="Todas las Áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS" className="font-bold text-slate-700">Todas las Áreas</SelectItem>
                {areasRaw?.map(a => (
                  <SelectItem key={a.id_area} value={a.id_area.toString()}>{a.nombre_area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => navigate(`/gestion-mensual?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)}
            variant="outline"
            className="font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Gestionar
          </Button>
          
          <Button
            onClick={handleExportar}
            disabled={programacion.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold text-white"
          >
            <FileSpreadsheet className="mr-2 h-5 w-5" />
            Exportar Excel
          </Button>
        </div>
      </div>


      {
        programacion.length > 0 && (
          <div className="max-w-sm">
            <Select
              value={filtro || ""}
              onValueChange={(v) => {
                setFiltro(v === "__TODOS__" ? '' : v);
                setBusquedaVista('');
              }}
            >
              <SelectTrigger className="h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-200">
                <SelectValue placeholder="Buscar colaborador..." />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                <div
                  className="flex items-center px-3 pb-2 border-b dark:border-slate-700"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <UserSearch className="h-4 w-4 mr-2 text-slate-400" />
                  <input
                    className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                    placeholder="Escriba para filtrar..."
                    value={busquedaVista}
                    onChange={(e) => setBusquedaVista(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto mt-1 p-1">
                  <SelectItem value="__TODOS__" className="py-2 font-medium text-slate-500 italic">
                    Todos los colaboradores
                  </SelectItem>
                  {datosProcesados
                    .filter((e: any) => {
                      if (!busquedaVista.trim()) return true;
                      const term = busquedaVista.toLowerCase();
                      return e.nombre.toLowerCase().includes(term) || e.cedula.includes(term);
                    })
                    .map((e: any) => (
                      <SelectItem key={e.id_empleado} value={e.id_empleado.toString()} className="py-2.5">
                        <span className="font-bold uppercase text-xs">{e.nombre}</span>
                        <span className="ml-2 text-indigo-600 font-mono text-xs">[{e.cedula}]</span>
                      </SelectItem>
                    ))
                  }
                </div>
              </SelectContent>
            </Select>
          </div>
        )
      }

      {(!pInicio || !pFin) ? (
        <Card className="border-dashed dark:border-slate-700 py-20 text-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex justify-center mb-6">
            <CalendarDays className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-medium text-slate-700 dark:text-slate-400">Seleccione un rango de fechas</h3>
          <p className="text-slate-400 dark:text-slate-500 max-w-md mx-auto mt-2 text-base">
            Ingrese las fechas de inicio y fin en el selector de rango para visualizar la programación.
          </p>
        </Card>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 rounded-lg p-4 flex gap-3 items-start">
          <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div>
            <h5 className="font-bold text-blue-700 dark:text-blue-400 text-base mb-1">Modo Lectura</h5>
            <p className="text-blue-600/90 dark:text-blue-300/90 text-sm">
              Vista consolidada. Pase el mouse sobre las casillas para ver detalles del turno y el área asignada.
            </p>
          </div>
        </div>
      )}

      {(pInicio && pFin) && (
        loadingProg ? (
          <div className="py-20 text-center text-slate-400 text-xl flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            Cargando datos frescos...
          </div>
        ) : programacion.length === 0 ? (
          <Card className="border-dashed dark:border-slate-700 py-16 text-center bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex justify-center mb-6">
              <CalendarDays className="h-16 w-16 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 dark:text-slate-300">Sin programación generada</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 text-lg mb-6">
              No hay turnos asignados para {esRangoPersonalizado ? `${fechaInicio} al ${fechaFin}` : `${meses[mes - 1]} ${anio}`}.
            </p>
            <Button variant="outline" onClick={() => navigate('/programacion-areas')}>
              Ir a Generar Programación <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        ) : (
          <div className="border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-base">Personal Programado</span>
              <Badge variant="secondary" className="bg-slate-700 dark:bg-slate-800 text-slate-100 dark:text-slate-300 border-0">
                {datosProcesados.length} Colaboradores
              </Badge>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-220px)] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-30 shadow-sm">
                  <tr>
                    <th className="sticky left-0 top-0 z-40 bg-slate-50 dark:bg-slate-900 border-b border-r dark:border-slate-700 p-4 text-left w-64 font-bold text-slate-700 dark:text-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">
                      COLABORADOR
                    </th>
                    {diasDelRango.map(dia => (
                      <th key={dia.fechaISO} className={cn(
                        "sticky top-0 z-30 border-b border-r dark:border-slate-700 min-w-[56px] p-2 text-center font-medium",
                        dia.esFinDeSemana ? "bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold">{dia.nombre}</span>
                          <span className={cn("text-base font-bold", dia.esFinDeSemana && "text-slate-400 dark:text-slate-500")}>{dia.dia}</span>
                          {/* Mostrar mes si es rango multi-mes */}
                          {esRangoPersonalizado && <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">{dia.mesNombre}</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datosProcesados.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 border-r border-b dark:border-slate-700 px-4 py-3 font-medium text-slate-700 dark:text-slate-300 truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-col">
                          <span className="truncate text-sm font-bold">{emp.nombre}</span>
                          {emp.cedula && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{emp.cedula}</span>}
                        </div>
                      </td>
                      {diasDelRango.map(dia => {
                        let infoDia = emp.dias[dia.fechaISO];

                        // Si no hay info (hueco), verificar si es DESCANSO
                        if (!infoDia) {
                          let diasDescanso: number[] = [];
                          const dateObj = new Date(dia.fechaISO + 'T12:00:00');
                          const y = dateObj.getFullYear();
                          const m = dateObj.getMonth() + 1;
                          const diaNumero = dateObj.getDate();
                          // @ts-ignore
                          const descansos = emp.descansosRaw || [];
                          const descMes = descansos.find((d: any) => d.anio === y && d.mes === m);
                          if (descMes) {
                            try { diasDescanso = Array.isArray(descMes.dias_descanso) ? descMes.dias_descanso : JSON.parse(descMes.dias_descanso as string); } catch { diasDescanso = []; }
                          }
                          if (diasDescanso.includes(diaNumero)) {
                            infoDia = {
                              tipo: 'DESCANSO',
                              valor: 'DES',
                              estilo: 'bg-indigo-100/50 text-indigo-800 border-indigo-200 font-bold opacity-60',
                              detalle: 'Descanso Programado',
                              subvalor: ''
                            };
                          }
                        }

                        if (!infoDia) {
                          infoDia = { type: 'REFUERZO_DEFAULT', valor: 'LIBRE', estilo: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold', detalle: 'Disponible / Sin Turno', subvalor: '' };
                        }
                        
                        // Filtro Estricto de Área
                        const idAreaFiltro = areaFiltro !== 'TODAS' ? Number(areaFiltro) : null;
                        if (idAreaFiltro && infoDia.tipo === 'TURNO' && infoDia.id_area !== idAreaFiltro) {
                            // Turno de OTRA área cuando estamos filtrando, se oculta
                            return (
                                <td key={dia.fechaISO} className={cn("border-r border-b dark:border-slate-700 p-0 text-center h-[70px] w-14 relative group", dia.esFinDeSemana ? "bg-slate-50/50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800")}>
                                    <div className="w-full h-full flex flex-col items-center justify-center transition-all p-1 bg-white dark:bg-slate-800 border dark:border-slate-700 cursor-default">
                                    </div>
                                </td>
                            );
                        }

                        // Color base (sin arcoíris)
                        let bgColorClass = 'bg-white dark:bg-slate-800';
                        if (infoDia.tipo === 'DESCANSO') bgColorClass = 'bg-indigo-50/50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 font-bold opacity-60 cursor-default';
                        else if (infoDia.valor === 'LIBRE') bgColorClass = 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold cursor-default';
                        else if (infoDia.tipo === 'NOVEDAD') bgColorClass = infoDia.estilo; // RESTAURAR ESTILO DE NOVEDAD
                        else if (infoDia.tipo === 'TURNO') bgColorClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border-2 dark:border-slate-600';

                        return (
                          <td key={dia.fechaISO} className={cn("border-r border-b dark:border-slate-700 p-0 text-center h-[70px] w-14 relative group", dia.esFinDeSemana ? "bg-slate-50/50 dark:bg-slate-800/50" : "bg-white dark:bg-slate-800")}>
                            <div className={cn("w-full h-full flex flex-col items-center justify-center transition-all p-1 border dark:border-slate-700", bgColorClass)}>
                              
                              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-2 w-max max-w-[220px] bg-slate-900 text-white p-3 rounded-lg shadow-2xl pointer-events-none">
                                <div className="text-base font-bold mb-1">{infoDia.detalle}</div>
                                {infoDia.tipo === 'TURNO' && (
                                  <>
                                    <div className="text-sm font-medium text-slate-200">Horario: {infoDia.hora}</div>
                                    <div className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{infoDia.areaCompleta}</div>
                                  </>
                                )}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                              </div>

                              <span className={cn("font-black leading-tight max-w-full px-1", infoDia.valor === 'LIBRE' || infoDia.valor === 'DES' ? 'text-[11px]' : 'text-[13px]')}>{infoDia.valor}</span>
                              {infoDia.tipo === 'TURNO' && infoDia.areaCompleta && infoDia.valor !== 'LIBRE' && (
                                <span className="text-[8px] font-bold opacity-80 leading-tight mt-0.5 max-w-[95%] text-center break-words line-clamp-2">
                                  {infoDia.areaCompleta}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}


      <div className="flex flex-col gap-4 pt-8 border-t dark:border-slate-700">
        <div className="flex flex-wrap gap-4 justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <span className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">LIBRE</span> Disponible
          </div>
          {leyendaTipos.map(tipo => (
            <div key={tipo.label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <span className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border", tipo.color)}>{tipo.label}</span> {tipo.full}
            </div>
          ))}
        </div>
      </div>
    </div >
  );
}
