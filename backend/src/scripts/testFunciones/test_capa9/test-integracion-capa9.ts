import { capa9_detectarProblemas } from "../../../services/programacion/capa9.deteccionProblemas";

import { EmpleadoDisponible, Asignacion } from "../../../services/programacion/tipos";



async function testIntegracionCapa9() {

    console.log("==================================================");

    console.log("PRUEBA DE INTEGRACIÓN: CAPA 9 FINAL");

    console.log("==================================================");



    const fecha = new Date();

    const areas = [{ id_area: 1, nombre_area: "Cajas", prioridad: 2 }];

    const maximos = new Map([[1, 2]]);



    const disponibles: EmpleadoDisponible[] = [

        { id_empleado: 1, nombre_completo: "User 1", disponible: true } as any,

        { id_empleado: 2, nombre_completo: "User 2", disponible: true } as any,

        { id_empleado: 3, nombre_completo: "User 3", disponible: true } as any

    ];



    const fechaAyer = new Date(fecha); fechaAyer.setDate(fecha.getDate() - 1);

    const fechaAntier = new Date(fecha); fechaAntier.setDate(fecha.getDate() - 2);

    const fecha3 = new Date(fecha); fecha3.setDate(fecha.getDate() - 3);

    const fecha4 = new Date(fecha); fecha4.setDate(fecha.getDate() - 4);



    const programacion: Asignacion[] = [

        { id_empleado: 1, id_area: 1, id_turno: 1, fecha: fecha, nombre_empleado: "User 1", nombre_area: "Cajas" },

        { id_empleado: 1, id_area: 1, id_turno: 1, fecha: fechaAyer, nombre_empleado: "User 1" },

        { id_empleado: 1, id_area: 1, id_turno: 1, fecha: fechaAntier, nombre_empleado: "User 1" },

        { id_empleado: 1, id_area: 1, id_turno: 1, fecha: fecha3, nombre_empleado: "User 1" },

        { id_empleado: 1, id_area: 1, id_turno: 1, fecha: fecha4, nombre_empleado: "User 1" }

    ];



    const alertas = capa9_detectarProblemas(programacion, areas, disponibles, maximos, fecha, {

        maxDiasConsecutivos: 3

    });



    console.log(`\nTOTAL ALERTAS: ${alertas.length}`);

    alertas.forEach((a, i) => console.log(`${i + 1}. [${a.tipo.toUpperCase()}] (${a.codigo}) ${a.mensaje}`));





    const tieneHuecos = alertas.some(a => a.codigo === 'AREA_DEFICIT_PERSONAL');

    const tieneSinAsignar = alertas.some(a => a.codigo === 'EMPLEADOS_SIN_ASIGNACION');

    const tieneConsecutivos = alertas.some(a => a.codigo === 'DIAS_CONSECUTIVOS_EXCEDIDOS');



    console.log("\nRESUMEN:");

    console.log(`- Déficit personal: ${tieneHuecos ? "✅" : "❌"}`);

    console.log(`- Personal libre: ${tieneSinAsignar ? "✅" : "❌"}`);

    console.log(`- Rachas excedidas: ${tieneConsecutivos ? "✅" : "❌"}`);

}



testIntegracionCapa9();