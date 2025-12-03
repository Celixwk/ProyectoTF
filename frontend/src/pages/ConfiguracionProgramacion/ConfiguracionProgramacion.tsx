import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vistasService, empleadosService, areasService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { EmpleadoCompleto } from '@/types/api.types';
import type { Area } from '@/types/api.types';


export default function ConfiguracionProgramacion() {
  const queryClient = useQueryClient();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [idEmpleadoSeleccionado, setIdEmpleadoSeleccionado] = useState<number | null>(null);
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [areasPermitidas, setAreasPermitidas] = useState<number[]>([]);
  const [maxTrabajadoresPorArea, setMaxTrabajadoresPorArea] = useState<Record<number, number>>({});

  // Obtener empleados activos
  const { data: empleados, isLoading: empleadosLoading } = useQuery({
    queryKey: ['empleados-activos-areas'],
    queryFn: () => vistasService.obtenerEmpleadosActivosAreas(),
  });

  // Obtener áreas
  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: () => areasService.listar(),
  });

  // Los descansos se guardan localmente en localStorage
  const getDescansoLocal = (idEmpleado: number, mes: number, anio: number) => {
    const key = `descanso_${idEmpleado}_${mes}_${anio}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { dias_descanso: [], observaciones: '' };
      }
    }
    return { dias_descanso: [], observaciones: '' };
  };

  // Generar días del mes
  const diasDelMes = useMemo(() => {
    const ultimoDia = new Date(anio, mes, 0).getDate();
    return Array.from({ length: ultimoDia }, (_, i) => i + 1);
  }, [mes, anio]);

  // Cargar descanso y áreas cuando cambia el empleado o el mes
  useEffect(() => {
    if (idEmpleadoSeleccionado) {
      const empleado = empleados?.find((e: any) => e.id_empleado === idEmpleadoSeleccionado);
      if (empleado) {
        // Cargar áreas permitidas del empleado
        setAreasPermitidas(empleado.areas_permitidas || []);
      }
      
      const descansoLocal = getDescansoLocal(idEmpleadoSeleccionado, mes, anio);
      setDiasSeleccionados(descansoLocal.dias_descanso || []);
      setObservaciones(descansoLocal.observaciones || '');
    } else {
      setDiasSeleccionados([]);
      setObservaciones('');
      setAreasPermitidas([]);
    }
  }, [idEmpleadoSeleccionado, mes, anio, empleados]);

  // Inicializar máximos de trabajadores por área desde localStorage
  useEffect(() => {
    if (areas && areas.length > 0) {
      const maximos: Record<number, number> = {};
      areas.forEach(area => {
        const key = `max_trabajadores_${area.id_area}`;
        maximos[area.id_area] = parseInt(localStorage.getItem(key) || '5');
      });
      setMaxTrabajadoresPorArea(maximos);
    }
  }, [areas]);

  // Guardar descanso localmente
  const handleGuardarLocal = () => {
    if (!idEmpleadoSeleccionado) {
      toast.error('Por favor selecciona un empleado');
      return;
    }

    const key = `descanso_${idEmpleadoSeleccionado}_${mes}_${anio}`;
    const data = {
      dias_descanso: diasSeleccionados,
      observaciones: observaciones || '',
    };
    localStorage.setItem(key, JSON.stringify(data));
    toast.success('Descansos guardados localmente');
  };

  const handleDiaToggle = (dia: number) => {
    setDiasSeleccionados((prev) => {
      if (prev.includes(dia)) {
        return prev.filter((d) => d !== dia);
      } else {
        return [...prev, dia].sort((a, b) => a - b);
      }
    });
  };

  // Mutación para actualizar áreas permitidas del empleado
  const actualizarAreasMutation = useMutation({
    mutationFn: async (data: { idEmpleado: number; areas: number[] }) => {
      return empleadosService.actualizar(data.idEmpleado, {
        areas_permitidas: data.areas,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados-activos-areas'] });
      toast.success('Áreas permitidas actualizadas exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al actualizar áreas permitidas');
    },
  });

  // Toggle área permitida
  const toggleArea = (idArea: number) => {
    const nuevasAreas = areasPermitidas.includes(idArea)
      ? areasPermitidas.filter((id) => id !== idArea)
      : [...areasPermitidas, idArea];
    setAreasPermitidas(nuevasAreas);
  };

  // Guardar todo (descansos y áreas)
  const handleGuardar = async () => {
    if (!idEmpleadoSeleccionado) {
      toast.error('Por favor selecciona un empleado');
      return;
    }

    // Guardar descansos localmente
    handleGuardarLocal();

    // Actualizar áreas permitidas en la base de datos
    if (empleadoSeleccionado) {
      // Solo actualizar si las áreas cambiaron
      const areasOriginales = empleadoSeleccionado.areas_permitidas || [];
      const areasCambiaron =
        areasOriginales.length !== areasPermitidas.length ||
        areasOriginales.some((id) => !areasPermitidas.includes(id)) ||
        areasPermitidas.some((id) => !areasOriginales.includes(id));

      if (areasCambiaron) {
        actualizarAreasMutation.mutate({
          idEmpleado: idEmpleadoSeleccionado,
          areas: areasPermitidas,
        });
      } else {
        toast.success('Descansos guardados localmente');
      }
    }
  };

  const empleadoSeleccionado = empleados?.find(
    (e: any) => e.id_empleado === idEmpleadoSeleccionado
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configuración de Programación
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Configura descansos mensuales y reglas de programación para empleados
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="empleado">Empleado</Label>
              <Select
                value={idEmpleadoSeleccionado?.toString() || ''}
                onValueChange={(value) => setIdEmpleadoSeleccionado(parseInt(value))}
              >
                <SelectTrigger id="empleado" className="mt-1">
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados?.map((empleado: EmpleadoCompleto) => (
                    <SelectItem
                      key={empleado.id_empleado}
                      value={empleado.id_empleado.toString()}
                    >
                      {empleado.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mes">Mes</Label>
              <Input
                id="mes"
                type="number"
                min="1"
                max="12"
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="anio">Año</Label>
              <Input
                id="anio"
                type="number"
                min="2020"
                max="2100"
                value={anio}
                onChange={(e) => setAnio(parseInt(e.target.value) || new Date().getFullYear())}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  const hoy = new Date();
                  setMes(hoy.getMonth() + 1);
                  setAnio(hoy.getFullYear());
                }}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Mes Actual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Máximo de Trabajadores por Área */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Máximo de Trabajadores por Área</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Define la cantidad máxima de trabajadores que pueden estar asignados simultáneamente en cada área durante la programación automática.
          </p>
          {areasLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {areas?.map((area: Area) => {
                  return (
                    <div key={area.id_area} className="flex items-center justify-between p-3 border rounded-lg">
                      <Label htmlFor={`max-${area.id_area}`} className="flex-1">
                        {area.nombre_area}
                      </Label>
                      <Input
                        id={`max-${area.id_area}`}
                        type="number"
                        min="1"
                        max="50"
                        value={maxTrabajadoresPorArea[area.id_area] || 5}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setMaxTrabajadoresPorArea(prev => ({ ...prev, [area.id_area]: value }));
                        }}
                        className="w-20 ml-2"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => {
                    // Guardar todos los máximos en localStorage
                    let guardados = 0;
                    areas?.forEach((area: Area) => {
                      const key = `max_trabajadores_${area.id_area}`;
                      const value = maxTrabajadoresPorArea[area.id_area] || 5;
                      localStorage.setItem(key, value.toString());
                      guardados++;
                    });
                    toast.success(`Se guardaron ${guardados} configuraciones de máximos por área`);
                  }}
                  className="min-w-[150px]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Máximos
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configuración de Descansos y Áreas */}
      {idEmpleadoSeleccionado ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Configuración - {empleadoSeleccionado?.nombre_completo || 'Empleado'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Áreas Permitidas */}
              <div>
                <Label className="mb-3 block text-base font-semibold">
                  Áreas Permitidas
                </Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Selecciona las áreas en las que este empleado puede rotar durante la programación automática:
                </p>
                {areasLoading ? (
                  <Skeleton className="h-[120px] w-full" />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border rounded-lg">
                    {areas?.map((area: Area) => (
                      <div
                        key={area.id_area}
                        className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleArea(area.id_area)}
                      >
                        <Checkbox
                          checked={areasPermitidas.includes(area.id_area)}
                          onCheckedChange={() => toggleArea(area.id_area)}
                        />
                        <Label
                          htmlFor={`area-${area.id_area}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {area.nombre_area}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {areasPermitidas.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                    ⚠️ Este empleado no tiene áreas permitidas. Debe tener al menos una área asignada.
                  </p>
                )}
              </div>

              {/* Separador */}
              <div className="border-t"></div>

              {/* Días de Descanso */}
              <div>
                <div>
                  <Label className="mb-2 block">
                    Selecciona los días del mes en que el empleado tendrá descanso:
                  </Label>
                  <div className="grid grid-cols-7 gap-2 p-4 border rounded-lg">
                    {diasDelMes.map((dia) => {
                      const fecha = new Date(anio, mes - 1, dia);
                      const diaSemana = fecha.getDay();
                      const esDomingo = diaSemana === 0;
                      const estaSeleccionado = diasSeleccionados.includes(dia);

                      return (
                        <div
                          key={dia}
                          className={`flex flex-col items-center p-2 border rounded cursor-pointer transition-colors ${
                            estaSeleccionado
                              ? 'bg-primary text-primary-foreground'
                              : esDomingo
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : 'bg-background hover:bg-muted'
                          }`}
                          onClick={() => handleDiaToggle(dia)}
                        >
                          <Checkbox
                            checked={estaSeleccionado}
                            onCheckedChange={() => handleDiaToggle(dia)}
                            className="mb-1"
                          />
                          <span className="text-xs font-medium">{dia}</span>
                          <span className="text-[10px] opacity-70">
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemana]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Input
                    id="observaciones"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Notas sobre los descansos (opcional)"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {diasSeleccionados.length > 0
                      ? `${diasSeleccionados.length} día(s) de descanso seleccionado(s): ${diasSeleccionados.join(', ')}`
                      : 'No hay días de descanso seleccionados'}
                  </div>
                  <Button 
                    onClick={handleGuardar}
                    disabled={actualizarAreasMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {actualizarAreasMutation.isPending ? 'Guardando...' : 'Guardar Todo'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Selecciona un empleado para configurar sus áreas permitidas y días de descanso
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

