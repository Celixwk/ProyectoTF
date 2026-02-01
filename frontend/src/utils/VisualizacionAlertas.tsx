// # VISUALIZACIÓN ALERTAS
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Alerta {
    tipo: 'error' | 'advertencia' | 'info' | string;
    mensaje: string;
    codigo?: string;
    area?: number;
    empleado?: number;
    fecha?: string;
}

interface GrupoAlerta {
    fecha: string;
    alertas: Alerta[];
}

interface AlertasProcesadas {
    alertasEmpleados: Alerta[];
    alertasPorArea: Record<number, Alerta[]>;
}

interface Props {
    alertas: GrupoAlerta[];
    areas?: Array<{ id_area: number; nombre_area: string }>;
    mostrarPorArea?: boolean;
    nombreArea?: string;
    idArea?: number;
}

const getIcon = (tipo: string) => {
    switch (tipo) {
        case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'advertencia': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        default: return <Info className="h-4 w-4 text-blue-500" />;
    }
};

const getBgColor = (tipo: string) => {
    switch (tipo) {
        case 'error': return 'bg-red-50 border-red-200';
        case 'advertencia': return 'bg-amber-50 border-amber-200';
        default: return 'bg-blue-50 border-blue-200';
    }
};

const formatearMensajeDeficit = (mensaje: string) => {
    if (mensaje.includes('déficit:')) {
        const match = mensaje.match(/(Área ".*") tiene déficit: (\d+)\/(\d+)/);
        if (match) {
            const [_, area, actual, total] = match;
            const deficitCount = parseInt(total) - parseInt(actual);
            return `Faltan ${deficitCount} personas (Asignados: ${actual} de ${total})`;
        }
    }
    return mensaje;
};

const formatearFecha = (fecha: string) => {
    const [year, month, day] = fecha.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export const procesarAlertas = (alertasMotor: GrupoAlerta[]): AlertasProcesadas => {
    const alertasEmpleados: Alerta[] = [];
    const alertasPorArea: Record<number, Alerta[]> = {};

    if (!Array.isArray(alertasMotor)) return { alertasEmpleados, alertasPorArea };

    alertasMotor.forEach(grupoFecha => {
        if (!grupoFecha?.alertas || !Array.isArray(grupoFecha.alertas)) return;

        grupoFecha.alertas.forEach((alerta: Alerta) => {
            if (alerta.mensaje?.includes('REFUERZOS')) return;

            const alertaConFecha = { ...alerta, fecha: grupoFecha.fecha };

            if (
                alerta.codigo === 'EMPLEADOS_SIN_ASIGNACION' ||
                alerta.codigo === 'DIAS_CONSECUTIVOS_EXCEDIDOS' ||
                alerta.codigo === 'DESCANSOS_FALTANTES' ||
                alerta.codigo === 'DESCANSOS_ADVERTENCIA_PROGRESIVA'
            ) {
                alertasEmpleados.push(alertaConFecha);
            } else if (alerta.area !== undefined && alerta.area !== null) {
                const idArea = Number(alerta.area);
                if (!alertasPorArea[idArea]) {
                    alertasPorArea[idArea] = [];
                }
                alertasPorArea[idArea].push(alertaConFecha);
            }
        });
    });

    return { alertasEmpleados, alertasPorArea };
};

const AlertasEmpleados = ({ alertas }: { alertas: Alerta[] }) => {
    if (!alertas || alertas.length === 0) return null;

    return (
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-3 bg-blue-50/50">
                <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Alertas de Empleados
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {alertas.map((alerta, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col gap-2 p-3 rounded-lg border ${getBgColor(alerta.tipo)}`}
                        >
                            <div className="flex items-start gap-2">
                                <div className="mt-0.5 shrink-0">
                                    {getIcon(alerta.tipo)}
                                </div>
                                <p className="text-[11px] font-semibold text-slate-800 leading-tight flex-1">
                                    {alerta.mensaje}
                                </p>
                            </div>
                            {alerta.fecha && (
                                <div className="text-[9px] text-slate-500 font-medium pl-6">
                                    📅 {formatearFecha(alerta.fecha)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const AlertasArea = ({ alertas, nombreArea }: { alertas: Alerta[], nombreArea: string }) => {
    if (!alertas || alertas.length === 0) return null;

    return (
        <div className="mb-4 p-3 border-l-4 border-l-amber-500 bg-amber-50/30 rounded-lg">
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {alertas.map((alerta, idx) => (
                    <div
                        key={idx}
                        className={`flex flex-col gap-2 p-2 rounded-lg border ${getBgColor(alerta.tipo)}`}
                    >
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 shrink-0">
                                {getIcon(alerta.tipo)}
                            </div>
                            <p className="text-[11px] font-semibold text-slate-800 leading-tight flex-1">
                                {formatearMensajeDeficit(alerta.mensaje)}
                            </p>
                        </div>
                        {alerta.fecha && (
                            <div className="text-[9px] text-slate-500 font-medium pl-6">
                                📅 {formatearFecha(alerta.fecha)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const VisualizacionAlertas = ({ alertas, areas, mostrarPorArea = false, nombreArea, idArea }: Props) => {
    if (!alertas || alertas.length === 0) return null;

    const { alertasEmpleados, alertasPorArea } = procesarAlertas(alertas);

    if (mostrarPorArea && idArea !== undefined) {
        const alertasDeArea = alertasPorArea[idArea];
        if (!alertasDeArea || alertasDeArea.length === 0) return null;

        return <AlertasArea alertas={alertasDeArea} nombreArea={nombreArea || `Área ${idArea}`} />;
    }

    if (!mostrarPorArea) {
        return (
            <>
                {alertasEmpleados.length > 0 && <AlertasEmpleados alertas={alertasEmpleados} />}

                {areas && areas.map((area) => {
                    const alertasDeArea = alertasPorArea[area.id_area];
                    if (!alertasDeArea || alertasDeArea.length === 0) return null;

                    return (
                        <div key={area.id_area} className="space-y-2">
                            <AlertasArea alertas={alertasDeArea} nombreArea={area.nombre_area} />
                        </div>
                    );
                })}
            </>
        );
    }

    return null;
};

export { AlertasEmpleados, AlertasArea };