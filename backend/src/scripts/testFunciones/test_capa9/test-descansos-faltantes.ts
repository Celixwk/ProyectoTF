import { capa9_detectarProblemas } from "../../../services/programacion/capa9.deteccionProblemas";
import { EmpleadoDisponible, Asignacion } from "../../../services/programacion/tipos";

async function testCertificacionDescansos() {
    console.log("==================================================");
    console.log("TEST DE CERTIFICACIÓN: AUDITORÍA DE DESCANSOS");
    console.log("==================================================");

    const idEmp = 200;
    const empMock = [{ id_area: 1, nombre_area: "Cajas" }];
    const emps = [{ id_empleado: idEmp, nombre_completo: "Test User" }] as any;

    // CASO 1: CUMPLIMIENTO EXACTO (30 días, 27 trab, requiere 3)
    const fecha30 = new Date(Date.UTC(2024, 5, 15)); // Junio
    const prog27 = Array.from({ length: 27 }, (_, i) => ({
        id_empleado: idEmp, fecha: new Date(Date.UTC(2024, 5, i + 1))
    } as any));

    console.log("\nCASO 1: Límite exacto de cumplimiento (27/30 días, req 3)");
    const res1 = capa9_detectarProblemas(prog27, empMock, [], new Map(), fecha30, {
        descansosRequeridos: new Map([[idEmp, 3]]), empleados: emps
    });
    const error1 = res1.find(a => a.codigo === 'DESCANSOS_FALTANTES');
    console.log(!error1 ? "✅ PASÓ: No generó error por cumplimiento exacto." : "❌ FALLÓ: Detectó error donde no debía.");

    // CASO 2: ERROR CRÍTICO (30 días, 27 trab, requiere 4)
    console.log("\nCASO 2: Error crítico por falta de días (27/30 días, req 4)");
    const res2 = capa9_detectarProblemas(prog27, empMock, [], new Map(), fecha30, {
        descansosRequeridos: new Map([[idEmp, 4]]), empleados: emps
    });
    const error2 = res2.find(a => a.codigo === 'DESCANSOS_FALTANTES');
    console.log(error2 ? `✅ PASÓ: [${error2.tipo.toUpperCase()}] ${error2.mensaje}` : "❌ FALLÓ: No detectó el error matemático.");

    // CASO 3: ADVERTENCIA PROGRESIVA (50% del mes)
    console.log("\nCASO 3: Advertencia progresiva (>50% mes)");
    const prog16 = Array.from({ length: 16 }, (_, i) => ({
        id_empleado: idEmp, fecha: new Date(Date.UTC(2024, 5, i + 1))
    } as any));
    const res3 = capa9_detectarProblemas(prog16, empMock, [], new Map(), fecha30, {
        descansosRequeridos: new Map([[idEmp, 8]]), empleados: emps
    });
    const info3 = res3.find(a => a.codigo === 'DESCANSOS_ADVERTENCIA_PROGRESIVA');
    console.log(info3 ? `✅ PASÓ: [${info3.tipo.toUpperCase()}] ${info3.mensaje}` : "❌ FALLÓ: No detectó advertencia preventiva.");

    // CASO 4: DOBLES TURNOS (Días Únicos)
    console.log("\nCASO 4: Doble turno mismo día (Conteo de días únicos)");
    const progDoble = [
        { id_empleado: idEmp, fecha: new Date(Date.UTC(2024, 5, 1)) },
        { id_empleado: idEmp, fecha: new Date(Date.UTC(2024, 5, 1)) }
    ] as any;
    const res4 = capa9_detectarProblemas(progDoble, empMock, [], new Map(), fecha30, {
        descansosRequeridos: new Map([[idEmp, 5]]), empleados: emps
    });
    console.log(res4.length === 0 ? "✅ PASÓ: Filtro de días únicos funcionando." : "❌ FALLÓ: Contó turnos en lugar de días únicos.");

    // CASO 5: MES CORTO (Febrero 28 días)
    console.log("\nCASO 5: Mes corto (Febrero 28 días)");
    const fechaFeb = new Date(Date.UTC(2025, 1, 15));
    const progFeb = Array.from({ length: 25 }, (_, i) => ({
        id_empleado: idEmp, fecha: new Date(Date.UTC(2025, 1, i + 1))
    } as any));
    const res5 = capa9_detectarProblemas(progFeb, empMock, [], new Map(), fechaFeb, {
        descansosRequeridos: new Map([[idEmp, 4]]), empleados: emps
    });
    const error5 = res5.find(a => a.codigo === 'DESCANSOS_FALTANTES');
    console.log(error5 ? `✅ PASÓ: Detectó que en 28 días no caben 25 trab y 4 desc.` : "❌ FALLÓ: Error de cálculo en mes corto.");

    console.log("\n==================================================");
}

testCertificacionDescansos();