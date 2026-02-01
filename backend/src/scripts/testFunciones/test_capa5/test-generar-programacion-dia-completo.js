"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa5_GeneracionAsignacion_1 = require("../../../services/programacion/capa5.GeneracionAsignacion");
async function main() {
    const fechaHoy = new Date("2025-12-23");
    const areas = [
        { id_area: 6, nombre_area: "Caseta de Entrada", prioridad: 1 },
        { id_area: 7, nombre_area: "Caseta de Salida", prioridad: 2 },
        { id_area: 8, nombre_area: "Conduce", prioridad: 3 },
        { id_area: 9, nombre_area: "Parqueadero 1", prioridad: 4 },
        { id_area: 10, nombre_area: "Parqueadero 2", prioridad: 5 },
        { id_area: 1, nombre_area: "Sala Principal", prioridad: 6 },
        { id_area: 2, nombre_area: "Puertas y Sala", prioridad: 7 },
        { id_area: 3, nombre_area: "Baño 1", prioridad: 8 },
        { id_area: 4, nombre_area: "Baños 3", prioridad: 9 },
        { id_area: 5, nombre_area: "Sala Taxis", prioridad: 10 },
        { id_area: 11, nombre_area: "Periférico Norte", prioridad: 11 },
        { id_area: 12, nombre_area: "Periférico Sur", prioridad: 12 },
        { id_area: 13, nombre_area: "Refuerzos", prioridad: 13 }
    ];
    const maximosPorArea = new Map(areas.map(a => [a.id_area, 1]));
    const turno = {
        id_turno: 1,
        hora_entrada: new Date("2025-12-23T06:00:00"),
        hora_salida: new Date("2025-12-23T14:00:00")
    };
    const empleados = [
        { id_empleado: 1, nombre_completo: "ADOLFO MUÑOZ", clasificacion: "especialista", areas: [{ id_area: 13 }], disponible: true },
        { id_empleado: 2, nombre_completo: "AISNIER CALDERON", clasificacion: "comodin", areas: [{ id_area: 2 }, { id_area: 7 }, { id_area: 8 }, { id_area: 10 }, { id_area: 4 }, { id_area: 9 }], disponible: true },
        { id_empleado: 3, nombre_completo: "ALBEIRO MARIN", clasificacion: "flexible", areas: [{ id_area: 8 }, { id_area: 9 }, { id_area: 10 }, { id_area: 2 }], disponible: true },
        { id_empleado: 4, nombre_completo: "ALBEIRO PARRA", clasificacion: "especialista", areas: [{ id_area: 9 }, { id_area: 11 }], disponible: true },
        { id_empleado: 5, nombre_completo: "ARLEY GOMEZ", clasificacion: "flexible", areas: [{ id_area: 11 }, { id_area: 12 }, { id_area: 6 }, { id_area: 2 }], disponible: true },
        { id_empleado: 6, nombre_completo: "CARLOS GOMEZ", clasificacion: "especialista", areas: [{ id_area: 1 }, { id_area: 9 }], disponible: true },
        { id_empleado: 7, nombre_completo: "CRISTIAN CAICEDO", clasificacion: "flexible", areas: [{ id_area: 8 }, { id_area: 7 }, { id_area: 13 }], disponible: true },
        { id_empleado: 8, nombre_completo: "CRISTIAN GASCA", clasificacion: "flexible", areas: [{ id_area: 8 }, { id_area: 9 }, { id_area: 10 }, { id_area: 6 }], disponible: true },
        { id_empleado: 9, nombre_completo: "DIMAS ESCARPETA", clasificacion: "flexible", areas: [{ id_area: 9 }, { id_area: 3 }, { id_area: 6 }], disponible: true },
        { id_empleado: 10, nombre_completo: "DONALDO ANTURY", clasificacion: "flexible", areas: [{ id_area: 12 }, { id_area: 11 }, { id_area: 6 }], disponible: true },
        { id_empleado: 11, nombre_completo: "EDWAR LOPEZ", clasificacion: "flexible", areas: [{ id_area: 2 }, { id_area: 9 }, { id_area: 10 }, { id_area: 6 }], disponible: true },
        { id_empleado: 12, nombre_completo: "ERIKA VARGAS", clasificacion: "comodin", areas: [{ id_area: 1 }, { id_area: 2 }, { id_area: 10 }, { id_area: 9 }, { id_area: 5 }], disponible: true },
        { id_empleado: 13, nombre_completo: "GLORIETH ZAPATA", clasificacion: "flexible", areas: [{ id_area: 7 }, { id_area: 6 }, { id_area: 4 }, { id_area: 10 }], disponible: true },
        { id_empleado: 14, nombre_completo: "JAIR LOZADA", clasificacion: "comodin", areas: [{ id_area: 2 }, { id_area: 5 }, { id_area: 6 }, { id_area: 9 }, { id_area: 11 }], disponible: true },
        { id_empleado: 15, nombre_completo: "JHON ARTUNDUAGA", clasificacion: "comodin", areas: [{ id_area: 4 }, { id_area: 2 }, { id_area: 5 }, { id_area: 10 }, { id_area: 6 }], disponible: true },
        { id_empleado: 16, nombre_completo: "JHON ARDILA", clasificacion: "flexible", areas: [{ id_area: 6 }, { id_area: 11 }, { id_area: 7 }], disponible: true },
        { id_empleado: 17, nombre_completo: "JHON CALDERON", clasificacion: "flexible", areas: [{ id_area: 5 }, { id_area: 9 }, { id_area: 10 }, { id_area: 6 }], disponible: true },
        { id_empleado: 18, nombre_completo: "JHON AVILA", clasificacion: "comodin", areas: [{ id_area: 1 }, { id_area: 8 }, { id_area: 9 }, { id_area: 13 }], disponible: true },
        { id_empleado: 19, nombre_completo: "JHON ORTIZ", clasificacion: "comodin", areas: [{ id_area: 1 }, { id_area: 2 }, { id_area: 5 }, { id_area: 9 }, { id_area: 10 }], disponible: true },
        { id_empleado: 20, nombre_completo: "JOSE QUIÑONES", clasificacion: "flexible", areas: [{ id_area: 5 }, { id_area: 6 }, { id_area: 9 }, { id_area: 2 }], disponible: true },
        { id_empleado: 21, nombre_completo: "JUAN LOPEZ", clasificacion: "comodin", areas: [{ id_area: 9 }, { id_area: 10 }, { id_area: 11 }, { id_area: 12 }, { id_area: 4 }], disponible: true },
        { id_empleado: 22, nombre_completo: "MANUEL SANTOS", clasificacion: "flexible", areas: [{ id_area: 1 }, { id_area: 11 }, { id_area: 2 }], disponible: true },
        { id_empleado: 23, nombre_completo: "MANUELA CLAROS", clasificacion: "flexible", areas: [{ id_area: 3 }, { id_area: 4 }, { id_area: 10 }, { id_area: 6 }], disponible: true },
        { id_empleado: 24, nombre_completo: "MARIA BARRAGAN", clasificacion: "flexible", areas: [{ id_area: 4 }, { id_area: 10 }, { id_area: 9 }], disponible: true },
        { id_empleado: 25, nombre_completo: "MARLY BARRAGAN", clasificacion: "flexible", areas: [{ id_area: 8 }, { id_area: 2 }, { id_area: 10 }], disponible: true },
        { id_empleado: 26, nombre_completo: "MARTHA VERGARA", clasificacion: "comodin", areas: [{ id_area: 2 }, { id_area: 10 }, { id_area: 9 }, { id_area: 7 }], disponible: true },
        { id_empleado: 27, nombre_completo: "MAYRA IBARRA", clasificacion: "flexible", areas: [{ id_area: 2 }, { id_area: 7 }, { id_area: 10 }], disponible: true },
        { id_empleado: 28, nombre_completo: "OSCAR BERMEO", clasificacion: "especialista", areas: [{ id_area: 7 }, { id_area: 13 }], disponible: true },
        { id_empleado: 29, nombre_completo: "PASTOR REYES", clasificacion: "comodin", areas: [{ id_area: 4 }, { id_area: 1 }, { id_area: 5 }, { id_area: 10 }, { id_area: 12 }], disponible: true },
        { id_empleado: 30, nombre_completo: "PAULA CUELLAR", clasificacion: "flexible", areas: [{ id_area: 7 }, { id_area: 10 }, { id_area: 4 }], disponible: true },
        { id_empleado: 31, nombre_completo: "RONALD CICERY", clasificacion: "comodin", areas: [{ id_area: 5 }, { id_area: 2 }, { id_area: 6 }, { id_area: 9 }, { id_area: 10 }, { id_area: 13 }], disponible: true },
        { id_empleado: 32, nombre_completo: "VICTOR MENDEZ", clasificacion: "flexible", areas: [{ id_area: 3 }, { id_area: 4 }, { id_area: 10 }, { id_area: 9 }], disponible: true },
        { id_empleado: 33, nombre_completo: "VICTOR RIOS", clasificacion: "flexible", areas: [{ id_area: 6 }, { id_area: 4 }, { id_area: 11 }], disponible: true },
        { id_empleado: 34, nombre_completo: "VIVIANA PEREZ", clasificacion: "flexible", areas: [{ id_area: 4 }, { id_area: 6 }, { id_area: 10 }], disponible: true },
        { id_empleado: 35, nombre_completo: "WILLIAM GUTIERREZ", clasificacion: "especialista", areas: [{ id_area: 13 }], disponible: true },
        { id_empleado: 36, nombre_completo: "YEINER CALDERON", clasificacion: "flexible", areas: [{ id_area: 10 }, { id_area: 9 }, { id_area: 11 }], disponible: true },
        { id_empleado: 37, nombre_completo: "YEISA MARULANDA", clasificacion: "flexible", areas: [{ id_area: 3 }, { id_area: 4 }, { id_area: 10 }], disponible: true },
        { id_empleado: 38, nombre_completo: "YILY BARAJAS", clasificacion: "flexible", areas: [{ id_area: 10 }, { id_area: 4 }, { id_area: 9 }], disponible: true },
        { id_empleado: 39, nombre_completo: "YULISSA SANTANILLA", clasificacion: "especialista", areas: [{ id_area: 13 }, { id_area: 2 }], disponible: true }
    ];
    const historial = [
        // Puestos Críticos
        { id_empleado: 5, id_area: 6, fecha: new Date("2025-12-22") }, // Arley - Caseta Entrada
        { id_empleado: 13, id_area: 6, fecha: new Date("2025-12-22") }, // Glorieth - Caseta Entrada
        { id_empleado: 2, id_area: 7, fecha: new Date("2025-12-22") }, // Aisnier - Caseta Salida
        { id_empleado: 7, id_area: 7, fecha: new Date("2025-12-22") }, // Cristian C - Caseta Salida
        // Operativos y Salas
        { id_empleado: 3, id_area: 8, fecha: new Date("2025-12-22") }, // Albeiro M - Conduce
        { id_empleado: 8, id_area: 8, fecha: new Date("2025-12-22") }, // Cristian G - Conduce
        { id_empleado: 4, id_area: 9, fecha: new Date("2025-12-22") }, // Albeiro P - Parqueadero 1
        { id_empleado: 9, id_area: 9, fecha: new Date("2025-12-22") }, // Dimas - Parqueadero 1
        { id_empleado: 11, id_area: 10, fecha: new Date("2025-12-22") }, // Edwar - Parqueadero 2
        { id_empleado: 23, id_area: 10, fecha: new Date("2025-12-22") }, // Manuela - Parqueadero 2
        { id_empleado: 6, id_area: 1, fecha: new Date("2025-12-22") }, // Carlos G - Sala Principal
        { id_empleado: 12, id_area: 1, fecha: new Date("2025-12-22") }, // Erika - Sala Principal
        { id_empleado: 14, id_area: 2, fecha: new Date("2025-12-22") }, // Jair - Puertas y Sala
        { id_empleado: 15, id_area: 2, fecha: new Date("2025-12-22") }, // Jhon Art - Puertas y Sala
        // Servicios y Periféricos
        { id_empleado: 32, id_area: 3, fecha: new Date("2025-12-22") }, // Victor M - Baño 1
        { id_empleado: 37, id_area: 3, fecha: new Date("2025-12-22") }, // Yeisa - Baño 1
        { id_empleado: 17, id_area: 5, fecha: new Date("2025-12-22") }, // Jhon Cal - Sala Taxis
        { id_empleado: 20, id_area: 5, fecha: new Date("2025-12-22") }, // Jose Q - Sala Taxis
        { id_empleado: 10, id_area: 11, fecha: new Date("2025-12-22") }, // Donaldo - P. Norte
        { id_empleado: 16, id_area: 11, fecha: new Date("2025-12-22") }, // Jhon Ard - P. Norte
        { id_empleado: 21, id_area: 12, fecha: new Date("2025-12-22") }, // Juan L - P. Sur
        { id_empleado: 29, id_area: 12, fecha: new Date("2025-12-22") }, // Pastor - P. Sur
        // Refuerzos y Resto de personal
        { id_empleado: 1, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 18, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 22, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 24, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 25, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 26, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 27, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 28, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 30, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 31, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 33, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 34, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 35, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 36, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 38, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 39, id_area: 13, fecha: new Date("2025-12-22") },
        { id_empleado: 19, id_area: 13, fecha: new Date("2025-12-22") }
    ];
    const resultado = (0, capa5_GeneracionAsignacion_1.capa5_generarAsignacionesDia)(empleados, empleados, areas, maximosPorArea, turno, fechaHoy, { programacionExistente: historial });
    console.log("RESULTADOS DE LA GENERACION:");
    console.table(resultado.detalles);
    console.log("ASIGNACIONES COMPLETAS:");
    console.table(resultado.asignaciones.map((a) => {
        var _a, _b;
        return ({
            AREA: a.id_area,
            EMPLEADO: a.id_empleado,
            FECHA: a.fecha.toISOString().split("T")[0],
            ENTRADA: (_a = a.hora_entrada) === null || _a === void 0 ? void 0 : _a.toISOString().split("T")[1],
            SALIDA: (_b = a.hora_salida) === null || _b === void 0 ? void 0 : _b.toISOString().split("T")[1]
        });
    }));
    console.log("HUECOS DETECTADOS:");
    console.table(resultado.huecos);
}
main().catch(err => console.error(err));
