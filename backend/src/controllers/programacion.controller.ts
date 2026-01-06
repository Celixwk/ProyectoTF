import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generarAutomatica = async (req: Request, res: Response) => {
    try {
        const { mes, anio, configuracion, id_usuario_registro } = req.body;
        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaFin = new Date(anio, mes, 0);

        const laborMes = await prisma.laborMes.findFirst({
            where: {
                fecha_inicio: { lte: fechaInicio },
                fecha_fin: { gte: fechaFin }
            }
        });

        if (!laborMes) {
            return res.status(400).json({ success: false, error: 'Periodo contable no encontrado.' });
        }

        const empleados = await prisma.empleado.findMany({
            where: { id_estado: 1 },
            include: { empleado_area: true }
        });

        const novedades = await prisma.novedadEmpleado.findMany({
            where: {
                detalle_novedad: {
                    some: { fecha: { gte: fechaInicio, lte: fechaFin } }
                }
            },
            include: { detalle_novedad: true }
        });

        const diasMes = fechaFin.getDate();
        const resultados: any[] = [];

        for (let dia = 1; dia <= diasMes; dia++) {
            const fechaActual = new Date(anio, mes - 1, dia);
            const fechaString = fechaActual.toISOString().split('T')[0];

            for (const areaIdKey in configuracion) {
                const areaId = Number(areaIdKey);
                const turnosHabilitados = configuracion[areaIdKey].turnosIds;

                if (!turnosHabilitados || turnosHabilitados.length === 0) continue;

                const empleadosArea = empleados.filter(e =>
                    e.empleado_area && e.empleado_area.some(ea => ea.id_area === areaId)
                );

                empleadosArea.forEach((emp, index) => {
                    const tieneNovedad = novedades.some(n =>
                        n.id_empleado === emp.id_empleado &&
                        n.detalle_novedad.some(d =>
                            new Date(d.fecha).toISOString().split('T')[0] === fechaString
                        )
                    );

                    if (!tieneNovedad) {
                        const turnoAsignado = turnosHabilitados[(dia + index) % turnosHabilitados.length];

                        resultados.push({
                            id_empleado: emp.id_empleado,
                            fecha: new Date(fechaActual),
                            id_area: areaId,
                            id_turno: Number(turnoAsignado),
                            id_labor_mes: laborMes.id_labor_mes,
                            tipo_dia: 'Laborado',
                            origen_registro: 'Automatico',
                            id_usuario_registro: id_usuario_registro ? Number(id_usuario_registro) : null,
                            estado: 'Activo'
                        });
                    }
                });
            }
        }

        if (resultados.length > 0) {
            await prisma.$transaction([
                prisma.detalleProgramacion.deleteMany({
                    where: {
                        fecha: { gte: fechaInicio, lte: fechaFin },
                        origen_registro: 'Automatico'
                    }
                }),
                prisma.detalleProgramacion.createMany({
                    data: resultados,
                    skipDuplicates: true
                })
            ]);
        }

        res.json({ success: true, data: { count: resultados.length } });
    } catch (error: any) {
        console.error("ERROR MOTOR:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const obtenerNovedadesPeriodo = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.query;
        const inicio = new Date(Number(anio), Number(mes) - 1, 1);
        const fin = new Date(Number(anio), Number(mes), 0);
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