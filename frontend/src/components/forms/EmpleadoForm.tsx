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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { empleadoSchema, type EmpleadoFormData } from '@/lib/validations';
import { Checkbox } from '@/components/ui/checkbox';
import type { EmpleadoCompleto } from '@/types/api.types';

interface EmpleadoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EmpleadoFormData) => Promise<void>;
  empleado?: EmpleadoCompleto | null;
  cargos: Array<{ id_cargo: number; nombre_cargo: string }>;
  areas: Array<{ id_area: number; nombre_area: string }>;
  loading?: boolean;
}

export function EmpleadoForm({
  open,
  onOpenChange,
  onSubmit,
  empleado,
  cargos,
  areas,
  loading = false,
}: EmpleadoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EmpleadoFormData>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: empleado
      ? {
          nombre1: empleado.nombre_completo.split(' ')[0] || '',
          nombre2: '',
          apellido1: empleado.nombre_completo.split(' ')[1] || '',
          apellido2: '',
          cedula: empleado.cedula,
          edad: empleado.edad || null,
          sexo: empleado.sexo || null,
          vehiculo: empleado.vehiculo || '',
          id_cargo: empleado.id_cargo,
          areas_permitidas: empleado.areas_permitidas || [],
        }
      : {
          nombre1: '',
          nombre2: '',
          apellido1: '',
          apellido2: '',
          cedula: '',
          edad: null,
          sexo: null,
          vehiculo: '',
          id_cargo: 0,
          areas_permitidas: [],
        },
  });

  const cargoId = watch('id_cargo');
  const areasPermitidas = watch('areas_permitidas') || [];

  const toggleArea = (idArea: number) => {
    const current = areasPermitidas;
    if (current.includes(idArea)) {
      setValue('areas_permitidas', current.filter((id: number) => id !== idArea));
    } else {
      setValue('areas_permitidas', [...current, idArea]);
    }
  };

  const onFormSubmit = async (data: EmpleadoFormData) => {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {empleado ? 'Editar Empleado' : 'Nuevo Empleado'}
          </DialogTitle>
          <DialogDescription>
            {empleado
              ? 'Actualiza la información del empleado'
              : 'Completa los datos para crear un nuevo empleado'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre1">
                Primer Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre1"
                {...register('nombre1')}
                placeholder="Primer nombre"
              />
              {errors.nombre1 && (
                <p className="text-sm text-red-500">{errors.nombre1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre2">Segundo Nombre</Label>
              <Input
                id="nombre2"
                {...register('nombre2')}
                placeholder="Segundo nombre (opcional)"
              />
              {errors.nombre2 && (
                <p className="text-sm text-red-500">{errors.nombre2.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apellido1">
                Primer Apellido <span className="text-red-500">*</span>
              </Label>
              <Input
                id="apellido1"
                {...register('apellido1')}
                placeholder="Primer apellido"
              />
              {errors.apellido1 && (
                <p className="text-sm text-red-500">
                  {errors.apellido1.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido2">Segundo Apellido</Label>
              <Input
                id="apellido2"
                {...register('apellido2')}
                placeholder="Segundo apellido (opcional)"
              />
              {errors.apellido2 && (
                <p className="text-sm text-red-500">
                  {errors.apellido2.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cedula">
                Cédula <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cedula"
                {...register('cedula')}
                placeholder="Número de cédula"
                maxLength={20}
              />
              {errors.cedula && (
                <p className="text-sm text-red-500">{errors.cedula.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edad">Edad</Label>
              <Input
                id="edad"
                type="number"
                {...register('edad', { valueAsNumber: true })}
                placeholder="Edad (opcional)"
                min={18}
                max={100}
              />
              {errors.edad && (
                <p className="text-sm text-red-500">{errors.edad.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select
                value={watch('sexo') || ''}
                onValueChange={(value) => setValue('sexo', value as 'M' | 'F' | null)}
              >
                <SelectTrigger id="sexo">
                  <SelectValue placeholder="Selecciona el sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
              {errors.sexo && (
                <p className="text-sm text-red-500">{errors.sexo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehiculo">Vehículo</Label>
              <Input
                id="vehiculo"
                {...register('vehiculo')}
                placeholder="Placa del vehículo (opcional)"
                maxLength={10}
              />
              {errors.vehiculo && (
                <p className="text-sm text-red-500">
                  {errors.vehiculo.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_cargo">
              Cargo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={cargoId?.toString() || ''}
              onValueChange={(value) => setValue('id_cargo', parseInt(value))}
            >
              <SelectTrigger id="id_cargo">
                <SelectValue placeholder="Selecciona un cargo" />
              </SelectTrigger>
              <SelectContent>
                {cargos.map((cargo) => (
                  <SelectItem key={cargo.id_cargo} value={cargo.id_cargo.toString()}>
                    {cargo.nombre_cargo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.id_cargo && (
              <p className="text-sm text-red-500">{errors.id_cargo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="areas-permitidas">
              Áreas Permitidas (Rotación) <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Selecciona las áreas donde este empleado puede rotar. Debe tener al menos una área.
            </p>
            <div id="areas-permitidas" className="grid grid-cols-2 gap-3 p-4 border rounded-lg max-h-[200px] overflow-y-auto">
              {areas.map((area) => (
                <div key={area.id_area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`area-${area.id_area}`}
                    checked={areasPermitidas.includes(area.id_area)}
                    onCheckedChange={() => toggleArea(area.id_area)}
                  />
                  <Label
                    htmlFor={`area-${area.id_area}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {area.nombre_area}
                  </Label>
                </div>
              ))}
            </div>
            {areasPermitidas.length === 0 && (
              <p className="text-sm text-red-500">
                Debe seleccionar al menos un área
              </p>
            )}
            {errors.areas_permitidas && (
              <p className="text-sm text-red-500">
                {errors.areas_permitidas.message}
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
              {loading ? 'Guardando...' : empleado ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

