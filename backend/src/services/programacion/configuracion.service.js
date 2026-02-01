"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuracionService = void 0;
const cliente_1 = __importDefault(require("../../prisma/cliente"));
exports.configuracionService = {
    async actualizarMaximosAreas(configs) {
        const operaciones = configs.map(c => cliente_1.default.area.update({
            where: { id_area: c.id_area },
            data: { max_trabajadores: c.max }
        }));
        return await cliente_1.default.$transaction(operaciones);
    },
    async guardarDescansos(id_empleado, mes, anio, dias, obs) {
        return await cliente_1.default.descanso.upsert({
            where: {
                id_empleado_mes_anio: { id_empleado, mes, anio }
            },
            update: { dias_descanso: dias, observaciones: obs },
            create: { id_empleado, mes, anio, dias_descanso: dias, observaciones: obs }
        });
    },
    async obtenerConfiguracionMes(mes, anio) {
        const areas = await cliente_1.default.area.findMany({
            select: {
                id_area: true,
                nombre_area: true,
                max_trabajadores: true
            }
        });
        const descansos = await cliente_1.default.descanso.findMany({
            where: { mes, anio },
            include: {
                empleado: {
                    select: {
                        nombre1: true,
                        apellido1: true,
                        cedula: true
                    }
                }
            }
        });
        return { areas, descansos };
    },
    async obtenerDescansoEmpleado(id_empleado, mes, anio) {
        return await cliente_1.default.descanso.findUnique({
            where: {
                id_empleado_mes_anio: { id_empleado, mes, anio }
            }
        });
    },
    async obtenerMaestrosConfiguracion() {
        const [empleados, areas, turnos] = await Promise.all([
            cliente_1.default.empleado.findMany({
                where: { id_estado: 1 },
                select: { id_empleado: true, nombre1: true, apellido1: true, cedula: true }
            }),
            cliente_1.default.area.findMany(),
            cliente_1.default.turno.findMany({ where: { estado: 'Activo' } })
        ]);
        return { empleados, areas, turnos };
    }
};
