import { AlertCircle } from 'lucide-react';
import type { FieldErrors } from 'react-hook-form';

interface FormErrorSummaryProps {
  errors: FieldErrors<any>;
}

/**
 * Muestra un resumen de errores de validación del formulario.
 * Aparece automáticamente cuando hay errores después de intentar guardar.
 */
export function FormErrorSummary({ errors }: FormErrorSummaryProps) {
  const errorMessages = Object.values(errors)
    .map((err: any) => {
      if (!err) return null;
      if (typeof err.message === 'string' && err.message) return err.message;
      // Manejar errores anidados (ej: arrays de objetos)
      if (typeof err === 'object' && !Array.isArray(err)) {
        return Object.values(err)
          .map((nested: any) => nested?.message)
          .filter(Boolean)
          .join(', ');
      }
      return null;
    })
    .filter(Boolean) as string[];

  if (errorMessages.length === 0) return null;

  return (
    <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <div>
        <p className="font-semibold mb-1">Por favor corrige los siguientes errores:</p>
        <ul className="list-disc list-inside space-y-0.5">
          {errorMessages.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
