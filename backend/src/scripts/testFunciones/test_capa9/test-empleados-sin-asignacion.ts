import { capa9_detectarProblemas } from "../../../services/programacion/capa9.deteccionProblemas";
import { EmpleadoDisponible, Asignacion } from "../../../services/programacion/tipos";

async function testHuecosConSugerencias() {
    console.log("\n==================================================");
    console.log("TEST: DETECCIÓN DE HUECOS + EMPLEADOS SUGERIDOS");
    console.log("==================================================");

    const fechaHoy = new Date();
    const areas = [{ id_area: 1, nombre_area: "Cajas", prioridad: 1 }];
    const maximosPorArea = new Map([[1, 2]]);

    const programacion: Asignacion[] = [
        {
            id_empleado: 102,
            id_area: 1,
            id_turno: 1,
            fecha: fechaHoy,
            nombre_empleado: "Pedro Asignado"
        }
    ];

    const disponibles: EmpleadoDisponible[] = [
        {
            id_empleado: 101,
            nombre_completo: "Juan Disponible",
            disponible: true,
            cedula: "123",
            total_areas: 1,
            clasificacion: 'especialista',
            areas: [{ id_area: 1, nombre_area: "Cajas" }]
        } as any,
        {
            id_empleado: 102,
            nombre_completo: "Pedro Asignado",
            disponible: true,
            cedula: "456",
            total_areas: 1,
            clasificacion: 'especialista',
            areas: [{ id_area: 1, nombre_area: "Cajas" }]
        } as any
    ];

    const alertas = capa9_detectarProblemas(programacion, areas, disponibles, maximosPorArea, fechaHoy);

    const alertaHueco = alertas.find(a => a.codigo === 'AREA_DEFICIT_PERSONAL' || a.codigo === 'AREA_SIN_PERSONAL');

    if (alertaHueco) {
        console.log("✅ HUECO DETECTADO CORRECTAMENTE");
        console.log(`Mensaje: ${alertaHueco.mensaje}`);

        if (alertaHueco.empleados_sugeridos && alertaHueco.empleados_sugeridos.length > 0) {
            console.log("✨ SUGERENCIA INTELIGENTE ENCONTRADA:");
            console.log(`   El sistema sugiere asignar a: ${alertaHueco.empleados_sugeridos[0].nombre}`);
            console.log(`   Acciones recomendadas: ${alertaHueco.acciones_sugeridas?.join(", ")}`);
        } else {
            console.log("❌ FALLÓ: No se encontraron empleados sugeridos.");
        }
    } else {
        console.log("❌ FALLÓ: No se detectó el déficit en el área.");
    }

    const alertaSinAsignar = alertas.find(a => a.codigo === 'EMPLEADOS_SIN_ASIGNACION');
    if (alertaSinAsignar) {
        console.log("✅ ALERTA DE DISPONIBLES DETECTADA");
    }

    console.log("==================================================\n");
}

testHuecosConSugerencias();