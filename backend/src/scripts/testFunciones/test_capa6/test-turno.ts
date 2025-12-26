import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const turnos = await prisma.turno.findMany();
  console.log(turnos);
}

main();
