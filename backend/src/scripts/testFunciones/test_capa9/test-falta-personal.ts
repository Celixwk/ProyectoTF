import { capa9_detectarProblemas } from "../../../services/programacion/capa9.deteccionProblemas";
import { Asignacion, EmpleadoDisponible } from "../../../services/programacion/tipos";

async function testFaltaPersonal() {
    console.log("==================================================");
    console.log("PRUEBA DE CAPA 9: DETECCIÓN DE FALTA DE PERSONAL");
    console.log("==================================================");

    const areas = [
        { id_area: 1, nombre_area: "Cajas", prioridad: 1 },
        { id_area: 2, nombre_area: "Bodega", prioridad: 2 }
    ];

    const maximosPorArea = new Map<number, number>();
    maximosPorArea.set(1, 3);
    maximosPorArea.set(2, 2);

    const fecha = new Date();
    const empleadosDisponibles: EmpleadoDisponible[] = [];

    // CASO 1: Área vacía
    console.log("\nCASO 1: Área vacía (Cero asignados)");
    const programacionVacia: Asignacion[] = [];

    const alertas1 = capa9_detectarProblemas(programacionVacia, areas, empleadosDisponibles, maximosPorArea, fecha);
    alertas1.filter(a => a.codigo === 'AREA_SIN_PERSONAL' || a.codigo === 'AREA_DEFICIT_PERSONAL')
        .forEach(a => console.log(`[${a.tipo.toUpperCase()}] ${a.mensaje}`));

    // CASO 2: Déficit parcial (Cajas 2/3)
    console.log("\nCASO 2: Déficit parcial (2/3 asignados)");
    const programacionIncompleta: Asignacion[] = [
        { id_empleado: 1, id_area: 1, id_turno: 1, fecha: fecha } as any,
        { id_empleado: 2, id_area: 1, id_turno: 1, fecha: fecha } as any
    ];

    const alertas2 = capa9_detectarProblemas(programacionIncompleta, areas, empleadosDisponibles, maximosPorArea, fecha);
    alertas2.filter(a => a.area === 1 && a.codigo === 'AREA_DEFICIT_PERSONAL')
        .forEach(a => console.log(`[${a.tipo.toUpperCase()}] ${a.mensaje}`));

    // CASO 3: Cobertura completa
    console.log("\nCASO 3: Cobertura completa");
    const programacionCompleta: Asignacion[] = [
        { id_empleado: 1, id_area: 1, id_turno: 1, fecha: fecha } as any,
        { id_empleado: 2, id_area: 1, id_turno: 1, fecha: fecha } as any,
        { id_empleado: 3, id_area: 1, id_turno: 1, fecha: fecha } as any,
        { id_empleado: 4, id_area: 2, id_turno: 1, fecha: fecha } as any,
        { id_empleado: 5, id_area: 2, id_turno: 1, fecha: fecha } as any
    ];

    const alertas3 = capa9_detectarProblemas(programacionCompleta, areas, empleadosDisponibles, maximosPorArea, fecha);
    const alertasFiltro3 = alertas3.filter(a => a.codigo === 'AREA_SIN_PERSONAL' || a.codigo === 'AREA_DEFICIT_PERSONAL');

    if (alertasFiltro3.length === 0) {
        console.log("✅ SIN ALERTAS DE FALTA DE PERSONAL");
    } else {
        alertasFiltro3.forEach(a => console.log(`⚠️ ALERTA INESPERADA: ${a.mensaje}`));
    }

    console.log("\n==================================================");
}

testFaltaPersonal();