"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vistasController = exports.empleadoController = void 0;
const cliente_1 = __importDefault(require("../prisma/cliente"));
exports.empleadoController = {
    async listar(req, res) {
        try {
            const empleados = await cliente_1.default.empleado.findMany({
                include: { cargo: true }
            });
            res.status(200).json({ success: true, data: empleados });
        }
        catch (error) {
            res.status(500).json({ success: false, data: [], error: error.message });
        }
    },
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            const empleado = await cliente_1.default.empleado.findUnique({
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
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async crear(req, res) {
        try {
            const { areas_permitidas, ...rawEmpleadoData } = req.body;
            // Sanitización ligera (convertir números)
            const empleadoData = {
                ...rawEmpleadoData,
                edad: Number(rawEmpleadoData.edad),
                id_cargo: Number(rawEmpleadoData.id_cargo),
                // Si no hay area, va a Refuerzos (13)
                id_area: rawEmpleadoData.id_area ? Number(rawEmpleadoData.id_area) : 13,
                id_estado: 1,
                // AHORA ES MÁS SIMPLE: Pasamos el string directo. Si es vacío, enviamos null.
                vehiculo: rawEmpleadoData.vehiculo && rawEmpleadoData.vehiculo.trim() !== ""
                    ? rawEmpleadoData.vehiculo
                    : null
            };
            const empleado = await cliente_1.default.empleado.create({
                data: empleadoData
            });
            if (areas_permitidas && Array.isArray(areas_permitidas) && areas_permitidas.length > 0) {
                await cliente_1.default.empleado_area.createMany({
                    data: areas_permitidas.map((id_area) => ({
                        id_empleado: empleado.id_empleado,
                        id_area: Number(id_area)
                    }))
                });
            }
            const empleadoCompleto = await cliente_1.default.empleado.findUnique({
                where: { id_empleado: empleado.id_empleado },
                include: {
                    cargo: true,
                    empleado_area: { include: { area: true } }
                }
            });
            res.status(201).json({ success: true, data: empleadoCompleto });
        }
        catch (error) {
            console.error("Error creando:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { areas_permitidas, ...rawEmpleadoData } = req.body;
            const empleadoData = { ...rawEmpleadoData };
            if (rawEmpleadoData.edad)
                empleadoData.edad = Number(rawEmpleadoData.edad);
            if (rawEmpleadoData.id_cargo)
                empleadoData.id_cargo = Number(rawEmpleadoData.id_cargo);
            if (rawEmpleadoData.id_area)
                empleadoData.id_area = Number(rawEmpleadoData.id_area);
            if (rawEmpleadoData.id_estado)
                empleadoData.id_estado = Number(rawEmpleadoData.id_estado);
            // Lógica de Vehículo (String o Null)
            if (rawEmpleadoData.vehiculo !== undefined) {
                empleadoData.vehiculo = rawEmpleadoData.vehiculo && rawEmpleadoData.vehiculo.trim() !== ""
                    ? rawEmpleadoData.vehiculo
                    : null;
            }
            const empleado = await cliente_1.default.empleado.update({
                where: { id_empleado: Number(id) },
                data: empleadoData
            });
            if (areas_permitidas && Array.isArray(areas_permitidas)) {
                await cliente_1.default.empleado_area.deleteMany({
                    where: { id_empleado: Number(id) }
                });
                if (areas_permitidas.length > 0) {
                    await cliente_1.default.empleado_area.createMany({
                        data: areas_permitidas.map((id_area) => ({
                            id_empleado: Number(id),
                            id_area: Number(id_area)
                        }))
                    });
                }
            }
            const empleadoCompleto = await cliente_1.default.empleado.findUnique({
                where: { id_empleado: Number(id) },
                include: {
                    cargo: true,
                    empleado_area: { include: { area: true } }
                }
            });
            res.status(200).json({ success: true, data: empleadoCompleto });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            await cliente_1.default.empleado.delete({
                where: { id_empleado: Number(id) }
            });
            res.status(200).json({ success: true, message: 'Empleado eliminado' });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
exports.vistasController = {
    async obtenerEmpleadosCompletos(req, res) {
        try {
            const { busqueda, estado, page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {
                AND: [
                    estado !== undefined && estado !== 'undefined'
                        ? { id_estado: estado === 'true' ? 1 : 0 }
                        : {},
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
                cliente_1.default.empleado.count({ where }),
                cliente_1.default.empleado.findMany({
                    where,
                    skip: Number(skip),
                    take: Number(limit),
                    include: {
                        cargo: true,
                        empleado_area: { include: { area: true } }
                    },
                    orderBy: { apellido1: 'asc' }
                })
            ]);
            const empleadosProcesados = empleadosRaw.map(emp => {
                var _a, _b, _c;
                return ({
                    id_empleado: emp.id_empleado,
                    cedula: emp.cedula,
                    nombre_completo: `${emp.nombre1} ${emp.nombre2 || ''} ${emp.apellido1} ${emp.apellido2 || ''}`.replace(/\s+/g, ' ').trim(),
                    nombre_cargo: ((_a = emp.cargo) === null || _a === void 0 ? void 0 : _a.nombre_cargo) || 'Sin Cargo',
                    salario_base: ((_b = emp.cargo) === null || _b === void 0 ? void 0 : _b.salario_base) || 0,
                    estado: emp.id_estado === 1,
                    sexo: (_c = emp.sexo) === null || _c === void 0 ? void 0 : _c.trim(),
                    vehiculo: emp.vehiculo, // AHORA ES TEXTO (LA PLACA)
                    areas_permitidas: emp.empleado_area.map(ea => ea.id_area),
                    areas: emp.empleado_area.map(ea => ea.area.nombre_area).join(', ')
                });
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                data: { empleados: [], paginacion: { total: 0, totalPaginas: 0, paginaActual: 1, limite: 20 } },
                error: error.message
            });
        }
    }
};
