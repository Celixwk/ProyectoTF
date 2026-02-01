import { AlertCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BotonRegeneracion } from '@/utils/botonRegeneracion';
import type { Area } from '@/types/api.types';

interface BannerNecesidadRegenerarProps {
    fechaCorte: Date | null;
    mes: number;
    anio: number;

    programacionOriginal?: any[];
    areas?: Area[];
    onSuccess?: (res: any) => void;

    onIgnore: () => void;
    modo?: 'gestion' | 'aviso';
}

export function BannerNecesidadRegenerar({
    fechaCorte,
    mes,
    anio,
    programacionOriginal = [],
    areas = [],
    onSuccess = () => { },
    onIgnore,
    modo = 'gestion'
}: BannerNecesidadRegenerarProps) {
    const navigate = useNavigate();

    if (!fechaCorte) return null;

    return (
        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
            <div className="bg-red-500 p-2 rounded-xl text-white shadow-lg shadow-red-100">
                <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-black text-red-900 uppercase tracking-tight">
                    {modo === 'gestion' ? 'Novedad Detectada' : 'Conflicto de Cobertura'}
                </p>
                <p className="text-xs text-red-700 font-medium">
                    Se requiere regenerar la cobertura desde el {format(fechaCorte, "dd 'de' MMMM", { locale: es })}.
                </p>
            </div>
            <div className="flex gap-2">
                {modo === 'gestion' ? (
                    <BotonRegeneracion
                        fechaCorte={fechaCorte}
                        mes={mes}
                        anio={anio}
                        programacionOriginal={programacionOriginal}
                        areas={areas}
                        onSuccess={onSuccess}
                        onError={(msg) => console.error(msg)}
                    />
                ) : (
                    <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        onClick={() => navigate(`/gestion-mensual?mes=${mes}&anio=${anio}`)}
                    >
                        Ir a Gestionar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}

                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onIgnore}
                    className="text-red-700 hover:bg-red-100 font-bold"
                >
                    Ignorar
                </Button>
            </div>
        </div>
    );
}