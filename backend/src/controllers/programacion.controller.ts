import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { capa6_generarProgramacionDia } from '../services/programacion/capa6.integracion';

const prisma = new PrismaClient();

export const generarAutomatica = async (req: Request, res: Response) => {
    try {
        const { mes, anio, configuracion, id_usuario_registro } = req.body;
        if (!mes || !anio) return res.status(400).json({ success: false, error: 'Mes y año requeridos' });
        const fechaInicio = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
        const fechaFin = new Date(Date.UTC(Number(anio), Number(mes), 0));
        const laborMes = await prisma.laborMes.findFirst({
            where: { fecha_inicio: { lte: fechaInicio }, fecha_fin: { gte: fechaFin } }
        });
        if (!laborMes) return res.status(400).json({ success: false, error: 'Periodo contable no encontrado.' });
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
                configuracion,
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
        if (!fecha_inicio) return res.status(400).json({ success: false, error: 'Fecha de inicio requerida' });

        const inicioProceso = new Date(fecha_inicio);
        const anio = inicioProceso.getUTCFullYear();
        const mes = inicioProceso.getUTCMonth();
        const ultimoDiaMes = new Date(Date.UTC(anio, mes + 1, 0));

        await prisma.detalleProgramacion.deleteMany({
            where: {
                fecha: { gte: inicioProceso, lte: ultimoDiaMes },
                origen_registro: 'Automatico'
            }
        });

        const diasRestantes = ultimoDiaMes.getUTCDate() - inicioProceso.getUTCDate() + 1;
        let totalAsignaciones = 0;

        for (let i = 0; i < diasRestantes; i++) {
            const fechaActual = new Date(Date.UTC(anio, mes, inicioProceso.getUTCDate() + i));
            const resultadoDia = await capa6_generarProgramacionDia(fechaActual, {
                configuracion,
                idUsuario: id_usuario_registro ? Number(id_usuario_registro) : undefined,
                maxDiasConsecutivosArea: 3
            });
            totalAsignaciones += resultadoDia.resumen?.total_asignaciones ?? resultadoDia.asignaciones?.length ?? 0;
        }

        res.json({
            success: true,
            message: `Programación regenerada exitosamente desde ${fecha_inicio}`,
            total_asignaciones: totalAsignaciones
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
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
        const inicio = new Date(Number(anio), Number(mes) - 1, 1);
        const fin = new Date(Number(anio), Number(mes), 0);
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
        res.json({ success: true, data: [] });
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
                    nov.detalle_novedad.some(det => det.fecha.toISOString().split('T')[0] === fechaKey)
                );
                if (tieneNovedad) return false;

                const esDiaDescanso = e.descansos.some(des => des.dias_descanso.includes(dia));
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