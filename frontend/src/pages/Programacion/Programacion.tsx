import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { areasService, programacionService, consultasService } from '@/services/api.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, LayoutDashboard, Info, UserSearch, ArrowRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Area } from '@/types/api.types';

const TIPOS_NOVEDAD: Record<string, { label: string, color: string, full: string }> = {
  'VAC': { label: 'VAC', color: 'bg-emerald-200 text-emerald-900 border-emerald-300', full: 'Vacaciones' },
  'INC': { label: 'INC', color: 'bg-rose-200 text-rose-900 border-rose-300', full: 'Incapacidad' },
  'LIC': { label: 'LIC', color: 'bg-amber-200 text-amber-900 border-amber-300', full: 'Licencia' },
  'SUS': { label: 'SUS', color: 'bg-slate-800 text-white border-slate-600', full: 'Suspensión' },
  'PER': { label: 'PER', color: 'bg-indigo-200 text-indigo-900 border-indigo-300', full: 'Permiso' },
  'DES': { label: 'DES', color: 'bg-blue-600 text-white border-blue-700', full: 'Descanso' }
};

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
  const [areaFiltro, setAreaFiltro] = useState<string>('TODAS');

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

  const diasDelRango = useMemo(() => {
    if (!fechaInicio || !fechaFin) return [];

    // Validación básica de formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)) {
      return [];
    }

    try {
      // Calcular días dinámicamente
      // Ajuste: Crear fechas a mediodía para evitar saltos de zona horaria al iterar
      const start = new Date(fechaInicio + 'T12:00:00');
      const end = new Date(fechaFin + 'T12:00:00');

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
      nombre: string,
      cedula: string,
      dias: Record<string, any>
    }> = {};

    programacion.forEach((asig: any) => {
      const idEmp = Number(asig.id_empleado);
      const fecha = asig.fecha.split('T')[0];
      const idArea = Number(asig.id_area);
      const nombreArea = areasMap.get(idArea) || 'General';
      const abreviacionArea = nombreArea.substring(0, 3).toUpperCase();
      const esRefuerzo = !asig.turno?.hora_entrada;

      if (!empleadosMap[idEmp]) {
        empleadosMap[idEmp] = {
          nombre: asig.nombre_empleado || asig.empleado?.nombre_completo || 'Empleado',
          cedula: asig.cedula_empleado || asig.empleado?.cedula || '',
          dias: {},
          // @ts-ignore
          descansosRaw: asig.empleado?.descansos || [],
          // @ts-ignore
          areaIds: new Set<number>()
        };
      }

      // Registrar área en el set del empleado
      // @ts-ignore
      if (idArea) empleadosMap[idEmp].areaIds.add(idArea);

      // Asegurarnos de tener los descansos si vienen en esta iteración
      if (asig.empleado?.descansos && (!empleadosMap[idEmp].dias['descansosRaw'])) {
        // @ts-ignore
        empleadosMap[idEmp].descansosRaw = asig.empleado.descansos;
      }

      let horaFormateada = 'Sin horario';
      if (!esRefuerzo && asig.turno?.hora_entrada) {
        const entrada = asig.turno.hora_entrada.includes('T') ? asig.turno.hora_entrada.split('T')[1] : asig.turno.hora_entrada;
        const salida = asig.turno.hora_salida?.includes('T') ? asig.turno.hora_salida.split('T')[1] : asig.turno.hora_salida;
        horaFormateada = `${entrada.substring(0, 5)} - ${salida?.substring(0, 5) || '??'}`;
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
          valor: esRefuerzo ? 'LIBRE' : (asig.turno?.tipo_turno || 'T?'),
          subvalor: abreviacionArea,
          areaCompleta: nombreArea,
          detalle: esRefuerzo ? 'Disponible / Sin Turno' : asig.turno?.tipo_turno,
          hora: horaFormateada,
          estilo: esRefuerzo
            ? 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold'
            : 'bg-white hover:bg-indigo-50 text-indigo-900 border-slate-200'
        };
      }
    });

    const listaNovedades = Array.isArray(novedadesData) ? novedadesData : (novedadesData.novedades || []);
    listaNovedades.forEach((nov: any) => {
      // Debug: Log nov being processed to ensure clean scope
      // console.log('Processing Novedad:', nov?.id_empleado);
      if (!empleadosMap[nov.id_empleado]) {
        empleadosMap[nov.id_empleado] = {
          nombre: nov.empleado ? `${nov.empleado.nombre1} ${nov.empleado.apellido1}` : (nov.nombre_completo || 'Empleado'),
          cedula: nov.cedula_empleado || '',
          dias: {}
        };
      }
      if (nov.detalle_novedad && Array.isArray(nov.detalle_novedad)) {
        nov.detalle_novedad.forEach((det: any) => {
          const fecha = det.fecha.split('T')[0];
          const tipoNov = TIPOS_NOVEDAD[nov.tipo_novedad?.codigo] || TIPOS_NOVEDAD['LIC'];
          empleadosMap[nov.id_empleado].dias[fecha] = {
            tipo: 'NOVEDAD',
            valor: tipoNov.label,
            estilo: tipoNov.color,
            detalle: tipoNov.full,
            subvalor: ''
          };
        });
      }
    });

    let resultado = Object.values(empleadosMap);

    // Filtro de Texto (Nombre/Cédula)
    if (filtro.trim()) {
      const s = filtro.toLowerCase();
      resultado = resultado.filter(e => e.nombre.toLowerCase().includes(s) || e.cedula.includes(s));
    }

    // Filtro de Área
    if (areaFiltro !== 'TODAS') {
      // Debemos filtrar por el área asignada en la mayoría de los días o alguna lógica
      // Como employees can move, filtering by area is tricky in a consolidated view.
      // But users usually want to see employees that belong to X area.
      // In this map, we store 'areaCompleta' in days. We don't have a main area per employee easily.
      // Let's rely on the area from the FIRST assignment found or most frequent?
      // Better: We can check if ANY day has this area.
      // Or better yet, we can capture the area from the initial loop.

      // Let's filter by checking if any day has the selected area abbreviation/name
      // or check against the 'id_area' from assignments.

      // Revised Strategy: Store 'areasIds' Set in employee object.
      resultado = resultado.filter(e => {
        // @ts-ignore
        return e.areaIds && e.areaIds.has(Number(areaFiltro));
      });
    }

    return resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [programacion, novedadesData, areasMap, filtro, areaFiltro]);

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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Programación de Turnos</h1>
          <p className="text-slate-500 text-lg">
            {esRangoPersonalizado
              ? `Vista personalizada: ${fechaInicio} al ${fechaFin}`
              : 'Vista consolidada de asignaciones y novedades.'
            }
          </p>
        </div>


        {/* Controles Agrupados para evitar saltos de layout */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {/* Selector de Rango Manual */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <span className="text-xs text-slate-400 font-bold px-1">RANGO</span>
            <Input
              type="date"
              className="w-auto h-8 text-xs"
              value={pInicio || ''}
              onChange={(e) => {
                const params: any = {};
                if (e.target.value) params.fechaInicio = e.target.value;
                if (pFin) params.fechaFin = pFin;
                setSearchParams(params);
              }}
            />
            <span className="text-slate-300">-</span>
            <Input
              type="date"
              className="w-auto h-8 text-xs"
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

          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <Select value={areaFiltro} onValueChange={setAreaFiltro}>
              <SelectTrigger className="w-[180px] border-none shadow-none font-medium h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas las Areas</SelectItem>
                {areasRaw?.map(a => <SelectItem key={a.id_area} value={String(a.id_area)}>{a.nombre_area}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>



          <Button
            onClick={() => navigate(`/gestion-mensual?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`)}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold"
          >
            <LayoutDashboard className="mr-2 h-5 w-5" />
            Gestionar
          </Button>
        </div>
      </div>


      {
        programacion.length > 0 && (
          <div className="relative max-w-md">
            <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar colaborador..."
              className="pl-10 bg-white"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        )
      }

      {(!pInicio || !pFin) ? (
        <Card className="border-dashed py-20 text-center bg-slate-50/50">
          <div className="flex justify-center mb-6">
            <CalendarDays className="h-16 w-16 text-slate-300" />
          </div>
          <h3 className="text-xl font-medium text-slate-700">Seleccione un rango de fechas</h3>
          <p className="text-slate-400 max-w-md mx-auto mt-2 text-base">
            Ingrese las fechas de inicio y fin en el selector de rango para visualizar la programación.
          </p>
        </Card>
      ) : (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 flex gap-3 items-start">
          <Info className="h-6 w-6 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h5 className="font-bold text-blue-700 text-base mb-1">Modo Lectura</h5>
            <p className="text-blue-600/90 text-sm">
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
          <Card className="border-dashed py-16 text-center bg-slate-50/50">
            <div className="flex justify-center mb-6">
              <CalendarDays className="h-16 w-16 text-slate-300" />
            </div>
            <h3 className="text-xl font-medium text-slate-900">Sin programación generada</h3>
            <p className="text-slate-500 max-w-md mx-auto mt-2 text-lg mb-6">
              No hay turnos asignados para {esRangoPersonalizado ? `${fechaInicio} al ${fechaFin}` : `${meses[mes - 1]} ${anio}`}.
            </p>
            <Button variant="outline" onClick={() => navigate('/programacion-areas')}>
              Ir a Generar Programación <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        ) : (
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-base">Personal Programado</span>
              <Badge variant="secondary" className="bg-slate-700 text-slate-100 border-0">
                {datosProcesados.length} Colaboradores
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 bg-slate-50 border-b border-r p-4 text-left w-64 font-bold text-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-sm">
                      COLABORADOR
                    </th>
                    {diasDelRango.map(dia => (
                      <th key={dia.fechaISO} className={cn(
                        "border-b border-r min-w-[56px] p-2 text-center font-medium",
                        dia.esFinDeSemana ? "bg-slate-50 text-slate-500" : "bg-white text-slate-700"
                      )}>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase font-bold">{dia.nombre}</span>
                          <span className={cn("text-base font-bold", dia.esFinDeSemana && "text-slate-400")}>{dia.dia}</span>
                          {/* Mostrar mes si es rango multi-mes */}
                          {esRangoPersonalizado && <span className="text-[9px] text-slate-400 font-normal">{dia.mesNombre}</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datosProcesados.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white border-r border-b px-4 py-3 font-medium text-slate-700 truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex flex-col">
                          <span className="truncate text-sm font-bold">{emp.nombre}</span>
                          {emp.cedula && <span className="text-xs text-slate-400 font-mono">{emp.cedula}</span>}
                        </div>
                      </td>
                      {diasDelRango.map(dia => {
                        let infoDia = emp.dias[dia.fechaISO];

                        // Si no hay info (hueco), verificar si es DESCANSO
                        if (!infoDia) {
                          let diasDescanso: number[] = [];
                          // Debemos buscar en los datos crudos o guardar los descansos en el objeto empleado
                          // Como 'emp' es procesado, quizas perdimos la ref a 'descansos'. 
                          // Estrategia: Guardar descansos en el objeto procesado 'emp' tambien.

                          // Acceder a descansos RAW desde el mapa o el objeto emp original si es posible.
                          // En datosProcesados (memo), 'emp' es: {nombre, cedula, dias, descansosRaw?}. 
                          // Debemos asegurarnos que 'descansosRaw' pase.

                          // Asumiremos que hemos agregado 'descansosRaw' al objeto emp en el useMemo de arriba.
                          // (Ver editar useMemo a continuacion)
                          const dateObj = new Date(dia.fechaISO + 'T12:00:00');
                          const y = dateObj.getFullYear();
                          const m = dateObj.getMonth() + 1;
                          const diaNumero = dateObj.getDate();

                          // @ts-ignore
                          const descansos = emp.descansosRaw || [];
                          const descMes = descansos.find((d: any) => d.anio === y && d.mes === m);
                          if (descMes) {
                            try {
                              diasDescanso = Array.isArray(descMes.dias_descanso) ? descMes.dias_descanso : JSON.parse(descMes.dias_descanso as string);
                            } catch { diasDescanso = []; }
                          }

                          if (diasDescanso.includes(diaNumero)) {
                            infoDia = {
                              tipo: 'DESCANSO',
                              valor: 'DES',
                              estilo: 'bg-indigo-100 text-indigo-800 border-indigo-200 font-bold opacity-60',
                              detalle: 'Descanso Programado',
                              subvalor: ''
                            };
                          }
                        }

                        if (!infoDia) {
                          infoDia = {
                            tipo: 'REFUERZO_DEFAULT',
                            valor: 'LIBRE',
                            estilo: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
                            detalle: 'Disponible / Sin Turno',
                            subvalor: ''
                          };
                        }
                        return (
                          <td key={dia.fechaISO} className="border-r border-b p-0 text-center h-16 w-14 relative">
                            <div className={cn("group w-full h-full flex flex-col items-center justify-center cursor-help transition-all p-1 border", infoDia.estilo)}>
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
                              <span className="font-black text-xs leading-tight truncate max-w-full px-1">{infoDia.valor}</span>
                              {infoDia.tipo === 'TURNO' && (
                                <span className="text-[10px] font-semibold opacity-80 leading-tight mt-0.5">{infoDia.subvalor}</span>
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


      <div className="flex flex-wrap gap-4 justify-center pt-8 border-t">
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <span className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T1</span> Turno / Área
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <span className="w-6 h-6 rounded bg-cyan-100 border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-900">LIBRE</span> Disponible
        </div>
        {Object.values(TIPOS_NOVEDAD).map(tipo => (
          <div key={tipo.label} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <span className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border", tipo.color)}>{tipo.label}</span> {tipo.full}
          </div>
        ))}
      </div>
    </div >
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);