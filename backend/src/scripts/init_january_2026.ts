
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initJanuary2026() {
    console.log("Initializing LaborMes for January 2026...");

    // 1. Get all active employees
    const empleados = await prisma.empleado.findMany({
        where: { id_estado: 1 } // Activo
    });

    console.log(`Found ${empleados.length} active employees.`);

    const fechaInicio = new Date("2026-01-01"); // Start of Jan
    const fechaFin = new Date("2026-01-31");    // End of Jan

    let createdCount = 0;
    let errorCount = 0;

    for (const emp of empleados) {
        // Check if already exists
        const exists = await prisma.laborMes.findFirst({
            where: {
                id_empleado: emp.id_empleado,
                fecha_inicio: fechaInicio
            }
        });

        if (!exists) {
            try {
                await prisma.laborMes.create({
                    data: {
                        id_empleado: emp.id_empleado,
                        fecha_inicio: fechaInicio,
                        fecha_fin: fechaFin,
                        estado: 'Abierto',
                        horas_mes: 0
                    }
                });
                createdCount++;
            } catch (e: any) {
                console.error(`Failed for Emp ${emp.id_empleado}:`, e.message);
                errorCount++;
            }
        } else {
            // console.log(`Skipping Emp ${emp.id_empleado}, already exists.`);
        }
    }

    console.log(`Summary: Created ${createdCount}, Errors ${errorCount}, Skips ${empleados.length - createdCount - errorCount}`);

    // Verify one
    if (empleados.length > 0) {
        const verify = await prisma.laborMes.findFirst({ where: { id_empleado: empleados[0].id_empleado, fecha_inicio: fechaInicio } });
        console.log("Sample Verification:", verify);
    }
}

initJanuary2026();
