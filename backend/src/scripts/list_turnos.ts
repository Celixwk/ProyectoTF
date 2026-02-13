
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const turnos = await prisma.turno.findMany({
        where: {
            id_turno: {
                in: [1, 2, 3]
            }
        }
    });
    console.log(JSON.stringify(turnos, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
