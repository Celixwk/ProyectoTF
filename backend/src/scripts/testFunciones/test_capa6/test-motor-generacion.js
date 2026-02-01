"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa6_integracion_1 = require("../../../services/programacion/capa6.integracion");
async function testMotor() {
    var _a, _b;
    try {
        const fechaPrueba = new Date();
        fechaPrueba.setHours(0, 0, 0, 0);
        const resultado = await (0, capa6_integracion_1.capa6_generarProgramacionDia)(fechaPrueba);
        console.log("\nESTADO DE PERSISTENCIA:");
        console.table([resultado.guardado || { realizado: false, razon: "No definido" }]);
        console.log("\nRESUMEN DE EJECUCIÓN:");
        console.table([{
                "Asignaciones": resultado.asignaciones.length,
                "Alertas Totales": resultado.alertas.length,
                "Áreas": resultado.resumen.total_areas,
                "Fecha": resultado.fecha.toISOString().split('T')[0]
            }]);
        if (resultado.alertas.length > 0) {
            console.log("\n⚠️ ALERTAS Y VALIDACIONES (CAPA 9):");
            resultado.alertas.forEach((a, i) => {
                const prefijo = a.tipo === 'error' ? '❌ ERROR' : '⚠️ ADVERTENCIA';
                console.log(`  ${i + 1}. [${prefijo}] ${a.mensaje}`);
            });
        }
        if (resultado.asignaciones.length > 0) {
            console.log("\nDETALLE DE ASIGNACIONES:");
            const vistaTabla = resultado.asignaciones.map(a => ({
                Turno: a.codigo_turno,
                Area: a.nombre_area,
                Empleado: a.nombre_empleado,
                Cedula: a.cedula,
                ID: a.id_empleado
            }));
            console.table(vistaTabla.sort((a, b) => (a.Turno || "").localeCompare(b.Turno || "") ||
                (a.Area || "").localeCompare(b.Area || "")));
        }
        if ((_a = resultado.guardado) === null || _a === void 0 ? void 0 : _a.realizado) {
            console.log("\n✅ ÉXITO: Los datos se han sincronizado con la base de datos.");
        }
        else {
            console.log(`\n❌ AVISO: Los datos NO se guardaron. Razón: ${(_b = resultado.guardado) === null || _b === void 0 ? void 0 : _b.razon}`);
        }
    }
    catch (error) {
        console.error("\n❌ ERROR CRÍTICO EN EL TEST:");
        console.error(error);
    }
}
testMotor();
