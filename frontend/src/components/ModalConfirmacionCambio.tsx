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
import { AlertTriangle } from "lucide-react";

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
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <AlertDialogTitle className="text-lg font-bold">
                            Advertencia de violación de Reglas
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="space-y-3">
                        <p className="font-medium text-slate-900">
                            El movimiento que intenta realizar rompe las siguientes reglas:
                        </p>
                        <div className="bg-red-50 border border-red-100 rounded-md p-3 space-y-2">
                            {advertencias.map((adv, index) => (
                                <div key={index} className="flex gap-2 text-sm text-red-800">
                                    <span>•</span>
                                    <span>{adv}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-slate-600 text-sm mt-2">
                            ¿Desea aplicar el cambio de todas formas e ignorar estas advertencias?
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                    >
                        Sí, aplicar cambio
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}