import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vistasService, empleadosService, cargosService, areasService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { EmpleadoForm } from '@/components/forms/EmpleadoForm';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { EmpleadoCompleto } from '@/types/api.types';
import type { EmpleadoFormData } from '@/lib/validations';

export default function Empleados() {
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<boolean | undefined>(true);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<EmpleadoCompleto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState<EmpleadoCompleto | null>(null);
  const queryClient = useQueryClient();

  // Obtener empleados usando la VISTA vw_empleados_completos
  const { data, isLoading } = useQuery({
    queryKey: ['empleados-completos', busqueda, estadoFiltro, page],
    queryFn: () => vistasService.obtenerEmpleadosCompletos({
      busqueda,
      estado: estadoFiltro,
      page,
      limit: 20,
    }),
  });

  // Obtener cargos para formulario
  const { data: cargos } = useQuery({
    queryKey: ['cargos'],
    queryFn: () => cargosService.listar(),
  });

  // Obtener áreas para formulario
  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: () => areasService.listar(),
  });

  // Mutación para crear/actualizar
  const saveMutation = useMutation({
    mutationFn: async (formData: EmpleadoFormData) => {
      if (empleadoSeleccionado) {
        return empleadosService.actualizar(empleadoSeleccionado.id_empleado, formData);
      } else {
        return empleadosService.crear(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados-completos'] });
      toast.success(
        empleadoSeleccionado
          ? 'Empleado actualizado exitosamente'
          : 'Empleado creado exitosamente'
      );
      setDialogOpen(false);
      setEmpleadoSeleccionado(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al guardar empleado');
    },
  });

  // Mutación para eliminar/desactivar
  const eliminarMutation = useMutation({
    mutationFn: (id: number) => empleadosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados-completos'] });
      toast.success('Empleado desactivado exitosamente');
      setDeleteDialogOpen(false);
      setEmpleadoAEliminar(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al desactivar empleado');
    },
  });

  const handleNuevoEmpleado = () => {
    setEmpleadoSeleccionado(null);
    setDialogOpen(true);
  };

  const handleEditarEmpleado = (empleado: EmpleadoCompleto) => {
    setEmpleadoSeleccionado(empleado);
    setDialogOpen(true);
  };

  const handleEliminarClick = (empleado: EmpleadoCompleto) => {
    setEmpleadoAEliminar(empleado);
    setDeleteDialogOpen(true);
  };

  const handleEliminarConfirmado = () => {
    if (empleadoAEliminar) {
      eliminarMutation.mutate(empleadoAEliminar.id_empleado);
    }
  };

  const empleados = data?.empleados || [];
  const paginacion = data?.paginacion;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Empleados
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestión de empleados del sistema
          </p>
        </div>
        <Button onClick={handleNuevoEmpleado}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={estadoFiltro === true ? 'default' : 'outline'}
                onClick={() => setEstadoFiltro(true)}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Activos
              </Button>
              <Button
                variant={estadoFiltro === false ? 'default' : 'outline'}
                onClick={() => setEstadoFiltro(false)}
              >
                <UserX className="h-4 w-4 mr-2" />
                Inactivos
              </Button>
              <Button
                variant={estadoFiltro === undefined ? 'default' : 'outline'}
                onClick={() => setEstadoFiltro(undefined)}
              >
                Todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Listado de Empleados ({paginacion?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                  <Skeleton className="h-4 w-1/6" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {empleados.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron empleados</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Cédula</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Salario Base</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empleados.map((empleado: EmpleadoCompleto) => (
                        <TableRow key={empleado.id_empleado}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {empleado.nombre_completo
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">
                                  {empleado.nombre_completo}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {empleado.sexo === 'M'
                                    ? 'Masculino'
                                    : empleado.sexo === 'F'
                                    ? 'Femenino'
                                    : '-'}
                                  {empleado.edad ? ` • ${empleado.edad} años` : ''}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono">{empleado.cedula}</div>
                            {empleado.vehiculo && (
                              <div className="text-xs text-muted-foreground">
                                🚗 {empleado.vehiculo}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{empleado.nombre_cargo}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(empleado.salario_base)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                empleado.estado
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {empleado.estado ? 'Activo' : 'Inactivo'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditarEmpleado(empleado)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog
                                open={
                                  deleteDialogOpen &&
                                  empleadoAEliminar?.id_empleado === empleado.id_empleado
                                }
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setDeleteDialogOpen(false);
                                    setEmpleadoAEliminar(null);
                                  }
                                }}
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEliminarClick(empleado)}
                                    title="Desactivar"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      ¿Estás seguro de desactivar este empleado?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción desactivará al empleado{' '}
                                      <strong>{empleado.nombre_completo}</strong>. El empleado
                                      ya no aparecerá en las listas activas, pero su información
                                      se mantendrá en el sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleEliminarConfirmado}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {eliminarMutation.isPending
                                        ? 'Desactivando...'
                                        : 'Desactivar'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {paginacion && paginacion.totalPaginas > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * paginacion.limite + 1} -{' '}
                    {Math.min(page * paginacion.limite, paginacion.total)} de{' '}
                    {paginacion.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPage((p) => Math.min(paginacion.totalPaginas, p + 1))
                      }
                      disabled={page === paginacion.totalPaginas}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <EmpleadoForm
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEmpleadoSeleccionado(null);
          }
        }}
        onSubmit={async (data) => {
          await saveMutation.mutateAsync(data);
        }}
        empleado={empleadoSeleccionado}
        cargos={cargos || []}
        areas={areas || []}
        loading={saveMutation.isPending}
      />
    </div>
  );
}
