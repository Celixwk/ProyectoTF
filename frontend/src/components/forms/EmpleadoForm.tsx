import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Users } from 'lucide-react';
import { empleadoSchema, type EmpleadoFormData } from '@/lib/validations';
import { empleadosService } from '@/services/api.service';
import type { EmpleadoCompleto } from '@/types/api.types';

interface EmpleadoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EmpleadoFormData) => Promise<void>;
  empleado: EmpleadoCompleto | null;
  cargos: Array<{ id_cargo: number; nombre_cargo: string }>;
  areas: Array<{ id_area: number; nombre_area: string }>;
  loading?: boolean;
}

export function EmpleadoForm({ open, onOpenChange, onSubmit, empleado, cargos, areas, loading }: EmpleadoFormProps) {
  const { register, handleSubmit, setValue, watch, reset } = useForm<EmpleadoFormData>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: {
      nombre1: '', nombre2: '', apellido1: '', apellido2: '',
      cedula: '', edad: 18, sexo: 'M', vehiculo: '', id_cargo: 0, areas_permitidas: []
    }
  });

  const areasPermitidas = watch('areas_permitidas') || [];

  useEffect(() => {
    const fetchDetalle = async () => {
      if (open && empleado) {
        try {
          const detalle = await empleadosService.obtener(empleado.id_empleado);

          const idsMapeados = Array.isArray(detalle.areas_permitidas)
            ? detalle.areas_permitidas.map((a: any) => {
              if (typeof a === 'number') return a;
              if (typeof a === 'object' && a !== null) return a.id_area;
              return null;
            }).filter((id: number | null): id is number => id !== null)
            : [];

          reset({
            nombre1: detalle.nombre1 || '',
            nombre2: detalle.nombre2 || '',
            apellido1: detalle.apellido1 || '',
            apellido2: detalle.apellido2 || '',
            cedula: detalle.cedula || '',
            edad: detalle.edad ? Number(detalle.edad) : 18,
            sexo: (detalle.sexo as 'M' | 'F') || 'M',
            vehiculo: detalle.vehiculo || '',
            id_cargo: detalle.id_cargo || 0,
            areas_permitidas: idsMapeados
          });
        } catch (error) {
          reset({
            nombre1: empleado.nombre_completo?.split(' ')[0] || '',
            cedula: empleado.cedula,
            id_cargo: empleado.id_cargo,
            areas_permitidas: Array.isArray(empleado.areas_permitidas) ? empleado.areas_permitidas : []
          });
        }
      } else if (open && !empleado) {
        reset({ nombre1: '', nombre2: '', apellido1: '', apellido2: '', cedula: '', edad: 18, sexo: 'M', vehiculo: '', id_cargo: 0, areas_permitidas: [] });
      }
    };
    fetchDetalle();
  }, [open, empleado, reset]);

  const toggleArea = (idArea: number) => {
    const nuevos = areasPermitidas.includes(idArea)
      ? areasPermitidas.filter(id => id !== idArea)
      : [...areasPermitidas, idArea];
    setValue('areas_permitidas', nuevos, { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>{empleado ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Primer Nombre *</Label>
              <Input {...register('nombre1')} />
            </div>
            <div className="space-y-1">
              <Label>Segundo Nombre</Label>
              <Input {...register('nombre2')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Primer Apellido *</Label>
              <Input {...register('apellido1')} />
            </div>
            <div className="space-y-1">
              <Label>Segundo Apellido</Label>
              <Input {...register('apellido2')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Cédula *</Label>
              <Input {...register('cedula')} />
            </div>
            <div className="space-y-1">
              <Label>Edad</Label>
              <Input type="number" {...register('edad', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Sexo</Label>
              <Select value={watch('sexo') || "M"} onValueChange={(v) => setValue('sexo', v as 'M' | 'F')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Vehículo</Label>
              <Input {...register('vehiculo')} placeholder="Placa" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Cargo *</Label>
            <Select value={watch('id_cargo')?.toString() || ""} onValueChange={(v) => setValue('id_cargo', parseInt(v))}>
              <SelectTrigger><SelectValue placeholder="Selecciona cargo" /></SelectTrigger>
              <SelectContent>
                {cargos.map(c => <SelectItem key={c.id_cargo} value={c.id_cargo.toString()}>{c.nombre_cargo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Áreas Permitidas</Label>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-muted/30 max-h-40 overflow-y-auto">
              {areas.map(a => (
                <div key={a.id_area} className="flex items-center space-x-2 bg-background p-2 rounded border">
                  <Checkbox
                    id={`a-${a.id_area}`}
                    checked={areasPermitidas.includes(a.id_area)}
                    onCheckedChange={() => toggleArea(a.id_area)}
                  />
                  <label htmlFor={`a-${a.id_area}`} className="text-sm font-normal cursor-pointer flex-1">{a.nombre_area}</label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : (empleado ? 'Actualizar' : 'Crear')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}