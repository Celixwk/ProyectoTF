// Formulario para crear y editar tipos de novedad
// Usa Checkbox, no Switch - actualizado para forzar recarga del módulo
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
import { tipoNovedadSchema, type TipoNovedadFormData } from '@/lib/validations';
import type { TipoNovedad } from '@/types/api.types';

interface TipoNovedadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TipoNovedadFormData) => Promise<void>;
  tipoNovedad?: TipoNovedad | null;
  loading?: boolean;
}

export function TipoNovedadForm({
  open,
  onOpenChange,
  onSubmit,
  tipoNovedad,
  loading = false,
}: TipoNovedadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TipoNovedadFormData>({
    resolver: zodResolver(tipoNovedadSchema),
    defaultValues: tipoNovedad
      ? {
          codigo: tipoNovedad.codigo,
          nombre_novedad: tipoNovedad.nombre_novedad,
          afecta_pago: tipoNovedad.afecta_pago,
        }
      : {
          codigo: '',
          nombre_novedad: '',
          afecta_pago: false,
        },
  });

  const onFormSubmit = async (data: TipoNovedadFormData) => {
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
            {tipoNovedad ? 'Editar Tipo de Novedad' : 'Nuevo Tipo de Novedad'}
          </DialogTitle>
          <DialogDescription>
            {tipoNovedad
              ? 'Actualiza la información del tipo de novedad'
              : 'Completa los datos para crear un nuevo tipo de novedad'}
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
              placeholder="Ej: INCAP, VAC, PERM, etc."
              maxLength={20}
            />
            {errors.codigo && (
              <p className="text-sm text-red-500">{errors.codigo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_novedad">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nombre_novedad"
              {...register('nombre_novedad')}
              placeholder="Ej: Incapacidad, Vacaciones, Permiso, etc."
              maxLength={100}
            />
            {errors.nombre_novedad && (
              <p className="text-sm text-red-500">
                {errors.nombre_novedad.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="afecta_pago"
              checked={watch('afecta_pago')}
              onCheckedChange={(checked) => setValue('afecta_pago', checked as boolean)}
            />
            <Label htmlFor="afecta_pago" className="flex-1 cursor-pointer">
              Afecta el pago
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Si está activado, esta novedad afectará el cálculo del pago del empleado
          </p>

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
              {loading ? 'Guardando...' : tipoNovedad ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
