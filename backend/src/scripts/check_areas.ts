
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
    const areas = await prisma.area.findMany();
    console.log(JSON.stringify(areas, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
