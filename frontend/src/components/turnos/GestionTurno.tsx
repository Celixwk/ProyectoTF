import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { turnosService } from '@/services/api.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Turno } from '@/types/api.types';
import { toast } from 'sonner';

interface TurnoFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    turnoEditar: Turno | null;
    onSuccess: () => void;
}

const INITIAL_STATE = {
    codigo: '',
    hora_entrada: '',
    hora_salida: '',
    tipo_turno: 'Diurno',
    estado: true
};

export function GestionTurno({ open, onOpenChange, turnoEditar, onSuccess }: TurnoFormProps) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (turnoEditar) {
            // Formatear las horas correctamente (pueden venir como "HH:MM:SS" o como Date ISO string)
            const formatearHora = (hora: string) => {
                if (!hora) return '';
                // Si viene como ISO string (con T), extraer solo la parte de la hora
                if (hora.includes('T')) {
                    return hora.split('T')[1]?.substring(0, 5) || '';
                }
                // Si ya viene como HH:MM:SS, tomar solo HH:MM
                return hora.substring(0, 5);
            };

            setFormData({
                codigo: turnoEditar.tipo_turno || '', // El código es el tipo_turno
                hora_entrada: formatearHora(turnoEditar.hora_entrada),
                hora_salida: formatearHora(turnoEditar.hora_salida),
                tipo_turno: turnoEditar.tipo_turno || 'Diurno',
                estado: turnoEditar.estado
            });
        } else {
            setFormData(INITIAL_STATE);
        }
    }, [turnoEditar, open]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            return turnoEditar
                ? await turnosService.actualizar(turnoEditar.id_turno, data)
                : await turnosService.crear(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['turnos'] });
            toast.success(turnoEditar ? 'Turno actualizado' : 'Turno creado');
            onSuccess();
            onOpenChange(false);
        },
        onError: () => toast.error('Error al guardar')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{turnoEditar ? 'Editar Turno' : 'Nuevo Turno'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="codigo" className="text-right">Código</Label>
                        <Input id="codigo" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="entrada" className="text-right">Entrada</Label>
                        <Input id="entrada" type="time" value={formData.hora_entrada} onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="salida" className="text-right">Salida</Label>
                        <Input id="salida" type="time" value={formData.hora_salida} onChange={(e) => setFormData({ ...formData, hora_salida: e.target.value })} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tipo" className="text-right">Tipo</Label>
                        <Select value={formData.tipo_turno} onValueChange={(v) => setFormData({ ...formData, tipo_turno: v })}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Diurno">Diurno</SelectItem>
                                <SelectItem value="Nocturno">Nocturno</SelectItem>
                                <SelectItem value="Mixto">Mixto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {turnoEditar ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}