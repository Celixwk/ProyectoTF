import { capa6_generarProgramacionDia } from "../../../services/programacion/capa6.integracion";

async function testMotor() {
  console.log("INICIO DE PRUEBA: Validación de Motor Multi-Turno (T1 y T2)");
  console.log("--------------------------------------------------------------");

  try {
    const fechaPrueba = new Date();
    fechaPrueba.setHours(0, 0, 0, 0);

    const resultado = await capa6_generarProgramacionDia(fechaPrueba);

    console.log("\nRESUMEN DE RESULTADOS:");
    console.table([{
      "Total Asignaciones": resultado.asignaciones.length,
      "Total Alertas": resultado.alertas.length,
      "Áreas Evaluadas": resultado.resumen.total_areas,
      "Fecha": resultado.fecha.toLocaleDateString()
    }]);

    if (resultado.alertas.length > 0) {
      console.log("\n⚠️ ALERTAS DE COBERTURA (Huecos detectados):");
      resultado.alertas.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.mensaje}`);
      });
    }

    if (resultado.asignaciones.length > 0) {
      console.log("\nDETALLE DE ASIGNACIONES:");
      const vistaTabla = resultado.asignaciones.map(a => ({
        Turno: a.codigo_turno || "S/T",
        Area: a.nombre_area || "S/A",
        Empleado: a.nombre_empleado || "S/N",
        ID_Emp: a.id_empleado
      }));

      console.table(vistaTabla.sort((a, b) => (a.Turno ?? "").localeCompare(b.Turno ?? "")));
    }

    console.log("\n--------------------------------------------------");
    console.log("RESULTADO FINAL: MOTOR EVALUADO EXITOSAMENTE");

  } catch (error) {
    console.error("\n❌ ERROR CRÍTICO DURANTE LA PRUEBA:");
    console.error(error);
  }
}

testMotor();