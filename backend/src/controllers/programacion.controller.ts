import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { capa6_generarProgramacionDia, capa6_guardarAsignaciones } from '../services/programacion/capa6.integracion';

const prisma = new PrismaClient();

export const generarAutomatica = async (req: Request, res: Response) => {
    try {
        const { mes, anio, configuracion, id_usuario_registro } = req.body;
        const fechaInicio = new Date(Date.UTC(anio, mes - 1, 1));
        const fechaFin = new Date(Date.UTC(anio, mes, 0));
        const idUsuario = id_usuario_registro ? Number(id_usuario_registro) : undefined;

        await prisma.detalleProgramacion.deleteMany({
            where: {
                fecha: { gte: fechaInicio, lte: fechaFin },
                origen_registro: 'Automatico'
            }
        });

        const diasMes = fechaFin.getUTCDate();
        const resultadosTotales = [];
        const alertasTotales = [];

        for (let dia = 1; dia <= diasMes; dia++) {
            const fechaProceso = new Date(Date.UTC(anio, mes - 1, dia));
            const resultadoDia = await capa6_generarProgramacionDia(fechaProceso, {
                configuracion,
                idUsuario: idUsuario,
                maxDiasConsecutivosArea: 3
            });

            if (resultadoDia.asignaciones.length > 0) {
                await capa6_guardarAsignaciones(resultadoDia.asignaciones, idUsuario);
            }

            resultadosTotales.push(...resultadoDia.asignaciones);
            if (resultadoDia.alertas.length > 0) {
                alertasTotales.push({
                    fecha: fechaProceso.toISOString().split('T')[0],
                    alertas: resultadoDia.alertas
                });
            }
        }

        res.json({
            success: true,
            data: { count: resultadosTotales.length, alertas: alertasTotales }
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
            empleado: item.empleado ? {
                ...item.empleado,
                nombre_completo: `${item.empleado.nombre1} ${item.empleado.nombre2 || ''} ${item.empleado.apellido1} ${item.empleado.apellido2 || ''}`.replace(/\s+/g, ' ').trim()
            } : null
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