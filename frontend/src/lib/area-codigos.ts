/**
 * Mapeo de áreas a códigos cortos para visualización
 */

export const CODIGOS_AREA: Record<string, string> = {
  'Sala Principal': 'C 5',
  'SALA PRINCIPAL': 'C 5',
  'Puertas y Sala': 'PTA1',
  'PUERTAS Y SALA': 'PTA1',
  'Baño 1': 'BÑO1',
  'BAÑO 1': 'BÑO1',
  'Baños 3': 'BÑO3',
  'BAÑOS 3': 'BÑO3',
  'Sala Taxis': 'ST',
  'SALA TAXIS': 'ST',
  'Caseta de Entrada': 'CTE',
  'CASETA DE ENTRADA': 'CTE',
  'Caseta de Salida': 'CTS',
  'CASETA DE SALIDA': 'CTS',
  'Conduce': 'C',
  'CONDUCE': 'C',
  'Parqueadero 1': 'PQA1',
  'PARQUEADERO 1': 'PQA1',
  'Parqueadero 2': 'PQA2',
  'PARQUEADERO 2': 'PQA2',
  'Periférico Norte': 'PN',
  'PERIFÉRICO NORTE': 'PN',
  'Periférico Sur': 'PS',
  'PERIFÉRICO SUR': 'PS',
};

/**
 * Colores para cada área (para visualización)
 */
export const COLORES_AREA: Record<string, string> = {
  'Sala Principal': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  'SALA PRINCIPAL': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  'Puertas y Sala': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  'PUERTAS Y SALA': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  'Baño 1': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  'BAÑO 1': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  'Baños 3': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  'BAÑOS 3': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  'Sala Taxis': 'bg-white dark:bg-gray-900/30 text-gray-800 dark:text-gray-200',
  'SALA TAXIS': 'bg-white dark:bg-gray-900/30 text-gray-800 dark:text-gray-200',
  'Caseta de Entrada': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200',
  'CASETA DE ENTRADA': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200',
  'Caseta de Salida': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
  'CASETA DE SALIDA': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200',
  'Conduce': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
  'CONDUCE': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
  'Parqueadero 1': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200',
  'PARQUEADERO 1': 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200',
  'Parqueadero 2': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
  'PARQUEADERO 2': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
  'Periférico Norte': 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200',
  'PERIFÉRICO NORTE': 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200',
  'Periférico Sur': 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200',
  'PERIFÉRICO SUR': 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-200',
};

/**
 * Obtiene el código corto de un área
 */
export function obtenerCodigoArea(nombreArea: string): string {
  return CODIGOS_AREA[nombreArea] || nombreArea.substring(0, 4).toUpperCase();
}

/**
 * Obtiene las clases de color para un área
 */
export function obtenerColorArea(nombreArea: string): string {
  return COLORES_AREA[nombreArea] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200';
}

