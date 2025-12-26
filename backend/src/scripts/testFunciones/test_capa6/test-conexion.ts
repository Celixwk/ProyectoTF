import prisma from "../../../prisma/cliente";

async function main() {
  console.log("INICIO DE PRUEBA: Conexión y Estado de Datos");
  console.log("--------------------------------------------------");

  try {
    const [
      totalEmpleados,
      empleadosActivos,
      totalAreas,
      totalTurnos
    ] = await Promise.all([
      prisma.empleado.count(),
      prisma.empleado.count({ where: { id_estado: 1 } }),
      prisma.area.count(),
      prisma.turno.count({ where: { estado: "Activo" } })
    ]);

    const muestraEmpleado = await prisma.empleado.findFirst({
      select: { id_empleado: true, nombre1: true, id_estado: true }
    });

    console.log("RESUMEN DE INFRAESTRUCTURA:");
    
    const tablaResumen = [
      { Entidad: "Empleados Totales", Cantidad: totalEmpleados, Estado: "OK" },
      { Entidad: "Empleados Activos (id_estado: 1)", Cantidad: empleadosActivos, Estado: empleadosActivos > 0 ? "OK" : "CRÍTICO" },
      { Entidad: "Áreas en BD", Cantidad: totalAreas, Estado: totalAreas > 0 ? "OK" : "CRÍTICO" },
      { Entidad: "Turnos Activos", Cantidad: totalTurnos, Estado: totalTurnos > 0 ? "OK" : "CRÍTICO" }
    ];

    console.table(tablaResumen);

    if (muestraEmpleado) {
      console.log("DATOS DE MUESTRA (Validación de campos):");
      console.log(`ID: ${muestraEmpleado.id_empleado} | Nombre: ${muestraEmpleado.nombre1} | Estado: ${muestraEmpleado.id_estado}`);
    }

    console.log("--------------------------------------------------");
    console.log("RESULTADO FINAL: CONEXIÓN EXITOSA");

  } catch (error) {
    console.error("ERROR: Fallo en la comunicación con la base de datos.");
    console.error("DETALLE:");
    if (error instanceof Error) {
      console.error(error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();