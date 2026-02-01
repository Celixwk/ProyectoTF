"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function run() {
    console.log("Connecting to DB...");
    const fecha = new Date("2026-01-05");
    const id_empleado = 900000023; // MANUELA CLAROS
    const area = await prisma.area.findFirst();
    const turno = await prisma.turno.findFirst({ where: { estado: 'Activo' } });
    if (!area || !turno) {
        console.log("No area/turno found");
        return;
    }
    console.log(`Upserting: Emp ${id_empleado}, Area ${area.id_area}, Turno ${turno.id_turno}`);
    try {
        const res = await prisma.detalleProgramacion.upsert({
            where: {
                uq_empleado_fecha: {
                    id_empleado: id_empleado,
                    fecha: fecha
                }
            },
            update: {
                id_area: area.id_area,
                id_turno: turno.id_turno,
                updated_at: new Date(),
                tipo_dia: "Laborado",
                origen_registro: "Manual_Test"
            },
            create: {
                id_empleado: id_empleado,
                fecha: fecha,
                id_area: area.id_area,
                id_turno: turno.id_turno,
                tipo_dia: "Laborado",
                estado: "Activo",
                origen_registro: "Manual_Test"
            }
        });
        console.log("Upsert Success:", res);
    }
    catch (e) {
        console.error("Upsert Failed:", e);
    }
}
run();
