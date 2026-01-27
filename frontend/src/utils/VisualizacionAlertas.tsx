import { AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Alerta {
    tipo: 'error' | 'advertencia' | 'info' | string;
    mensaje: string;
}

interface GrupoAlerta {
    fecha: string;
    alertas: Alerta[];
}

interface Props {
    alertas: GrupoAlerta[];
}

export const VisualizacionAlertas = ({ alertas }: Props) => {
    if (!alertas || alertas.length === 0) return null;

    const filtrarYFormatearAlertas = (lista: Alerta[]) => {
        return lista
            .filter(alerta => !alerta.mensaje.includes('REFUERZOS'))
            .map(alerta => {
                if (alerta.mensaje.includes('déficit:')) {
                    const match = alerta.mensaje.match(/(Área ".*") tiene déficit: (\d+)\/(\d+)/);
                    if (match) {
                        const [_, area, actual, total] = match;
                        const deficitCount = parseInt(total) - parseInt(actual);
                        return {
                            ...alerta,
                            mensaje: `${area}: Faltan ${deficitCount} personas (Asignados: ${actual} de ${total})`
                        };
                    }
                }
                return alerta;
            });
    };

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'advertencia': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            default: return <Info className="h-4 w-4 text-blue-500" />;
        }
    };

    const getBgColor = (tipo: string) => {
        switch (tipo) {
            case 'error': return 'bg-red-50';
            case 'advertencia': return 'bg-amber-50';
            default: return 'bg-blue-50';
        }
    };

    const gruposFiltrados = alertas.map(grupo => ({
        ...grupo,
        alertas: filtrarYFormatearAlertas(grupo.alertas)
    })).filter(grupo => grupo.alertas.length > 0);

    if (gruposFiltrados.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Análisis de la Generación
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {gruposFiltrados.map((grupo, idx) => (
                    <Card key={idx} className="border-slate-200 bg-white overflow-hidden shadow-sm">
                        <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider flex justify-between items-center">
                            <span>Fecha: {grupo.fecha.split('T')[0]}</span>
                            <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                                {grupo.alertas.length} avisos
                            </span>
                        </div>
                        <CardContent className="p-3 space-y-2">
                            {grupo.alertas.map((alerta, aIdx) => (
                                <div
                                    key={aIdx}
                                    className={`flex items-start gap-2 p-2 rounded-lg text-[11px] ${getBgColor(alerta.tipo)}`}
                                >
                                    <div className="mt-0.5 shrink-0">
                                        {getIcon(alerta.tipo)}
                                    </div>
                                    <p className="font-semibold text-slate-800 leading-tight">
                                        {alerta.mensaje}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};