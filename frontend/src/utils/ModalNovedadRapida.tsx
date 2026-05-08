import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { novedadesService } from '@/services/api.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Save, Loader2 } from 'lucide-react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';

const PALETA_COLORES = [
    'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-500',
    'bg-slate-800', 'bg-violet-600', 'bg-orange-500', 'bg-teal-600',
];

interface ModalNovedadRapidaProps {
    isOpen: boolean;
    onClose: () => void;
    empleado: { id: number; nombre: string } | null;
    fechaSeleccionada: string | null;
    onSuccess: (fechaMinima: Date) => void;
}

export function ModalNovedadRapida({ isOpen, onClose, empleado, fechaSeleccionada, onSuccess }: ModalNovedadRapidaProps) {
    const queryClient = useQueryClient();
    const [tipoNovedad, setTipoNovedad] = useState<string>("");
    const [fechaInicio, setFechaInicio] = useState<string>(fechaSeleccionada || "");
    const [fechaFin, setFechaFin] = useState<string>(fechaSeleccionada || "");

    const { data: tiposNovedad = [] } = useQuery({
        queryKey: ['tipos-novedades'],
        queryFn: () => novedadesService.listarTipos(),
        staleTime: 60_000
    });

    const esFormularioValido =
        empleado &&
        tipoNovedad !== "" &&
        fechaInicio !== "" &&
        fechaFin !== "" &&
        new Date(fechaInicio) <= new Date(fechaFin);

    const sincronizarMutation = useMutation({
        mutationFn: async () => {
            if (!esFormularioValido) return;


            const dias = eachDayOfInterval({
                start: parseISO(fechaInicio),
                end: parseISO(fechaFin)
            });


            const operaciones = dias.map(fecha => ({
                fecha: format(fecha, 'yyyy-MM-dd'),
                id_tipo: parseInt(tipoNovedad),
                tipo: 'crear' as const
            }));

            return novedadesService.sincronizar({
                id_empleado: empleado.id,
                operaciones
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programacion-mensual'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['programacion-rango'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['no-asignados-dia'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['novedades-completas'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['novedades-lectura'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['validar-programacion'], exact: false });

            const fechaCorte = parseISO(fechaInicio);
            onSuccess(fechaCorte);

            toast.success('Novedad registrada correctamente');
            onClose();
        },
        onError: () => {
            toast.error('Error al sincronizar la novedad');
        }
    });

    const handleGuardar = () => {
        if (!esFormularioValido) return;
        sincronizarMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
                        <CalendarIcon className="h-5 w-5 text-indigo-600" />
                        Registrar Novedad
                    </DialogTitle>
                    <p className="text-sm text-slate-500 font-medium">
                        Empleado: <span className="text-indigo-600 font-bold">{empleado?.nombre}</span>
                    </p>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400 ml-1">Tipo de Novedad</Label>
                        <Select value={tipoNovedad} onValueChange={setTipoNovedad}>
                            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold">
                                <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {tiposNovedad.map((t: any, idx: number) => (
                                    <SelectItem key={t.id_novedad_tipo} value={t.id_novedad_tipo.toString()} className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${PALETA_COLORES[idx % PALETA_COLORES.length]}`} />
                                            {t.nombre_novedad}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-400 ml-1">Desde</Label>
                            <Input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-400 ml-1">Hasta</Label>
                            <Input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="font-bold text-slate-500"
                        disabled={sincronizarMutation.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGuardar}
                        disabled={!esFormularioValido || sincronizarMutation.isPending}
                        className={`font-black px-8 rounded-xl h-12 shadow-lg transition-all active:scale-95 ${!esFormularioValido
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                            }`}
                    >
                        {sincronizarMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                GUARDAR NOVEDAD
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}