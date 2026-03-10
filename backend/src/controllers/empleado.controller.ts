import { Request, Response } from 'express';
import prisma from '../prisma/cliente';

export const empleadoController = {
    async listar(req: Request, res: Response) {
        try {
            const empleados = await prisma.empleado.findMany({
                where: { id_estado: 1 },
                include: { cargo: true }
            });
            res.status(200).json({ success: true, data: empleados });
        } catch (error: any) {
            res.status(500).json({ success: false, data: [], error: error.message });
        }
    },

    async obtenerPorId(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const empleado = await prisma.empleado.findUnique({
                where: { id_empleado: Number(id) },
                include: {
                    cargo: true,
                    empleado_area: { include: { area: true } }
                }
            });

            if (!empleado) {
                return res.status(404).json({ success: false, error: 'Empleado no encontrado' });
            }

            const empleadoConAreas = {
                ...empleado,
                areas_permitidas: empleado.empleado_area.map(ea => ea.id_area)
            };

            res.status(200).json({ success: true, data: empleadoConAreas });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async crear(req: Request, res: Response) {
        try {
            const { areas_permitidas, ...rawEmpleadoData } = req.body;

            const empleadoData = {
                ...rawEmpleadoData,
                edad: Number(rawEmpleadoData.edad),
                id_cargo: Number(rawEmpleadoData.id_cargo),
                id_area: rawEmpleadoData.id_area ? Number(rawEmpleadoData.id_area) : 13,
                id_estado: 1,
                vehiculo: rawEmpleadoData.vehiculo && rawEmpleadoData.vehiculo.trim() !== ""
                    ? rawEmpleadoData.vehiculo
                    : null
            };

            const empleado = await prisma.empleado.create({
                data: empleadoData
            });

            if (areas_permitidas && Array.isArray(areas_permitidas) && areas_permitidas.length > 0) {
                await prisma.empleado_area.createMany({
                    data: areas_permitidas.map((id_area: number) => ({
                        id_empleado: empleado.id_empleado,
                        id_area: Number(id_area)
                    }))
                });
            }

            const empleadoCompleto = await prisma.empleado.findUnique({
                where: { id_empleado: empleado.id_empleado },
                include: {
                    cargo: true,
                    empleado_area: { include: { area: true } }
                }
            });

            res.status(201).json({ success: true, data: empleadoCompleto });
        } catch (error: any) {
            console.error("Error creando:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async actualizar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { areas_permitidas, ...rawEmpleadoData } = req.body;

            const empleadoData: any = { ...rawEmpleadoData };

            if (rawEmpleadoData.edad) empleadoData.edad = Number(rawEmpleadoData.edad);
            if (rawEmpleadoData.id_cargo) empleadoData.id_cargo = Number(rawEmpleadoData.id_cargo);
            if (rawEmpleadoData.id_area) empleadoData.id_area = Number(rawEmpleadoData.id_area);
            if (rawEmpleadoData.id_estado) empleadoData.id_estado = Number(rawEmpleadoData.id_estado);

            if (rawEmpleadoData.vehiculo !== undefined) {
                empleadoData.vehiculo = rawEmpleadoData.vehiculo && rawEmpleadoData.vehiculo.trim() !== ""
                    ? rawEmpleadoData.vehiculo
                    : null;
            }

            const empleado = await prisma.empleado.update({
                where: { id_empleado: Number(id) },
                data: empleadoData
            });

            if (areas_permitidas && Array.isArray(areas_permitidas)) {
                await prisma.empleado_area.deleteMany({
                    where: { id_empleado: Number(id) }
                });

                if (areas_permitidas.length > 0) {
                    await prisma.empleado_area.createMany({
                        data: areas_permitidas.map((id_area: number) => ({
                            id_empleado: Number(id),
                            id_area: Number(id_area)
                        }))
                    });
                }
            }

            const empleadoCompleto = await prisma.empleado.findUnique({
                where: { id_empleado: Number(id) },
                include: {
                    cargo: true,
                    empleado_area: { include: { area: true } }
                }
            });

            res.status(200).json({ success: true, data: empleadoCompleto });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async eliminar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await prisma.empleado.update({
                where: { id_empleado: Number(id) },
                data: { id_estado: 2 }
            });
            res.status(200).json({ success: true, message: 'Empleado desactivado correctamente' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

export const vistasController = {
    async obtenerEmpleadosCompletos(req: Request, res: Response) {
        try {
            const { busqueda, estado, page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const where: any = {
                AND: [
                    estado !== undefined && estado !== 'undefined'
                        ? { id_estado: estado === 'true' ? 1 : 2 }
                        : { id_estado: 1 }, // Default to Active

                    busqueda ? {
                        OR: [
                            { nombre1: { contains: String(busqueda), mode: 'insensitive' } },
                            { apellido1: { contains: String(busqueda), mode: 'insensitive' } },
                            { cedula: { contains: String(busqueda) } }
                        ]
                    } : {}
                ]
            };

            const [total, empleadosRaw] = await Promise.all([
                prisma.empleado.count({ where }),
                prisma.empleado.findMany({
                    where,
                    skip: Number(skip),
                    take: Number(limit),
                    include: {
                        cargo: true,
                        empleado_area: { include: { area: true } },
                        labor_mes: {
                            where: { estado: 'Activo' },
                            include: { detalle_programacion: { include: { turno: true } } }
                        }
                    },
                    orderBy: { apellido1: 'asc' }
                }) as unknown as Promise<any[]>
            ]);

            const empleadosProcesados = empleadosRaw.map(emp => {
                let horas_acumuladas = 0;
                let meta_periodo = 240; // Default or maybe mapped from somewhere else

                if (emp.labor_mes && emp.labor_mes.length > 0) {
                    const laborVisible = emp.labor_mes[0]; // Active labor_mes
                    meta_periodo = laborVisible.horas_laborales || 240;
                    if (laborVisible.detalle_programacion) {
                        horas_acumuladas = laborVisible.detalle_programacion.reduce((acc: number, cur: any) => {
                            return acc + (cur.turno?.duracion_horas ? Number(cur.turno.duracion_horas) : 0);
                        }, 0);
                    }
                }

                return {
                    id_empleado: emp.id_empleado,
                    cedula: emp.cedula,
                    nombre_completo: `${emp.nombre1} ${emp.nombre2 || ''} ${emp.apellido1} ${emp.apellido2 || ''}`.replace(/\s+/g, ' ').trim(),
                    nombre_cargo: emp.cargo?.nombre_cargo || 'Sin Cargo',
                    salario_base: emp.cargo?.salario_base || 0,
                    estado: emp.id_estado === 1,
                    sexo: emp.sexo?.trim(),
                    vehiculo: emp.vehiculo,
                    areas_permitidas: emp.empleado_area.map(ea => ea.id_area),
                    areas: emp.empleado_area.map(ea => ea.area.nombre_area).join(', '),
                    horas_acumuladas,
                    meta_periodo
                };
            });

            res.status(200).json({
                success: true,
                data: {
                    empleados: empleadosProcesados,
                    paginacion: {
                        total,
                        totalPaginas: Math.ceil(total / Number(limit)),
                        paginaActual: Number(page),
                        limite: Number(limit)
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                data: { empleados: [], paginacion: { total: 0, totalPaginas: 0, paginaActual: 1, limite: 20 } },
                error: error.message
            });
        }
    }
};