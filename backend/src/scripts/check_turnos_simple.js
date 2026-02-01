"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const turnos = await prisma.turno.findMany();
    turnos.forEach(t => {
        console.log(`${t.id_turno}: ${t.tipo_turno} (${t.hora_entrada.toISOString().substr(11, 5)} - ${t.hora_salida.toISOString().substr(11, 5)})`);
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
