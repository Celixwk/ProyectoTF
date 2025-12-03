import { useQuery } from '@tanstack/react-query';
import { dashboardService, vistasService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock, FileText, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  // Obtener estadísticas generales
  const { data: estadisticas, isLoading: estadisticasLoading } = useQuery({
    queryKey: ['dashboard-estadisticas'],
    queryFn: () => dashboardService.obtenerEstadisticas(),
  });

  // Obtener turnos de hoy usando la VISTA
  const { data: turnosHoy, isLoading: turnosHoyLoading } = useQuery({
    queryKey: ['turnos-hoy'],
    queryFn: () => dashboardService.obtenerTurnosHoy(),
  });

  // Obtener recargos por mes para gráfico
  const { data: recargosPorMes, isLoading: recargosLoading } = useQuery({
    queryKey: ['recargos-por-mes', new Date().getFullYear()],
    queryFn: () => dashboardService.obtenerRecargosPorMes(new Date().getFullYear()),
  });

  // Obtener empleados más activos
  const { data: empleadosActivos, isLoading: empleadosActivosLoading } = useQuery({
    queryKey: ['empleados-activos'],
    queryFn: () => dashboardService.obtenerEmpleadosActivos({ limite: 5 }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Vista general del sistema de nómina
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {estadisticasLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.empleados.activos || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  de {estadisticas?.empleados.total || 0} totales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.operacion.turnosHoy || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  turnos programados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Novedades Pendientes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {estadisticas?.operacion.novedadesPendientes || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  requieren aprobación
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recargos Mes Actual</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(estadisticas?.operacion.recargosMesActual || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  total del mes
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Recargos por Mes */}
        <Card>
          <CardHeader>
            <CardTitle>Recargos por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            {recargosLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={recargosPorMes?.recargosPorMes || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombreMes" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="totalDinero" fill="#3b82f6" name="Total ($)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Empleados Más Activos */}
        <Card>
          <CardHeader>
            <CardTitle>Empleados Más Activos</CardTitle>
          </CardHeader>
          <CardContent>
            {empleadosActivosLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-4 w-16 ml-auto" />
                      <Skeleton className="h-3 w-12 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {empleadosActivos?.map((empleado: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{empleado.nombre_completo}</p>
                        <p className="text-xs text-gray-500">{empleado.nombre_cargo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{empleado.total_turnos} turnos</p>
                      <p className="text-xs text-gray-500">{empleado.total_horas}h</p>
                    </div>
                  </div>
                ))}
                {(!empleadosActivos || empleadosActivos.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No hay datos disponibles
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Turnos de Hoy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Turnos de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {turnosHoyLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="text-center px-4">
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-24 ml-auto" />
                    <Skeleton className="h-3 w-20 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {turnosHoy?.map((turno: any) => (
                <div
                  key={turno.id_detalle_turno}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {turno.labor_mes?.empleado?.nombre1} {turno.labor_mes?.empleado?.apellido1}
                    </p>
                    <p className="text-sm text-gray-500">
                      {turno.labor_mes?.empleado?.cargo?.nombre_cargo}
                    </p>
                  </div>
                  <div className="text-center px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {turno.turno?.codigo}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatTime(turno.turno?.hora_entrada)} - {formatTime(turno.turno?.hora_salida)}
                    </p>
                    <p className="text-xs text-gray-500">{turno.area?.nombre_area}</p>
                  </div>
                </div>
              ))}
              {(!turnosHoy || turnosHoy.length === 0) && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay turnos programados para hoy</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

