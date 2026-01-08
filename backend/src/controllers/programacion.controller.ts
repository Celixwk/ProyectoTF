import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { capa6_generarProgramacionDia } from '../services/programacion/capa6.integracion';

const prisma = new PrismaClient();

export const generarAutomatica = async (req: Request, res: Response) => {
    try {
        const { mes, anio, configuracion, id_usuario_registro } = req.body;
        if (!mes || !anio) return res.status(400).json({ success: false, error: 'Mes y año requeridos' });

        const fechaInicio = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
        const fechaFin = new Date(Date.UTC(Number(anio), Number(mes), 0, 23, 59, 59));

        const laborMes = await prisma.laborMes.findFirst({
            where: {
                fecha_inicio: { lte: fechaInicio },
                fecha_fin: { gte: fechaFin }
            }
        });

        if (!laborMes) return res.status(400).json({ success: false, error: 'Periodo contable no encontrado.' });

        await prisma.detalleProgramacion.deleteMany({
            where: {
                fecha: { gte: fechaInicio, lte: fechaFin },
                origen_registro: 'Automatico'
            }
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

export const obtenerNovedadesPeriodo = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.query;
        const inicio = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
        const fin = new Date(Date.UTC(Number(anio), Number(mes), 0, 23, 59, 59));
        const novedades = await prisma.novedadEmpleado.findMany({
            where: {
                detalle_novedad: { some: { fecha: { gte: inicio, lte: fin } } }
            },
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
            where: {
                fecha: {
                    gte: new Date(String(inicio)),
                    lte: new Date(String(fin))
                }
            },
            include: {
                empleado: true,
                turno: true,
                area: true
            },
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

export const obtenerEmpleadosNoAsignadosPorDia = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.query;

        if (!mes || !anio) {
            return res.status(400).json({ success: false, error: 'Mes y año requeridos' });
        }

        const fechaInicio = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
        const fechaFin = new Date(Date.UTC(Number(anio), Number(mes), 0, 23, 59, 59));
        const diasMes = new Date(Number(anio), Number(mes), 0).getDate();

        const empleadosActivos = await prisma.empleado.findMany({
            where: {
                id_estado: 1,
                labor_mes: {
                    some: {
                        fecha_inicio: { lte: fechaInicio },
                        fecha_fin: { gte: fechaFin },
                        estado: "Abierto"
                    }
                }
            },
            select: {
                id_empleado: true,
                nombre1: true,
                apellido1: true,
                cedula: true
            }
        });

        const noAsignadosPorDia: Record<string, any[]> = {};

        for (let dia = 1; dia <= diasMes; dia++) {
            const fechaDia = new Date(Date.UTC(Number(anio), Number(mes) - 1, dia));
            const fechaISO = fechaDia.toISOString().split('T')[0];

            const asignacionesDelDia = await prisma.detalleProgramacion.findMany({
                where: { fecha: fechaDia },
                select: { id_empleado: true }
            });

            const novedadesDelDia = await prisma.detalleNovedad.findMany({
                where: { fecha: fechaDia },
                include: { novedad_empleado: true }
            });

            const idsAsignados = new Set(asignacionesDelDia.map(a => a.id_empleado));
            const idsConNovedad = new Set(novedadesDelDia.map(n => n.novedad_empleado.id_empleado));

            const noAsignados = empleadosActivos
                .filter(emp => !idsAsignados.has(emp.id_empleado) && !idsConNovedad.has(emp.id_empleado))
                .map(emp => ({
                    id_empleado: emp.id_empleado,
                    nombre_completo: `${emp.nombre1} ${emp.apellido1}`,
                    cedula: emp.cedula
                }));

            noAsignadosPorDia[fechaISO] = noAsignados;
        }

        res.json({ success: true, data: noAsignadosPorDia });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const moverEmpleado = async (req: Request, res: Response) => {
    try {
        const { id_detalle_programacion, nuevo_id_area, nuevo_id_turno } = req.body;

        if (!id_detalle_programacion) {
            return res.status(400).json({ success: false, error: 'ID requerido' });
        }

        const actualizado = await prisma.detalleProgramacion.update({
            where: { id_detalle_programacion: Number(id_detalle_programacion) },
            data: {
                ...(nuevo_id_area && { id_area: Number(nuevo_id_area) }),
                ...(nuevo_id_turno && { id_turno: Number(nuevo_id_turno) }),
                updated_at: new Date(),
                origen_registro: 'Manual'
            }
        });

        res.json({ success: true, data: actualizado });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const eliminarProgramacion = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.body;
        const inicio = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
        const fin = new Date(Date.UTC(Number(anio), Number(mes), 0, 23, 59, 59));
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

