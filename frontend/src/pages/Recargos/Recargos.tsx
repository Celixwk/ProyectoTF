import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vistasService, empleadosService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, Filter, Calculator } from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import type { RecargoCompleto } from '@/types/api.types';

export default function Recargos() {
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );
  const [idEmpleado, setIdEmpleado] = useState<number | undefined>();

  // Obtener recargos usando la VISTA vw_recargos_completos
  const { data, isLoading } = useQuery({
    queryKey: ['recargos-completos', fechaInicio, fechaFin, idEmpleado],
    queryFn: () => vistasService.obtenerRecargosCompletos({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      id_empleado: idEmpleado,
    }),
  });

  // Obtener empleados activos para filtro
  const { data: empleados } = useQuery({
    queryKey: ['empleados-activos'],
    queryFn: () => empleadosService.obtenerActivos(),
  });

  const recargos = data?.recargos || [];

  // Calcular totales
  const totales = recargos.reduce(
    (acc: any, recargo: RecargoCompleto) => ({
      horas: acc.horas + parseFloat(recargo.total_horas || '0'),
      dinero: acc.dinero + parseFloat(recargo.total_dinero || '0'),
    }),
    { horas: 0, dinero: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Recargos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Cálculo y gestión de recargos laborales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Recargos
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recargos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totales.dinero)}</div>
            <p className="text-xs text-muted-foreground">
              {recargos.length} registro(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Horas</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totales.horas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">horas extras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Empleado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recargos.length > 0
                ? formatCurrency(totales.dinero / new Set(recargos.map((r: RecargoCompleto) => r.id_empleado)).size)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Set(recargos.map((r: RecargoCompleto) => r.id_empleado)).size} empleado(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="">Todos los empleados</option>
                {empleados?.map((emp: any) => (
                  <option key={emp.id_empleado} value={emp.id_empleado}>
                    {emp.nombre1} {emp.apellido1}
                  </option>
                ))}
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
          <CardTitle>Listado de Recargos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando recargos...</p>
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
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Turno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detalle
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                  {recargos.map((recargo: RecargoCompleto) => (
                    <tr key={recargo.id_recargo} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {recargo.nombre_completo}
                        </div>
                        <div className="text-xs text-gray-500">{recargo.cedula}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDateShort(recargo.fecha)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {recargo.codigo_turno}
                        </div>
                        <div className="text-xs text-gray-500">
                          {recargo.hora_entrada} - {recargo.hora_salida}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {recargo.total_horas} h
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(recargo.total_dinero)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          {recargo.rno !== '0' && <div>RNO: {recargo.rno}</div>}
                          {recargo.rnf !== '0' && <div>RNF: {recargo.rnf}</div>}
                          {recargo.heon !== '0' && <div>HEON: {recargo.heon}</div>}
                          {recargo.heod !== '0' && <div>HEOD: {recargo.heod}</div>}
                          {recargo.hefd !== '0' && <div>HEFD: {recargo.hefd}</div>}
                          {recargo.hefn !== '0' && <div>HEFN: {recargo.hefn}</div>}
                          {recargo.dominicales > 0 && <div>Dom: {recargo.dominicales}</div>}
                          {recargo.festivos > 0 && <div>Fest: {recargo.festivos}</div>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {recargos.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron recargos</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

