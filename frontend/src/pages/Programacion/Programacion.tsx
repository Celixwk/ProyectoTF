import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { areasService, programacionService, consultasService } from '@/services/api.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, LayoutDashboard, Info } from 'lucide-react';
import { format } from 'date-fns';
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
  const hoy = new Date();

  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const anios = Array.from({ length: 5 }, (_, i) => hoy.getFullYear() - 2 + i);

  const { data: areasRaw } = useQuery<Area[]>({
    queryKey: ['areas'],
    queryFn: () => areasService.listar()
  });

  const areasMap = useMemo(() => {
    const map = new Map<number, string>();
    areasRaw?.forEach(a => map.set(a.id_area, a.nombre_area));
    return map;
  }, [areasRaw]);

  const fechaInicio = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const fechaFin = new Date(anio, mes, 0).toISOString().split('T')[0];

  const { data: programacion = [], isLoading: loadingProg } = useQuery({
    queryKey: ['programacion-lectura', mes, anio],
    queryFn: async () => {
      const res = await programacionService.listarPorPeriodo(fechaInicio, fechaFin);
      return Array.isArray(res) ? res : (res.data || []);
    }
  });

  const { data: novedadesData = [] } = useQuery({
    queryKey: ['novedades-lectura', mes, anio],
    queryFn: () => consultasService.obtenerNovedadesCompletas({
      inicio: fechaInicio,
      fin: fechaFin
    })
  });

  const diasDelMes = useMemo(() => {
    const total = new Date(anio, mes, 0).getDate();
    return Array.from({ length: total }, (_, i) => {
      const fecha = new Date(anio, mes - 1, i + 1);
      return {
        dia: i + 1,
        fechaISO: format(fecha, 'yyyy-MM-dd'),
        nombre: format(fecha, 'EEE', { locale: es }).toUpperCase().replace('.', ''),
        esFinDeSemana: fecha.getDay() === 0 || fecha.getDay() === 6
      };
    });
  }, [mes, anio]);

  const datosProcesados = useMemo(() => {
    if (!programacion.length && !novedadesData.length) return [];

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
          dias: {}
        };
      }

      let horaFormateada = 'Sin horario';
      if (!esRefuerzo && asig.turno?.hora_entrada) {
        const entrada = asig.turno.hora_entrada.includes('T') ? asig.turno.hora_entrada.split('T')[1] : asig.turno.hora_entrada;
        const salida = asig.turno.hora_salida?.includes('T') ? asig.turno.hora_salida.split('T')[1] : asig.turno.hora_salida;
        horaFormateada = `${entrada.substring(0, 5)} - ${salida?.substring(0, 5) || '??'}`;
      }

      empleadosMap[idEmp].dias[fecha] = {
        tipo: 'TURNO',
        valor: esRefuerzo ? 'REF' : (asig.turno?.tipo_turno || 'T?'),
        subvalor: abreviacionArea,
        areaCompleta: nombreArea,
        detalle: esRefuerzo ? 'Refuerzo' : asig.turno?.tipo_turno,
        hora: horaFormateada,
        estilo: esRefuerzo
          ? 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold'
          : 'bg-white hover:bg-indigo-50 text-indigo-900 border-slate-200'
      };
    });

    const listaNovedades = Array.isArray(novedadesData) ? novedadesData : (novedadesData.novedades || []);

    listaNovedades.forEach((nov: any) => {
      if (!empleadosMap[nov.id_empleado]) {
        empleadosMap[nov.id_empleado] = {
          nombre: nov.empleado ? `${nov.empleado.nombre1} ${nov.empleado.apellido1}` : nov.nombre_completo,
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

    return Object.values(empleadosMap).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [programacion, novedadesData, areasMap]);

  return (
    <div className="space-y-6 max-w-full mx-auto pb-20 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Programación de Turnos</h1>
          <p className="text-slate-500 text-lg">Vista consolidada de asignaciones y novedades.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
          <Select value={String(mes)} onValueChange={(v) => setMes(parseInt(v))}>
            <SelectTrigger className="w-[160px] border-none shadow-none font-medium text-base"><SelectValue /></SelectTrigger>
            <SelectContent>
              {meses.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)} className="text-base">{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="h-6 w-px bg-slate-200" />
          <Select value={String(anio)} onValueChange={(v) => setAnio(parseInt(v))}>
            <SelectTrigger className="w-[120px] border-none shadow-none font-medium text-base"><SelectValue /></SelectTrigger>
            <SelectContent>
              {anios.map(a => <SelectItem key={a} value={String(a)} className="text-base">{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => navigate(`/gestion-mensual?mes=${mes}&anio=${anio}`)}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-md font-bold text-base px-6 py-6"
        >
          <LayoutDashboard className="mr-2 h-5 w-5" />
          Ir a Gestión Mensual
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 flex gap-3 items-start">
        <Info className="h-6 w-6 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <h5 className="font-bold text-blue-700 text-base mb-1">Modo Lectura</h5>
          <p className="text-blue-600/90 text-sm leading-relaxed">
            Esta vista consolida todos los empleados. Pase el mouse sobre las casillas para ver detalles del turno y el área asignada.
          </p>
        </div>
      </div>

      {loadingProg ? (
        <div className="py-20 text-center text-slate-400 text-xl">Cargando programación...</div>
      ) : datosProcesados.length === 0 ? (
        <Card className="border-dashed py-16 text-center bg-slate-50/50">
          <div className="flex justify-center mb-6">
            <CalendarDays className="h-16 w-16 text-slate-300" />
          </div>
          <h3 className="text-xl font-medium text-slate-900">Sin programación visible</h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2 text-lg">
            No hay turnos asignados para {meses[mes - 1]} {anio}.
          </p>
        </Card>
      ) : (
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-base">Personal Programado</span>
            <Badge variant="secondary" className="bg-slate-700 text-slate-100 border-0 text-sm px-3 py-1">
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
                  {diasDelMes.map(dia => (
                    <th key={dia.dia} className={cn(
                      "border-b border-r min-w-[56px] p-2 text-center font-medium",
                      dia.esFinDeSemana ? "bg-slate-50 text-slate-500" : "bg-white text-slate-700"
                    )}>
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold">{dia.nombre}</span>
                        <span className={cn("text-base font-bold", dia.esFinDeSemana && "text-slate-400")}>{dia.dia}</span>
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
                    {diasDelMes.map(dia => {
                      let infoDia = emp.dias[dia.fechaISO];

                      if (!infoDia) {
                        infoDia = {
                          tipo: 'REFUERZO_DEFAULT',
                          valor: 'REF',
                          estilo: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
                          detalle: 'Refuerzo (Por asignar)',
                          subvalor: ''
                        };
                      }

                      return (
                        <td key={dia.dia} className={cn(
                          "border-r border-b p-0 text-center h-16 w-14 relative"
                        )}>
                          {/* AQUI SE AGREGA LA CLASE 'group' AL CONTENEDOR INDIVIDUAL */}
                          <div
                            className={cn(
                              "group w-full h-full flex flex-col items-center justify-center cursor-help transition-all p-1 border",
                              infoDia.estilo
                            )}
                          >
                            {/* TOOLTIP PERSONALIZADO (Aparece solo para este DIV) */}
                            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 z-50 mb-2 w-max max-w-[220px] bg-slate-900 text-white p-3 rounded-lg shadow-2xl pointer-events-none">
                              <div className="text-base font-bold mb-1">{infoDia.detalle}</div>
                              {infoDia.tipo === 'TURNO' && (
                                <>
                                  <div className="text-sm font-medium text-slate-200">Horario: {infoDia.hora}</div>
                                  <div className="text-xs text-slate-400 mt-1 uppercase tracking-wide">{infoDia.areaCompleta}</div>
                                </>
                              )}
                              {/* Triángulo indicador */}
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
      )}

      <div className="flex flex-wrap gap-4 justify-center pt-8 border-t">
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <span className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">T1</span> Turno / Área
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <span className="w-6 h-6 rounded bg-cyan-100 border border-cyan-300 flex items-center justify-center text-[10px] font-bold text-cyan-900">REF</span> Refuerzo
        </div>
        {Object.values(TIPOS_NOVEDAD).map(tipo => (
          <div key={tipo.label} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <span className={cn("w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border", tipo.color)}>{tipo.label}</span> {tipo.full}
          </div>
        ))}
      </div>
    </div>
  );
}