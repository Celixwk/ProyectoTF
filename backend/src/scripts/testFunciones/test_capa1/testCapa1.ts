import { capa1_ordenarPorEspecializacion } from "../../../services/programacion/capa1.especializacion";

async function main() {
  const resultado = await capa1_ordenarPorEspecializacion();
  console.log(JSON.stringify(resultado, null, 2));
}

main();