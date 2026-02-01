"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cliente_1 = __importDefault(require("../prisma/cliente"));
const capa6_integracion_1 = require("../services/programacion/capa6.integracion");
async function testManualAssignment() {
    console.log("--- Testing Manual Assignment ---");
    const fecha = "2026-01-05"; // Today's date in user context
    const id_empleado = 900000023; // MANUELA CLAROS from screenshot
    // Need a valid turno ID and area ID
    const area = await cliente_1.default.area.findFirst();
    const turno = await cliente_1.default.turno.findFirst({ where: { estado: 'Activo' } });
    if (!area || !turno) {
        console.error("No area or turno found for test");
        return;
    }
    console.log(`Assigning Empleado ${id_empleado} to Area ${area.id_area} Turno ${turno.id_turno} on ${fecha}`);
    // Simulate Controller Call logic directly
    try {
        const asignacion = await cliente_1.default.detalleProgramacion.upsert({
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
    }
    catch (e) {
        console.error("Manual Assignment Failed:", e.message);
    }
    // Verify View
    const inView = await cliente_1.default.vw_turnos_asignados.findFirst({
        where: {
            id_empleado: id_empleado,
            fecha: new Date(fecha)
        }
    });
    console.log("View Result:", inView);
}
async function testGeneration() {
    var _a, _b, _c, _d;
    console.log("\n--- Testing Generation ---");
    const fecha = new Date("2026-01-05");
    try {
        const resultado = await (0, capa6_integracion_1.capa6_generarProgramacionDia)(fecha);
        console.log("Generation Result Summary:");
        console.log("Total Asignaciones:", (_a = resultado.resumen) === null || _a === void 0 ? void 0 : _a.total_asignaciones);
        console.log("Guardado Realizado:", (_b = resultado.guardado) === null || _b === void 0 ? void 0 : _b.realizado);
        console.log("Errores de Guardado:", (_c = resultado.guardado) === null || _c === void 0 ? void 0 : _c.errores);
        if (((_d = resultado.resumen) === null || _d === void 0 ? void 0 : _d.total_asignaciones) === 0) {
            console.log("WARNING: 0 assignments generated. Checking why...");
            // Check availability
            const empleados = await cliente_1.default.empleado.findMany({ where: { id_estado: 1 } });
            console.log(`Total Active Employees: ${empleados.length}`);
        }
    }
    catch (e) {
        console.error("Generation Failed:", e.message);
    }
}
async function run() {
    await testManualAssignment();
    await testGeneration();
}
run();
