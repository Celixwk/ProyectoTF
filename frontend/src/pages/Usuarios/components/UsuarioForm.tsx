import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { usuariosService } from '@/services/api.service';
import type { Usuario } from '@/types/api.types';

const usuarioSchema = z.object({
    id_usuario: z.number().optional(),
    usuario: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
    nombre_completo: z.string().min(3, 'El nombre completo es requerido'),
    tipo_usuario: z.enum(['administrador', 'supervisor', 'empleado'], {
        required_error: 'Debe seleccionar un rol'
    }),
    contrasenia: z.string().optional(),
}).superRefine((data, ctx) => {
    // If it's a new user, password is required
    if (!data.id_usuario && (!data.contrasenia || data.contrasenia.length < 5)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'La contraseña es requerida y debe tener al menos 5 caracteres',
            path: ['contrasenia'],
        });
    }
});

type FormValues = z.infer<typeof usuarioSchema>;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    usuarioEditando?: Usuario | null;
}

export function UsuarioForm({ open, onOpenChange, usuarioEditando }: Props) {
    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
        resolver: zodResolver(usuarioSchema),
        defaultValues: {
            usuario: '',
            nombre_completo: '',
            tipo_usuario: 'administrador',
            contrasenia: '',
        },
    });

    const watchTipo = watch('tipo_usuario');

    useEffect(() => {
        if (usuarioEditando) {
            reset({
                id_usuario: usuarioEditando.id_usuario,
                usuario: usuarioEditando.usuario,
                nombre_completo: usuarioEditando.nombre_completo,
                tipo_usuario: (usuarioEditando.tipo_usuario as any) || 'administrador',
                contrasenia: '', // Leave blank when editing to not override unless typed
            });
        } else {
            reset({
                usuario: '',
                nombre_completo: '',
                tipo_usuario: 'administrador',
                contrasenia: '',
            });
        }
    }, [usuarioEditando, open, reset]);

    const creacionMutation = useMutation({
        mutationFn: (data: FormValues) => usuariosService.crear(data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            toast.success('Usuario creado', { description: 'El usuario se ha creado exitosamente.' });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error('Error al crear', {
                description: error?.response?.data?.error || 'No se pudo crear el usuario'
            });
        }
    });

    const edicionMutation = useMutation({
        mutationFn: (data: FormValues) => usuariosService.actualizar(data.id_usuario!, data as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            toast.success('Usuario actualizado', { description: 'El usuario se ha actualizado exitosamente.' });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error('Error al actualizar', {
                description: error?.response?.data?.error || 'No se pudo actualizar el usuario'
            });
        }
    });

    const onSubmit = (data: FormValues) => {
        if (usuarioEditando) {
            edicionMutation.mutate(data);
        } else {
            creacionMutation.mutate(data);
        }
    };

    const isPending = creacionMutation.isPending || edicionMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="usuario">User Login <span className="text-red-500">*</span></Label>
                        <Input id="usuario" placeholder="ej. admin123" {...register('usuario')} />
                        {errors.usuario && <p className="text-sm text-red-500">{errors.usuario.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nombre_completo">Nombre Completo <span className="text-red-500">*</span></Label>
                        <Input id="nombre_completo" placeholder="Ej. Juan Pérez" {...register('nombre_completo')} />
                        {errors.nombre_completo && <p className="text-sm text-red-500">{errors.nombre_completo.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipo_usuario">Rol / Perfil <span className="text-red-500">*</span></Label>
                        <Select
                            value={watchTipo}
                            onValueChange={(value) => setValue('tipo_usuario', value as any)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="administrador">Administrador</SelectItem>
                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                <SelectItem value="empleado">Empleado</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.tipo_usuario && <p className="text-sm text-red-500">{errors.tipo_usuario.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contrasenia">
                            Contraseña {!usuarioEditando && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                            id="contrasenia"
                            type="password"
                            placeholder={usuarioEditando ? "Dejar en blanco para no cambiarla" : "Contraseña segura"}
                            {...register('contrasenia')}
                        />
                        {errors.contrasenia && <p className="text-sm text-red-500">{errors.contrasenia.message}</p>}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {usuarioEditando ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
