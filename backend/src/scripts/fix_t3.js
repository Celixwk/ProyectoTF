"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Update T3 (id=7 based on previous check)
    // Legend says T3 is 14:00 - 23:00
    // Previous output showed T3 was 11:00 - 19:00
    const hEntrada = new Date('1970-01-01T14:00:00Z');
    const hSalida = new Date('1970-01-01T23:00:00Z');
    const updated = await prisma.turno.update({
        where: { tipo_turno: 'T3' },
        data: {
            hora_entrada: hEntrada,
            hora_salida: hSalida,
            duracion_horas: 9
        }
    });
    console.log('Updated T3:', updated);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
