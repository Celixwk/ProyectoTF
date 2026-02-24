const fs = require('fs');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeAvailability(targetDateStr) {
    const reportLines = [];
    const log = (msg) => {
        console.log(msg);
        reportLines.push(msg);
    };

    log(`\n=== ANÁLISIS DE DISPONIBILIDAD PARA: ${targetDateStr} ===`);

    // 1. Total Empleados Activos
    const empleados = await prisma.empleado.findMany({
        where: { id_estado: 1 },
        select: { id_empleado: true, nombre1: true, apellido1: true, cedula: true }
    });
    log(`1. TOTAL EMPLEADOS ACTIVOS: ${empleados.length}`);

    // Configurar fechas UTC para el día
    const [y, m, d] = targetDateStr.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));

    // 2. Buscar Asignaciones (Trabajando)
    const asignaciones = await prisma.detalleProgramacion.findMany({
        where: {
            fecha: { gte: start, lt: end }
        },
        include: { area: true, empleado: true }
    });

    const asignadosIds = new Set(asignaciones.map(a => a.id_empleado));
    log(`2. ASIGNADOS (TRABAJANDO): ${asignaciones.length}`);
    /*
    asignaciones.forEach(a => {
        console.log(`   - ${a.empleado.nombre1} ${a.empleado.apellido1} -> ${a.area.nombre_area}`);
    });
    */

    // 3. Buscar Novedades
    // Necesitamos lógica aproximada a la del controlador, buscando en NovedadIncapacidad, NovedadLicencia, etc.
    // O mejor, consultar las tablas de novedades_empleado
    const novedades = await prisma.novedadEmpleado.findMany({
        where: {
            detalle_novedad: {
                some: {
                    fecha: { gte: start, lt: end }
                }
            }
        },
        include: { empleado: true, tipo_novedad: true }
    });

    const novedadesIds = new Set(novedades.map(n => n.id_empleado));
    log(`3. CON NOVEDAD: ${novedades.length}`);
    // novedades.forEach(n => {
    //     console.log(`   - ${n.empleado.nombre1} ${n.empleado.apellido1} -> ${n.tipo_novedad.nombre_novedad}`);
    // });

    // 4. Buscar Descansos Explicitly
    // console.log(`\n4. BUSCANDO DESCANSOS EN DB (Tabla Descanso):`);
    // Buscar descansos para este mes/año
    const descansosDb = await prisma.descanso.findMany({
        where: {
            anio: y,
            mes: m,
            id_empleado: { in: empleados.map(e => e.id_empleado) }
        },
        include: { empleado: true }
    });

    const descansosIds = new Set();
    descansosDb.forEach(desc => {
        let dias = [];
        try {
            if (Array.isArray(desc.dias_descanso)) dias = desc.dias_descanso;
            else if (typeof desc.dias_descanso === 'string') dias = JSON.parse(desc.dias_descanso);
        } catch (e) { console.log('Error parseando dias descanso', e); }

        if (dias.includes(d)) {
            descansosIds.add(desc.id_empleado);
            // console.log(`   - [DESCANSO] ${desc.empleado.nombre1} ${desc.empleado.apellido1} (Día ${d})`);
        }
    });

    log(`4. CON DESCANSOS (DB): ${descansosIds.size}`);
    // if (descansosIds.size === 0) console.log("   -> NO SE ENCONTRARON DESCANSOS PARA ESTE DÍA.");

    // 5. Calculo de Refuerzos (Los que no estan en 2, 3 ni 4)
    log(`\n5. CALCULO DE POTENCIALES REFUERZOS:`);
    let potentialRefuerzos = 0;
    // const listaPotenciales = []; // Removed

    for (const emp of empleados) {
        if (!asignadosIds.has(emp.id_empleado) && !novedadesIds.has(emp.id_empleado) && !descansosIds.has(emp.id_empleado)) {
            potentialRefuerzos++;
            log(`   [DISPONIBLE] ${emp.nombre1} ${emp.apellido1} (${emp.cedula})`);
        } else if (!asignadosIds.has(emp.id_empleado)) {
            let reason = "DESCONOCIDO";
            if (novedadesIds.has(emp.id_empleado)) reason = "TIENE NOVEDAD";
            if (descansosIds.has(emp.id_empleado)) reason = "TIENE DESCANSO (DB)";
            log(`   [NO DISPONIBLE] ${emp.nombre1} ${emp.apellido1} -> Motivo: ${reason}`);
        }
    }

    if (potentialRefuerzos === 0) log("   -> 0 DISPONIBLES.");
    // else {
    //     console.log(`   -> ${potentialRefuerzos} EMPLEADOS "LIBRES" (Podrían estar en Descanso):`);
    //     listaPotenciales.forEach(name => console.log(`      * ${name}`));
    //     console.log("\n   NOTA: Si estos empleados tienen 'Descanso' programado para hoy, tampoco saldrán en Refuerzos.");
    // }

    // console.log("\n============================================================");

    fs.writeFileSync('final_report.txt', reportLines.join('\n'));
}

// Analizar una fecha conflictiva de la captura
analyzeAvailability('2026-02-18');
