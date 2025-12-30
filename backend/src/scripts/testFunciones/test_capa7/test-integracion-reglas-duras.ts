
import { capa7_validarReglasDuras } from "../../../services/programacion/capa7.reglasDuras";
import { EmpleadoOrdenado } from "../../../services/programacion/tipos";

async function testIntegracionReglasDuras() {
    console.log("==================================================");
    console.log("PRUEBA DE INTEGRACIÓN: REGLAS DURAS (CAPA 7)");
    console.log("==================================================");

    // Mocks comunes
    const fecha = new Date();
    const area = { id_area: 1 };
    const turnoNormal = {
        id_turno: 1,
        hora_entrada: new Date(),
        hora_salida: new Date(),
        duracion_horas: 8
    } as any;
    const programacionVacia: any[] = [];

    // CASO 1: Empleado Inactivo - Debe RECHAZAR
    console.log("\nCASO 1: Empleado Inactivo");
    const empleadoInactivo: EmpleadoOrdenado = {
        id_empleado: 1,
        nombre_completo: "Inactivo",
        cedula: "000000",
        total_areas: 0,
        clasificacion: 'flexible',
        areas: [],
        id_estado: 2, // Inactivo
        cargo: { id_cargo: 1, nombre_cargo: "Vendedor" }
    };

    const res1 = capa7_validarReglasDuras(empleadoInactivo, area, turnoNormal, fecha, programacionVacia);
    console.log(`Resultado: ${res1.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!res1.valido) console.log(`Razón: ${res1.razon} | Código: ${res1.codigo}`);

    // CASO 2: Empleado No Disponible (Incapacitado) - Debe RECHAZAR
    console.log("\nCASO 2: Empleado No Disponible (Incapacitado)");
    const empleadoActivo: EmpleadoOrdenado = { ...empleadoInactivo, id_estado: 1 };
    const disponibilidadMala = { disponible: false, tipoNovedad: "Incapacidad Medica" };

    const res2 = capa7_validarReglasDuras(empleadoActivo, area, turnoNormal, fecha, programacionVacia, disponibilidadMala);
    console.log(`Resultado: ${res2.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!res2.valido) console.log(`Razón: ${res2.razon} | Código: ${res2.codigo}`);

    // CASO 3: Happy Path (Todo OK) - Debe APROBAR
    console.log("\nCASO 3: Happy Path (Activo, Disponible, Turno OK)");
    const disponibilidadBuena = { disponible: true };

    const res3 = capa7_validarReglasDuras(empleadoActivo, area, turnoNormal, fecha, programacionVacia, disponibilidadBuena);
    console.log(`Resultado: ${res3.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);
    if (!res3.valido) console.log(`Razón: ${res3.razon}`);

    // CASO 4: Turno Excesivo (> 12 horas) - Debe RECHAZAR
    console.log("\nCASO 4: Turno Excesivo (> 12 horas)");

    const turnoIlegal = {
        id_turno: 99,
        hora_entrada: new Date(),
        hora_salida: new Date(),
        duracion_horas: 16
    } as any;
    const res4 = capa7_validarReglasDuras(empleadoActivo, area, turnoIlegal, fecha, programacionVacia, disponibilidadBuena);

    console.log(`Resultado: ${res4.valido ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`);

    if (!res4.valido) console.log(`Razón: ${res4.razon} | Código: ${res4.codigo}`);

    console.log("\n==================================================");
    console.log("FIN DE PRUEBAS DE INTEGRACIÓN");
}

testIntegracionReglasDuras();
