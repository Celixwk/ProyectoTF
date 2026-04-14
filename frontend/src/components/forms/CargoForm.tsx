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
import { cargoSchema, type CargoFormData } from '@/lib/validations';
import type { Cargo } from '@/types/api.types';
import { FormErrorSummary } from './FormErrorSummary';

interface CargoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CargoFormData) => Promise<void>;
  cargo?: Cargo | null;
  loading?: boolean;
}

export function CargoForm({
  open,
  onOpenChange,
  onSubmit,
  cargo,
  loading = false,
}: CargoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CargoFormData>({
    resolver: zodResolver(cargoSchema),
    defaultValues: cargo
      ? {
          nombre_cargo: cargo.nombre_cargo,
          salario_base: parseFloat(cargo.salario_base),
          areas_permitidas: cargo.areas_permitidas || [],
        }
      : {
          nombre_cargo: '',
          salario_base: 0,
          areas_permitidas: [],
        },
  });

  const onFormSubmit = async (data: CargoFormData) => {
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
          <DialogTitle>{cargo ? 'Editar Cargo' : 'Nuevo Cargo'}</DialogTitle>
          <DialogDescription>
            {cargo
              ? 'Actualiza la información del cargo'
              : 'Completa los datos para crear un nuevo cargo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_cargo">
              Nombre del Cargo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre_cargo"
              {...register('nombre_cargo')}
              placeholder="Ej: Operario, Supervisor, etc."
              className={errors.nombre_cargo ? 'border-red-500 focus-visible:ring-red-400' : ''}
            />
            {errors.nombre_cargo && (
              <p className="text-sm text-red-500">
                {errors.nombre_cargo.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salario_base">
              Salario Base <span className="text-red-500">*</span>
            </Label>
            <Input
              id="salario_base"
              type="number"
              step="0.01"
              {...register('salario_base', { valueAsNumber: true })}
              placeholder="0.00"
              min={0}
              className={errors.salario_base ? 'border-red-500 focus-visible:ring-red-400' : ''}
            />
            {errors.salario_base && (
              <p className="text-sm text-red-500">
                {errors.salario_base.message}
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
              {loading ? 'Guardando...' : cargo ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

