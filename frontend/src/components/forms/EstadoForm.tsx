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
import { estadoSchema, type EstadoFormData } from '@/lib/validations';
import type { EstadoEmpleado } from '@/types/api.types';
import { FormErrorSummary } from './FormErrorSummary';

interface EstadoFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: EstadoFormData) => Promise<void>;
    estado?: EstadoEmpleado | null;
    loading?: boolean;
}

export function EstadoForm({
    open,
    onOpenChange,
    onSubmit,
    estado,
    loading = false,
}: EstadoFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<EstadoFormData>({
        resolver: zodResolver(estadoSchema),
        defaultValues: estado
            ? {
                nombre_estado: estado.nombre_estado,
            }
            : {
                nombre_estado: '',
            },
    });

    const onFormSubmit = async (data: EstadoFormData) => {
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
                    <DialogTitle>{estado ? 'Editar Estado' : 'Nuevo Estado'}</DialogTitle>
                    <DialogDescription>
                        {estado
                            ? 'Actualiza el nombre del estado del empleado'
                            : 'Completa los datos para crear un nuevo estado'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre_estado">
                            Nombre del Estado <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="nombre_estado"
                            {...register('nombre_estado')}
                            placeholder="Ej: Activo, Inactivo, Vacaciones..."
                            className={errors.nombre_estado ? 'border-red-500 focus-visible:ring-red-400' : ''}
                        />
                        {errors.nombre_estado && (
                            <p className="text-sm text-red-500">
                                {errors.nombre_estado.message}
                            </p>
                        )}
                    </div>

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
                            {loading ? 'Guardando...' : estado ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
