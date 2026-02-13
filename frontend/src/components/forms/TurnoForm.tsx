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

import { turnoSchema, type TurnoFormData } from '@/lib/validations';
import type { Turno } from '@/types/api.types';

interface TurnoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TurnoFormData) => Promise<void>;
  turno?: Turno | null;
  loading?: boolean;
}

export function TurnoForm({
  open,
  onOpenChange,
  onSubmit,
  turno,
  loading = false,
}: TurnoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TurnoFormData>({
    resolver: zodResolver(turnoSchema),
    defaultValues: turno
      ? {
        codigo: turno.codigo,
        tipo_turno: turno.tipo_turno,
        hora_entrada: turno.hora_entrada,
        hora_salida: turno.hora_salida,
        estado: turno.estado,
      }
      : {
        codigo: '',
        tipo_turno: '',
        hora_entrada: '06:00',
        hora_salida: '14:00',
        estado: true,
      },
  });

  const onFormSubmit = async (data: TurnoFormData) => {
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
          <DialogTitle>{turno ? 'Editar Turno' : 'Nuevo Turno'}</DialogTitle>
          <DialogDescription>
            {turno
              ? 'Actualiza la información del turno'
              : 'Completa los datos para crear un nuevo turno'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">
                Código <span className="text-red-500">*</span>
              </Label>
              <Input
                id="codigo"
                {...register('codigo')}
                placeholder="Ej: T1, T2, T11, etc."
                maxLength={20}
                pattern="^T\d+$"
              />
              {errors.codigo && (
                <p className="text-sm text-red-500">{errors.codigo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_turno">
                Tipo de Turno (Opcional)
              </Label>
              <Input
                id="tipo_turno"
                {...register('tipo_turno')}
                placeholder="Ej: Operativo, Nocturno, etc."
                maxLength={50}
              />
              {errors.tipo_turno && (
                <p className="text-sm text-red-500">
                  {errors.tipo_turno.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_entrada">
                Hora de Entrada <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hora_entrada"
                type="time"
                {...register('hora_entrada')}
              />
              {errors.hora_entrada && (
                <p className="text-sm text-red-500">
                  {errors.hora_entrada.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora_salida">
                Hora de Salida <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hora_salida"
                type="time"
                {...register('hora_salida')}
              />
              {errors.hora_salida && (
                <p className="text-sm text-red-500">
                  {errors.hora_salida.message}
                </p>
              )}
            </div>
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
              {loading ? 'Guardando...' : turno ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

