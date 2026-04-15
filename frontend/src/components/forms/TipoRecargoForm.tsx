import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { tipoRecargoSchema, type TipoRecargoFormData } from '@/lib/validations';
import type { TipoRecargo } from '@/types/api.types';
import { FormErrorSummary } from './FormErrorSummary';

interface TipoRecargoFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: TipoRecargoFormData) => Promise<void>;
    tipoRecargo?: TipoRecargo | null;
    loading?: boolean;
}

export function TipoRecargoForm({
    open,
    onOpenChange,
    onSubmit,
    tipoRecargo,
    loading = false,
}: TipoRecargoFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<TipoRecargoFormData>({
        resolver: zodResolver(tipoRecargoSchema),
        defaultValues: tipoRecargo
            ? {
                codigo: tipoRecargo.codigo,
                nombre_recargo: tipoRecargo.nombre_recargo,
                porcentaje_recargo: Number(tipoRecargo.porcentaje_recargo),
                descripcion: tipoRecargo.descripcion || '',
                activo: tipoRecargo.activo,
            }
            : {
                codigo: '',
                nombre_recargo: '',
                porcentaje_recargo: 0,
                descripcion: '',
                activo: true,
            },
    });

    const onFormSubmit = async (data: TipoRecargoFormData) => {
        try {
            await onSubmit(data);
            reset();
            onOpenChange(false);
        } catch (error) {
            // El error ya se maneja en el componente padre
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {tipoRecargo ? 'Editar Tipo de Recargo' : 'Nuevo Tipo de Recargo'}
                    </DialogTitle>
                    <DialogDescription>
                        {tipoRecargo
                            ? 'Actualiza la información del tipo de recargo'
                            : 'Completa los datos para crear un nuevo tipo de recargo'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="codigo">
                            Código <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="codigo"
                            {...register('codigo')}
                            placeholder="Ej: RNO, HED, etc."
                            maxLength={10}
                            className={errors.codigo ? 'border-red-500 focus-visible:ring-red-400' : ''}
                        />
                        {errors.codigo && (
                            <p className="text-sm text-red-500">{errors.codigo.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nombre_recargo">
                            Nombre <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nombre_recargo"
                            {...register('nombre_recargo')}
                            placeholder="Ej: Recargo Nocturno Ordinario"
                            maxLength={60}
                            className={errors.nombre_recargo ? 'border-red-500 focus-visible:ring-red-400' : ''}
                        />
                        {errors.nombre_recargo && (
                            <p className="text-sm text-red-500">
                                {errors.nombre_recargo.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="porcentaje_recargo">
                            Porcentaje <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="porcentaje_recargo"
                            type="number"
                            step="0.01"
                            {...register('porcentaje_recargo')}
                            placeholder="Ej: 35"
                            className={errors.porcentaje_recargo ? 'border-red-500 focus-visible:ring-red-400' : ''}
                        />
                        {errors.porcentaje_recargo && (
                            <p className="text-sm text-red-500">
                                {errors.porcentaje_recargo.message}
                            </p>
                        )}
<p className="text-xs text-muted-foreground">Valor numérico de porcentaje para el cálculo.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Input
                            id="descripcion"
                            {...register('descripcion')}
                            placeholder="Ej: Recargo del 35% aplicado a horas ordinarias nocturnas"
                            maxLength={255}
                        />
                        {errors.descripcion && (
                            <p className="text-sm text-red-500">
                                {errors.descripcion.message}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="activo"
                            checked={watch('activo')}
                            onCheckedChange={(checked) => setValue('activo', checked as boolean)}
                        />
                        <Label htmlFor="activo" className="flex-1 cursor-pointer">
                            Estado Activo
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Si está activado, el sistema usará este tipo de recargo para las liquidaciones.
                    </p>

                    <FormErrorSummary errors={errors} />

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : tipoRecargo ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
