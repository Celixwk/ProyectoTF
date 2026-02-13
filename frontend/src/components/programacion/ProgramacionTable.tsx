import { Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { generarDiasMes, agruparEmpleadosPorArea } from '@/lib/programacion.utils';
import { obtenerCodigoArea, obtenerColorArea } from '@/lib/area-codigos';

import type { TurnoAsignado, Area } from '@/types/api.types';

type EmpleadoTabla = {
  id_empleado: number;
  nombre_completo: string;
  areas_permitidas?: number[] | null;
  nombre_cargo?: string;
};

interface ProgramacionTableProps {
  turnosAsignados: TurnoAsignado[];
  empleados: EmpleadoTabla[];
  areas: Area[];
  fechaInicio: string;
  fechaFin: string;
  mes?: number; // Mes (1-12) para mostrar correctamente en el título
  anio?: number; // Año para mostrar correctamente en el título
  isLoading?: boolean;
  onAsignarTurno: (data: {
    id_empleado: number;
    fecha: string;
    id_turno: number;
    id_area: number;
  }) => void;
  novedadesMap?: Map<string, any>;
  descansosMap?: Map<string, boolean>;
  calendarioMap?: Map<string, { es_festivo: boolean; es_domingo: boolean; nombre_festivo: string | null }>;
}

export function ProgramacionTable({
  turnosAsignados,
  empleados,
  areas,
  fechaInicio,
  fechaFin,
  mes,
  anio,
  isLoading = false,
  onAsignarTurno,
  novedadesMap = new Map(),
  descansosMap = new Map(),
  calendarioMap = new Map(),
}: ProgramacionTableProps) {
  // Generar días del mes
  const diasMes = generarDiasMes(fechaInicio, fechaFin, calendarioMap);

  // Agrupar empleados por área (usando turnos asignados si están disponibles)
  const empleadosPorArea = agruparEmpleadosPorArea(empleados, areas, turnosAsignados);

  // Mapear turnos asignados para búsqueda rápida
  // Normalizar fechas a formato YYYY-MM-DD para asegurar coincidencia
  const turnosMap = new Map<string, TurnoAsignado>();

  // Función helper para normalizar fechas a YYYY-MM-DD
  const normalizarFecha = (fecha: string): string => {
    if (!fecha) return '';
    // Si ya está en formato YYYY-MM-DD, retornarlo
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }
    // Si incluye hora (T o espacio), tomar solo la fecha
    let fechaStr = fecha;
    if (fechaStr.includes('T')) {
      fechaStr = fechaStr.split('T')[0];
    } else if (fechaStr.includes(' ')) {
      fechaStr = fechaStr.split(' ')[0];
    }
    // Parsear y formatear
    try {
      const fechaDate = new Date(fechaStr + 'T00:00:00'); // Agregar hora para evitar problemas de zona horaria
      if (!isNaN(fechaDate.getTime())) {
        const año = fechaDate.getFullYear();
        const mes = String(fechaDate.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaDate.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      }
    } catch (e) {
      console.error('Error normalizando fecha:', fecha, e);
    }
    return fechaStr;
  };

  turnosAsignados.forEach(turno => {
    const fechaNormalizada = normalizarFecha(turno.fecha);
    const key = `${turno.id_empleado}-${fechaNormalizada}`;
    turnosMap.set(key, turno);
  });

  // Debug: Log para verificar los turnos (solo en desarrollo)
  if (import.meta.env.DEV && turnosAsignados.length > 0) {
    console.log('📊 Turnos asignados recibidos:', {
      total: turnosAsignados.length,
      mapeados: turnosMap.size,
      primerTurno: turnosAsignados[0],
      totalDiasMes: diasMes.length,
      primerDia: diasMes[0]?.fecha,
      ejemploKeys: Array.from(turnosMap.keys()).slice(0, 5)
    });
  }

  // Función para detectar si hay cobertura por descanso en un área específica
  // Retorna true si hay algún empleado con descanso que normalmente trabajaría en esta área
  const hayCoberturaPorDescanso = (idArea: number, fecha: string): boolean => {
    // Extraer el día del mes de la fecha (YYYY-MM-DD)
    const diaDelMes = parseInt(fecha.split('-')[2]);

    // Verificar si hay algún empleado con descanso que normalmente trabajaría en esta área
    return empleados.some(emp => {
      // Verificar si este empleado tiene descanso en este día
      const keyDescanso = `${emp.id_empleado}-${diaDelMes}`;
      const tieneDescanso = descansosMap.get(keyDescanso) || false;

      if (!tieneDescanso) return false;

      // Verificar si este empleado normalmente trabajaría en esta área
      // Opción 1: Según áreas permitidas
      const areasPermitidas = emp.areas_permitidas || [];
      if (areasPermitidas.length > 0) {
        return areasPermitidas.includes(idArea);
      }

      // Opción 2: Si no tiene áreas permitidas, verificar según turnos asignados históricos
      // Contar cuántos turnos tiene este empleado en esta área
      const turnosEnArea = turnosAsignados.filter(
        t => t.id_empleado === emp.id_empleado && t.id_area === idArea
      ).length;

      // Si tiene al menos un turno en esta área, probablemente trabaja ahí
      return turnosEnArea > 0;
    });
  };

  // Obtener turno para una celda específica
  // Solo incluye sigla del área si hay cobertura por descanso
  // Si hay una novedad activa, mostrar la novedad en lugar del turno
  const getTurnoCell = (idEmpleado: number, fecha: string) => {
    const key = `${idEmpleado}-${fecha}`;

    // Verificar si hay una novedad activa para este empleado y fecha
    const novedad = novedadesMap.get(key);
    if (novedad && novedad.codigo_novedad) {
      // Mostrar el código de la novedad (ej: "VACACIO", "LICEN M.")
      return novedad.codigo_novedad;
    }

    // Si no hay novedad, mostrar el turno asignado
    const turno = turnosMap.get(key);
    if (!turno) return null;

    // Verificar si es turno de descanso
    if (turno.codigo_turno === 'D' || turno.codigo_turno === 'DESCANSO') {
      return 'D';
    }

    // Obtener código del turno (ej: T1, T11, T5) - formatear con espacio después de T
    let turnoCodigo = turno.codigo_turno;
    if (turnoCodigo.startsWith('T')) {
      // Formato: T 1, T 11, T 5 (con espacio)
      const numero = turnoCodigo.substring(1);
      turnoCodigo = `T ${numero.trim()}`;
    }

    // Solo agregar código del área si hay cobertura por descanso
    const necesitaCobertura = hayCoberturaPorDescanso(turno.id_area, fecha);
    if (necesitaCobertura) {
      const codigoArea = obtenerCodigoArea(turno.nombre_area);
      return `${turnoCodigo} ${codigoArea}`;
    }

    // Si no hay cobertura, mostrar solo el código del turno
    return turnoCodigo;
  };

  const handleCellClick = (empleado: { id_empleado: number; nombre_completo: string }, fecha: string, turnoExistente: TurnoAsignado | null) => {
    onAsignarTurno({
      id_empleado: empleado.id_empleado,
      fecha,
      id_turno: turnoExistente?.id_turno || 0,
      id_area: turnoExistente?.id_area || 0,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Programación de Turnos - {mes && anio
            ? new Date(anio, mes - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
            : new Date(fechaInicio).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="sticky left-0 bg-muted z-10 min-w-[250px] font-bold text-sm border-r-2">
                  EMPLEADO / ÁREA
                </TableHead>
                {diasMes.map((dia) => {
                  // Lógica: 
                  // - Los domingos: fondo rojo pero texto normal (NO rojo)
                  // - Los festivos que NO son domingos: fondo rojo Y texto rojo
                  // - Si es domingo Y festivo: fondo rojo, texto normal, pero mostrar nombre del festivo en rojo
                  const esDomingo = Boolean(dia.esDomingo);
                  const esFestivoNoDomingo = Boolean(dia.esFestivo) && !esDomingo;
                  const esDiaEspecial = esDomingo || esFestivoNoDomingo;

                  // Log para debugging de festivos (solo en desarrollo y para festivos o primeros días)
                  if (import.meta.env.DEV && (dia.dia <= 3 || dia.esFestivo || dia.esDomingo)) {
                    console.log(`🎨 Header día ${dia.dia} (${dia.fecha}): esFestivo=${dia.esFestivo}, esDomingo=${dia.esDomingo}, esFestivoNoDomingo=${esFestivoNoDomingo}, esDiaEspecial=${esDiaEspecial}, nombreFestivo=${dia.nombreFestivo || 'N/A'}`);
                  }

                  return (
                    <TableHead
                      key={dia.fecha}
                      className={`text-center min-w-[70px] max-w-[70px] border-r p-1 ${esDiaEspecial ? 'bg-red-100 dark:bg-red-900/30' : 'bg-muted/50'
                        }`}
                    >
                      <div className="flex flex-col items-center">
                        {/* Domingo: texto normal (no rojo). Festivo no domingo: texto rojo */}
                        {/* Asegurar que domingos tengan texto normal explícitamente */}
                        <span className={`text-[11px] font-bold uppercase leading-tight ${esFestivoNoDomingo
                          ? 'text-red-600 dark:text-red-300'
                          : esDomingo
                            ? 'text-foreground' // Domingo: texto normal explícito
                            : ''
                          }`}>
                          {dia.diaSemana}
                        </span>
                        <span className={`text-sm font-bold mt-0.5 ${esFestivoNoDomingo
                          ? 'text-red-600 dark:text-red-300'
                          : esDomingo
                            ? 'text-foreground' // Domingo: texto normal explícito
                            : ''
                          }`}>
                          {dia.dia}
                        </span>
                        {/* Mostrar nombre de festivo SOLO si es festivo Y NO es domingo (para evitar mostrar texto rojo en domingos) */}
                        {dia.esFestivo && dia.nombreFestivo && !esDomingo && (
                          <span className="text-[10px] text-red-600 dark:text-red-300 font-semibold mt-0.5 text-center">
                            {dia.nombreFestivo}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {empleadosPorArea.size === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={diasMes.length + 1}
                    className="text-center py-12 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-lg font-medium">No hay programación generada</p>
                      <p className="text-sm">
                        Genera la programación automática para ver los turnos asignados
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                Array.from(empleadosPorArea.entries()).map(([nombreArea, empleadosArea]) => (
                  <Fragment key={`area-fragment-${nombreArea}`}>
                    {/* Header de área */}
                    <TableRow className={`${obtenerColorArea(nombreArea)} hover:opacity-80 transition-opacity`}>
                      <TableCell
                        colSpan={diasMes.length + 1}
                        className="font-bold text-sm py-3 px-4 border-b-2 border-t-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>{nombreArea.toUpperCase()}</span>
                          <span className="text-xs font-normal opacity-70">
                            ({obtenerCodigoArea(nombreArea)})
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Empleados del área */}
                    {empleadosArea.map((empleado) => (
                      <TableRow key={empleado.id_empleado} className="hover:bg-muted/20 border-b">
                        <TableCell className="sticky left-0 bg-background z-10 font-semibold text-xs py-2 px-3 border-r-2 whitespace-nowrap">
                          {empleado.nombre_completo.toUpperCase()}
                        </TableCell>
                        {diasMes.map((dia) => {
                          // Asegurar formato YYYY-MM-DD para la fecha (ya debería estar normalizada)
                          const fechaKey = dia.fecha.includes('T') ? dia.fecha.split('T')[0] : dia.fecha;
                          const key = `${empleado.id_empleado}-${fechaKey}`;
                          // Lógica: Los domingos siempre en rojo, y los festivos que NO son domingos también en rojo
                          const esDomingo = Boolean(dia.esDomingo);
                          const esFestivoNoDomingo = Boolean(dia.esFestivo) && !esDomingo;
                          const esDiaEspecialVerificado = esDomingo || esFestivoNoDomingo;
                          const turnoExistente = turnosMap.get(key);
                          const novedad = novedadesMap.get(key);
                          const turnoDisplay = getTurnoCell(empleado.id_empleado, fechaKey);
                          const codigoArea = turnoExistente ? obtenerCodigoArea(turnoExistente.nombre_area) : null;

                          // Color de área SOLO si hay turno, NO es día especial, y NO hay novedad
                          // Si es día especial, NUNCA aplicar color de área - esto es crítico
                          const colorArea = turnoExistente && !novedad && !esDiaEspecialVerificado
                            ? obtenerColorArea(turnoExistente.nombre_area)
                            : '';

                          // Clase de celda: prioridad absoluta: novedad > día especial (rojo) > color de área > fondo normal
                          // IMPORTANTE: Si es día especial, SIEMPRE usar rojo, sin importar el color de área
                          const tieneNovedad = !!novedad;
                          let claseCelda = '';

                          // Determinar clase de celda con prioridad clara
                          if (tieneNovedad) {
                            // Prioridad 1: Novedad (amarillo)
                            claseCelda = 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400';
                          } else if (esDiaEspecialVerificado) {
                            // Prioridad 2: Día especial (rojo) - NUNCA aplicar color de área aquí
                            claseCelda = 'bg-red-100/50 dark:bg-red-900/20';
                          } else if (turnoExistente && turnoDisplay && colorArea) {
                            // Prioridad 3: Día normal con turno - aplicar SOLO color de área
                            // Solo aplicar color si hay turno existente Y hay display Y hay color de área
                            claseCelda = `${colorArea} font-semibold rounded`;
                          } else {
                            // Prioridad 4: Día normal sin turno o sin color - fondo blanco
                            // Asegurar que celdas vacías siempre tengan fondo blanco
                            claseCelda = 'bg-white dark:bg-background hover:bg-muted/50';
                          }

                          return (
                            <TableCell
                              key={`${empleado.id_empleado}-${dia.fecha}`}
                              className={`text-center text-xs p-1.5 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all border-r ${claseCelda}`}
                              onClick={() => handleCellClick(empleado, dia.fecha, turnoExistente || null)}
                              title={
                                tieneNovedad
                                  ? `Novedad: ${novedad.codigo_novedad || novedad.tipo || 'Novedad'}\nEmpleado: ${empleado.nombre_completo}\nFecha: ${new Date(dia.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${novedad.observaciones ? `\nObservaciones: ${novedad.observaciones}` : ''}`
                                  : turnoExistente
                                    ? `Turno: ${turnoExistente.codigo_turno}\nÁrea: ${turnoExistente.nombre_area} (${codigoArea})\nHorario: ${turnoExistente.hora_entrada.substring(0, 5)} - ${turnoExistente.hora_salida.substring(0, 5)}\nEmpleado: ${empleado.nombre_completo}\nFecha: ${new Date(dia.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                                    : `Clic para asignar turno\nEmpleado: ${empleado.nombre_completo}\nFecha: ${new Date(dia.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                              }
                            >
                              <div className="min-h-[36px] flex items-center justify-center py-1.5">
                                <span className={`text-xs font-medium ${turnoDisplay
                                  ? tieneNovedad
                                    ? 'text-amber-700 dark:text-amber-300 font-bold'
                                    : esDiaEspecialVerificado
                                      ? esFestivoNoDomingo
                                        ? 'text-red-600 dark:text-red-400 font-bold' // Festivo no domingo: texto rojo
                                        : 'text-foreground font-semibold' // Domingo: texto normal (no rojo)
                                      : 'text-foreground font-semibold'
                                  : 'text-muted-foreground/30'
                                  }`}>
                                  {turnoDisplay || ''}
                                </span>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

