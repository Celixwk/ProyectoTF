import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, XCircle } from "lucide-react";

interface ModalConfirmacionCambioProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    advertencias: string[];
}

export function ModalConfirmacionCambio({
    open,
    onOpenChange,
    onConfirm,
    advertencias,
}: ModalConfirmacionCambioProps) {
    const tieneReglaDura = advertencias.some(adv =>
        adv.includes('⛔ CONFLICTO:') ||
        adv.includes('AREA LLENA')
    );

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className={`flex items-center gap-2 mb-2 ${tieneReglaDura ? 'text-red-700' : 'text-amber-600'}`}>
                        {tieneReglaDura ? (
                            <XCircle className="h-6 w-6" />
                        ) : (
                            <AlertTriangle className="h-6 w-6" />
                        )}
                        <AlertDialogTitle className="text-lg font-bold">
                            {tieneReglaDura ? 'Error: Movimiento Bloqueado' : 'Advertencia de violación de Reglas'}
                        </AlertDialogTitle>
                    </div>

                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <p className="font-medium text-slate-900">
                                {tieneReglaDura
                                    ? 'El movimiento no puede realizarse debido a las siguientes restricciones:'
                                    : 'El movimiento que intenta realizar rompe las siguientes reglas:'}
                            </p>

                            <div className={`border rounded-md p-3 space-y-2 ${tieneReglaDura
                                ? 'bg-red-50 border-red-200'
                                : 'bg-amber-50 border-amber-200'
                                }`}>
                                {advertencias.map((adv, index) => {
                                    const matchProhibido = adv.match(/^⛔ PROHIBIDO:\s(.+?)\sNO\s(.+)$/);
                                    const matchConflicto = adv.match(/^⛔ CONFLICTO:\s(.+?)\sya\s(.+)$/);
                                    const matchFatiga = adv.match(/^⛔ FATIGA:\s(.+?)\sexcedería\s(.+)$/);

                                    if (matchProhibido) {
                                        const [, nombre, resto] = matchProhibido;
                                        return (
                                            <div key={index} className={`flex gap-2 text-sm ${tieneReglaDura ? 'text-red-900' : 'text-amber-900'}`}>
                                                <span>•</span>
                                                <span>
                                                    ⛔ PROHIBIDO: <strong>{nombre}</strong> NO {resto}
                                                </span>
                                            </div>
                                        );
                                    }

                                    if (matchConflicto) {
                                        const [, nombre, resto] = matchConflicto;
                                        return (
                                            <div key={index} className="flex gap-2 text-sm text-red-900 font-medium">
                                                <span>•</span>
                                                <span>
                                                    ⛔ CONFLICTO: <strong>{nombre}</strong> ya {resto}
                                                </span>
                                            </div>
                                        );
                                    }

                                    if (matchFatiga) {
                                        const [, nombre, resto] = matchFatiga;
                                        return (
                                            <div key={index} className="flex gap-2 text-sm text-amber-900">
                                                <span>•</span>
                                                <span>
                                                    ⛔ FATIGA: <strong>{nombre}</strong> excedería {resto}
                                                </span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={index} className={`flex gap-2 text-sm ${tieneReglaDura ? 'text-red-900' : 'text-amber-900'}`}>
                                            <span>•</span>
                                            <span>{adv}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {!tieneReglaDura && (
                                <p className="text-slate-600 text-sm mt-2">
                                    ¿Desea aplicar el cambio de todas formas e ignorar estas advertencias?
                                </p>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>
                        {tieneReglaDura ? 'Cerrar' : 'Cancelar'}
                    </AlertDialogCancel>
                    {!tieneReglaDura && (
                        <AlertDialogAction
                            onClick={onConfirm}
                            className="bg-amber-600 hover:bg-amber-700 text-white border-none"
                        >
                            Sí, aplicar cambio
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}