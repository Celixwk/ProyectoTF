import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vistasService, empleadosService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import type { NovedadCompleta } from '@/types/api.types';

export default function Novedades() {
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );
  const [idEmpleado, setIdEmpleado] = useState<number | undefined>();
  const [etapa, setEtapa] = useState<string | undefined>();

  // Obtener novedades usando la VISTA vw_novedades_completas
  const { data, isLoading } = useQuery({
    queryKey: ['novedades-completas', fechaInicio, fechaFin, idEmpleado, etapa],
    queryFn: () => vistasService.obtenerNovedadesCompletas({
      inicio: fechaInicio,
      fin: fechaFin,
      id_empleado: idEmpleado,
      etapa,
    }),
  });

  // Obtener empleados activos para filtro
  const { data: empleados } = useQuery({
    queryKey: ['empleados-activos'],
    queryFn: () => empleadosService.obtenerActivos(),
  });

  const novedades = data?.novedades || [];

  const getEtapaIcon = (etapa: string) => {
    switch (etapa) {
      case 'Aprobada':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Rechazada':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Finalizada':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getEtapaColor = (etapa: string) => {
    switch (etapa) {
      case 'Aprobada':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Rechazada':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Finalizada':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Novedades
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestión de novedades laborales
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Novedad
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Empleado</label>
              <select
                value={idEmpleado || ''}
                onChange={(e) => setIdEmpleado(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Todos</option>
                {empleados?.map((emp: any) => (
                  <option key={emp.id_empleado} value={emp.id_empleado}>
                    {emp.nombre1} {emp.apellido1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Etapa</label>
              <select
                value={etapa || ''}
                onChange={(e) => setEtapa(e.target.value || undefined)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Todas</option>
                <option value="Solicitada">Solicitada</option>
                <option value="En Revision">En Revisión</option>
                <option value="Aprobada">Aprobada</option>
                <option value="Rechazada">Rechazada</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Novedades ({novedades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando novedades...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fechas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Etapa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observaciones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                  {novedades.map((novedad: NovedadCompleta) => (
                    <tr key={novedad.id_novedad_registro} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {novedad.empleado}
                        </div>
                        <div className="text-xs text-gray-500">{novedad.cedula}</div>
                        <div className="text-xs text-gray-500">{novedad.nombre_cargo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {novedad.tipo || 'Sin tipo'}
                        </div>
                        {novedad.codigo_novedad && (
                          <div className="text-xs text-gray-500 font-mono">
                            {novedad.codigo_novedad}
                          </div>
                        )}
                        {novedad.afecta_pago !== null && (
                          <div className="text-xs">
                            {novedad.afecta_pago ? (
                              <span className="text-red-600">Afecta pago</span>
                            ) : (
                              <span className="text-green-600">No afecta pago</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          Inicio: {formatDateShort(novedad.fecha_inicio || novedad.fecha_registro)}
                        </div>
                        {novedad.fecha_vencimiento && (
                          <div className="text-xs text-gray-500">
                            Vence: {formatDateShort(novedad.fecha_vencimiento)}
                          </div>
                        )}
                        {novedad.cantidad && (
                          <div className="text-xs text-gray-500">
                            Cantidad: {novedad.cantidad}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getEtapaColor(novedad.etapa)}`}>
                          {getEtapaIcon(novedad.etapa)}
                          {novedad.etapa.charAt(0).toUpperCase() + novedad.etapa.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {novedad.observaciones || '-'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Por: {novedad.usuario_registro}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {novedad.etapa === 'Solicitada' && (
                            <>
                              <Button variant="ghost" size="sm" className="text-green-600">
                                Aprobar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600">
                                Rechazar
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {novedades.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron novedades</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

