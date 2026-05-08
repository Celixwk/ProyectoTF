import { useSearchParams } from 'react-router-dom';
import { Calendar, Settings2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import Programacion from './Programacion';
import GestionMensual from '../ProgramacionAreas/GestionMensual';
import ProgramacionAreas from '../ProgramacionAreas/ProgramacionAreas';

type Tab = 'vista' | 'gestion' | 'generar';

const TABS: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'vista', label: 'Programación', icon: Calendar, desc: 'Vista consolidada de turnos' },
    { id: 'gestion', label: 'Gestión', icon: Settings2, desc: 'Editar asignaciones y novedades' },
    { id: 'generar', label: 'Generar', icon: Zap, desc: 'Generación automática' },
];

export default function ProgramacionUnificada() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabActivo = (searchParams.get('tab') as Tab) || 'vista';

    const cambiarTab = (tab: Tab) => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', tab);
        // Limpiar params internos de otros tabs para evitar conflictos
        if (tab !== 'gestion') {
            params.delete('fechaInicio');
            params.delete('fechaFin');
        }
        setSearchParams(params);
    };

    return (
        <div className="flex flex-col min-h-0">
            {/* Barra de tabs */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
                <div className="flex gap-0 max-w-full overflow-x-auto">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const activo = tabActivo === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => cambiarTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap',
                                    activo
                                        ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                                )}
                            >
                                <Icon className={cn('h-4 w-4', activo ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400')} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Contenido del tab activo */}
            <div className="flex-1">
                {tabActivo === 'vista' && <Programacion />}
                {tabActivo === 'gestion' && (
                    <GestionMensual onIrAGenerar={() => cambiarTab('generar')} />
                )}
                {tabActivo === 'generar' && <ProgramacionAreas />}
            </div>
        </div>
    );
}
