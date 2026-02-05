import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando corrección de secuencias...');

    // Fix Area sequence
    try {
        const areaMaxResult = await prisma.area.aggregate({ _max: { id_area: true } });
        const areaMax = areaMaxResult._max.id_area || 0;
        const nextAreaId = areaMax + 1;

        // Postgres specific: setval
        // Sequence name convention: table_column_seq
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('area', 'id_area'), ${nextAreaId}, false)`);
        console.log(`✅ Secuencia de Area actualizada. Próximo ID será: ${nextAreaId}`);
    } catch (error) {
        console.error('❌ Error actualizando secuencia de Area:', error);
    }

    // Fix Cargo sequence (just in case)
    try {
        const cargoMaxResult = await prisma.cargo.aggregate({ _max: { id_cargo: true } });
        const cargoMax = cargoMaxResult._max.id_cargo || 0;
        const nextCargoId = cargoMax + 1;

        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('cargo', 'id_cargo'), ${nextCargoId}, false)`);
        console.log(`✅ Secuencia de Cargo actualizada. Próximo ID será: ${nextCargoId}`);
    } catch (error) {
        console.error('❌ Error actualizando secuencia de Cargo:', error);
    }

    // Fix Turno sequence (just in case)
    try {
        const turnoMaxResult = await prisma.turno.aggregate({ _max: { id_turno: true } });
        const turnoMax = turnoMaxResult._max.id_turno || 0;
        const nextTurnoId = turnoMax + 1;

        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('turno', 'id_turno'), ${nextTurnoId}, false)`);
        console.log(`✅ Secuencia de Turno actualizada. Próximo ID será: ${nextTurnoId}`);
    } catch (error) {
        console.error('❌ Error actualizando secuencia de Turno:', error);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
