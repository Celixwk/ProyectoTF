import { Request, Response } from 'express';
import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

export const guardarAlertas = async (req: Request, res: Response) => {
    try {
        const { mes, anio, alertas, fechaInicio, fechaFin } = req.body;

        // Si vienen fechas explícitas, usamos el rango para borrar.
        // Si no, intentamos deducirlo de las alertas o fallback a mes/año (comportamiento legacy si fuera necesario, aunque idealmente siempre enviamos rango)

        let inicioBorrado: Date;
        let finBorrado: Date;

        if (fechaInicio && fechaFin) {
            inicioBorrado = new Date(fechaInicio);
            finBorrado = new Date(fechaFin);
            // Ajustar a medianoche UTC o Local según convención
            inicioBorrado.setUTCHours(0, 0, 0, 0);
            finBorrado.setUTCHours(23, 59, 59, 999);
        } else {
            // Fallback Legacy: Borrar todo el mes
            if (!mes || !anio) return res.status(400).json({ success: false, error: 'Se requiere rango de fechas o mes/año' });
            inicioBorrado = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1));
            finBorrado = new Date(Date.UTC(Number(anio), Number(mes), 0, 23, 59, 59));
        }

        if (!Array.isArray(alertas)) {
            return res.status(400).json({ success: false, message: 'Alertas debe ser un array' });
        }

        const dataParaInsertar: any[] = [];
        alertas.forEach((grupo: any) => {
            if (grupo.alertas && Array.isArray(grupo.alertas)) {
                grupo.alertas.forEach((alerta: any) => {
                    // Calcular mes/anio de la alerta individual por si cruza meses
                    const d = new Date(grupo.fecha);
                    dataParaInsertar.push({
                        mes: d.getMonth() + 1,
                        anio: d.getFullYear(),
                        fecha: d,
                        tipo: alerta.tipo,
                        codigo: alerta.codigo || null,
                        mensaje: alerta.mensaje,
                        id_area: alerta.area || null,
                        id_empleado: alerta.empleado || null,
                        datos_completos: alerta
                    });
                });
            }
        });

        const resultado = await prisma.$transaction(async (tx) => {
            // Borrar SÓLO en el rango afectado
            const eliminadas = await tx.alertasProgramacion.deleteMany({
                where: { fecha: { gte: inicioBorrado, lte: finBorrado } }
            });

            if (dataParaInsertar.length > 0) {
                const insertadas = await tx.alertasProgramacion.createMany({
                    data: dataParaInsertar
                });
                return insertadas;
            }
            return { count: 0 };
        });

        res.json({
            success: true,
            message: 'Alertas guardadas exitosamente',
            data: { total: resultado.count }
        });
    } catch (error: any) {
        console.error('❌ ERROR AL GUARDAR ALERTAS:', error);
        res.status(500).json({ success: false, message: 'Error al guardar las alertas', error: error.message });
    }
};

export const obtenerAlertas = async (req: Request, res: Response) => {
    try {
        const { mes, anio, fechaInicio, fechaFin } = req.query;

        let filtro: any = {};

        if (fechaInicio && fechaFin) {
            const inicio = new Date(fechaInicio as string);
            const fin = new Date(fechaFin as string);
            fin.setUTCHours(23, 59, 59, 999);
            filtro = { fecha: { gte: inicio, lte: fin } };
        } else if (mes && anio) {
            filtro = { mes: Number(mes), anio: Number(anio) };
        } else {
            return res.status(400).json({ success: false, message: 'Se requieren parámetros de fecha (inicio/fin) o periodo (mes/año)' });
        }

        const alertasRaw = await prisma.alertasProgramacion.findMany({
            where: filtro,
            orderBy: [
                { fecha: 'asc' },
                { id_alerta: 'asc' }
            ]
        });

        const alertasPorFecha = alertasRaw.reduce((acc: any, alerta: any) => {
            const fechaKey = alerta.fecha.toISOString().split('T')[0];
            if (!acc[fechaKey]) {
                acc[fechaKey] = { fecha: alerta.fecha, alertas: [] };
            }

            acc[fechaKey].alertas.push({
                tipo: alerta.tipo,
                codigo: alerta.codigo,
                mensaje: alerta.mensaje,
                area: alerta.id_area,
                empleado: alerta.id_empleado,
                ...(alerta.datos_completos as object || {})
            });

            return acc;
        }, {});

        res.json({ success: true, data: Object.values(alertasPorFecha) });
    } catch (error: any) {
        console.error('Error al obtener alertas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las alertas', error: error.message });
    }
};

export const eliminarAlertas = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.body;

        if (!mes || !anio) {
            return res.status(400).json({
                success: false,
                message: 'Mes y año son requeridos'
            });
        }

        const eliminado = await prisma.alertasProgramacion.deleteMany({
            where: {
                mes: Number(mes),
                anio: Number(anio)
            }
        });

        res.json({
            success: true,
            message: 'Alertas eliminadas exitosamente',
            data: { eliminadas: eliminado.count }
        });
    } catch (error: any) {
        console.error('Error al eliminar alertas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar las alertas',
            error: error.message
        });
    }
};
