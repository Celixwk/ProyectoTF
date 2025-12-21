import prisma from "../../prisma/cliente";

import type { EmpleadoDisponible, AreaPriorizada } from "./tipos";



export async function capa3_obtenerPrioridadAreas(

  areas: Array<{ id_area: number; nombre_area: string }>,

  opciones?: { prioridades?: Record<number, number> }

): Promise<AreaPriorizada[]> {

  // Si se inyectan prioridades en opciones, usarlas directamente

  if (opciones?.prioridades) {

    return areas

      .map(area => ({

        id_area: area.id_area,

        nombre_area: area.nombre_area,

        prioridad: opciones.prioridades![area.id_area] ?? 999

      }))

      .sort((a, b) => a.prioridad - b.prioridad);

  }

  try {

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

    if (parametroPrioridad?.length > 0 && parametroPrioridad[0].valor_texto) {

      try {

        const prioridades = JSON.parse(parametroPrioridad[0].valor_texto) as Record<number, number>;

        return areas

          .map(area => ({

            id_area: area.id_area,

            nombre_area: area.nombre_area,

            prioridad: prioridades[area.id_area] ?? 999

          }))

          .sort((a, b) => a.prioridad - b.prioridad);

      } catch {

        console.warn("Error al parsear prioridades de áreas desde BD, usando reglas por defecto");

      }

    }

  } catch {

    console.warn("No se pudo obtener prioridades desde BD, usando reglas por defecto");

  }



  return areas

    .map((area, index) => ({

      id_area: area.id_area,

      nombre_area: area.nombre_area,

      prioridad: index + 1

    }))

    .sort((a, b) => a.nombre_area.localeCompare(b.nombre_area));

}



export function capa3_aplicarReglasArea(

  area: { id_area: number; nombre_area: string },

  empleadosDisponibles: EmpleadoDisponible[],

  maximosPorArea?: Map<number, number>

): EmpleadoDisponible[] {

  const empleadosElegibles = empleadosDisponibles.filter(empleado => {

    if (!empleado.disponible) return false;

    if (empleado.areas.length === 0) return true;

    return empleado.areas.some(a => a.id_area === area.id_area);

  });



  return empleadosElegibles;

}

