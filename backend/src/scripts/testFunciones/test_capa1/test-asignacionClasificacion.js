"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const capa1_especializacion_1 = require("../../../services/programacion/capa1.especializacion");
const cliente_1 = __importDefault(require("../../../prisma/cliente"));
async function main() {
    console.log("✅ Ejecutando prueba de la función principal de Capa 1...");
    const resultado = await (0, capa1_especializacion_1.capa1_ordenarPorEspecializacion)();
    console.log("\n=== ✅ ESPECIALISTAS ===");
    console.table(resultado.especialistas);
    console.log("\n=== ✅ FLEXIBLES ===");
    console.table(resultado.flexibles);
    console.log("\n=== ✅ COMODINES ===");
    console.table(resultado.comodines);
    console.log("\n=== ✅ TODOS ORDENADOS ===");
    console.table(resultado.todos);
    await cliente_1.default.$disconnect();
}
main();
