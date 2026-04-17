import { Request, Response } from 'express';
import { subMonths, endOfMonth } from 'date-fns';
import { FestivosColombia } from '../utils/FestivosColombia';
import { PrismaClient } from '../generated/client';
import { capa6_generarProgramacionDia } from '../services/programacion/capa6.integracion';

const prisma = new PrismaClient();

const normalizarFechaUTC = (fechaStr: string) => {
    const [y, m, d] = fechaStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};

export const obtenerEstadoMes = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.query;
        if (!mes || !anio) return res.status(400).json({ success: false, error: 'Mes y año requeridos' });

        const m = Number(mes);
        const y = Number(anio);

        const registroMes = await prisma.mes.findFirst({
            where: { numero_mes: m, anio: y }
        });

        if (registroMes) {
            return res.json({ success: true, estado: registroMes.estado });
        }

        // Lógica Dinámica si no existe
        const fechaActual = new Date();
        const mesActual = fechaActual.getUTCMonth() + 1;
        const anioActual = fechaActual.getUTCFullYear();

        const diffAnios = y - anioActual;
        const diffMeses = (diffAnios * 12) + (m - mesActual);

        // Futuro o Presente = Abierto
        // Pasado = Cerrado
        const estadoCalculado = diffMeses >= 0 ? 'Abierto' : 'Cerrado';

        res.json({ success: true, estado: estadoCalculado });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const verificarProgramacionExistente = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.query;
        if (!mes || !anio) return res.status(400).json({ success: false, error: 'Mes y año requeridos' });
        const inicio = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
        const fin = new Date(Date.UTC(Number(anio), Number(mes), 0, 23, 59, 59));
        const count = await prisma.detalleProgramacion.count({
            where: { fecha: { gte: inicio, lte: fin } }
        });
        res.json({ success: true, existe: count > 0, total_registros: count });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const generarAutomatica = async (req: Request, res: Response) => {
    try {
        const { fechaInicio, fechaFin, id_usuario_registro, configuracion, balancearHoras } = req.body;

        // Validación básica de fechas
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ success: false, error: 'Fecha de inicio y fin requeridas' });
        }

        const inicio = normalizarFechaUTC(fechaInicio);
        const fin = normalizarFechaUTC(fechaFin);
        fin.setUTCHours(23, 59, 59, 999);

        if (inicio > fin) {
            return res.status(400).json({ success: false, error: 'La fecha de inicio no puede ser mayor a la fecha fin' });
        }

        // Límite de seguridad: 45 días
        const diasDiferencia = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        if (diasDiferencia > 45) {
            return res.status(400).json({ success: false, error: 'El rango de generación no puede exceder 45 días por seguridad.' });
        }

        // Verificar si ya existe programación en ese rango
        const existenciaPrevia = await prisma.detalleProgramacion.count({
            where: { fecha: { gte: inicio, lte: fin }, origen_registro: 'Automatico' }
        });

        if (existenciaPrevia > 0) {
            // Nota: Aquí podrías decidir si permites sobrescribir o no. 
            // Por seguridad, pedimos confirmar (o borrar manual antes).
            // Para este caso, vamos a LIMPIAR lo automático existente en ese rango para regenerar.
            await prisma.detalleProgramacion.deleteMany({
                where: { fecha: { gte: inicio, lte: fin }, origen_registro: 'Automatico' }
            });
        }

        const empleadosActivos = await prisma.empleado.findMany({
            where: { id_estado: 1 },
            select: { id_empleado: true }
        });

        if (empleadosActivos.length === 0) return res.status(400).json({ success: false, error: 'No hay empleados activos.' });

        // --- MANEJO DE LABOR MES (CRUCE DE MESES) ---
        // Identificar todos los meses involucrados en el rango
        const mesesInvolucrados = new Set<string>();
        const current = new Date(inicio);
        while (current <= fin) {
            const k = `${current.getUTCFullYear()}-${current.getUTCMonth() + 1}`;
            mesesInvolucrados.add(k);
            current.setUTCDate(current.getUTCDate() + 15); // Saltar de 15 en 15 para avanzar rápido sin saltar meses cortos
        }
        // Asegurar el último día también
        mesesInvolucrados.add(`${fin.getUTCFullYear()}-${fin.getUTCMonth() + 1}`);

        for (const mesAnio of mesesInvolucrados) {
            const [y, m] = mesAnio.split('-').map(Number);
            const inicioMes = new Date(Date.UTC(y, m - 1, 1));
            const finMes = new Date(Date.UTC(y, m, 0)); // Último día del mes

            // Buscar si ya tienen LaborMes para este mes específico
            const periodosExistentes = await prisma.laborMes.findMany({
                where: {
                    fecha_inicio: { lte: inicioMes },
                    fecha_fin: { gte: finMes },
                    id_empleado: { in: empleadosActivos.map(e => e.id_empleado) }
                },
                select: { id_empleado: true }
            });

            const idsConPeriodo = new Set(periodosExistentes.map(p => p.id_empleado));
            const empleadosSinPeriodo = empleadosActivos.filter(e => !idsConPeriodo.has(e.id_empleado));

            if (empleadosSinPeriodo.length > 0) {
                await prisma.laborMes.createMany({
                    data: empleadosSinPeriodo.map(e => ({
                        id_empleado: e.id_empleado,
                        fecha_inicio: inicioMes,
                        fecha_fin: finMes,
                        estado: 'Abierto',
                        horas_mes: 240
                    }))
                });
            }
        }
        // --- FIN MANEJO LABOR MES ---

        // Configuración de Turnos
        const turnosBD = await prisma.turno.findMany();
        const tIds: Record<string, number> = {};
        turnosBD.forEach(t => {
            if (t.tipo_turno) tIds[t.tipo_turno] = t.id_turno;
        });

        // Usar configuración recibida o generar la default si no viene
        let configReal: Record<number, { turnosIds: number[] }> = {};

        if (configuracion) {
            configReal = configuracion;
        } else {
            const getIds = (codigos: string[]) => codigos.map(c => tIds[c]).filter(id => id !== undefined);
            configReal[1] = { turnosIds: getIds(['T1', 'T11']) };
            configReal[2] = { turnosIds: getIds(['T11', 'T5']) };
            configReal[3] = { turnosIds: getIds(['T5', 'T3']) };
            configReal[4] = { turnosIds: getIds(['T5', 'T11']) };
            configReal[5] = { turnosIds: getIds(['T5', 'T11']) };
            configReal[6] = { turnosIds: getIds(['T5', 'T13', 'T11']) };
            configReal[7] = { turnosIds: getIds(['T11', 'T5', 'T13']) };
            configReal[8] = { turnosIds: getIds(['T11', 'T5']) };
            configReal[9] = { turnosIds: getIds(['T13', 'T11', 'T5']) };
            configReal[10] = { turnosIds: getIds(['T5', 'T11']) };
            configReal[11] = { turnosIds: getIds(['T6', 'T8', 'T2']) };
            configReal[12] = { turnosIds: getIds(['T6']) };
            const todasLasAreas = await prisma.area.findMany();
            todasLasAreas.forEach(area => {
                if (!configReal[area.id_area]) {
                    configReal[area.id_area] = { turnosIds: getIds(['T5', 'T11']) };
                }
            });
        }

        // Obtener parametrizaciones globales (días y preferencias)
        const [paramDias, paramPreferencias] = await Promise.all([
            prisma.parametrizacion.findUnique({ where: { nombre_parametro: 'MAX_DIAS_CONSECUTIVOS' } }),
            prisma.parametrizacion.findUnique({ where: { nombre_parametro: 'PREFERENCIAS_EMPLEADOS_TURNOS' } })
        ]);

        const maxDiasConsecutivosArea = paramDias?.horas_maximas ? Number(paramDias.horas_maximas) : 3;

        let preferenciasEmpleados = {};
        if (paramPreferencias?.valor_texto) {
            try {
                preferenciasEmpleados = JSON.parse(paramPreferencias.valor_texto);
            } catch (e) { console.error("Error parseando preferencias:", e); }
        }

        let totalAsignaciones = 0;
        let totalGuardadas = 0;
        let totalErrores = 0;
        const alertasTotales: Array<{ fecha: string; alertas: any[] }> = [];

        // Bucle de Generación por Días del Rango
        const loopDate = new Date(inicio);
        while (loopDate <= fin) {
            // Clonar fecha para no modificar la referencia del bucle dentro de la función
            const fechaProceso = new Date(loopDate);

            const resultadoDia = await capa6_generarProgramacionDia(fechaProceso, {
                configuracion: configReal,
                idUsuario: id_usuario_registro ? Number(id_usuario_registro) : undefined,
                maxDiasConsecutivosArea,
                preferenciasTurnos: preferenciasEmpleados,
                balancearHoras: balancearHoras === true || String(balancearHoras) === "true"
            });

            totalAsignaciones += resultadoDia.resumen?.total_asignaciones ?? resultadoDia.asignaciones?.length ?? 0;
            const guardado = resultadoDia.guardado ?? null;
            if (guardado) {
                totalGuardadas += guardado.guardadas ?? 0;
                totalErrores += guardado.errores ?? 0;
            }

            if (Array.isArray(resultadoDia.alertas) && resultadoDia.alertas.length > 0) {
                alertasTotales.push({
                    fecha: fechaProceso.toISOString().split('T')[0],
                    alertas: resultadoDia.alertas
                });
            }

            // Avisar siguiente día
            loopDate.setUTCDate(loopDate.getUTCDate() + 1);
        }

        res.json({
            success: true,
            message: `Programación generada del ${fechaInicio} al ${fechaFin}`,
            total_asignaciones: totalAsignaciones,
            total_guardadas: totalGuardadas,
            total_errores: totalErrores,
            alertas: alertasTotales
        });

    } catch (error: any) {
        console.error('Error generando programación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const regenerarDesdeFecha = async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, configuracion, id_usuario_registro, balancearHoras } = req.body;
        if (!fecha_inicio || !configuracion) {
            return res.status(400).json({ success: false, error: 'Faltan parámetros requeridos' });
        }
        const [anio, mes, dia] = fecha_inicio.split('-').map(Number);
        const inicioProceso = new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0));
        const ultimoDiaMes = new Date(Date.UTC(anio, mes, 0, 23, 59, 59, 999));
        const empleadosActivos = await prisma.empleado.findMany({
            where: { id_estado: 1 },
            select: { id_empleado: true }
        });
        const periodosExistentes = await prisma.laborMes.findMany({
            where: {
                fecha_inicio: { lte: inicioProceso },
                fecha_fin: { gte: ultimoDiaMes },
                id_empleado: { in: empleadosActivos.map(e => e.id_empleado) }
            },
            select: { id_empleado: true }
        });
        const idsConPeriodo = new Set(periodosExistentes.map(p => p.id_empleado));
        const empleadosSinPeriodo = empleadosActivos.filter(e => !idsConPeriodo.has(e.id_empleado));
        if (empleadosSinPeriodo.length > 0) {
            await prisma.laborMes.createMany({
                data: empleadosSinPeriodo.map(e => ({
                    id_empleado: e.id_empleado,
                    fecha_inicio: new Date(Date.UTC(anio, mes - 1, 1)),
                    fecha_fin: new Date(Date.UTC(anio, mes, 0)),
                    estado: 'Abierto',
                    horas_mes: 240
                }))
            });
        }
        await prisma.detalleProgramacion.deleteMany({
            where: {
                fecha: { gte: inicioProceso, lte: ultimoDiaMes },
                origen_registro: 'Automatico'
            }
        });
        const primerDiaMes = new Date(Date.UTC(anio, mes - 1, 1, 0, 0, 0, 0));
        const programacionPrevia = await prisma.detalleProgramacion.findMany({
            where: {
                fecha: { gte: primerDiaMes, lt: inicioProceso }
            },
            select: { id_empleado: true, id_area: true, fecha: true, id_turno: true }
        });
        let programacionAcumulada = [...programacionPrevia];
        const alertasTotales: Array<{ fecha: string; alertas: any[] }> = [];
        let totalAsignaciones = 0;
        const diaInicio = inicioProceso.getUTCDate();
        const diaFin = ultimoDiaMes.getUTCDate();
        for (let d = diaInicio; d <= diaFin; d++) {
            const fechaProceso = new Date(Date.UTC(anio, mes - 1, d, 0, 0, 0, 0));
            const resultadoDia = await capa6_generarProgramacionDia(fechaProceso, {
                configuracion,
                idUsuario: id_usuario_registro ? Number(id_usuario_registro) : undefined,
                maxDiasConsecutivosArea: 3,
                programacionExistente: programacionAcumulada,
                balancearHoras: balancearHoras === true || String(balancearHoras) === "true"
            } as any);
            if (resultadoDia.asignaciones && resultadoDia.asignaciones.length > 0) {
                programacionAcumulada.push(...resultadoDia.asignaciones);
                totalAsignaciones += resultadoDia.asignaciones.length;
            }
            if (Array.isArray(resultadoDia.alertas) && resultadoDia.alertas.length > 0) {
                alertasTotales.push({
                    fecha: fechaProceso.toISOString().split('T')[0],
                    alertas: resultadoDia.alertas
                });
            }
        }
        res.json({
            success: true,
            message: `Regeneración completada desde ${fecha_inicio}`,
            total_asignaciones: totalAsignaciones,
            alertas: alertasTotales
        });
    } catch (error: any) {
        console.error('Error regenerando:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const verificarMesAbierto = async (fecha: Date) => {
    const mes = fecha.getUTCMonth() + 1;
    const anio = fecha.getUTCFullYear();

    const registroMes = await prisma.mes.findFirst({
        where: { numero_mes: mes, anio: anio }
    });

    // CASO 1: Registro explícito "Cerrado" -> BLOQUEADO
    if (registroMes && registroMes.estado === 'Cerrado') {
        throw new Error(`El periodo ${registroMes.nombre_mes} ${anio} está CERRADO. No se admiten cambios.`);
    }

    // CASO 2: Registro explícito "Abierto" -> PERMITIDO
    if (registroMes && registroMes.estado === 'Abierto') {
        return;
    }

    // CASO 3: No existe registro (Dinámico)
    const fechaActual = new Date();
    const mesActual = fechaActual.getUTCMonth() + 1;
    const anioActual = fechaActual.getUTCFullYear();

    // Calcular "distancia" en meses (aproximada para seguridad)
    const diffAnios = anio - anioActual;
    const diffMeses = (diffAnios * 12) + (mes - mesActual);

    // Regla: Si es el mes actual o futuro (diff >= 0) -> PERMITIDO (Asumimos Abierto implícitamente)
    // Regla: Si es pasado (diff < 0) -> BLOQUEADO (Seguridad por defecto para historia antigua sin registro)
    if (diffMeses < 0) {
        throw new Error(`El periodo ${mes}/${anio} es histórico y no está habilitado para cambios.`);
    }
};

export const guardarCambiosManuales = async (req: Request, res: Response) => {
    try {
        const { cambios } = req.body;
        if (!Array.isArray(cambios) || cambios.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay cambios para procesar' });
        }

        // SEGURIDAD: Verificar que los meses involucrados estén abiertos
        const fechasVerificadas = new Set<string>();
        for (const cambio of cambios) {
            const fechaStr = cambio.fecha.split('T')[0];
            if (!fechasVerificadas.has(fechaStr)) {
                const [y, m, d] = fechaStr.split('-').map(Number);
                const fechaCheck = new Date(Date.UTC(y, m - 1, d));
                await verificarMesAbierto(fechaCheck);
                fechasVerificadas.add(fechaStr);
            }
        }

        await prisma.$transaction(async (tx) => {
            for (const cambio of cambios) {
                const idEmpleado = Number(cambio.id_empleado);
                if (!idEmpleado || isNaN(idEmpleado)) {
                    throw new Error(`ID de empleado inválido para el cambio en fecha ${cambio.fecha}`);
                }

                const [y, m, d] = cambio.fecha.split('T')[0].split('-').map(Number);
                const fechaDate = new Date(Date.UTC(y, m - 1, d));

                // Rango del día completo para evitar problemas de horas
                const fechaSiguiente = new Date(fechaDate);
                fechaSiguiente.setUTCDate(fechaSiguiente.getUTCDate() + 1);

                if (Number(cambio.id_area_destino) === -1) {
                    // Lógica de eliminación (Mover a Refuerzos)
                    await tx.detalleProgramacion.deleteMany({
                        where: {
                            id_empleado: idEmpleado,
                            fecha: { gte: fechaDate, lt: fechaSiguiente }
                        }
                    });
                } else {
                    // Lógica de Asignación / Movimiento
                    // Buscamos si ya existe un registro para ese empleado y día (RANGO)
                    const existente = await tx.detalleProgramacion.findFirst({
                        where: {
                            id_empleado: idEmpleado,
                            fecha: { gte: fechaDate, lt: fechaSiguiente }
                        }
                    });

                    if (existente) {
                        // ACTUALIZAR
                        await tx.detalleProgramacion.update({
                            where: { id_detalle_programacion: existente.id_detalle_programacion },
                            data: {
                                id_area: Number(cambio.id_area_destino),
                                id_turno: Number(cambio.id_turno_destino),
                                fecha: fechaDate, // Reiniciar a 00:00 UTC por consistencia
                                updated_at: new Date()
                            }
                        });
                    } else {
                        // CREAR
                        const laborMes = await tx.laborMes.findFirst({
                            where: {
                                id_empleado: idEmpleado,
                                fecha_inicio: { lte: fechaDate },
                                fecha_fin: { gte: fechaDate },
                                estado: 'Abierto'
                            }
                        });

                        const isDomingo = fechaDate.getUTCDay() === 0;
                        const fechaString = fechaDate.toISOString().split('T')[0];
                        const { esFestivo } = FestivosColombia.esFestivo(fechaString);

                        await tx.detalleProgramacion.create({
                            data: {
                                id_empleado: idEmpleado,
                                id_area: Number(cambio.id_area_destino),
                                id_turno: Number(cambio.id_turno_destino),
                                fecha: fechaDate,
                                id_labor_mes: laborMes?.id_labor_mes || null,
                                estado: 'Activo',
                                origen_registro: 'Manual',
                                tipo_dia: esFestivo ? 'Festivo' : (isDomingo ? 'Domingo' : 'Laborado')
                            }
                        });
                    }
                }
            }
        });

        res.json({ success: true, message: 'Cambios guardados correctamente' });
    } catch (error: any) {
        console.error('Error guardando cambios manuales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar los cambios',
            error: error.message
        });
    }
};

