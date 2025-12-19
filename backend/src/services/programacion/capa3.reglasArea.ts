import prisma from "../../prisma/cliente";
import type { EmpleadoDisponible, AreaPriorizada } from "./tipos";

/**
 * CAPA 3: Obtener prioridad de áreas
 * Define el orden en que se deben llenar las áreas
 * 
 * @param areas Lista de áreas
 * @returns Áreas ordenadas por prioridad
 */
export async function capa3_obtenerPrioridadAreas(
    areas: Array<{ id_area: number; nombre_area: string }>
): Promise<AreaPriorizada[]> {
    // Intentar obtener prioridad desde la tabla de parametrización
    // Si no existe, usar reglas por defecto
    
    try {
        // Usar consulta SQL directa para evitar problemas con tipos de Prisma
        const parametroPrioridad = await prisma.$queryRaw<Array<{
            id_parametro: number;
            nombre_parametro: string;
            valor_texto: string | null;
            activo: boolean;
        }>>`
            SELECT id_parametro, nombre_parametro, valor_texto, activo
            FROM parametrizacion
            WHERE nombre_parametro = 'prioridad_areas'
            AND activo = true
            LIMIT 1
        `;

        if (parametroPrioridad && parametroPrioridad.length > 0 && parametroPrioridad[0].valor_texto) {
            // Si hay configuración en BD, parsearla
            // Formato esperado: JSON con { id_area: prioridad }
            try {
                const prioridades = JSON.parse(parametroPrioridad[0].valor_texto);
                return areas.map(area => ({
                    id_area: area.id_area,
                    nombre_area: area.nombre_area,
                    prioridad: prioridades[area.id_area] || 999 // Prioridad baja por defecto
                })).sort((a, b) => a.prioridad - b.prioridad);
            } catch (e) {
                // Si falla el parseo, usar reglas por defecto
                console.warn('Error al parsear prioridades de áreas desde BD, usando reglas por defecto');
            }
        }
    } catch (error) {
        // Si no existe la tabla o hay error, usar reglas por defecto
        console.warn('No se pudo obtener prioridades desde BD, usando reglas por defecto');
    }

    // Reglas por defecto: ordenar alfabéticamente
    // En el futuro se puede implementar lógica más sofisticada
    return areas.map((area, index) => ({
        id_area: area.id_area,
        nombre_area: area.nombre_area,
        prioridad: index + 1 // Prioridad secuencial por defecto
    })).sort((a, b) => a.nombre_area.localeCompare(b.nombre_area));
}

/**
 * CAPA 3: Aplicar reglas específicas por área
 * Filtra empleados elegibles para una área según sus reglas
 * 
 * @param area Área para la cual aplicar reglas
 * @param empleadosDisponibles Lista de empleados disponibles
 * @param maximosPorArea Mapa de máximos por área
 * @returns Empleados elegibles para esa área
 */
export function capa3_aplicarReglasArea(
    area: { id_area: number; nombre_area: string },
    empleadosDisponibles: EmpleadoDisponible[],
    maximosPorArea: Map<number, number>
): EmpleadoDisponible[] {
    // Filtrar empleados que:
    // 1. Estén disponibles
    // 2. Tengan la área en su lista de áreas permitidas
    //    (Si no tiene áreas permitidas, puede trabajar en todas)
    
    const empleadosElegibles = empleadosDisponibles.filter(empleado => {
        // Debe estar disponible
        if (!empleado.disponible) {
            return false;
        }

        // Si no tiene áreas definidas, puede trabajar en todas
        if (empleado.areas.length === 0) {
            return true;
        }

        // Verificar si tiene esta área permitida
        return empleado.areas.some(a => a.id_area === area.id_area);
    });

    return empleadosElegibles;
}










