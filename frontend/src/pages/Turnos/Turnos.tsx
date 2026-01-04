import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { turnosService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Clock, Moon, Sun, Loader2 } from 'lucide-react';
import type { Turno } from '@/types/api.types';
import { GestionTurno } from '@/components/turnos/GestionTurno';
import { toast } from 'sonner';

export default function Turnos() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [turnoAEditar, setTurnoAEditar] = useState<Turno | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['turnos', soloActivos],
    queryFn: () => turnosService.listar({ estado: soloActivos ? true : undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => turnosService.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnos'] });
      toast.success('Turno eliminado');
    },
    onError: () => toast.error('Error al eliminar el turno')
  });

  const listaTurnos = Array.isArray(response) ? response : response?.data || [];

  const turnosFiltrados = listaTurnos.filter((turno: any) => {
    if (busqueda === '') return true;
    // Usamos tipo_turno que es el nombre real en tu BD
    return turno.tipo_turno?.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Turnos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configuración de turnos laborales</p>
        </div>
        <Button onClick={() => { setTurnoAEditar(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo Turno
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por tipo (T1, Diurno...)"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={soloActivos ? 'default' : 'outline'}
              onClick={() => setSoloActivos(!soloActivos)}
            >
              {soloActivos ? 'Solo Activos' : 'Todos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Turnos ({turnosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
              <p className="text-gray-500 mt-4">Cargando turnos...</p>
            </div>
          ) : turnosFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                  {turnosFiltrados.map((turno: any) => (
                    <tr key={turno.id_turno} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 mr-2 text-orange-500" />
                          <span className="text-sm font-bold font-mono">{turno.tipo_turno}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">{turno.hora_entrada.split('T')[1]?.substring(0, 5) || turno.hora_entrada} - {turno.hora_salida.split('T')[1]?.substring(0, 5) || turno.hora_salida}</div>
                        <div className="text-xs text-gray-500">{turno.duracion_horas} horas</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${turno.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {turno.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setTurnoAEditar(turno); setIsFormOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirm('¿Eliminar?') && deleteMutation.mutate(turno.id_turno)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron turnos</p>
            </div>
          )}
        </CardContent>
      </Card>

      <GestionTurno
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        turnoEditar={turnoAEditar}
        onSuccess={() => { setTurnoAEditar(null); queryClient.invalidateQueries({ queryKey: ['turnos'] }); }}
      />
    </div>
  );
}