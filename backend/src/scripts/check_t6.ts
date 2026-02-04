
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
    const t6 = await prisma.turno.findFirst({ where: { tipo_turno: 'T6' } });
    console.log(JSON.stringify(t6, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
