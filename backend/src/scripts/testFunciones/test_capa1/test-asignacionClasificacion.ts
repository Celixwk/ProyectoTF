console.log("✅ Ejecutando prueba de la función principal de Capa 1...");

import { capa1_ordenarPorEspecializacion } from "../../../services/programacion/capa1.especializacion";
import prisma from "../../../prisma/cliente";

async function main() {
  const resultado = await capa1_ordenarPorEspecializacion();

  console.log("\n=== ✅ ESPECIALISTAS ===");
  console.table(resultado.especialistas);

  console.log("\n=== ✅ FLEXIBLES ===");
  console.table(resultado.flexibles);

  console.log("\n=== ✅ COMODINES ===");
  console.table(resultado.comodines);

  console.log("\n=== ✅ TODOS ORDENADOS ===");
  console.table(resultado.todos);

  await prisma.$disconnect();
}

main();