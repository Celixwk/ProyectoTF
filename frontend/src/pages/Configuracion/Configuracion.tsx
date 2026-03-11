import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cargosService, areasService, novedadesService, tiposRecargoService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Skeleton } from '@/components/ui/skeleton';
import { CargoForm } from '@/components/forms/CargoForm';
import { AreaForm } from '@/components/forms/AreaForm';
import { TipoNovedadForm } from '@/components/forms/TipoNovedadForm';
import { TipoRecargoForm } from '@/components/forms/TipoRecargoForm';
import { Briefcase, Building2, FileText, Plus, Edit, Trash2, Coins } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Cargo, Area, TipoNovedad, TipoRecargo } from '@/types/api.types';
import type { CargoFormData, AreaFormData, TipoNovedadFormData, TipoRecargoFormData } from '@/lib/validations';

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState('cargos');
  const queryClient = useQueryClient();

  // Estados para diálogos de Cargos
  const [cargoDialogOpen, setCargoDialogOpen] = useState(false);
  const [cargoSeleccionado, setCargoSeleccionado] = useState<Cargo | null>(null);
  const [cargoDeleteDialogOpen, setCargoDeleteDialogOpen] = useState(false);
  const [cargoAEliminar, setCargoAEliminar] = useState<Cargo | null>(null);

  // Estados para diálogos de Áreas
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [areaSeleccionada, setAreaSeleccionada] = useState<Area | null>(null);
  const [areaDeleteDialogOpen, setAreaDeleteDialogOpen] = useState(false);
  const [areaAEliminar, setAreaAEliminar] = useState<Area | null>(null);

  // Estados para diálogos de Tipos de Novedad
  const [tipoNovedadDialogOpen, setTipoNovedadDialogOpen] = useState(false);
  const [tipoNovedadSeleccionado, setTipoNovedadSeleccionado] = useState<TipoNovedad | null>(null);
  const [tipoNovedadDeleteDialogOpen, setTipoNovedadDeleteDialogOpen] = useState(false);
  const [tipoNovedadAEliminar, setTipoNovedadAEliminar] = useState<TipoNovedad | null>(null);

  // Estados para diálogos de Tipos de Recargo
  const [tipoRecargoDialogOpen, setTipoRecargoDialogOpen] = useState(false);
  const [tipoRecargoSeleccionado, setTipoRecargoSeleccionado] = useState<TipoRecargo | null>(null);
  const [tipoRecargoDeleteDialogOpen, setTipoRecargoDeleteDialogOpen] = useState(false);
  const [tipoRecargoAEliminar, setTipoRecargoAEliminar] = useState<TipoRecargo | null>(null);

  // Obtener datos
  const { data: cargos, isLoading: cargosLoading } = useQuery({
    queryKey: ['cargos'],
    queryFn: () => cargosService.listar(),
  });

  const { data: areas, isLoading: areasLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: () => areasService.listar(),
  });

  const { data: tiposNovedad, isLoading: tiposNovedadLoading } = useQuery({
    queryKey: ['tipos-novedades'],
    queryFn: () => novedadesService.listarTipos(),
  });

  const { data: tiposRecargo, isLoading: tiposRecargoLoading } = useQuery({
    queryKey: ['tipos-recargo'],
    queryFn: () => tiposRecargoService.listar(),
  });

  // Mutaciones para Cargos
  const cargoSaveMutation = useMutation({
    mutationFn: async (data: CargoFormData) => {
      const payload = {
        ...data,
        salario_base: data.salario_base.toString(),
      };
      if (cargoSeleccionado) {
        return cargosService.actualizar(cargoSeleccionado.id_cargo, payload);
      } else {
        return cargosService.crear(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      toast.success(
        cargoSeleccionado ? 'Cargo actualizado exitosamente' : 'Cargo creado exitosamente'
      );
      setCargoDialogOpen(false);
      setCargoSeleccionado(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al guardar cargo');
    },
  });

  const cargoDeleteMutation = useMutation({
    mutationFn: (id: number) => cargosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
      toast.success('Cargo eliminado exitosamente');
      setCargoDeleteDialogOpen(false);
      setCargoAEliminar(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al eliminar cargo');
    },
  });

  // Mutaciones para Áreas
  const areaSaveMutation = useMutation({
    mutationFn: async (data: AreaFormData) => {
      if (areaSeleccionada) {
        return areasService.actualizar(areaSeleccionada.id_area, data);
      } else {
        return areasService.crear(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success(
        areaSeleccionada ? 'Área actualizada exitosamente' : 'Área creada exitosamente'
      );
      setAreaDialogOpen(false);
      setAreaSeleccionada(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al guardar área');
    },
  });

  const areaDeleteMutation = useMutation({
    mutationFn: (id: number) => areasService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast.success('Área eliminada exitosamente');
      setAreaDeleteDialogOpen(false);
      setAreaAEliminar(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al eliminar área');
    },
  });

  // Mutaciones para Tipos de Novedad
  const tipoNovedadSaveMutation = useMutation({
    mutationFn: async (data: TipoNovedadFormData) => {
      if (tipoNovedadSeleccionado) {
        return novedadesService.actualizarTipo(tipoNovedadSeleccionado.id_novedad_tipo, data);
      } else {
        return novedadesService.crearTipo(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-novedades'] });
      toast.success(
        tipoNovedadSeleccionado ? 'Tipo de novedad actualizado exitosamente' : 'Tipo de novedad creado exitosamente'
      );
      setTipoNovedadDialogOpen(false);
      setTipoNovedadSeleccionado(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al guardar tipo de novedad');
    },
  });

  const tipoNovedadDeleteMutation = useMutation({
    mutationFn: (id: number) => novedadesService.eliminarTipo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-novedades'] });
      toast.success('Tipo de novedad eliminado exitosamente');
      setTipoNovedadDeleteDialogOpen(false);
      setTipoNovedadAEliminar(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al eliminar tipo de novedad');
    },
  });

  // Mutaciones para Tipos de Recargo
  const tipoRecargoSaveMutation = useMutation({
    mutationFn: async (data: TipoRecargoFormData) => {
      if (tipoRecargoSeleccionado) {
        return tiposRecargoService.actualizar(tipoRecargoSeleccionado.id_recargo_tipo, data);
      } else {
        return tiposRecargoService.crear(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-recargo'] });
      toast.success(
        tipoRecargoSeleccionado ? 'Tipo de recargo actualizado exitosamente' : 'Tipo de recargo creado exitosamente'
      );
      setTipoRecargoDialogOpen(false);
      setTipoRecargoSeleccionado(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al guardar tipo de recargo');
    },
  });

  const tipoRecargoDeleteMutation = useMutation({
    mutationFn: (id: number) => tiposRecargoService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-recargo'] });
      toast.success('Tipo de recargo eliminado exitosamente');
      setTipoRecargoDeleteDialogOpen(false);
      setTipoRecargoAEliminar(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al eliminar tipo de recargo');
    },
  });

  // Handlers Cargos
  const handleNuevoCargo = () => {
    setCargoSeleccionado(null);
    setCargoDialogOpen(true);
  };

  const handleEditarCargo = (cargo: Cargo) => {
    setCargoSeleccionado(cargo);
    setCargoDialogOpen(true);
  };

  const handleEliminarCargo = (cargo: Cargo) => {
    setCargoAEliminar(cargo);
    setCargoDeleteDialogOpen(true);
  };

  // Handlers Áreas
  const handleNuevaArea = () => {
    setAreaSeleccionada(null);
    setAreaDialogOpen(true);
  };

  const handleEditarArea = (area: Area) => {
    setAreaSeleccionada(area);
    setAreaDialogOpen(true);
  };

  const handleEliminarArea = (area: Area) => {
    setAreaAEliminar(area);
    setAreaDeleteDialogOpen(true);
  };

  // Handlers Tipos de Novedad
  const handleNuevoTipoNovedad = () => {
    setTipoNovedadSeleccionado(null);
    setTipoNovedadDialogOpen(true);
  };

  const handleEditarTipoNovedad = (tipoNovedad: TipoNovedad) => {
    setTipoNovedadSeleccionado(tipoNovedad);
    setTipoNovedadDialogOpen(true);
  };

  const handleEliminarTipoNovedad = (tipoNovedad: TipoNovedad) => {
    setTipoNovedadAEliminar(tipoNovedad);
    setTipoNovedadDeleteDialogOpen(true);
  };

  // Handlers Tipos de Recargo
  const handleNuevoTipoRecargo = () => {
    setTipoRecargoSeleccionado(null);
    setTipoRecargoDialogOpen(true);
  };

  const handleEditarTipoRecargo = (tipoRecargo: TipoRecargo) => {
    setTipoRecargoSeleccionado(tipoRecargo);
    setTipoRecargoDialogOpen(true);
  };

  const handleEliminarTipoRecargo = (tipoRecargo: TipoRecargo) => {
    setTipoRecargoAEliminar(tipoRecargo);
    setTipoRecargoDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Configuración
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gestión de parámetros del sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cargos">
            <Briefcase className="h-4 w-4 mr-2" />
            Cargos
          </TabsTrigger>
          <TabsTrigger value="areas">
            <Building2 className="h-4 w-4 mr-2" />
            Áreas
          </TabsTrigger>
          <TabsTrigger value="novedades">
            <FileText className="h-4 w-4 mr-2" />
            Novedades
          </TabsTrigger>
          <TabsTrigger value="recargos">
            <Coins className="h-4 w-4 mr-2" />
            Recargos
          </TabsTrigger>
        </TabsList>

        {/* Cargos Tab */}
        <TabsContent value="cargos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cargos</CardTitle>
              <Button onClick={handleNuevoCargo}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cargo
              </Button>
            </CardHeader>
            <CardContent>
              {cargosLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : cargos && cargos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cargos.map((cargo: Cargo) => (
                    <Card key={cargo.id_cargo}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">{cargo.nombre_cargo}</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditarCargo(cargo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog
                              open={
                                cargoDeleteDialogOpen &&
                                cargoAEliminar?.id_cargo === cargo.id_cargo
                              }
                              onOpenChange={(open) => {
                                if (!open) {
                                  setCargoDeleteDialogOpen(false);
                                  setCargoAEliminar(null);
                                }
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEliminarCargo(cargo)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Estás seguro de eliminar este cargo?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará el cargo{' '}
                                    <strong>{cargo.nombre_cargo}</strong>. Esta acción no se puede
                                    deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      cargoAEliminar &&
                                      cargoDeleteMutation.mutate(cargoAEliminar.id_cargo)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {cargoDeleteMutation.isPending
                                      ? 'Eliminando...'
                                      : 'Eliminar'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(cargo.salario_base)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Salario base</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay cargos registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Áreas Tab */}
        <TabsContent value="areas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Áreas</CardTitle>
              <Button onClick={handleNuevaArea}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Área
              </Button>
            </CardHeader>
            <CardContent>
              {areasLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <Skeleton className="h-6 w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : areas && areas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map((area: Area) => (
                    <Card key={area.id_area}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">{area.nombre_area}</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditarArea(area)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog
                              open={
                                areaDeleteDialogOpen &&
                                areaAEliminar?.id_area === area.id_area
                              }
                              onOpenChange={(open) => {
                                if (!open) {
                                  setAreaDeleteDialogOpen(false);
                                  setAreaAEliminar(null);
                                }
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEliminarArea(area)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Estás seguro de eliminar esta área?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará el área{' '}
                                    <strong>{area.nombre_area}</strong>. Esta acción no se puede
                                    deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      areaAEliminar &&
                                      areaDeleteMutation.mutate(areaAEliminar.id_area)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {areaDeleteMutation.isPending
                                      ? 'Eliminando...'
                                      : 'Eliminar'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay áreas registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Novedades Tab */}
        <TabsContent value="novedades" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tipos de Novedad</CardTitle>
              <Button onClick={handleNuevoTipoNovedad}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Tipo
              </Button>
            </CardHeader>
            <CardContent>
              {tiposNovedadLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <Skeleton className="h-6 w-1/4 mb-2" />
                        <Skeleton className="h-4 w-1/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : tiposNovedad && tiposNovedad.length > 0 ? (
                <div className="space-y-4">
                  {tiposNovedad.map((tipo: TipoNovedad) => (
                    <Card key={tipo.id_novedad_tipo}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-bold text-lg">{tipo.codigo}</span>
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                                {tipo.nombre_novedad}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs ${tipo.afecta_pago
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  }`}
                              >
                                {tipo.afecta_pago ? 'Afecta pago' : 'No afecta pago'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditarTipoNovedad(tipo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog
                              open={
                                tipoNovedadDeleteDialogOpen &&
                                tipoNovedadAEliminar?.id_novedad_tipo === tipo.id_novedad_tipo
                              }
                              onOpenChange={(open) => {
                                if (!open) {
                                  setTipoNovedadDeleteDialogOpen(false);
                                  setTipoNovedadAEliminar(null);
                                }
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEliminarTipoNovedad(tipo)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Estás seguro de eliminar este tipo de novedad?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará el tipo de novedad{' '}
                                    <strong>{tipo.nombre_novedad}</strong> ({tipo.codigo}). Esta acción no se puede
                                    deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      tipoNovedadAEliminar &&
                                      tipoNovedadDeleteMutation.mutate(tipoNovedadAEliminar.id_novedad_tipo)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {tipoNovedadDeleteMutation.isPending
                                      ? 'Eliminando...'
                                      : 'Eliminar'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay tipos de novedad registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        {/* Recargos Tab */}
        <TabsContent value="recargos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tipos de Recargo</CardTitle>
              <Button onClick={handleNuevoTipoRecargo}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Tipo
              </Button>
            </CardHeader>
            <CardContent>
              {tiposRecargoLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <Skeleton className="h-6 w-1/4 mb-2" />
                        <Skeleton className="h-4 w-1/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : tiposRecargo && tiposRecargo.length > 0 ? (
                <div className="space-y-4">
                  {tiposRecargo.map((tipo: TipoRecargo) => (
                    <Card key={tipo.id_recargo_tipo}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-mono font-bold text-lg">{tipo.codigo}</span>
                              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded text-xs">
                                {tipo.nombre_recargo}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs ${tipo.activo
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}
                              >
                                {tipo.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Porcentaje: {tipo.porcentaje_recargo}% {tipo.descripcion ? `- ${tipo.descripcion}` : ''}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditarTipoRecargo(tipo)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog
                              open={
                                tipoRecargoDeleteDialogOpen &&
                                tipoRecargoAEliminar?.id_recargo_tipo === tipo.id_recargo_tipo
                              }
                              onOpenChange={(open) => {
                                if (!open) {
                                  setTipoRecargoDeleteDialogOpen(false);
                                  setTipoRecargoAEliminar(null);
                                }
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEliminarTipoRecargo(tipo)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Estás seguro de eliminar este tipo de recargo?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará el tipo de recargo{' '}
                                    <strong>{tipo.nombre_recargo}</strong> ({tipo.codigo}). Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      tipoRecargoAEliminar &&
                                      tipoRecargoDeleteMutation.mutate(tipoRecargoAEliminar.id_recargo_tipo)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {tipoRecargoDeleteMutation.isPending
                                      ? 'Eliminando...'
                                      : 'Eliminar'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay tipos de recargo registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Dialogs */}
      <CargoForm
        open={cargoDialogOpen}
        onOpenChange={(open) => {
          setCargoDialogOpen(open);
          if (!open) setCargoSeleccionado(null);
        }}
        onSubmit={async (data) => {
          await cargoSaveMutation.mutateAsync(data);
        }}
        cargo={cargoSeleccionado}
        loading={cargoSaveMutation.isPending}
      />

      <AreaForm
        open={areaDialogOpen}
        onOpenChange={(open) => {
          setAreaDialogOpen(open);
          if (!open) setAreaSeleccionada(null);
        }}
        onSubmit={async (data) => {
          await areaSaveMutation.mutateAsync(data);
        }}
        area={areaSeleccionada}
        loading={areaSaveMutation.isPending}
      />

      <TipoNovedadForm
        open={tipoNovedadDialogOpen}
        onOpenChange={(open) => {
          setTipoNovedadDialogOpen(open);
          if (!open) setTipoNovedadSeleccionado(null);
        }}
        onSubmit={async (data) => {
          await tipoNovedadSaveMutation.mutateAsync(data);
        }}
        tipoNovedad={tipoNovedadSeleccionado}
        loading={tipoNovedadSaveMutation.isPending}
      />


      <TipoRecargoForm
        open={tipoRecargoDialogOpen}
        onOpenChange={(open) => {
          setTipoRecargoDialogOpen(open);
          if (!open) setTipoRecargoSeleccionado(null);
        }}
        onSubmit={async (data) => {
          await tipoRecargoSaveMutation.mutateAsync(data);
        }}
        tipoRecargo={tipoRecargoSeleccionado}
        loading={tipoRecargoSaveMutation.isPending}
      />
    </div >
  );
}
