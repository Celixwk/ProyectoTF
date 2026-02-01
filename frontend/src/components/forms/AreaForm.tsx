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
import { areaSchema, type AreaFormData } from '@/lib/validations';
import type { Area } from '@/types/api.types';

interface AreaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AreaFormData) => Promise<void>;
  area?: Area | null;
  loading?: boolean;
}

export function AreaForm({
  open,
  onOpenChange,
  onSubmit,
  area,
  loading = false,
}: AreaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: area
      ? {
          nombre_area: area.nombre_area,
        }
      : {
          nombre_area: '',
        },
  });

  const onFormSubmit = async (data: AreaFormData) => {
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
          <DialogTitle>{area ? 'Editar Área' : 'Nueva Área'}</DialogTitle>
          <DialogDescription>
            {area
              ? 'Actualiza la información del área'
              : 'Completa los datos para crear un nueva área'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_area">
              Nombre del Área <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre_area"
              {...register('nombre_area')}
              placeholder="Ej: Producción, Almacén, etc."
            />
            {errors.nombre_area && (
              <p className="text-sm text-red-500">
                {errors.nombre_area.message}
              </p>
            )}
          </div>

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
              {loading ? 'Guardando...' : area ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

