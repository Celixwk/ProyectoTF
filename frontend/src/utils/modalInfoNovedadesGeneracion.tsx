import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CalendarDays, ArrowRight, AlertTriangle, ExternalLink, XCircle } from 'lucide-react';
import { format, differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModalInfoNovedadesProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
    novedades: any[];
    nombreMes: string;
}

interface NovedadAgrupada {
    id_empleado: number;
    nombre_empleado: string;
    tipo: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    dias: number;
}

export function ModalInfoNovedadesGeneracion({ isOpen, onClose, onContinue, novedades, nombreMes }: ModalInfoNovedadesProps) {
    const navigate = useNavigate();

    const novedadesAgrupadas = useMemo(() => {
        if (!novedades || !Array.isArray(novedades) || novedades.length === 0) return [];

        const listaPlana: any[] = [];
        novedades.forEach(nov => {
            if (nov.detalle_novedad && Array.isArray(nov.detalle_novedad) && nov.detalle_novedad.length > 0) {
                nov.detalle_novedad.forEach((det: any) => {
                    listaPlana.push({ ...nov, fecha: det.fecha });
                });
            } else if (nov.fecha) {
                listaPlana.push(nov);
            }
        });

        const listaProcesada = listaPlana.map(item => {
            let fechaObj: Date | null = null;
            if (item.fecha instanceof Date) {
                fechaObj = item.fecha;
            } else if (typeof item.fecha === 'string') {
                fechaObj = parseISO(item.fecha);
                if (!isValid(fechaObj)) fechaObj = new Date(item.fecha);
            }
            if (!fechaObj || !isValid(fechaObj)) return null;
            return { ...item, fechaObj };
        }).filter(Boolean);

        const sorted = listaProcesada.sort((a, b) => {
            if (a.id_empleado !== b.id_empleado) return a.id_empleado - b.id_empleado;
            const tipoA = a.id_novedad_tipo || 0;
            const tipoB = b.id_novedad_tipo || 0;
            if (tipoA !== tipoB) return tipoA - tipoB;
            return a.fechaObj.getTime() - b.fechaObj.getTime();
        });

        const agrupadas: NovedadAgrupada[] = [];
        let actual: NovedadAgrupada | null = null;

        sorted.forEach((nov) => {
            const fechaNov = nov.fechaObj;
            const nombre = nov.empleado
                ? `${nov.empleado.nombre1 || ''} ${nov.empleado.apellido1 || ''}`.trim()
                : (nov.nombre_completo || 'Desconocido');
            const tipo = nov.tipo_novedad?.nombre_novedad || nov.tipo || 'Novedad';

            if (actual) {
                const esMismoEmpleado = actual.id_empleado === nov.id_empleado;
                const esMismoTipo = actual.tipo === tipo;
                const diff = Math.abs(differenceInCalendarDays(fechaNov, actual.fecha_fin));

                if (esMismoEmpleado && esMismoTipo && diff <= 1) {
                    if (fechaNov > actual.fecha_fin) {
                        actual.fecha_fin = fechaNov;
                        actual.dias = differenceInCalendarDays(actual.fecha_fin, actual.fecha_inicio) + 1;
                    }
                    return;
                } else {
                    agrupadas.push(actual);
                }
            }

            actual = {
                id_empleado: nov.id_empleado,
                nombre_empleado: nombre || 'Sin Nombre',
                tipo: tipo,
                fecha_inicio: fechaNov,
                fecha_fin: fechaNov,
                dias: 1
            };
        });

        if (actual) agrupadas.push(actual);
        return agrupadas;
    }, [novedades]);

    const formatDateSafe = (date: Date) => isValid(date) ? format(date, 'd MMM', { locale: es }) : 'Error';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <CalendarDays className="h-5 w-5" />
                        Novedades en {nombreMes}
                    </DialogTitle>
                    <div className="text-xs text-slate-500 mt-1">
                        Se detectaron <strong>{novedadesAgrupadas.length}</strong> eventos que bloquean la agenda.
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6">
                    <div className="border rounded-xl bg-slate-50 shadow-inner">
                        {novedadesAgrupadas.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                                <AlertTriangle className="h-8 w-8 opacity-50" />
                                <p className="text-xs">Sin novedades procesables.</p>
                            </div>
                        ) : (
                            novedadesAgrupadas.map((grupo, i) => (
                                <div key={i} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-white transition-colors gap-4">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="font-bold text-slate-800 text-[11px] uppercase truncate">
                                            {grupo.nombre_empleado}
                                        </span>
                                        <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                                            {grupo.tipo}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
                                            {formatDateSafe(grupo.fecha_inicio)}
                                            {grupo.dias > 1 && ` - ${formatDateSafe(grupo.fecha_fin)}`}
                                        </div>
                                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                                            {grupo.dias} {grupo.dias === 1 ? 'día' : 'días'}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 pt-4 border-t bg-slate-50/50 flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <div className="flex gap-2 justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-9 px-3"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                onClose();
                                navigate('/novedades');
                            }}
                            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 h-9 px-3"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Detalle
                        </Button>
                    </div>

                    <Button
                        className="bg-amber-600 hover:bg-amber-700 text-white shadow-md h-9 px-6 font-bold"
                        onClick={onContinue}
                    >
                        Continuar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}