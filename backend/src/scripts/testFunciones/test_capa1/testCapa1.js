"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa1_especializacion_1 = require("../../../services/programacion/capa1.especializacion");
async function main() {
    const resultado = await (0, capa1_especializacion_1.capa1_ordenarPorEspecializacion)();
    console.log(JSON.stringify(resultado, null, 2));
}
main();
