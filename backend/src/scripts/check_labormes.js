"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkLaborMes() {
    const id_empleado = 23;
    const fecha = new Date("2026-01-05");
    console.log(`Searching LaborMes for Emp ${id_empleado} on ${fecha.toISOString()}`);
    const laborMes = await prisma.laborMes.findMany({
        where: {
            id_empleado: id_empleado
        }
    });
    console.log("All LaborMes for employee:", laborMes);
    const match = laborMes.find(lm => {
        const start = new Date(lm.fecha_inicio);
        const end = new Date(lm.fecha_fin);
        return fecha >= start && fecha <= end;
    });
    if (match) {
        console.log("MATCH FOUND:", match);
    }
    else {
        console.log("NO MATCH for date range.");
    }
}
checkLaborMes();
