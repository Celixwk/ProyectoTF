import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock, FileText, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency, formatTime } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: estadisticas, isLoading: eLoading } = useQuery({
    queryKey: ['dashboard-estadisticas'],
    queryFn: dashboardService.obtenerEstadisticas,
  });

  const { data: turnosHoy, isLoading: tLoading } = useQuery({
    queryKey: ['turnos-hoy'],
    queryFn: dashboardService.obtenerTurnosHoy,
  });

  const { data: recargos, isLoading: rLoading } = useQuery({
    queryKey: ['recargos-por-mes', new Date().getFullYear()],
    queryFn: () => dashboardService.obtenerRecargosPorMes(new Date().getFullYear()),
  });

  const { data: empleados, isLoading: emLoading } = useQuery({
    queryKey: ['empleados-activos'],
    queryFn: () => dashboardService.obtenerEmpleadosActivos({ limite: 5 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Vista general del sistema de nómina</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {eLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
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
                <div className="text-2xl font-bold">{estadisticas?.empleadosActivos || 0}</div>
                <p className="text-xs text-muted-foreground">Personal en sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{turnosHoy?.length || 0}</div>
                <p className="text-xs text-muted-foreground">programados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Áreas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas?.areasRegistradas || 0}</div>
                <p className="text-xs text-muted-foreground">activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tipos de Turno</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estadisticas?.turnosActivos || 0}</div>
                <p className="text-xs text-muted-foreground">configurados</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Recargos por Mes</CardTitle></CardHeader>
          <CardContent>
            {rLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={recargos || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombreMes" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="totalDinero" fill="#3b82f6" name="Total ($)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Empleados Más Activos</CardTitle></CardHeader>
          <CardContent>
            {emLoading ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="space-y-4">
                {empleados?.map((emp: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</div>
                      <div>
                        <p className="text-sm font-medium">{emp.nombre1} {emp.apellido1}</p>
                        <p className="text-xs text-gray-500">{emp.cargo?.nombre_cargo || 'Sin cargo'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Turnos de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {tLoading ? <Skeleton className="h-40 w-full" /> : (
            <div className="space-y-3">
              {turnosHoy?.map((turno: any) => (
                <div key={turno.id_detalle_programacion} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{turno.empleado?.nombre1} {turno.empleado?.apellido1}</p>
                    <p className="text-sm text-muted-foreground">{turno.area?.nombre_area}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatTime(turno.turno?.hora_entrada)} - {formatTime(turno.turno?.hora_salida)}</p>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono">{turno.turno?.tipo_turno}</span>
                  </div>
                </div>
              ))}
              {(!turnosHoy || turnosHoy.length === 0) && (
                <p className="text-center text-muted-foreground py-10">No hay turnos programados para hoy</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}