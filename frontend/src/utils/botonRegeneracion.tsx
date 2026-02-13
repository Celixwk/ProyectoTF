import { useMutation } from '@tanstack/react-query';
import { programacionService } from '@/services/api.service';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';
import type { Area } from '@/types/api.types';

interface BotonRegeneracionProps {
    fechaCorte: Date;

    programacionOriginal: any[];
    areas: Area[];
    onSuccess: (data: any) => void;
    onError: (error: string) => void;
}

export function BotonRegeneracion({
    fechaCorte,
    programacionOriginal,
    areas,
    onSuccess,
    onError
}: BotonRegeneracionProps) {

    const configParaRegenerar = useMemo(() => {
        if (!programacionOriginal?.length || !areas.length) return null;

        const config: Record<number, { turnosIds: number[] }> = {};

        areas.forEach(area => {
            const turnosUsados = new Set(
                programacionOriginal
                    .filter((p: any) => Number(p.id_area) === area.id_area)
                    .map((p: any) => Number(p.id_turno))
            );

            if (turnosUsados.size > 0) {
                config[area.id_area] = {
                    turnosIds: Array.from(turnosUsados).sort((a, b) => a - b)
                };
            }
        });

        return Object.keys(config).length > 0 ? config : null;
    }, [programacionOriginal, areas]);

    const regenerarMutation = useMutation({
        mutationFn: async () => {
            if (!configParaRegenerar) {
                throw new Error('No se pudo inferir la configuración del mes');
            }

            const fechaInicio = format(fechaCorte, 'yyyy-MM-dd');

            return programacionService.regenerarDesdeFecha({
                fechaInicio,
                configuracion: configParaRegenerar,
                idUsuario: undefined
            });
        },
        onSuccess: (data) => {
            onSuccess(data);
        },
        onError: (error: any) => {
            onError(error.message || 'Error al regenerar');
        }
    });

    return (
        <Button
            size="sm"
            onClick={() => regenerarMutation.mutate()}
            disabled={regenerarMutation.isPending || !configParaRegenerar}
            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
        >
            {regenerarMutation.isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerando...
                </>
            ) : (
                <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    REGENERAR DESDE {format(fechaCorte, 'dd/MM')}
                </>
            )}
        </Button>
    );
}