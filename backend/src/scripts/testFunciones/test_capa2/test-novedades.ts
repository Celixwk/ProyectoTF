import { capa2_verificarDisponibilidad } from "../../../services/programacion/capa2.disponibilidad";
import type { EmpleadoOrdenado, NovedadPorFecha } from "../../../services/programacion/tipos";

async function main() {
    const fechaPrueba = new Date("2025-01-15");

    const mockNovedades = new Map<number, NovedadPorFecha>();
    mockNovedades.set(10, {
        id_empleado: 10,
        tipo_novedad: "Incapacidad",
        codigo: "INCAP",
        fecha_inicio: new Date("2025-01-10"),
        fecha_fin: new Date("2025-01-20")
    });

    const empleadoTest = {
        id_empleado: 10,
        nombre: "Empleado Prueba",
        id_estado: 1,
        puntos: 100
    } as unknown as EmpleadoOrdenado;

    console.log("--- INICIANDO TEST ---");
    
    const resultado = await capa2_verificarDisponibilidad(
        empleadoTest,
        fechaPrueba,
        mockNovedades
    );

    console.log("Resultado:", resultado);

    if (!resultado.disponible && resultado.tipoNovedad === 'INCAP') {
        console.log("ESTADO: OK");
    } else {
        console.log("ESTADO: ERROR");
    }
}

main();