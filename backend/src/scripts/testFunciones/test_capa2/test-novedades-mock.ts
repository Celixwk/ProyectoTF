console.log("✅ Probando capa2_verificarDisponibilidad con MOCK...");

import { capa2_verificarDisponibilidad } from "../../../services/programacion/capa2.disponibilidad";
import { TipoClasificacion } from "../../../services/programacion/tipos";


const novedadesMock = new Map<number, any>();

novedadesMock.set(10, {
  id_empleado: 10,
  tipo_novedad: "Incapacidad",
  codigo: "INCAP",
  fecha_inicio: new Date("2025-01-10"),
  fecha_fin: new Date("2025-01-20")
});


const empleadoMock = {
  id_empleado: 10,
  cedula: "1234567890",
  id_estado: 1,
  nombre_completo: "Empleado de prueba",
  total_areas: 2,
  clasificacion: "flexible" as TipoClasificacion,
  areas: []
};


const fecha = new Date("2025-01-15");

async function main() {
  const resultado = await capa2_verificarDisponibilidad(
    empleadoMock,
    fecha,
    novedadesMock 
  );

  console.log("Resultado:", resultado);
}

main();