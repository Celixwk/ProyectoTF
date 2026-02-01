import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { turnosService } from '@/services/api.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';
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
    hora_entrada_2: '',
    hora_salida_2: '',
    tipo_turno: 'Diurno',
    estado: true
};

export function GestionTurno({ open, onOpenChange, turnoEditar, onSuccess }: TurnoFormProps) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (turnoEditar) {
            const formatearHora = (hora: string | null) => {
                if (!hora) return '';
                if (hora.includes('T')) return hora.split('T')[1]?.substring(0, 5) || '';
                return hora.substring(0, 5);
            };

            setFormData({
                codigo: turnoEditar.tipo_turno || '',
                hora_entrada: formatearHora(turnoEditar.hora_entrada),
                hora_salida: formatearHora(turnoEditar.hora_salida),
                hora_entrada_2: formatearHora(turnoEditar.hora_entrada_2 || null),
                hora_salida_2: formatearHora(turnoEditar.hora_salida_2 || null),
                tipo_turno: turnoEditar.tipo_turno || 'Diurno',
                estado: String(turnoEditar.estado).toLowerCase() === 'activo'
            });
        } else {
            setFormData(INITIAL_STATE);
        }
    }, [turnoEditar, open]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const payload = {
                ...data,
                tipo_turno: data.codigo,
                hora_entrada_2: data.hora_entrada_2 || null,
                hora_salida_2: data.hora_salida_2 || null,
                estado: data.estado ? 'Activo' : 'Inactivo'
            };
            return turnoEditar
                ? await turnosService.actualizar(turnoEditar.id_turno, payload)
                : await turnosService.crear(payload);
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
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{turnoEditar ? `Editar Turno: ${formData.codigo}` : 'Nuevo Turno'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="codigo" className="text-right font-bold">Código</Label>
                        <Input id="codigo" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} className="col-span-3 font-mono" required placeholder="Ej: T6" />
                    </div>

                    <div className="space-y-3 p-3 border rounded-lg bg-slate-50/50">
                        <Label className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Primer Bloque</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="entrada" className="text-xs">Entrada 1</Label>
                                <Input id="entrada" type="time" value={formData.hora_entrada} onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="salida" className="text-xs">Salida 1</Label>
                                <Input id="salida" type="time" value={formData.hora_salida} onChange={(e) => setFormData({ ...formData, hora_salida: e.target.value })} required />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 p-3 border border-dashed border-indigo-200 rounded-lg bg-indigo-50/30">
                        <div className="flex items-center gap-2">
                            <PlusCircle className="h-3 w-3 text-indigo-500" />
                            <Label className="text-[10px] uppercase font-black text-indigo-600 tracking-wider">Segundo Bloque (Opcional)</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="entrada2" className="text-xs">Entrada 2</Label>
                                <Input id="entrada2" type="time" value={formData.hora_entrada_2} onChange={(e) => setFormData({ ...formData, hora_entrada_2: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="salida2" className="text-xs">Salida 2</Label>
                                <Input id="salida2" type="time" value={formData.hora_salida_2} onChange={(e) => setFormData({ ...formData, hora_salida_2: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="tipo" className="text-right font-bold">Tipo</Label>
                        <Select value={formData.tipo_turno} onValueChange={(v) => setFormData({ ...formData, tipo_turno: v })}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Diurno">Diurno</SelectItem>
                                <SelectItem value="Nocturno">Nocturno</SelectItem>
                                <SelectItem value="Mixto">Mixto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {turnoEditar ? 'Guardar Cambios' : 'Crear Turno'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}