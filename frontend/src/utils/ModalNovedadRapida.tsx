import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { novedadesService, areasService, turnosService, programacionService } from '@/services/api.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Save, Loader2, Edit2 } from 'lucide-react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';

const PALETA_COLORES = [
    'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-500',
    'bg-slate-800', 'bg-violet-600', 'bg-orange-500', 'bg-teal-600',
];

interface ModalNovedadRapidaProps {
    isOpen: boolean;
    onClose: () => void;
    empleado: { id: number; nombre: string } | null;
    fechaSeleccionada: string | null;
    novedadExistente?: { id_novedad_tipo: number };
    onSuccess: (fechaMinima: Date) => void;
}

export function ModalNovedadRapida({
    isOpen, onClose, empleado, fechaSeleccionada, novedadExistente, onSuccess
}: ModalNovedadRapidaProps) {
    const queryClient = useQueryClient();
    const esEdicion = !!novedadExistente;

    const [tipoNovedad, setTipoNovedad] = useState<string>("");
    const [fechaInicio, setFechaInicio] = useState<string>(fechaSeleccionada || "");
    const [fechaFin, setFechaFin] = useState<string>(fechaSeleccionada || "");
    const [areaId, setAreaId] = useState<string>("");
    const [turnoId, setTurnoId] = useState<string>("");

    // Pre-poblar tipo cuando se edita
    useEffect(() => {
        if (novedadExistente?.id_novedad_tipo) {
            setTipoNovedad(novedadExistente.id_novedad_tipo.toString());
        } else {
            setTipoNovedad("");
        }
        setFechaInicio(fechaSeleccionada || "");
        setFechaFin(fechaSeleccionada || "");
        setAreaId("");
        setTurnoId("");
    }, [novedadExistente, fechaSeleccionada]);

    const { data: tiposNovedad = [] } = useQuery({
        queryKey: ['tipos-novedades'],
        queryFn: () => novedadesService.listarTipos(),
        staleTime: 60_000
    });

    const { data: areasData = [] } = useQuery({
        queryKey: ['areas-lista'],
        queryFn: () => areasService.listar(),
        staleTime: 300_000
    });

    const { data: turnosData = [] } = useQuery({
        queryKey: ['turnos-lista'],
        queryFn: () => turnosService.listar(),
        staleTime: 300_000
    });

    const esFormularioValido =
        empleado &&
        tipoNovedad !== "" &&
        fechaInicio !== "" &&
        fechaFin !== "" &&
        new Date(fechaInicio) <= new Date(fechaFin);

    // Si se elige turno, también debe elegirse área
    const turnoRequiereArea = turnoId !== "" && areaId === "";

    const sincronizarMutation = useMutation({
        mutationFn: async () => {
            if (!esFormularioValido) return;

            const operacionTipo = esEdicion ? 'modificar' : 'crear';

            // Para edición: solo opera en la fecha seleccionada (un día)
            // Para creación: puede abarcar un rango
            const dias = esEdicion
                ? [parseISO(fechaInicio)]
                : eachDayOfInterval({ start: parseISO(fechaInicio), end: parseISO(fechaFin) });

            const operaciones = dias.map(fecha => ({
                fecha: format(fecha, 'yyyy-MM-dd'),
                id_tipo: parseInt(tipoNovedad),
                tipo: operacionTipo as 'crear' | 'modificar'
            }));

            await novedadesService.sincronizar({ id_empleado: empleado!.id, operaciones });

            // Si hay área+turno seleccionados, también guardar el detalle de programación
            if (areaId && turnoId) {
                const cambios = dias.map(fecha => ({
                    id_detalle_programacion: 0,
                    id_empleado: empleado!.id,
                    empleado: empleado!.nombre,
                    fecha: format(fecha, 'yyyy-MM-dd'),
                    id_area_origen: 0,
                    id_turno_origen: 0,
                    id_area_destino: parseInt(areaId),
                    id_turno_destino: parseInt(turnoId),
                }));
                await programacionService.guardarCambios(cambios);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programacion-mensual'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['programacion-rango'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['no-asignados-dia'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['novedades-completas'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['novedades-lectura'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['validar-programacion'], exact: false });

            const fechaCorte = parseISO(fechaInicio);
            onSuccess(fechaCorte);

            toast.success(esEdicion ? 'Novedad actualizada correctamente' : 'Novedad registrada correctamente');
            onClose();
        },
        onError: () => {
            toast.error('Error al guardar la novedad');
        }
    });

    const handleGuardar = () => {
        if (!esFormularioValido || turnoRequiereArea) return;
        sincronizarMutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[460px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
                        {esEdicion
                            ? <Edit2 className="h-5 w-5 text-indigo-600" />
                            : <CalendarIcon className="h-5 w-5 text-indigo-600" />
                        }
                        {esEdicion ? 'Modificar Novedad' : 'Registrar Novedad'}
                    </DialogTitle>
                    <p className="text-sm text-slate-500 font-medium">
                        Empleado: <span className="text-indigo-600 font-bold">{empleado?.nombre}</span>
                    </p>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    {/* Tipo de novedad */}
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-400 ml-1">Tipo de Novedad</Label>
                        <Select value={tipoNovedad} onValueChange={setTipoNovedad}>
                            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold">
                                <SelectValue placeholder="Seleccionar tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {(tiposNovedad as any[]).map((t: any, idx: number) => (
                                    <SelectItem key={t.id_novedad_tipo} value={t.id_novedad_tipo.toString()} className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${PALETA_COLORES[idx % PALETA_COLORES.length]}`} />
                                            {t.nombre_novedad}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Fechas — solo para creación (edición opera en fecha puntual) */}
                    {!esEdicion ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-400 ml-1">Desde</Label>
                                <Input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-400 ml-1">Hasta</Label>
                                <Input
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    className="h-12 bg-slate-50 border-slate-200 rounded-xl font-bold"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-400 ml-1">Fecha</Label>
                            <Input
                                type="date"
                                value={fechaInicio}
                                readOnly
                                className="h-12 bg-slate-100 border-slate-200 rounded-xl font-bold text-slate-500 cursor-default"
                            />
                        </div>
                    )}

                    {/* Área y Turno opcionales */}
                    <div className="border-t pt-4 space-y-3">
                        <p className="text-xs font-black uppercase text-slate-400 ml-1">
                            Asignación de trabajo <span className="font-medium normal-case text-slate-400">(opcional)</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 ml-1">Área</Label>
                                <Select value={areaId} onValueChange={(v) => { setAreaId(v); setTurnoId(""); }}>
                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-bold">
                                        <SelectValue placeholder="Sin área..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(areasData as any[]).map((a: any) => (
                                            <SelectItem key={a.id_area} value={a.id_area.toString()} className="font-medium text-sm">
                                                {a.nombre_area}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 ml-1">Turno</Label>
                                <Select value={turnoId} onValueChange={setTurnoId} disabled={!areaId}>
                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl text-sm font-bold disabled:opacity-50">
                                        <SelectValue placeholder="Sin turno..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(turnosData as any[]).map((t: any) => (
                                            <SelectItem key={t.id_turno} value={t.id_turno.toString()} className="font-medium text-sm">
                                                {t.tipo_turno}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {turnoRequiereArea && (
                            <p className="text-xs text-rose-500 font-bold ml-1">Si seleccionas turno debes seleccionar también un área.</p>
                        )}
                        {areaId && !turnoId && (
                            <p className="text-xs text-amber-500 font-semibold ml-1">Selecciona un turno para completar la asignación.</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="font-bold text-slate-500"
                        disabled={sincronizarMutation.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGuardar}
                        disabled={!esFormularioValido || turnoRequiereArea || sincronizarMutation.isPending}
                        className={`font-black px-8 rounded-xl h-12 shadow-lg transition-all active:scale-95 ${(!esFormularioValido || turnoRequiereArea)
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                            }`}
                    >
                        {sincronizarMutation.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Save className="h-5 w-5 mr-2" />
                                {esEdicion ? 'ACTUALIZAR' : 'GUARDAR'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
