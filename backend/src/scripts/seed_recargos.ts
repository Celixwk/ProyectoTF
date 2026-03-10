import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tiposRecargoBase = [
    {
        codigo: 'RNO',
        nombre_recargo: 'Recargo Nocturno Ordinario',
        porcentaje_recargo: 35,
        descripcion: 'Recargo por laborar en jornada ordinaria nocturna (21:00 a 06:00)',
        activo: true
    },
    {
        codigo: 'RNF',
        nombre_recargo: 'Recargo Nocturno Festivo',
        porcentaje_recargo: 110,
        descripcion: 'Recargo por laborar en jornada nocturna durante domingo o festivo',
        activo: true
    },
    {
        codigo: 'HEOD',
        nombre_recargo: 'Hora Extra Ordinaria Diurna',
        porcentaje_recargo: 25,
        descripcion: 'Hora extra laborada en jornada diurna (06:00 a 21:00)',
        activo: true
    },
    {
        codigo: 'HEON',
        nombre_recargo: 'Hora Extra Ordinaria Nocturna',
        porcentaje_recargo: 75,
        descripcion: 'Hora extra laborada en jornada nocturna (21:00 a 06:00)',
        activo: true
    },
    {
        codigo: 'HEFD',
        nombre_recargo: 'Hora Extra Festiva Diurna',
        porcentaje_recargo: 100,
        descripcion: 'Hora extra laborada en domingo o festivo en jornada diurna',
        activo: true
    },
    {
        codigo: 'HEFN',
        nombre_recargo: 'Hora Extra Festiva Nocturna',
        porcentaje_recargo: 150,
        descripcion: 'Hora extra laborada en domingo o festivo en jornada nocturna',
        activo: true
    },
    {
        codigo: 'D',
        nombre_recargo: 'Dominical Diurno',
        porcentaje_recargo: 75,
        descripcion: 'Recargo por laborar en día de descanso obligatorio (Domingo)',
        activo: true
    },
    {
        codigo: 'F',
        nombre_recargo: 'Festivo Diurno',
        porcentaje_recargo: 75,
        descripcion: 'Recargo por laborar en día festivo',
        activo: true
    }
];

async function main() {
    console.log('Iniciando poblado de Tipos de Recargo...');

    for (const tipo of tiposRecargoBase) {
        // Usamos upsert para no duplicar si el script se corre varias veces
        const recargo = await prisma.tipoRecargo.upsert({
            where: { codigo: tipo.codigo },
            update: {}, // Si ya existe, no actualizar nada por si el usuario lo editó
            create: tipo,
        });
        console.log(`Verificado/Creado: ${recargo.codigo} - ${recargo.nombre_recargo}`);
    }

    console.log('¡Proceso finalizado con éxito!');
}

main()
    .catch((e) => {
        console.error('Error al poblar base de datos:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
