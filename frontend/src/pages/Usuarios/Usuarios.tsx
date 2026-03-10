import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus, Pencil, Trash2, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { usuariosService } from '@/services/api.service';
import type { Usuario } from '@/types/api.types';
import { UsuarioForm } from './components/UsuarioForm';

export default function Usuarios() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);

    const { data: usuarios, isLoading } = useQuery({
        queryKey: ['usuarios'],
        queryFn: usuariosService.listar
    });

    const eliminarMutation = useMutation({
        mutationFn: usuariosService.eliminar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios'] });
            toast.success('Usuario eliminado');
        },
        onError: (err: any) => {
            toast.error('Error', {
                description: err?.response?.data?.error || 'No se pudo eliminar el usuario'
            });
        }
    });

    const handleEliminar = (id: number) => {
        if (confirm('¿Está seguro de eliminar este usuario? Esa acción no se puede deshacer.')) {
            eliminarMutation.mutate(id);
        }
    };

    const handleEditar = (usr: Usuario) => {
        setUsuarioEditando(usr);
        setModalOpen(true);
    };

    const handleNuevo = () => {
        setUsuarioEditando(null);
        setModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                        <ShieldCheck className="h-6 w-6 text-indigo-600" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Administra los accesos, credenciales y roles del aplicativo
                    </p>
                </div>
                <Button onClick={handleNuevo} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Nombre / User</TableHead>
                                <TableHead>Rol del Sistema</TableHead>
                                <TableHead>Fecha Creación</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                        Cargando usuarios...
                                    </TableCell>
                                </TableRow>
                            ) : usuarios?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                        No hay usuarios registrados (excepto el administrador principal).
                                    </TableCell>
                                </TableRow>
                            ) : (
                                usuarios?.map((usr) => (
                                    <TableRow key={usr.id_usuario}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800">{usr.nombre_completo}</span>
                                                <span className="text-sm text-slate-500 flex items-center gap-1">
                                                    <Lock className="h-3 w-3" /> {usr.usuario}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={usr.tipo_usuario === 'administrador' ? 'default' : 'secondary'} className="capitalize">
                                                {usr.tipo_usuario === 'administrador' && <Shield className="h-3 w-3 mr-1" />}
                                                {usr.tipo_usuario}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {new Date(usr.fecha_creacion).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditar(usr)}
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEliminar(usr.id_usuario)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                title={usr.usuario === 'admin' ? "El administrador maestro no puede ser eliminado" : "Eliminar"}
                                                disabled={usr.usuario === 'admin'}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <UsuarioForm
                open={modalOpen}
                onOpenChange={setModalOpen}
                usuarioEditando={usuarioEditando}
            />
        </div>
    );
}
