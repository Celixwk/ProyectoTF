
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function run() {
    console.log("Connecting to DB...");
    const fecha = new Date("2026-01-05");
    const id_empleado = 23; // MANUELA CLAROS internal ID

    // Clean up previous attempts
    try {
        await prisma.detalleProgramacion.deleteMany({
            where: {
                id_empleado: id_empleado,
                fecha: fecha
            }
        });
    } catch (e) { }

    const area = await prisma.area.findFirst();
    const turno = await prisma.turno.findFirst({ where: { estado: 'Activo' } });

    if (!area || !turno) { console.log("No area/turno"); return; }

    console.log(`Upserting Emp ${id_empleado} (NO Labor Mes)...`);

    // 1. Insert without Labor Mes
    await prisma.detalleProgramacion.upsert({
        where: { uq_empleado_fecha: { id_empleado, fecha } },
        update: {
            id_area: area.id_area, id_turno: turno.id_turno,
            tipo_dia: "Laborado", id_labor_mes: null
        },
        create: {
            id_empleado, fecha, id_area: area.id_area, id_turno: turno.id_turno,
            tipo_dia: "Laborado", estado: "Activo", id_labor_mes: null
        }
    });

    // 2. Check View
    const viewResultWithoutLM = await prisma.vw_turnos_asignados.findFirst({
        where: { id_empleado: id_empleado, fecha: fecha }
    });

    console.log("Visible in View (Null Labor Mes)?", !!viewResultWithoutLM, viewResultWithoutLM);

    // 3. Find a labor mes
    const laborMes = await prisma.laborMes.findFirst({
        where: { id_empleado: id_empleado, estado: 'Abierto' }
    });

    if (laborMes) {
        console.log(`Found LaborMes ${laborMes.id_labor_mes}. Updating assignment...`);

        await prisma.detalleProgramacion.update({
            where: { uq_empleado_fecha: { id_empleado, fecha } },
            data: { id_labor_mes: laborMes.id_labor_mes }
        });

        const viewResultWithLM = await prisma.vw_turnos_asignados.findFirst({
            where: { id_empleado: id_empleado, fecha: fecha }
        });

        console.log("Visible in View (With Labor Mes)?", !!viewResultWithLM, viewResultWithLM);
    } else {
        console.log("No active LaborMes found for employee.");
    }
}

run();