export const obtenerNovedadesPeriodo = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.query;
        const inicio = new Date(Number(anio), Number(mes) - 1, 1);
        const fin = new Date(Number(anio), Number(mes), 0);
        const novedades = await prisma.novedadEmpleado.findMany({
            where: { detalle_novedad: { some: { fecha: { gte: inicio, lte: fin } } } },
            include: { empleado: true, tipo_novedad: true, detalle_novedad: true }
        });
        res.json({ success: true, data: novedades });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerDetalleProgramacion = async (req: Request, res: Response) => {
    try {
        const { inicio, fin } = req.query;

        let fechaInicio: Date;
        let fechaFin: Date;

        if (inicio && fin) {
            const start = new Date(inicio as string);
            const end = new Date(fin as string);
            // Asegurar UTC 00:00:00 para búsqueda exacta
            fechaInicio = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
            fechaFin = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999));
        } else {
            // Fallback default logic if needed? Usually query params are required.
            // Just default to loose parsing if missing (though frontend sends them)
            fechaInicio = new Date(String(inicio));
            fechaFin = new Date(String(fin));
        }

        console.log(`[DEBUG] obtenerDetalleProgramacion Range: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`);

        const rawData = await prisma.detalleProgramacion.findMany({
            where: { fecha: { gte: fechaInicio, lte: fechaFin } },
            include: {
                empleado: {
                    include: {
                        descansos: {
                            where: {
                                mes: { gte: fechaInicio.getUTCMonth() + 1, lte: fechaFin.getUTCMonth() + 1 },
                                anio: { gte: fechaInicio.getUTCFullYear(), lte: fechaFin.getUTCFullYear() }
                            }
                        }
                    }
                },
                turno: true,
                area: true
            },
            orderBy: { fecha: 'asc' }
        });

        console.log(`[DEBUG] obtenerDetalleProgramacion Found: ${rawData.length}`);

        const data = rawData.map(item => ({
            ...item,
            empleado: item.empleado
                ? {
                    ...item.empleado,
                    nombre_completo: `${item.empleado.nombre1} ${item.empleado.nombre2 || ''} ${item.empleado.apellido1} ${item.empleado.apellido2 || ''}`.replace(/\s+/g, ' ').trim(),
                    descansos: item.empleado.descansos || []
                }
                : null
        }));
        res.json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const eliminarProgramacion = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.body;
        const inicio = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
        const fin = new Date(Date.UTC(Number(anio), Number(mes), 0));
        const resultado = await prisma.detalleProgramacion.deleteMany({
            where: { fecha: { gte: inicio, lte: fin } }
        });
        res.json({ success: true, count: resultado.count });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const validarProgramacion = async (req: Request, res: Response) => {
    try {
        const { inicio, fin } = req.query;
        if (!inicio || !fin) return res.status(400).json({ success: false, error: 'Faltan fechas' });

        const fechaInicio = normalizarFechaUTC(inicio as string);
        const fechaFin = normalizarFechaUTC(fin as string);
        fechaFin.setUTCHours(23, 59, 59);

        console.log('📊 VALIDACIÓN INICIADA:', { inicio, fin, timestamp: new Date().toISOString() });

        const programacion = await prisma.detalleProgramacion.findMany({
            where: { fecha: { gte: fechaInicio, lte: fechaFin } },
            select: { id_empleado: true, fecha: true, id_area: true }
        });

        console.log('📦 REGISTROS LEÍDOS:', programacion.length);

        const alertas = [];

        const areas = await prisma.area.findMany();

        const programacionNormalizada = programacion.map(p => ({
            ...p,
            fechaStr: new Date(p.fecha).toISOString().split('T')[0]
        }));

        console.log('📅 EJEMPLO FECHA NORMALIZADA:', programacionNormalizada[0]);

        const diasDelPeriodo = Math.floor((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        for (let i = 0; i < diasDelPeriodo; i++) {
            const diaEvaluar = new Date(fechaInicio);
            diaEvaluar.setUTCDate(fechaInicio.getUTCDate() + i);
            const fechaStr = diaEvaluar.toISOString().split('T')[0];

            for (const area of areas) {
                if (area.id_area === 13) continue;

                const asignados = programacionNormalizada.filter(p =>
                    p.fechaStr === fechaStr && p.id_area === area.id_area
                ).length;

                if (i === 0 && area.id_area <= 3) {
                    console.log(`📊 DÍA ${fechaStr} - ÁREA ${area.nombre_area}:`, {
                        asignados,
                        requeridos: area.max_trabajadores,
                        hayDeficit: asignados < area.max_trabajadores
                    });
                }

                if (asignados < area.max_trabajadores) {
                    alertas.push({
                        tipo: 'COBERTURA',
                        codigo: 'DEFICIT_PERSONAL',
                        fecha: fechaStr,
                        id_area: area.id_area,
                        area: area.id_area,
                        mensaje: `Área "${area.nombre_area}" tiene déficit: ${asignados}/${area.max_trabajadores}`,
                        datos_completos: {
                            requeridos: area.max_trabajadores,
                            asignados: asignados
                        }
                    });
                }
            }
        }


        if (programacion.length > 0) {
            const empleadosIds = [...new Set(programacion.map(p => p.id_empleado))];

            const novedades = await prisma.detalleNovedad.findMany({
                where: {
                    fecha: { gte: fechaInicio, lte: fechaFin },
                    novedad_empleado: { id_empleado: { in: empleadosIds } }
                },
                include: { novedad_empleado: true }
            });

            for (const prog of programacion) {
                const fechaStr = new Date(prog.fecha).toISOString().split('T')[0];
                const conflicto = novedades.find(nov =>
                    nov.novedad_empleado.id_empleado === prog.id_empleado &&
                    new Date(nov.fecha).toISOString().split('T')[0] === fechaStr
                );

                if (conflicto) {
                    alertas.push({
                        tipo: 'NOVEDAD',
                        fecha: fechaStr,
                        id_empleado: prog.id_empleado,
                        empleado: prog.id_empleado,
                        mensaje: 'Conflicto: Turno y novedad simultánea'
                    });
                }
            }
        }

        console.log('⚠️ ALERTAS GENERADAS:', alertas.length);
        console.log('📋 ESTRUCTURA PRIMERA ALERTA:', alertas[0]);

        const tiposAlertas = alertas.reduce((acc, a) => {
            acc[a.tipo] = (acc[a.tipo] || 0) + 1;
            return acc;
        }, {});
        console.log('📊 DISTRIBUCIÓN:', tiposAlertas);


        const alertasAgrupadas = alertas.reduce((acc: any[], alerta: any) => {
            const fechaKey = alerta.fecha;
            let grupo = acc.find(g => g.fecha === fechaKey);

            if (!grupo) {
                grupo = { fecha: fechaKey, alertas: [] };
                acc.push(grupo);
            }

            grupo.alertas.push(alerta);
            return acc;
        }, []);

        console.log('📦 ALERTAS AGRUPADAS:', alertasAgrupadas.length, 'grupos');

        res.json({ success: true, data: alertasAgrupadas });
    } catch (error: any) {
        console.error('❌ ERROR EN VALIDACIÓN:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerEmpleadosNoAsignadosPorDia = async (req: Request, res: Response) => {
    try {
        const { mes, anio, fechaInicio, fechaFin } = req.query;


        let inicio: Date;
        let fin: Date;

        if (fechaInicio && fechaFin) {
            const start = new Date(fechaInicio as string);
            const end = new Date(fechaFin as string);
            // Asegurar UTC 00:00:00 para comparación correcta
            inicio = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
            fin = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999));
        } else if (mes && anio) {
            const nMes = Number(mes);
            const nAnio = Number(anio);
            inicio = new Date(Date.UTC(nAnio, nMes - 1, 1));
            fin = new Date(Date.UTC(nAnio, nMes, 0, 23, 59, 59, 999));
        } else {
            return res.status(400).json({ success: false, error: 'Se requieren fechas o periodo mes/año' });
        }

        const empleados = await prisma.empleado.findMany({
            where: { id_estado: 1 },
            include: {
                descansos: {
                    // Nota: Descansos actualmente son por mes/anio.
                },
                novedad_empleado: {
                    where: {
                        detalle_novedad: { some: { fecha: { gte: inicio, lte: fin } } }
                    },
                    include: { detalle_novedad: true }
                },
                empleado_area: {
                    include: { area: true }
                }
            }
        });


        const mesesInvolucrados = new Set<string>();
        const cur = new Date(inicio);
        while (cur <= fin) {
            mesesInvolucrados.add(`${cur.getUTCFullYear()}-${cur.getUTCMonth() + 1}`);
            // Avanzar dias para cubrir el rango (seguro en UTC)
            cur.setUTCDate(cur.getUTCDate() + 15);
        }
        mesesInvolucrados.add(`${fin.getUTCFullYear()}-${fin.getUTCMonth() + 1}`);

        // Construir filtro de descansos OR
        const orDescansos = Array.from(mesesInvolucrados).map(m => {
            const [y, mo] = m.split('-').map(Number);
            return { mes: mo, anio: y };
        });

        // DEBUG: Imprimir rango de búsqueda
        console.log(`[DEBUG] obtenerEmpleadosNoAsignadosPorDia Range: ${inicio.toISOString()} - ${fin.toISOString()}`);

        const descansos = await prisma.descanso.findMany({
            where: {
                OR: orDescansos,
                empleado: { id_estado: 1 } // Solo activos
            }
        });


        const asignaciones = await prisma.detalleProgramacion.findMany({
            where: { fecha: { gte: inicio, lte: fin } },
            select: { id_empleado: true, fecha: true }
        });

        console.log(`[DEBUG] Found ${asignaciones.length} assignments in range.`);



        const resultado: Record<string, any[]> = {};

        // Iterar día por día
        const loopDate = new Date(inicio);
        while (loopDate <= fin) {
            const fechaKey = loopDate.toISOString().split('T')[0];

            // Definir linderos del día en UTC para comparación robusta
            const rangeInicio = new Date(loopDate); // 00:00:00.000 Z
            const rangeFin = new Date(loopDate);
            rangeFin.setUTCDate(rangeFin.getUTCDate() + 1); // 00:00:00.000 Z del día siguiente

            // Filtrar asignaciones dentro del rango exacto del día
            const asignadosEseDia = new Set(
                asignaciones
                    .filter(a => {
                        const f = new Date(a.fecha);
                        return f >= rangeInicio && f < rangeFin;
                    })
                    .map(a => a.id_empleado)
            );

            const currentYear = loopDate.getUTCFullYear();
            const currentMonth = loopDate.getUTCMonth() + 1;
            const currentDay = loopDate.getUTCDate();

            const disponibles = empleados.filter(e => {
                if (asignadosEseDia.has(e.id_empleado)) return false;

                // Novedad
                const tieneNovedad = e.novedad_empleado.some(nov =>
                    nov.detalle_novedad.some(det =>
                        det.fecha.toISOString().split('T')[0] === fechaKey)
                );
                if (tieneNovedad) return false;

                // Descanso (Buscamos en la lista global de descansos cargada)
                const desc = descansos.find(d =>
                    d.id_empleado === e.id_empleado &&
                    d.anio === currentYear &&
                    d.mes === currentMonth
                );

                // Parseo manual seguro de dias_descanso si viene como string
                let diasDescansoArr: number[] = [];
                if (desc) {
                    if (Array.isArray(desc.dias_descanso)) {
                        diasDescansoArr = desc.dias_descanso as number[];
                    } else if (typeof desc.dias_descanso === 'string') {
                        try {
                            diasDescansoArr = JSON.parse(desc.dias_descanso);
                        } catch {
                            // Si no es JSON valido, quizas es csv? Asumimos vacío por seguridad
                            diasDescansoArr = [];
                        }
                    }
                }

                if (diasDescansoArr.includes(currentDay)) {
                    return false;
                }

                return true;
            });

            resultado[fechaKey] = disponibles.map(e => ({
                id_empleado: e.id_empleado,
                cedula: e.cedula,
                nombre_completo: `${e.nombre1} ${e.nombre2 || ''} ${e.apellido1} ${e.apellido2 || ''}`.replace(/\s+/g, ' ').trim(),
                areas: e.empleado_area.map((ea: any) => ({
                    id_area: ea.area.id_area,
                    nombre_area: ea.area.nombre_area
                }))
            }));

            loopDate.setUTCDate(loopDate.getUTCDate() + 1);
        }

        res.json({ success: true, data: resultado });
    } catch (error: any) {
        console.error('❌ Error en obtenerEmpleadosNoAsignadosPorDia:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


export const obtenerEmpleadosConAreas = async (req: Request, res: Response) => {
    try {
        const empleados = await prisma.empleado.findMany({
            where: { id_estado: 1 },
            select: {
                id_empleado: true,
                empleado_area: {
                    select: {
                        id_area: true
                    }
                }
            }
        });

        const empleadosInfo = empleados.map(emp => ({
            id_empleado: emp.id_empleado,
            areas_habilitadas: emp.empleado_area.map(ea => ea.id_area)
        }));

        res.json({ success: true, data: empleadosInfo });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const validarCompleto = async (req: Request, res: Response) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        let start: Date;
        let end: Date;

        if (fechaInicio && fechaFin) {
            start = normalizarFechaUTC(String(fechaInicio));
            end = normalizarFechaUTC(String(fechaFin));
        } else {
            // Default: Mes Actual
            const now = new Date();
            start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
            end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
        }
        end.setUTCHours(23, 59, 59, 999);

        // 1. Obtener Áreas y sus cupos
        const areas = await prisma.area.findMany();

        // 2. Obtener conteo de asignaciones por día y área
        // Prisma no tiene groupBy nativo flexible para esto en una sola pasada con joins complejos a veces, 
        // pero podemos hacer un groupBy simple.
        const asignaciones = await prisma.detalleProgramacion.groupBy({
            by: ['fecha', 'id_area'],
            _count: {
                id_empleado: true
            },
            where: {
                fecha: { gte: start, lte: end },
                // id_turno: { not: null } // Opcional: solo turnos reales? Suponemos que cualquier registro cuenta
            }
        });

        // 3. Analizar día por día
        let totalHuecos = 0;
        const diasConHuecos: string[] = [];
        let loop = new Date(start);

        // Mapa de conteos para acceso rápido: key = "YYYY-MM-DD_AREAID"
        const mapaConteos = new Map<string, number>();
        asignaciones.forEach(a => {
            const fechaKey = a.fecha.toISOString().split('T')[0];
            const areaId = a.id_area;
            const count = a._count.id_empleado;
            mapaConteos.set(`${fechaKey}_${areaId}`, count);
        });

        while (loop <= end) {
            const fechaStr = loop.toISOString().split('T')[0];
            const esDomingo = loop.getUTCDay() === 0; // 0 = Domingo

            // REGLA: Si es Domingo, verificamos si aplica (por ahora simplificado: aplica igual si hay cupo definido, 
            // o podríamos asumir que domingos NO requieren personal completo si no hay turnos definidos, pero
            // la regla general es cubrir "max_trabajadores" siempre).
            // Para ser más precisos con la lógica de negocio real:
            // "hueco" = max_trabajadores - asignados.

            // Excepción: Si max_trabajadores es 0 (ej. administración a veces), no cuenta.

            for (const area of areas) {
                const cupo = area.max_trabajadores;
                if (cupo <= 0) continue;

                // Solo validamos domingos si el usuario lo quisiera, por defecto validamos TODO.
                // Si quieres ignorar domingos, descomenta:
                // if (esDomingo) continue; 

                const key = `${fechaStr}_${area.id_area}`;
                const asignados = mapaConteos.get(key) || 0;

                if (asignados < cupo) {
                    totalHuecos += (cupo - asignados);
                    if (!diasConHuecos.includes(fechaStr)) {
                        diasConHuecos.push(fechaStr);
                    }
                }
            }

            loop.setUTCDate(loop.getUTCDate() + 1);
        }

        const completo = totalHuecos === 0;

        res.json({
            success: true,
            completo,
            total_huecos: totalHuecos,
            dias_con_huecos: diasConHuecos.length,
            mensaje: completo
                ? 'Programación completa.'
                : `Faltan ${totalHuecos} asignaciones en ${diasConHuecos.length} días.`
        });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const eliminarDetalle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID no proporcionado' });
        }

        const detalle = await prisma.detalleProgramacion.findUnique({
            where: { id_detalle_programacion: Number(id) }
        });

        if (!detalle) {
            return res.status(404).json({ success: false, message: 'Turno no encontrado' });
        }

        await prisma.detalleProgramacion.delete({
            where: { id_detalle_programacion: Number(id) }
        });

        res.json({ success: true, message: 'Turno eliminado con éxito' });
    } catch (error: any) {
        console.error('Error al eliminar detalle de programación:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el turno', error: error.message });
    }
};

export const obtenerUltimoRango = async (req: Request, res: Response) => {
    try {
        // Estrategia: Buscar la fecha más reciente registrada y ver su "bloque".
        // O más simple: obtener min y max de todas las asignaciones futuras o del mes actual/siguiente.

        // Vamos a buscar el rango global de lo que hay en BD (o al menos lo más reciente).
        const result = await prisma.detalleProgramacion.aggregate({
            _min: { fecha: true },
            _max: { fecha: true },
            // Opcional: filtrar solo futuras si quisieramos
            // where: { fecha: { gte: new Date() } } 
        });

        if (!result._min.fecha || !result._max.fecha) {
            return res.json({ success: false, message: 'No hay programación registrada' });
        }

        const inicio = result._min.fecha.toISOString().split('T')[0];
        const fin = result._max.fecha.toISOString().split('T')[0];

        res.json({
            success: true,
            inicio,
            fin
        });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};


