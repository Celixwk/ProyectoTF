
import prisma from "../prisma/cliente";
import { capa6_generarProgramacionDia } from "../services/programacion/capa6.integracion";
import { capa5_generarAsignacionesDia } from "../services/programacion/capa5.GeneracionAsignacion";
import { Asignacion } from "../services/programacion/tipos";

async function reproduce() {
    console.log("=== STARTING REPRODUCTION ===");
    const fecha = new Date("2026-01-07"); // Use a near future date
    console.log(`Testing for date: ${fecha.toISOString()}`);

    // 1. Test full generation via Capa 6
    console.log("\n--- Testing Capa 6 Generation ---");
    try {
        const resultado = await capa6_generarProgramacionDia(fecha);
        console.log("Result Summary:");
        console.log(`- Total Assignments Generated: ${resultado.asignaciones.length}`);
        console.log(`- Alerts: ${resultado.alertas.length}`);
        console.log(`- Critical Errors: ${resultado.alertas.filter(a => a.tipo === 'error').length}`);

        console.log("Guardado Info:");
        console.log(JSON.stringify(resultado.guardado, null, 2));

        if (resultado.asignaciones.length > 0) {
            // 2. Try to manually save the first assignment to see the REAL error
            console.log("\n--- Testing Manual Save of First Assignment (to catch swallowed error) ---");
            const asig = resultado.asignaciones[0];
            try {
                // Mimic the exact upsert from capa6
                await prisma.detalleProgramacion.upsert({
                    where: {
                        uq_empleado_fecha: {
                            id_empleado: asig.id_empleado,
                            fecha: asig.fecha
                        }
                    },
                    update: {
                        id_area: asig.id_area,
                        id_turno: asig.id_turno,
                        updated_at: new Date(),
                        tipo_dia: "Laborado",
                        origen_registro: "Automatico",
                        id_labor_mes: asig.id_labor_mes
                    },
                    create: {
                        id_empleado: asig.id_empleado,
                        fecha: asig.fecha,
                        id_area: asig.id_area,
                        id_turno: asig.id_turno,
                        id_labor_mes: asig.id_labor_mes,
                        tipo_dia: "Laborado",
                        estado: "Activo",
                        origen_registro: "Automatico"
                    }
                });
                console.log("✅ Manual save SUCCESSFUL");
            } catch (e: any) {
                console.error("❌ Manual save FAILED with error:");
                console.error(e);
            }
        } else {
            console.log("⚠️ No assignments generated, so nothing to save.");
        }

    } catch (e: any) {
        console.error("Capa 6 Execution Failed:", e);
    }
}

reproduce()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
