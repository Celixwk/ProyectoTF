import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { programacionService } from '@/services/api.service';
import { Clock } from 'lucide-react';

interface ModalAjusteHorasProps {
    isOpen: boolean;
    onClose: () => void;
    asignacion: any | null;
    onSuccess: () => void;
}

export function ModalAjusteHoras({ isOpen, onClose, asignacion, onSuccess }: ModalAjusteHorasProps) {
    const [horaEntrada, setHoraEntrada] = useState('');
    const [horaSalida, setHoraSalida] = useState('');
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (asignacion && isOpen) {
            // Pre-llenar con los valores reales si existen, sino en blanco y mostramos placeholder
            const he = asignacion.hora_entrada_real ? new Date(asignacion.hora_entrada_real) : null;
            const hs = asignacion.hora_salida_real ? new Date(asignacion.hora_salida_real) : null;
            
            setHoraEntrada(he ? he.toISOString().substring(11, 16) : '');
            setHoraSalida(hs ? hs.toISOString().substring(11, 16) : '');
        }
    }, [asignacion, isOpen]);

    const handleGuardar = async () => {
        if (!asignacion) return;
        setCargando(true);
        try {
            await programacionService.ajustarHoras({
                id_empleado: asignacion.id_empleado,
                fecha: asignacion.fecha.split('T')[0],
                hora_entrada_real: horaEntrada || undefined,
                hora_salida_real: horaSalida || undefined
            });
            toast.success('Horas ajustadas correctamente');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Error al guardar el ajuste de horas');
        } finally {
            setCargando(false);
        }
    };

    if (!asignacion) return null;

    const turnoTeorico = asignacion.turno;
    let placeholderEn = turnoTeorico ? (turnoTeorico.hora_entrada as string).substring(11, 16) : '--:--';
    let placeholderSa = turnoTeorico && turnoTeorico.hora_salida ? (turnoTeorico.hora_salida as string).substring(11, 16) : '--:--';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Ajuste de Horas Reales
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <p className="text-sm text-slate-500">
                        Si el colaborador <strong>{asignacion.nombre_empleado || asignacion.empleado?.nombre_completo}</strong> realizó horas distintas a su turno asignado, regístralas aquí. Puedes dejar un campo vacío para usar el valor teórico.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Entrada Real</Label>
                            <Input 
                                type="time" 
                                value={horaEntrada} 
                                onChange={e => setHoraEntrada(e.target.value)} 
                                placeholder={placeholderEn} 
                            />
                            <p className="text-[10px] text-slate-400">Turno: {placeholderEn}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Salida Real</Label>
                            <Input 
                                type="time" 
                                value={horaSalida} 
                                onChange={e => setHoraSalida(e.target.value)} 
                                placeholder={placeholderSa} 
                            />
                            <p className="text-[10px] text-slate-400">Turno: {placeholderSa}</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={cargando}>Cancelar</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleGuardar} disabled={cargando}>
                        {cargando ? 'Guardando...' : 'Guardar Ajuste'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
