import prisma from "../../../prisma/cliente";
import { capa3_obtenerPrioridadAreas } from "../../../services/programacion/capa3.reglasArea";
import type { AreaPriorizada } from "../../../services/programacion/tipos";

async function main() {
  console.log("=== 🧪 Test de prioridades de áreas ===\n");

  // 1. Cargar áreas reales desde BD
  const areas = await prisma.area.findMany({
    select: { id_area: true, nombre_area: true },
  });

  console.log("📌 Áreas cargadas desde BD:");
  console.table(areas);

  // 2. Obtener prioridades desde BD o fallback
  const prioridadesBD: AreaPriorizada[] = await capa3_obtenerPrioridadAreas(areas);
  console.log("\n📌 Prioridades obtenidas (BD o fallback):");
  console.table(
    prioridadesBD.map(a => ({
      id_area: a.id_area,
      nombre_area: a.nombre_area,
      prioridad: a.prioridad,
    }))
  );

  // 3. Probar con prioridades mockeadas (inyección)
  const prioridadesMock = { [areas[0]?.id_area ?? 0]: 1, [areas[1]?.id_area ?? 0]: 2 };
  const prioridadesInyectadas: AreaPriorizada[] = await capa3_obtenerPrioridadAreas(
    areas,
    { prioridades: prioridadesMock }
  );

  console.log("\n📌 Prioridades obtenidas con mock inyectado:");
  console.table(
    prioridadesInyectadas.map(a => ({
      id_area: a.id_area,
      nombre_area: a.nombre_area,
      prioridad: a.prioridad,
    }))
  );

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("❌ Error en test-prioridades-areas:", err);
});
