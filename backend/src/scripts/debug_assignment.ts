
import prisma from "../prisma/cliente";
import { capa6_generarProgramacionDia } from "../services/programacion/capa6.integracion";
import { asignarTurno } from "../controllers/turno.controller";
import { Request, Response } from 'express';

async function testManualAssignment() {
    console.log("--- Testing Manual Assignment ---");
    const fecha = "2026-01-05"; // Today's date in user context
    const id_empleado = 900000023; // MANUELA CLAROS from screenshot
    // Need a valid turno ID and area ID
    const area = await prisma.area.findFirst();
    const turno = await prisma.turno.findFirst({ where: { estado: 'Activo' } });

    if (!area || !turno) {
        console.error("No area or turno found for test");
        return;
    }

    console.log(`Assigning Empleado ${id_empleado} to Area ${area.id_area} Turno ${turno.id_turno} on ${fecha}`);

    // Simulate Controller Call logic directly
    try {
        const asignacion = await prisma.detalleProgramacion.upsert({
            where: {
                uq_empleado_fecha: {
                    id_empleado: id_empleado,
                    fecha: new Date(fecha)
                }
            },
            update: {
                id_area: area.id_area,
                id_turno: turno.id_turno,
                updated_at: new Date(),
                tipo_dia: "Laborado",
                origen_registro: "Manual"
            },
            create: {
                id_empleado: id_empleado,
                fecha: new Date(fecha),
                id_area: area.id_area,
                id_turno: turno.id_turno,
                tipo_dia: "Laborado",
                estado: "Activo",
                origen_registro: "Manual"
            }
        });
        console.log("Manual Assignment Result:", asignacion);
    } catch (e: any) {
        console.error("Manual Assignment Failed:", e.message);
    }

    // Verify View
    const inView = await prisma.vw_turnos_asignados.findFirst({
        where: {
            id_empleado: id_empleado,
            fecha: new Date(fecha)
        }
    });

    console.log("View Result:", inView);
}

async function testGeneration() {
    console.log("\n--- Testing Generation ---");
    const fecha = new Date("2026-01-05");

    try {
        const resultado = await capa6_generarProgramacionDia(fecha);
        console.log("Generation Result Summary:");
        console.log("Total Asignaciones:", resultado.resumen?.total_asignaciones);
        console.log("Guardado Realizado:", resultado.guardado?.realizado);
        console.log("Errores de Guardado:", resultado.guardado?.errores);
        if (resultado.resumen?.total_asignaciones === 0) {
            console.log("WARNING: 0 assignments generated. Checking why...");
            // Check availability
            const empleados = await prisma.empleado.findMany({ where: { id_estado: 1 } });
            console.log(`Total Active Employees: ${empleados.length}`);
        }
    } catch (e: any) {
        console.error("Generation Failed:", e.message);
    }
}

async function run() {
    await testManualAssignment();
    await testGeneration();
}

run();
