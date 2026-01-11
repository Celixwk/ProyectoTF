import { useMutation, useQueryClient } from '@tanstack/react-query';
import { programacionService } from '@/services/api.service';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BotonEliminarProgramacionProps {
    mes: number;
    anio: number;
    onSuccess: () => void;
}

export function BotonEliminarProgramacion({ mes, anio, onSuccess }: BotonEliminarProgramacionProps) {
    const queryClient = useQueryClient();

    const eliminarMutation = useMutation({
        mutationFn: async () => {
            await programacionService.eliminarMes(mes, anio);
        },
        onSuccess: () => {
            toast.success('Programación eliminada correctamente');
            queryClient.invalidateQueries({ queryKey: ['programacion-mensual'] });
            queryClient.invalidateQueries({ queryKey: ['no-asignados-dia'] });
            queryClient.invalidateQueries({ queryKey: ['validar-programacion'] });
            onSuccess();
        },
        onError: (e: any) => toast.error(e.message || 'Error eliminando programación')
    });

    const handleEliminar = () => {
        const confirmado = window.confirm(
            '⚠️ ¿ESTÁ SEGURO DE ELIMINAR TODA LA PROGRAMACIÓN DE ESTE MES?\n\nEsta acción borrará todos los turnos asignados y NO TIENE REVERSA.\n\n¿Desea continuar?'
        );

        if (confirmado) {
            eliminarMutation.mutate();
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 font-bold"
            onClick={handleEliminar}
            disabled={eliminarMutation.isPending}
        >
            {eliminarMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="mr-2 h-4 w-4" />
            )}
            ELIMINAR PROGRAMACIÓN
        </Button>
    );
}