"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capa2_obtenerNovedadesPorFecha = capa2_obtenerNovedadesPorFecha;
exports.capa2_verificarDisponibilidad = capa2_verificarDisponibilidad;
exports.capa2_filtrarDisponibles = capa2_filtrarDisponibles;
const cliente_1 = __importDefault(require("../../prisma/cliente"));
async function capa2_obtenerNovedadesPorFecha(fecha) {
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);
    const novedades = await cliente_1.default.novedadEmpleado.findMany({
        where: {
            fecha_registro: {
                lte: fechaFin
            },
            OR: [
                {
                    fecha_vencimiento: {
                        gte: fechaInicio
                    }
                },
                {
                    fecha_vencimiento: null
                }
            ],
            tipo_novedad: {
                codigo: {
                    in: ['INCAP', 'LIC', 'AUS']
                }
            },
            etapa: {
                in: ['aprobada', 'activa', 'pendiente']
            }
        },
        include: {
            tipo_novedad: true,
            empleado: true
        }
    });
    const mapaNovedades = new Map();
    novedades.forEach(novedad => {
        const fechaRegistro = new Date(novedad.fecha_registro);
        fechaRegistro.setHours(0, 0, 0, 0);
        let fechaVencimiento = null;
        if (novedad.fecha_vencimiento) {
            fechaVencimiento = new Date(novedad.fecha_vencimiento);
            fechaVencimiento.setHours(23, 59, 59, 999);
        }
        const fechaVerificar = new Date(fecha);
        fechaVerificar.setHours(0, 0, 0, 0);
        if (fechaVerificar >= fechaRegistro && (!fechaVencimiento || fechaVerificar <= fechaVencimiento)) {
            mapaNovedades.set(novedad.id_empleado, {
                id_empleado: novedad.id_empleado,
                tipo_novedad: novedad.tipo_novedad.nombre_novedad,
                codigo: novedad.tipo_novedad.codigo,
                fecha_inicio: fechaRegistro,
                fecha_fin: fechaVencimiento || fechaRegistro
            });
        }
    });
    return mapaNovedades;
}
async function capa2_verificarDisponibilidad(empleado, fecha, novedades) {
    if (empleado.id_estado !== 1) {
        return {
            disponible: false,
            razon: 'Empleado inactivo'
        };
    }
    if (!novedades) {
        novedades = await capa2_obtenerNovedadesPorFecha(fecha);
    }
    const novedad = novedades.get(empleado.id_empleado);
    if (novedad) {
        return {
            disponible: false,
            razon: `Empleado con ${novedad.tipo_novedad.toLowerCase()}`,
            tipoNovedad: novedad.codigo
        };
    }
    return {
        disponible: true
    };
}
async function capa2_filtrarDisponibles(empleados, fecha, opciones) {
    const novedades = (opciones === null || opciones === void 0 ? void 0 : opciones.novedades) || await capa2_obtenerNovedadesPorFecha(fecha);
    const empleadosDisponibles = await Promise.all(empleados.map(async (empleado) => {
        const verificacion = await capa2_verificarDisponibilidad(empleado, fecha, novedades);
        return {
            ...empleado,
            disponible: verificacion.disponible,
            razonNoDisponible: verificacion.razon,
            tipoNovedad: verificacion.tipoNovedad
        };
    }));
    return empleadosDisponibles;
}
