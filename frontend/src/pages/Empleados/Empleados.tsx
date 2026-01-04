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
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmpleadoForm } from '@/components/forms/EmpleadoForm';
import { Plus, Search, Edit, Trash2, User, BadgeCheck, ShieldAlert } from 'lucide-react';
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

  const { data, isLoading } = useQuery({
    queryKey: ['empleados-completos', busqueda, estadoFiltro, page],
    queryFn: () => vistasService.obtenerEmpleadosCompletos({
      busqueda,
      estado: estadoFiltro,
      page,
      limit: 20,
    }),
  });

  const { data: cargos } = useQuery({
    queryKey: ['cargos'],
    queryFn: () => cargosService.listar(),
  });

  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: () => areasService.listar(),
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: EmpleadoFormData) => {
      const payload = {
        ...formData,
        edad: formData.edad || null,
        areas_permitidas: formData.areas_permitidas || []
      };

      if (empleadoSeleccionado) {
        return empleadosService.actualizar(empleadoSeleccionado.id_empleado, payload);
      } else {
        return empleadosService.crear(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados-completos'] });
      toast.success(empleadoSeleccionado ? 'Empleado actualizado' : 'Empleado creado');
      setDialogOpen(false);
      setEmpleadoSeleccionado(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al guardar');
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) => empleadosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empleados-completos'] });
      toast.success('Empleado desactivado');
      setDeleteDialogOpen(false);
      setEmpleadoAEliminar(null);
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

  const handleEliminarConfirmado = () => {
    if (empleadoAEliminar) {
      eliminarMutation.mutate(empleadoAEliminar.id_empleado);
    }
  };

  const empleados = data?.empleados || [];
  const paginacion = data?.paginacion;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empleados</h1>
          <p className="text-gray-500 mt-1">Gestión de empleados del sistema</p>
        </div>
        <Button onClick={handleNuevoEmpleado}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

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
              <Button variant={estadoFiltro === true ? 'default' : 'outline'} onClick={() => setEstadoFiltro(true)}>Activos</Button>
              <Button variant={estadoFiltro === false ? 'default' : 'outline'} onClick={() => setEstadoFiltro(false)}>Inactivos</Button>
              <Button variant={estadoFiltro === undefined ? 'default' : 'outline'} onClick={() => setEstadoFiltro(undefined)}>Todos</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Empleados ({paginacion?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
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
                  {empleados.map((empleado) => (
                    <TableRow key={empleado.id_empleado}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span>{empleado.nombre_completo}</span>
                        </div>
                      </TableCell>
                      <TableCell>{empleado.cedula}</TableCell>
                      <TableCell>{empleado.nombre_cargo}</TableCell>
                      <TableCell>{formatCurrency(empleado.salario_base)}</TableCell>
                      <TableCell>
                        {empleado.estado ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <BadgeCheck className="h-4 w-4" /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <ShieldAlert className="h-4 w-4" /> Inactivo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditarEmpleado(empleado)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEmpleadoAEliminar(empleado); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EmpleadoForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={async (data) => { await saveMutation.mutateAsync(data); }}
        empleado={empleadoSeleccionado}
        cargos={cargos || []}
        areas={areas || []}
        loading={saveMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar empleado?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción desactivará a {empleadoAEliminar?.nombre_completo}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminarConfirmado}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}