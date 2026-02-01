"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.novedadController = void 0;
const cliente_1 = __importDefault(require("../prisma/cliente"));
exports.novedadController = {
    async listar(req, res) {
        try {
            const { inicio, fin } = req.query;
            let filtroFecha = {};
            if (inicio && fin) {
                const [yI, mI, dI] = inicio.split('-').map(Number);
                const [yF, mF, dF] = fin.split('-').map(Number);
                filtroFecha = {
                    detalle_novedad: {
                        some: {
                            fecha: {
                                gte: new Date(Date.UTC(yI, mI - 1, dI, 0, 0, 0)),
                                lte: new Date(Date.UTC(yF, mF - 1, dF, 23, 59, 59))
                            }
                        }
                    }
                };
            }
            const novedades = await cliente_1.default.novedadEmpleado.findMany({
                where: filtroFecha,
                include: {
                    empleado: {
                        select: { nombre1: true, apellido1: true, cedula: true }
                    },
                    tipo_novedad: true,
                    detalle_novedad: { orderBy: { fecha: 'asc' } }
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
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async listarTipos(req, res) {
        try {
            const tipos = await cliente_1.default.tipoNovedad.findMany({ where: { activo: true }, orderBy: { id_novedad_tipo: 'asc' } });
            res.status(200).json({ success: true, data: tipos });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async crear(req, res) {
        try {
            const { id_empleado, id_novedad_tipo, fecha_inicio, fecha_fin, observaciones, cantidad_diaria = 1 } = req.body;
            if (!id_empleado || !id_novedad_tipo || !fecha_inicio || !fecha_fin) {
                return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
            }
            const resultado = await cliente_1.default.$transaction(async (tx) => {
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
                const [yI, mI, dI] = fecha_inicio.split('-').map(Number);
                const [yF, mF, dF] = fecha_fin.split('-').map(Number);
                const current = new Date(Date.UTC(yI, mI - 1, dI, 12, 0, 0));
                const fin = new Date(Date.UTC(yF, mF - 1, dF, 12, 0, 0));
                while (current <= fin) {
                    dias.push({
                        id_novedad_empleado: novedad.id_novedad_empleado,
                        fecha: new Date(current),
                        cantidad: Number(cantidad_diaria),
                        observaciones
                    });
                    current.setUTCDate(current.getUTCDate() + 1);
                }
                if (dias.length > 0) {
                    await tx.detalleNovedad.createMany({ data: dias });
                }
                return novedad;
            });
            res.status(201).json({ success: true, data: resultado });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async sincronizarNovedades(req, res) {
        try {
            const { id_empleado, operaciones } = req.body;
            if (!id_empleado || !Array.isArray(operaciones)) {
                return res.status(400).json({ success: false, error: 'Datos incompletos' });
            }
            const tiposValidos = await cliente_1.default.tipoNovedad.findMany({ select: { id_novedad_tipo: true } });
            const idsValidos = new Set(tiposValidos.map(t => t.id_novedad_tipo));
            await cliente_1.default.$transaction(async (tx) => {
                for (const op of operaciones) {
                    const [y, m, d] = op.fecha.split('-').map(Number);
                    const fecha = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
                    const inicioDia = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
                    const finDia = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
                    if (op.tipo === 'eliminar') {
                        const detalles = await tx.detalleNovedad.findMany({
                            where: {
                                fecha: { gte: inicioDia, lte: finDia },
                                novedad_empleado: { id_empleado: Number(id_empleado) }
                            },
                            select: { id_novedad_empleado: true }
                        });
                        for (const det of detalles) {
                            await tx.detalleNovedad.deleteMany({ where: { id_novedad_empleado: det.id_novedad_empleado } });
                            await tx.novedadEmpleado.delete({ where: { id_novedad_empleado: det.id_novedad_empleado } });
                        }
                        continue;
                    }
                    if (!idsValidos.has(Number(op.id_tipo)))
                        continue;
                    if (op.tipo === 'crear') {
                        const existe = await tx.detalleNovedad.findFirst({
                            where: {
                                fecha: { gte: inicioDia, lte: finDia },
                                novedad_empleado: { id_empleado: Number(id_empleado) }
                            }
                        });
                        if (existe)
                            continue;
                        const laborMes = await tx.laborMes.findFirst({
                            where: {
                                id_empleado: Number(id_empleado),
                                fecha_inicio: { lte: fecha },
                                fecha_fin: { gte: fecha }
                            }
                        });
                        const novedad = await tx.novedadEmpleado.create({
                            data: {
                                id_empleado: Number(id_empleado),
                                id_novedad_tipo: Number(op.id_tipo),
                                id_labor_mes: (laborMes === null || laborMes === void 0 ? void 0 : laborMes.id_labor_mes) || null,
                                fecha_solicitud: new Date(),
                                fecha_registro: new Date(),
                                etapa: 'Aprobada'
                            }
                        });
                        await tx.detalleNovedad.create({
                            data: { id_novedad_empleado: novedad.id_novedad_empleado, fecha, cantidad: 1 }
                        });
                    }
                    if (op.tipo === 'modificar') {
                        const detalle = await tx.detalleNovedad.findFirst({
                            where: {
                                fecha: { gte: inicioDia, lte: finDia },
                                novedad_empleado: { id_empleado: Number(id_empleado) }
                            },
                            select: { id_novedad_empleado: true }
                        });
                        if (detalle) {
                            await tx.novedadEmpleado.update({
                                where: { id_novedad_empleado: detalle.id_novedad_empleado },
                                data: { id_novedad_tipo: Number(op.id_tipo) }
                            });
                        }
                    }
                }
            });
            res.status(200).json({ success: true, message: 'Sincronización exitosa' });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async guardarMasivo(req, res) {
        try {
            const { id_empleado, novedades, fecha_inicio, fecha_fin } = req.body;
            if (!id_empleado || !fecha_inicio || !fecha_fin) {
                return res.status(400).json({ success: false, error: 'Datos incompletos' });
            }
            const [yI, mI, dI] = fecha_inicio.split('-').map(Number);
            const [yF, mF, dF] = fecha_fin.split('-').map(Number);
            const start = new Date(Date.UTC(yI, mI - 1, dI, 0, 0, 0));
            const end = new Date(Date.UTC(yF, mF - 1, dF, 23, 59, 59));
            await cliente_1.default.$transaction(async (tx) => {
                const existentes = await tx.novedadEmpleado.findMany({
                    where: {
                        id_empleado: Number(id_empleado),
                        detalle_novedad: { some: { fecha: { gte: start, lte: end } } }
                    },
                    select: { id_novedad_empleado: true }
                });
                if (existentes.length > 0) {
                    const ids = existentes.map(n => n.id_novedad_empleado);
                    await tx.detalleNovedad.deleteMany({ where: { id_novedad_empleado: { in: ids } } });
                    await tx.novedadEmpleado.deleteMany({ where: { id_novedad_empleado: { in: ids } } });
                }
                if (Array.isArray(novedades)) {
                    for (const item of novedades) {
                        const [y, m, d] = item.fecha.split('-').map(Number);
                        const fechaItem = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
                        const laborMes = await tx.laborMes.findFirst({
                            where: {
                                id_empleado: Number(id_empleado),
                                fecha_inicio: { lte: fechaItem },
                                fecha_fin: { gte: fechaItem }
                            }
                        });
                        const novedad = await tx.novedadEmpleado.create({
                            data: {
                                id_empleado: Number(id_empleado),
                                id_novedad_tipo: Number(item.id_tipo),
                                id_labor_mes: (laborMes === null || laborMes === void 0 ? void 0 : laborMes.id_labor_mes) || null,
                                fecha_solicitud: new Date(),
                                fecha_registro: new Date(),
                                etapa: 'Aprobada'
                            }
                        });
                        await tx.detalleNovedad.create({
                            data: { id_novedad_empleado: novedad.id_novedad_empleado, fecha: fechaItem, cantidad: 1 }
                        });
                    }
                }
            });
            res.status(200).json({ success: true, message: 'Sincronizado' });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            await cliente_1.default.$transaction(async (tx) => {
                await tx.detalleNovedad.deleteMany({ where: { id_novedad_empleado: Number(id) } });
                await tx.novedadEmpleado.delete({ where: { id_novedad_empleado: Number(id) } });
            });
            res.status(200).json({ success: true, message: 'Eliminada' });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
