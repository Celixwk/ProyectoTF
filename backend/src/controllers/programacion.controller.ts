// # Programacion.controller
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { capa6_generarProgramacionDia } from '../services/programacion/capa6.integracion';

const prisma = new PrismaClient();

const normalizarFechaUTC = (fechaStr: string) => {
    const [y, m, d] = fechaStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
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
        const { mes, anio, id_usuario_registro } = req.body;
        if (!mes || !anio) return res.status(400).json({ success: false, error: 'Mes y año requeridos' });
        const fechaInicio = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
        const fechaFin = new Date(Date.UTC(Number(anio), Number(mes), 0));
        const existenciaPrevia = await prisma.detalleProgramacion.count({
            where: { fecha: { gte: fechaInicio, lte: fechaFin } }
        });
        if (existenciaPrevia > 0) {
            return res.status(409).json({ success: false, error: `Ya existe una programación para este periodo. Use Gestión Mensual.` });
        }
        const empleadosActivos = await prisma.empleado.findMany({
            where: { id_estado: 1 },
            select: { id_empleado: true }
        });
        if (empleadosActivos.length === 0) return res.status(400).json({ success: false, error: 'No hay empleados activos.' });
        const periodosExistentes = await prisma.laborMes.findMany({
            where: {
                fecha_inicio: { lte: fechaInicio },
                fecha_fin: { gte: fechaFin },
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
                    fecha_inicio: fechaInicio,
                    fecha_fin: fechaFin,
                    estado: 'Abierto',
                    horas_mes: 240
                }))
            });
        }
        const turnosBD = await prisma.turno.findMany();
        const tIds: Record<string, number> = {};
        turnosBD.forEach(t => {
            if (t.tipo_turno) tIds[t.tipo_turno] = t.id_turno;
        });
        const getIds = (codigos: string[]) => codigos.map(c => tIds[c]).filter(id => id !== undefined);
        const configReal: Record<number, { turnosIds: number[] }> = {};
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
        await prisma.detalleProgramacion.deleteMany({
            where: { fecha: { gte: fechaInicio, lte: fechaFin }, origen_registro: 'Automatico' }
        });
        const diasMes = fechaFin.getUTCDate();
        let totalAsignaciones = 0;
        let totalGuardadas = 0;
        let totalErrores = 0;
        const alertasTotales: Array<{ fecha: string; alertas: any[] }> = [];
        for (let dia = 1; dia <= diasMes; dia++) {
            const fechaProceso = new Date(Date.UTC(Number(anio), Number(mes) - 1, dia));
            const resultadoDia = await capa6_generarProgramacionDia(fechaProceso, {
                configuracion: configReal,
                idUsuario: id_usuario_registro ? Number(id_usuario_registro) : undefined,
                maxDiasConsecutivosArea: 3
            });
            totalAsignaciones += resultadoDia.resumen?.total_asignaciones ?? resultadoDia.asignaciones?.length ?? 0;
            const guardado = resultadoDia.guardado ?? null;
            if (guardado) {
                totalGuardadas += guardado.guardadas ?? 0;
                totalErrores += guardado.errores ?? 0;
            }
            if (Array.isArray(resultadoDia.alertas) && resultadoDia.alertas.length > 0) {
                alertasTotales.push({ fecha: fechaProceso.toISOString().split('T')[0], alertas: resultadoDia.alertas });
            }
        }
        res.json({
            success: true,
            message: `Programación generada para ${fechaInicio.toISOString().slice(0, 7)}`,
            total_asignaciones: totalAsignaciones,
            total_guardadas: totalGuardadas,
            total_errores: totalErrores,
            alertas: alertasTotales
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const regenerarDesdeFecha = async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, configuracion, id_usuario_registro } = req.body;
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
                programacionExistente: programacionAcumulada
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

export const guardarCambiosManuales = async (req: Request, res: Response) => {
    try {
        const { cambios } = req.body;
        if (!Array.isArray(cambios) || cambios.length === 0) {
            return res.status(400).json({ success: false, message: 'No hay cambios para procesar' });
        }

        await prisma.$transaction(async (tx) => {
            for (const cambio of cambios) {
                const idEmpleado = Number(cambio.id_empleado);
                if (!idEmpleado || isNaN(idEmpleado)) {
                    throw new Error(`ID de empleado inválido para el cambio en fecha ${cambio.fecha}`);
                }

                const fechaDate = normalizarFechaUTC(cambio.fecha);
                const esDesdeRefuerzo = !cambio.id_detalle_programacion || cambio.id_detalle_programacion === 0 || cambio.id_detalle_programacion > 99999990;

                if (cambio.id_area_destino === -1) {
                    if (!esDesdeRefuerzo) {
                        await tx.detalleProgramacion.deleteMany({
                            where: {
                                id_empleado: idEmpleado,
                                fecha: fechaDate
                            }
                        });
                    }
                } else {
                    if (esDesdeRefuerzo) {
                        const laborMes = await tx.laborMes.findFirst({
                            where: {
                                id_empleado: idEmpleado,
                                fecha_inicio: { lte: fechaDate },
                                fecha_fin: { gte: fechaDate },
                                estado: 'Abierto'
                            }
                        });

                        await tx.detalleProgramacion.create({
                            data: {
                                id_empleado: idEmpleado,
                                id_area: Number(cambio.id_area_destino),
                                id_turno: Number(cambio.id_turno_destino),
                                fecha: fechaDate,
                                id_labor_mes: laborMes?.id_labor_mes || null,
                                estado: 'Activo',
                                origen_registro: 'Manual',
                                tipo_dia: 'Laborado'
                            }
                        });
                    } else {
                        const existente = await tx.detalleProgramacion.findFirst({
                            where: {
                                id_empleado: idEmpleado,
                                fecha: fechaDate
                            }
                        });

                        if (existente) {
                            await tx.detalleProgramacion.update({
                                where: { id_detalle_programacion: existente.id_detalle_programacion },
                                data: {
                                    id_area: Number(cambio.id_area_destino),
                                    id_turno: Number(cambio.id_turno_destino),
                                    updated_at: new Date()
                                }
                            });
                        } else {
                            const laborMes = await tx.laborMes.findFirst({
                                where: {
                                    id_empleado: idEmpleado,
                                    fecha_inicio: { lte: fechaDate },
                                    fecha_fin: { gte: fechaDate },
                                    estado: 'Abierto'
                                }
                            });

                            await tx.detalleProgramacion.create({
                                data: {
                                    id_empleado: idEmpleado,
                                    id_area: Number(cambio.id_area_destino),
                                    id_turno: Number(cambio.id_turno_destino),
                                    fecha: fechaDate,
                                    id_labor_mes: laborMes?.id_labor_mes || null,
                                    estado: 'Activo',
                                    origen_registro: 'Manual',
                                    tipo_dia: 'Laborado'
                                }
                            });
                        }
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
        const rawData = await prisma.detalleProgramacion.findMany({
            where: { fecha: { gte: new Date(String(inicio)), lte: new Date(String(fin)) } },
            include: { empleado: true, turno: true, area: true },
            orderBy: { fecha: 'asc' }
        });
        const data = rawData.map(item => ({
            ...item,
            empleado: item.empleado
                ? {
                    ...item.empleado,
                    nombre_completo: `${item.empleado.nombre1} ${item.empleado.nombre2 || ''} ${item.empleado.apellido1} ${item.empleado.apellido2 || ''}`.replace(/\s+/g, ' ').trim()
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
        const programacion = await prisma.detalleProgramacion.findMany({
            where: {
                fecha: { gte: fechaInicio, lte: fechaFin }
            },
            select: { id_empleado: true, fecha: true, id_area: true }
        });
        const alertas = [];
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
                const f = prog.fecha.toISOString().split('T')[0];
                const conflicto = novedades.find(nov =>
                    nov.novedad_empleado.id_empleado === prog.id_empleado &&
                    nov.fecha.toISOString().split('T')[0] === f
                );
                if (conflicto) {
                    alertas.push({
                        tipo: 'NOVEDAD',
                        fecha: f,
                        id_empleado: prog.id_empleado,
                        mensaje: 'Conflicto: Turno y novedad simultánea'
                    });
                }
            }
        }
        const areas = await prisma.area.findMany();
        const diasDelPeriodo = Math.floor((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        for (let i = 0; i < diasDelPeriodo; i++) {
            const diaEvaluar = new Date(fechaInicio);
            diaEvaluar.setUTCDate(fechaInicio.getUTCDate() + i);
            const fechaStr = diaEvaluar.toISOString().split('T')[0];
            for (const area of areas) {
                if (area.id_area === 13) continue;
                const asignados = programacion.filter(p =>
                    p.fecha.toISOString().split('T')[0] === fechaStr &&
                    p.id_area === area.id_area
                ).length;
                if (asignados < area.max_trabajadores) {
                    alertas.push({
                        tipo: 'COBERTURA',
                        codigo: 'DEFICIT_PERSONAL',
                        fecha: fechaStr,
                        id_area: area.id_area,
                        mensaje: `Área "${area.nombre_area}" tiene déficit: ${asignados}/${area.max_trabajadores}`,
                        datos_completos: {
                            requeridos: area.max_trabajadores,
                            asignados: asignados
                        }
                    });
                }
            }
        }
        res.json({ success: true, data: alertas });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerEmpleadosNoAsignadosPorDia = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.query;
        const nMes = Number(mes);
        const nAnio = Number(anio);
        const inicio = new Date(Date.UTC(nAnio, nMes - 1, 1));
        const fin = new Date(Date.UTC(nAnio, nMes, 0));
        const empleados = await prisma.empleado.findMany({
            where: { id_estado: 1 },
            include: {
                descansos: { where: { mes: nMes, anio: nAnio } },
                novedad_empleado: {
                    where: {
                        detalle_novedad: { some: { fecha: { gte: inicio, lte: fin } } }
                    },
                    include: { detalle_novedad: true }
                }
            }
        });
        const asignaciones = await prisma.detalleProgramacion.findMany({
            where: { fecha: { gte: inicio, lte: fin } },
            select: { id_empleado: true, fecha: true }
        });
        const resultado: Record<string, any[]> = {};
        const diasMes = fin.getUTCDate();
        for (let dia = 1; dia <= diasMes; dia++) {
            const fechaObj = new Date(Date.UTC(nAnio, nMes - 1, dia));
            const fechaKey = fechaObj.toISOString().split('T')[0];
            const asignadosEseDia = new Set(
                asignaciones
                    .filter(a => a.fecha.toISOString().split('T')[0] === fechaKey)
                    .map(a => a.id_empleado)
            );
            resultado[fechaKey] = empleados.filter(e => {
                if (asignadosEseDia.has(e.id_empleado)) return false;
                const tieneNovedad = e.novedad_empleado.some(nov =>
                    nov.detalle_novedad.some(det =>
                        det.fecha.toISOString().split('T')[0] === fechaKey)
                );
                if (tieneNovedad) return false;
                const esDiaDescanso = e.descansos.some(des =>
                    des.dias_descanso.includes(dia));
                if (esDiaDescanso) return false;
                return true;
            }).map(e => ({
                id_empleado: e.id_empleado,
                cedula: e.cedula,
                nombre_completo: `${e.nombre1} ${e.nombre2 || ''} ${e.apellido1} ${e.apellido2 || ''}`.replace(/\s+/g, ' ').trim()
            }));
        }
        res.json({ success: true, data: resultado });
    } catch (error: any) {
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