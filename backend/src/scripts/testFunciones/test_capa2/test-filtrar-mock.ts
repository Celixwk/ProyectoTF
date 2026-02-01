import { capa2_filtrarDisponibles } from "../../../services/programacion/capa2.disponibilidad";
import type { EmpleadoOrdenado, NovedadPorFecha } from "../../../services/programacion/tipos";

async function main() {
    const fechaTest = new Date("2025-01-15");

    const empleadosMock: EmpleadoOrdenado[] = [
        {
            id_empleado: 10,
            nombre_completo: "Empleado con incapacidad",
            id_estado: 1,
            cedula: "111",
            total_areas: 2,
            clasificacion: "flexible",
            areas: []
        },
        {
            id_empleado: 20,
            nombre_completo: "Empleado con licencia",
            id_estado: 1,
            cedula: "222",
            total_areas: 1,
            clasificacion: "especialista",
            areas: []
        },
        {
            id_empleado: 30,
            nombre_completo: "Empleado disponible",
            id_estado: 1,
            cedula: "333",
            total_areas: 3,
            clasificacion: "flexible",
            areas: []
        }
    ] as any;

    const mockNovedades = new Map<number, NovedadPorFecha>();
    mockNovedades.set(10, {
        id_empleado: 10,
        tipo_novedad: "Incapacidad",
        codigo: "INCAP",
        fecha_inicio: new Date("2025-01-10"),
        fecha_fin: new Date("2025-01-20")
    });
    mockNovedades.set(20, {
        id_empleado: 20,
        tipo_novedad: "Licencia",
        codigo: "LIC",
        fecha_inicio: new Date("2025-01-01"),
        fecha_fin: new Date("2025-01-30")
    });

    console.log("--- PROBANDO FILTRADO DE DISPONIBLES ---");

    const resultado = await capa2_filtrarDisponibles(empleadosMock, fechaTest, { 
        novedades: mockNovedades 
    });

    console.table(
        resultado.map(r => ({
            Empleado: r.nombre_completo,
            Disponible: r.disponible ? "✅ SÍ" : "❌ NO",
            Razon: r.razonNoDisponible || "N/A",
            Codigo: r.tipoNovedad || "-"
        }))
    );
}

main();