import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consultasService, turnosService, areasService, programacionService, calendarioService } from '@/services/api.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProgramacionTable } from '@/components/programacion/ProgramacionTable';
import { Calendar, ChevronLeft, ChevronRight, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { TurnoAsignado, Area, Turno, EmpleadoCompleto } from '@/types/api.types';

export default function Programacion() {
  const queryClient = useQueryClient();
  // Inicializar con el mes y año actuales
  const hoy = new Date();
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [asignacionActual, setAsignacionActual] = useState<{
    id_empleado: number;
    fecha: string;
    nombre_empleado: string;
  } | null>(null);

  // Calcular fechas de inicio y fin del mes (solo el mes actual, no días del mes anterior)
  const fechaInicio = useMemo(() => {
    // Primer día del mes seleccionado (día 1 del mes)
    const año = anio;
    const mesNum = mes; // mes ya viene como 1-12
    return `${año}-${String(mesNum).padStart(2, '0')}-01`;
  }, [anio, mes]);

  const fechaFin = useMemo(() => {
    // Último día del mes seleccionado
    // Crear fecha del primer día del siguiente mes y restar 1 día
    const año = anio;
    const mesNum = mes;
    const ultimoDia = new Date(año, mesNum, 0).getDate(); // El día 0 del mes siguiente = último día del mes actual
    return `${año}-${String(mesNum).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;
  }, [anio, mes]);

  // Obtener turnos asignados usando la VISTA vw_turnos_asignados
  // IMPORTANTE: Solo consultar turnos del mes actual (fechaInicio a fechaFin)
  const { data: turnosData, isLoading: turnosLoading, error: turnosError } = useQuery({
    queryKey: ['turnos-asignados', fechaInicio, fechaFin, mes, anio],
    queryFn: () => {
      console.log('🔍 Consultando turnos asignados SOLO del mes actual:', { fechaInicio, fechaFin, mes, anio });
      return consultasService.obtenerTurnosAsignados({
        fecha_inicio: fechaInicio, // Solo primer día del mes
        fecha_fin: fechaFin, // Solo último día del mes
        limit: 1000, // Obtener todos los turnos del mes
      });
    },
    // Refrescar cuando cambie el mes o año
    refetchOnWindowFocus: false,
  });

  // Debug: Log para ver qué datos se están recibiendo
  if (turnosData) {
    console.log('✅ Datos de turnos recibidos:', {
      total: turnosData.total,
      turnos: turnosData.turnos?.length || 0,
      primerTurno: turnosData.turnos?.[0] || null
    });
  }

  if (turnosError) {
    console.error('❌ Error al obtener turnos:', turnosError);
  }

  // Obtener empleados activos para mostrar en la tabla
  const { data: empleados, isLoading: empleadosLoading } = useQuery({
    queryKey: ['empleados-activos-areas'],
    queryFn: () => vistasService.obtenerEmpleadosActivosAreas(),
  });

  // Obtener áreas para agrupar empleados
  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: () => areasService.listar(),
  });

  // Obtener calendario (domingos y festivos) para el mes seleccionado
  const { data: calendarioMes, isLoading: calendarioLoading, error: calendarioError } = useQuery({
    queryKey: ['calendario', anio, mes],
    queryFn: () => {
      console.log(`📅 Obteniendo calendario para ${anio}-${mes}`);
      return calendarioService.listar({ anio, mes });
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // Logging del calendario
  useEffect(() => {
    if (calendarioMes) {
      console.log(`✅ Calendario recibido: ${Array.isArray(calendarioMes) ? calendarioMes.length : 0} días`);
    }
    if (calendarioError) {
      console.error('❌ Error al obtener calendario:', calendarioError);
    }
  }, [calendarioMes, calendarioError]);

  // Obtener turnos disponibles para asignar
  const { data: turnos, isLoading: turnosDisponiblesLoading } = useQuery({
    queryKey: ['turnos'],
    queryFn: () => turnosService.listar({ estado: true }),
  });

  // Obtener novedades activas para el mes actual (aprobadas o completadas)
  const { data: novedadesData } = useQuery({
    queryKey: ['novedades-completas', fechaInicio, fechaFin],
    queryFn: () => vistasService.obtenerNovedadesCompletas({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      etapa: undefined, // Obtener todas las etapas, pero filtrar solo aprobadas/completadas en el frontend
    }),
  });

  // Estado del formulario de asignación
  const [formData, setFormData] = useState({
    id_turno: '',
    id_area: '',
  });

  // Mutación para asignar turno
  const asignarTurnoMutation = useMutation({
    mutationFn: async (data: {
      id_empleado: number;
      fecha: string;
      id_turno: number;
      id_area: number;
    }) => {
      // Necesitamos obtener o crear labor_mes primero
      // Por ahora asumimos que ya existe
      return turnosService.asignar({
        id_empleado: data.id_empleado,
        id_turno: data.id_turno,
        id_area: data.id_area,
        fecha: data.fecha,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
      toast.success('Turno asignado exitosamente');
      setDialogOpen(false);
      setAsignacionActual(null);
      setFormData({ id_turno: '', id_area: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al asignar turno');
    },
  });

  const handleAsignarTurno = (data: {
    id_empleado: number;
    fecha: string;
    id_turno: number;
    id_area: number;
  }) => {
    const empleado = empleados?.find((e: any) => e.id_empleado === data.id_empleado);

    if (!empleado) return;

    // Si ya hay un turno asignado, precargar los valores
    const turnoExistente = turnosAsignados.find(
      (t: TurnoAsignado) =>
        t.id_empleado === data.id_empleado && t.fecha === data.fecha
    );

    setAsignacionActual({
      id_empleado: data.id_empleado,
      fecha: data.fecha,
      nombre_empleado: empleado.nombre_completo,
    });

    setFormData({
      id_turno: turnoExistente ? turnoExistente.id_turno.toString() : '',
      id_area: turnoExistente ? turnoExistente.id_area.toString() : '',
    });

    setDialogOpen(true);
  };

  const handleSubmitAsignacion = () => {
    if (!asignacionActual || !formData.id_turno || !formData.id_area) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    asignarTurnoMutation.mutate({
      id_empleado: asignacionActual.id_empleado,
      fecha: asignacionActual.fecha,
      id_turno: parseInt(formData.id_turno),
      id_area: parseInt(formData.id_area),
    });
  };

  const handleMesAnterior = () => {
    if (mes === 1) {
      setMes(12);
      setAnio(anio - 1);
    } else {
      setMes(mes - 1);
    }
    // Forzar actualización de la query para refrescar los datos
    queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
    queryClient.invalidateQueries({ queryKey: ['calendario'] });
  };

  const handleMesSiguiente = () => {
    if (mes === 12) {
      setMes(1);
      setAnio(anio + 1);
    } else {
      setMes(mes + 1);
    }
    // Forzar actualización de la query para refrescar los datos
    queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
    queryClient.invalidateQueries({ queryKey: ['calendario'] });
  };

  // Obtener descansos guardados localmente para este mes
  const obtenerDescansosMes = (mes: number, anio: number): Record<string, number[]> => {
    const descansos: Record<string, number[]> = {};
    const prefix = `descanso_`;

    // Recorrer todos los items de localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key.includes(`_${mes}_${anio}`)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.dias_descanso && Array.isArray(data.dias_descanso)) {
            // Extraer ID de empleado de la clave (formato: descanso_ID_mes_anio)
            const partes = key.split('_');
            if (partes.length >= 4) {
              const idEmpleado = partes[1];
              descansos[idEmpleado] = data.dias_descanso;
            }
          }
        } catch (e) {
          console.error('Error al parsear descanso:', e);
        }
      }
    }

    return descansos;
  };

  // Crear mapa de descansos para detectar cobertura
  // Formato: "id_empleado-dia" -> true si tiene descanso
  const descansosMap = useMemo(() => {
    const map = new Map<string, boolean>();
    const descansos = obtenerDescansosMes(mes, anio);

    Object.entries(descansos).forEach(([idEmpleado, dias]) => {
      dias.forEach(dia => {
        const key = `${idEmpleado}-${dia}`;
        map.set(key, true);
      });
    });

    return map;
  }, [mes, anio]);

  // Mutación para generar programación automática
  const generarProgramacionMutation = useMutation({
    mutationFn: () => {
      const descansos = obtenerDescansosMes(mes, anio);
      // Obtener máximos por área desde localStorage
      const maximosPorArea: Record<number, number> = {};
      if (areas) {
        areas.forEach(area => {
          const key = `max_trabajadores_${area.id_area}`;
          const stored = localStorage.getItem(key);
          const max = stored ? parseInt(stored) : 5;
          maximosPorArea[area.id_area] = max;
          console.log(`📋 Máximo para área ${area.nombre_area} (ID: ${area.id_area}): ${max}`);
        });
        console.log('📥 Máximos por área que se enviarán al backend:', maximosPorArea);
      } else {
        console.warn('⚠️ No hay áreas disponibles para obtener máximos');
      }
      return programacionService.generarAutomatica(mes, anio, descansos, maximosPorArea);
    },
    onSuccess: async (data) => {
      // Invalidar y refrescar las queries
      await queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
      await queryClient.invalidateQueries({ queryKey: ['turnos-asignados', fechaInicio, fechaFin, mes, anio] });
      // Forzar un refetch inmediato
      await queryClient.refetchQueries({ queryKey: ['turnos-asignados', fechaInicio, fechaFin, mes, anio] });
      toast.success(
        `Programación generada exitosamente: ${data.totalAsignaciones} asignaciones creadas`
      );
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        // Invalidar la consulta para refrescar los datos
        queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
        const registrosExistentes = error.response?.data?.registrosExistentes || 0;
        toast.error(
          `Ya existe programación para este mes (${registrosExistentes} registros). Use el botón "Eliminar Programación" para eliminarla antes de generar una nueva.`
        );
      } else {
        toast.error(error.response?.data?.error || 'Error al generar programación');
      }
    },
  });

  // Mutación para eliminar programación del mes
  const eliminarProgramacionMutation = useMutation({
    mutationFn: () => programacionService.eliminarMes(mes, anio),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['turnos-asignados'] });
      toast.success(`Programación eliminada: ${data.eliminados} asignaciones eliminadas`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al eliminar programación');
    },
  });

  const turnosAsignados = turnosData?.turnos || [];
  const empleadosList = (empleados || []) as unknown as EmpleadoCompleto[];
  const areasList = areas || [];
  const turnosList = turnos || [];
  const calendarioMap = useMemo(() => {
    const map = new Map<string, { es_festivo: boolean; es_domingo: boolean; nombre_festivo: string | null }>();

    // No mostrar warning si el calendario aún se está cargando (isLoading)
    if (!calendarioMes || !Array.isArray(calendarioMes)) {
      // Solo mostrar warning si ya se intentó cargar y falló, no si está cargando
      if (calendarioMes === null) {
        // null significa que la query falló o no hay datos
        console.warn('⚠️ Calendario no disponible o formato incorrecto');
      }
      // Si es undefined, significa que aún se está cargando, no mostrar warning
      return map;
    }

    calendarioMes.forEach((dia: any) => {
      // Normalizar fecha: puede venir como Date object, ISO string, o YYYY-MM-DD
      let fechaStr = '';

      // Manejar diferentes formatos de fecha
      if (dia.fecha) {
        if (dia.fecha instanceof Date) {
          fechaStr = dia.fecha.toISOString().split('T')[0];
        } else if (typeof dia.fecha === 'string') {
          // Puede venir como ISO string o YYYY-MM-DD
          fechaStr = dia.fecha.includes('T') ? dia.fecha.split('T')[0] : dia.fecha;
        } else if (dia.fecha.toISOString) {
          // Objeto Date serializado
          fechaStr = dia.fecha.toISOString().split('T')[0];
        } else if (typeof dia.fecha === 'object' && dia.fecha !== null) {
          // Intentar parsear como objeto Date serializado
          try {
            const fechaDate = new Date(dia.fecha);
            if (!isNaN(fechaDate.getTime())) {
              fechaStr = fechaDate.toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn(`⚠️ No se pudo parsear fecha:`, dia.fecha);
          }
        }
      }

      // Validar formato YYYY-MM-DD
      if (fechaStr && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
        // Asegurar que los valores booleanos se conviertan correctamente
        // Conversión robusta para manejar diferentes formatos del backend
        const esFestivoValue: any = dia.es_festivo;
        const esDomingoValue: any = dia.es_domingo;

        const esFestivo = esFestivoValue === true || esFestivoValue === 1 || esFestivoValue === 'true' || esFestivoValue === '1' || (typeof esFestivoValue === 'string' && esFestivoValue.toLowerCase() === 'true');
        const esDomingo = esDomingoValue === true || esDomingoValue === 1 || esDomingoValue === 'true' || esDomingoValue === '1' || (typeof esDomingoValue === 'string' && esDomingoValue.toLowerCase() === 'true');

        map.set(fechaStr, {
          es_festivo: Boolean(esFestivo),
          es_domingo: Boolean(esDomingo),
          nombre_festivo: dia.nombre_festivo || null,
        });

        // Log para festivos y domingos
        if (esFestivo) {
          console.log(`🎉 Festivo encontrado en calendario: ${fechaStr} - ${dia.nombre_festivo || 'Sin nombre'}`);
        }
        if (esDomingo && !esFestivo) {
          console.log(`📅 Domingo encontrado en calendario: ${fechaStr}`);
        }
      } else {
        console.warn(`⚠️ Fecha inválida en calendario:`, dia.fecha, `(fechaStr: ${fechaStr})`);
      }
    });

    // Log resumen de festivos y domingos cargados
    const festivosCargados = Array.from(map.entries()).filter(([_, info]) => info.es_festivo);
    const domingosCargados = Array.from(map.entries()).filter(([_, info]) => info.es_domingo);
    if (festivosCargados.length > 0) {
      console.log(`📅 Total festivos cargados: ${festivosCargados.length}`, festivosCargados.map(([fecha, info]) => `${fecha} (${info.nombre_festivo || 'Sin nombre'})`).join(', '));
    }
    if (domingosCargados.length > 0) {
      console.log(`📅 Total domingos cargados: ${domingosCargados.length}`);
    }
    console.log(`📅 Calendario total: ${map.size} días mapeados`);

    console.log(`📅 Calendario cargado: ${map.size} días registrados`);

    // Log detallado de los primeros días para debugging
    if (map.size > 0) {
      const primerosDias = Array.from(map.entries()).slice(0, 5);
      console.log(`📅 Primeros días del calendario:`, primerosDias.map(([fecha, info]) =>
        `${fecha}: festivo=${info.es_festivo}, domingo=${info.es_domingo}`
      ).join(', '));
    }

    return map;
  }, [calendarioMes]);

  // Verificar si hay programación para el mes actual (filtrar solo turnos del mes seleccionado)
  const tieneProgramacion = useMemo(() => {
    if (turnosAsignados.length === 0) return false;

    // Filtrar turnos que pertenecen al mes seleccionado
    const turnosDelMes = turnosAsignados.filter((turno: any) => {
      if (!turno.fecha) return false;
      const fechaTurno = new Date(turno.fecha);
      const añoTurno = fechaTurno.getFullYear();
      const mesTurno = fechaTurno.getMonth() + 1;
      return añoTurno === anio && mesTurno === mes;
    });

    return turnosDelMes.length > 0;
  }, [turnosAsignados, anio, mes]);

  // Filtrar novedades activas (aprobadas o completadas) y crear un mapa por empleado y fecha
  // La vista vw_novedades_completas devuelve una fila por cada detalle_novedad
  const novedadesActivas = novedadesData?.novedades?.filter(
    (novedad: any) =>
      (novedad.etapa === 'aprobada' || novedad.etapa === 'completada') &&
      novedad.fecha_inicio &&
      novedad.codigo_novedad
  ) || [];

  const novedadesMap = new Map<string, any>();
  novedadesActivas.forEach((novedad: any) => {
    // fecha_inicio es la fecha del detalle_novedad (fecha específica de la novedad)
    const fechaStr = novedad.fecha_inicio.includes('T')
      ? novedad.fecha_inicio.split('T')[0]
      : novedad.fecha_inicio;
    const key = `${novedad.id_empleado}-${fechaStr}`;
    // Si ya hay una novedad para esta fecha, mantener la primera (puede haber múltiples novedades en la misma fecha)
    if (!novedadesMap.has(key)) {
      novedadesMap.set(key, novedad);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Programación de Turnos
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Asignación y visualización de turnos laborales
        </p>
      </div>

      {/* Botones de acción */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {tieneProgramacion && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-green-500" />
                  Este mes tiene programación asignada
                </span>
              )}
              {!tieneProgramacion && (
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  No hay programación para este mes
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={eliminarProgramacionMutation.isPending}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {eliminarProgramacionMutation.isPending
                      ? 'Eliminando...'
                      : 'Eliminar Programación'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar programación del mes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará toda la programación de{' '}
                      {new Date(anio, mes - 1).toLocaleDateString('es-ES', {
                        month: 'long',
                        year: 'numeric',
                      })}
                      . Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => eliminarProgramacionMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={generarProgramacionMutation.isPending || tieneProgramacion}
                    variant={tieneProgramacion ? 'outline' : 'default'}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generarProgramacionMutation.isPending
                      ? 'Generando...'
                      : 'Generar Programación Automática'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Generar Programación Automática</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se generará una programación automática para{' '}
                      {new Date(anio, mes - 1).toLocaleDateString('es-ES', {
                        month: 'long',
                        year: 'numeric',
                      })}
                      . La programación distribuirá los turnos de manera equitativa entre los
                      empleados según sus áreas permitidas.
                      {tieneProgramacion && (
                        <span className="block mt-2 text-red-500 font-semibold">
                          ⚠️ Ya existe programación para este mes. Elimínela primero antes de
                          generar una nueva.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => generarProgramacionMutation.mutate()}
                      disabled={tieneProgramacion}
                    >
                      Generar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegación de Mes */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleMesAnterior}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Mes Anterior
              </Button>
              <div className="text-lg font-semibold px-4">
                {new Date(anio, mes - 1).toLocaleDateString('es-ES', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <Button variant="outline" onClick={handleMesSiguiente}>
                Mes Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const hoy = new Date();
                const mesActual = hoy.getMonth() + 1;
                const anioActual = hoy.getFullYear();
                console.log(`📅 Cambiando a mes actual: ${mesActual}/${anioActual}`);
                setMes(mesActual);
                setAnio(anioActual);
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Mes Actual
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug info - remover después */}
      {import.meta.env.DEV && (
        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          Debug: Turnos asignados = {turnosAsignados.length} |
          Fecha inicio = {fechaInicio} |
          Fecha fin = {fechaFin}
          {turnosError && <span className="text-red-500"> | Error: {turnosError.message}</span>}
        </div>
      )}

      {/* Tabla de Programación */}
      <ProgramacionTable
        turnosAsignados={turnosAsignados}
        empleados={empleadosList}
        areas={areasList}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        mes={mes}
        anio={anio}
        isLoading={
          turnosLoading ||
          empleadosLoading ||
          areasLoading ||
          turnosDisponiblesLoading ||
          calendarioLoading ||
          generarProgramacionMutation.isPending
        }
        onAsignarTurno={handleAsignarTurno}
        novedadesMap={novedadesMap}
        descansosMap={descansosMap}
        calendarioMap={calendarioMap}
      />

      {/* Dialog para asignar turno */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Turno</DialogTitle>
            <DialogDescription>
              Asignar turno a {asignacionActual?.nombre_empleado} para el{' '}
              {asignacionActual?.fecha &&
                new Date(asignacionActual.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="turno">Turno</Label>
              <Select
                value={formData.id_turno}
                onValueChange={(value) => setFormData({ ...formData, id_turno: value })}
              >
                <SelectTrigger id="turno">
                  <SelectValue placeholder="Selecciona un turno" />
                </SelectTrigger>
                <SelectContent>
                  {turnosList.map((turno: Turno) => (
                    <SelectItem key={turno.id_turno} value={turno.id_turno.toString()}>
                      {turno.codigo} - {turno.hora_entrada.substring(0, 5)} -{' '}
                      {turno.hora_salida.substring(0, 5)} ({turno.tipo_turno})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área</Label>
              <Select
                value={formData.id_area}
                onValueChange={(value) => setFormData({ ...formData, id_area: value })}
              >
                <SelectTrigger id="area">
                  <SelectValue placeholder="Selecciona un área" />
                </SelectTrigger>
                <SelectContent>
                  {areasList.map((area: Area) => (
                    <SelectItem key={area.id_area} value={area.id_area.toString()}>
                      {area.nombre_area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitAsignacion}
              disabled={asignarTurnoMutation.isPending}
            >
              {asignarTurnoMutation.isPending ? 'Asignando...' : 'Asignar Turno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
