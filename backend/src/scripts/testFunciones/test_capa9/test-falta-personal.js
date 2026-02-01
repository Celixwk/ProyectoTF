"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa9_deteccionProblemas_1 = require("../../../services/programacion/capa9.deteccionProblemas");
async function testFaltaPersonal() {
    console.log("==================================================");
    console.log("PRUEBA DE CAPA 9: DETECCIÓN DE FALTA DE PERSONAL");
    console.log("==================================================");
    const areas = [
        { id_area: 1, nombre_area: "Cajas", prioridad: 1 },
        { id_area: 2, nombre_area: "Bodega", prioridad: 2 }
    ];
    const maximosPorArea = new Map();
    maximosPorArea.set(1, 3);
    maximosPorArea.set(2, 2);
    const fecha = new Date();
    const empleadosDisponibles = [];
    // CASO 1: Área vacía
    console.log("\nCASO 1: Área vacía (Cero asignados)");
    const programacionVacia = [];
    const alertas1 = (0, capa9_deteccionProblemas_1.capa9_detectarProblemas)(programacionVacia, areas, empleadosDisponibles, maximosPorArea, fecha);
    alertas1.filter(a => a.codigo === 'AREA_SIN_PERSONAL' || a.codigo === 'AREA_DEFICIT_PERSONAL')
        .forEach(a => console.log(`[${a.tipo.toUpperCase()}] ${a.mensaje}`));
    // CASO 2: Déficit parcial (Cajas 2/3)
    console.log("\nCASO 2: Déficit parcial (2/3 asignados)");
    const programacionIncompleta = [
        { id_empleado: 1, id_area: 1, id_turno: 1, fecha: fecha },
        { id_empleado: 2, id_area: 1, id_turno: 1, fecha: fecha }
    ];
    const alertas2 = (0, capa9_deteccionProblemas_1.capa9_detectarProblemas)(programacionIncompleta, areas, empleadosDisponibles, maximosPorArea, fecha);
    alertas2.filter(a => a.area === 1 && a.codigo === 'AREA_DEFICIT_PERSONAL')
        .forEach(a => console.log(`[${a.tipo.toUpperCase()}] ${a.mensaje}`));
    // CASO 3: Cobertura completa
    console.log("\nCASO 3: Cobertura completa");
    const programacionCompleta = [
        { id_empleado: 1, id_area: 1, id_turno: 1, fecha: fecha },
        { id_empleado: 2, id_area: 1, id_turno: 1, fecha: fecha },
        { id_empleado: 3, id_area: 1, id_turno: 1, fecha: fecha },
        { id_empleado: 4, id_area: 2, id_turno: 1, fecha: fecha },
        { id_empleado: 5, id_area: 2, id_turno: 1, fecha: fecha }
    ];
    const alertas3 = (0, capa9_deteccionProblemas_1.capa9_detectarProblemas)(programacionCompleta, areas, empleadosDisponibles, maximosPorArea, fecha);
    const alertasFiltro3 = alertas3.filter(a => a.codigo === 'AREA_SIN_PERSONAL' || a.codigo === 'AREA_DEFICIT_PERSONAL');
    if (alertasFiltro3.length === 0) {
        console.log("✅ SIN ALERTAS DE FALTA DE PERSONAL");
    }
    else {
        alertasFiltro3.forEach(a => console.log(`⚠️ ALERTA INESPERADA: ${a.mensaje}`));
    }
    console.log("\n==================================================");
}
testFaltaPersonal();
