import { Request, Response } from 'express';
import prisma from '../prisma/cliente';

export const novedadController = {
    async listar(req: Request, res: Response) {
        try {
            const { inicio, fin } = req.query;

            const filtroFecha = inicio && fin ? {
                detalle_novedad: {
                    some: {
                        fecha: {
                            gte: new Date(inicio as string),
                            lte: new Date(fin as string)
                        }
                    }
                }
            } : {};

            const novedades = await prisma.novedadEmpleado.findMany({
                where: filtroFecha,
                include: {
                    empleado: {
                        select: {
                            nombre1: true,
                            apellido1: true,
                            cedula: true
                        }
                    },
                    tipo_novedad: true,
                    detalle_novedad: {
                        orderBy: { fecha: 'asc' }
                    }
                },
                orderBy: { fecha_solicitud: 'desc' }
            });

            const data = novedades.map(n => {
                const fechas = n.detalle_novedad.map(d => new Date(d.fecha).getTime());
                const inicioFechas = fechas.length > 0 ? new Date(Math.min(...fechas)) : null;
                const finFechas = fechas.length > 0 ? new Date(Math.max(...fechas)) : null;

                return {
                    ...n,
                    fecha_inicio: inicioFechas,
                    fecha_fin: finFechas,
                    nombre_completo: `${n.empleado.nombre1} ${n.empleado.apellido1}`
                };
            });

            res.status(200).json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async listarTipos(req: Request, res: Response) {
        try {
            const tipos = await prisma.tipoNovedad.findMany({
                where: { activo: true }
            });
            res.status(200).json({ success: true, data: tipos });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async crear(req: Request, res: Response) {
        try {
            const { id_empleado, id_novedad_tipo, fecha_inicio, fecha_fin, observaciones, cantidad_diaria = 1 } = req.body;

            if (!id_empleado || !id_novedad_tipo || !fecha_inicio || !fecha_fin) {
                return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
            }

            const resultado = await prisma.$transaction(async (tx) => {
                const novedad = await tx.novedadEmpleado.create({
                    data: {
                        id_empleado: Number(id_empleado),
                        id_novedad_tipo: Number(id_novedad_tipo),
                        fecha_solicitud: new Date(),
                        fecha_registro: new Date(),
                        etapa: 'Aprobada'
                    }
                });

                const dias = [];
                const current = new Date(fecha_inicio);
                const fin = new Date(fecha_fin);

                current.setHours(0, 0, 0, 0);
                fin.setHours(0, 0, 0, 0);

                while (current <= fin) {
                    dias.push({
                        id_novedad_empleado: novedad.id_novedad_empleado,
                        fecha: new Date(current),
                        cantidad: Number(cantidad_diaria),
                        observaciones
                    });
                    current.setDate(current.getDate() + 1);
                }

                if (dias.length > 0) {
                    await tx.detalleNovedad.createMany({ data: dias });
                }

                return novedad;
            });

            res.status(201).json({ success: true, data: resultado });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async sincronizarNovedades(req: Request, res: Response) {
        try {
            const { id_empleado, operaciones } = req.body;

            if (!id_empleado || !Array.isArray(operaciones)) {
                return res.status(400).json({ success: false, error: 'Datos incompletos' });
            }

            await prisma.$transaction(async (tx) => {
                for (const op of operaciones) {
                    const fecha = new Date(op.fecha);
                    fecha.setHours(0, 0, 0, 0);

                    const existente = await tx.novedadEmpleado.findFirst({
                        where: {
                            id_empleado: Number(id_empleado),
                            detalle_novedad: { some: { fecha } }
                        },
                        include: { detalle_novedad: true }
                    });

                    if (op.tipo === 'crear') {
                        if (existente) continue;

                        const novedad = await tx.novedadEmpleado.create({
                            data: {
                                id_empleado: Number(id_empleado),
                                id_novedad_tipo: Number(op.id_tipo),
                                fecha_solicitud: new Date(),
                                fecha_registro: new Date(),
                                etapa: 'Aprobada'
                            }
                        });

                        await tx.detalleNovedad.create({
                            data: {
                                id_novedad_empleado: novedad.id_novedad_empleado,
                                fecha,
                                cantidad: 1
                            }
                        });
                    }

                    if (op.tipo === 'modificar' && existente) {
                        await tx.novedadEmpleado.update({
                            where: { id_novedad_empleado: existente.id_novedad_empleado },
                            data: { id_novedad_tipo: Number(op.id_tipo) }
                        });
                    }

                    if (op.tipo === 'eliminar' && existente) {
                        await tx.detalleNovedad.deleteMany({
                            where: {
                                id_novedad_empleado: existente.id_novedad_empleado,
                                fecha
                            }
                        });

                        const restantes = await tx.detalleNovedad.count({
                            where: { id_novedad_empleado: existente.id_novedad_empleado }
                        });

                        if (restantes === 0) {
                            await tx.novedadEmpleado.delete({
                                where: { id_novedad_empleado: existente.id_novedad_empleado }
                            });
                        }
                    }
                }
            });

            res.status(200).json({ success: true, message: 'Sincronización exitosa' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async guardarMasivo(req: Request, res: Response) {
        try {
            const { id_empleado, novedades, fecha_inicio, fecha_fin } = req.body;

            if (!id_empleado || !fecha_inicio || !fecha_fin) {
                return res.status(400).json({ success: false, error: 'Datos incompletos' });
            }

            await prisma.$transaction(async (tx) => {
                const existentes = await tx.novedadEmpleado.findMany({
                    where: {
                        id_empleado: Number(id_empleado),
                        detalle_novedad: {
                            some: {
                                fecha: {
                                    gte: new Date(fecha_inicio),
                                    lte: new Date(fecha_fin)
                                }
                            }
                        }
                    },
                    select: { id_novedad_empleado: true }
                });

                if (existentes.length > 0) {
                    const ids = existentes.map(n => n.id_novedad_empleado);
                    await tx.detalleNovedad.deleteMany({
                        where: { id_novedad_empleado: { in: ids } }
                    });
                    await tx.novedadEmpleado.deleteMany({
                        where: { id_novedad_empleado: { in: ids } }
                    });
                }

                if (Array.isArray(novedades)) {
                    for (const item of novedades) {
                        const novedad = await tx.novedadEmpleado.create({
                            data: {
                                id_empleado: Number(id_empleado),
                                id_novedad_tipo: Number(item.id_tipo),
                                fecha_solicitud: new Date(),
                                fecha_registro: new Date(),
                                etapa: 'Aprobada'
                            }
                        });

                        await tx.detalleNovedad.create({
                            data: {
                                id_novedad_empleado: novedad.id_novedad_empleado,
                                fecha: new Date(item.fecha),
                                cantidad: 1
                            }
                        });
                    }
                }
            });

            res.status(200).json({ success: true, message: 'Sincronizado' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async eliminar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.novedadEmpleado.delete({
                where: { id_novedad_empleado: Number(id) }
            });
            res.status(200).json({ success: true, message: 'Eliminada' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
