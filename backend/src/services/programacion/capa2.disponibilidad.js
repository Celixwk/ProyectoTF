"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.capa2_obtenerNovedadesPorFecha = capa2_obtenerNovedadesPorFecha;
exports.capa2_verificarDisponibilidad = capa2_verificarDisponibilidad;
exports.capa2_filtrarDisponibles = capa2_filtrarDisponibles;
var cliente_1 = require("../../prisma/cliente");
/**
 * Obtiene todas las novedades activas para una fecha específica
 * Tipos de novedades que afectan disponibilidad: INCAP, LIC, AUS
 *
 * @param fecha Fecha a verificar
 * @returns Mapa de id_empleado -> tipo_novedad
 */
function capa2_obtenerNovedadesPorFecha(fecha) {
    return __awaiter(this, void 0, void 0, function () {
        var fechaInicio, fechaFin, novedades, mapaNovedades;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fechaInicio = new Date(fecha);
                    fechaInicio.setHours(0, 0, 0, 0);
                    fechaFin = new Date(fecha);
                    fechaFin.setHours(23, 59, 59, 999);
                    return [4 /*yield*/, cliente_1.default.novedadEmpleado.findMany({
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
                                        in: ['INCAP', 'LIC', 'AUS'] // Tipos que impiden trabajar
                                    }
                                },
                                etapa: {
                                    in: ['aprobada', 'activa', 'pendiente'] // Depende de la lógica del negocio
                                }
                            },
                            include: {
                                tipo_novedad: true,
                                empleado: true
                            }
                        })];
                case 1:
                    novedades = _a.sent();
                    mapaNovedades = new Map();
                    novedades.forEach(function (novedad) {
                        // Verificar que la fecha esté dentro del rango de la novedad
                        var fechaRegistro = new Date(novedad.fecha_registro);
                        fechaRegistro.setHours(0, 0, 0, 0);
                        var fechaVencimiento = null;
                        if (novedad.fecha_vencimiento) {
                            fechaVencimiento = new Date(novedad.fecha_vencimiento);
                            fechaVencimiento.setHours(23, 59, 59, 999);
                        }
                        var fechaVerificar = new Date(fecha);
                        fechaVerificar.setHours(0, 0, 0, 0);
                        // Si la fecha está dentro del rango de la novedad
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
                    return [2 /*return*/, mapaNovedades];
            }
        });
    });
}
/**
 * Verifica si un empleado específico está disponible para una fecha
 *
 * @param empleado Empleado a verificar
 * @param fecha Fecha a verificar
 * @param novedades Mapa de novedades (opcional, se consulta si no se proporciona)
 * @returns true si está disponible, false si no
 */
function capa2_verificarDisponibilidad(empleado, fecha, novedades) {
    return __awaiter(this, void 0, void 0, function () {
        var novedad;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // 1. Verificar estado del empleado (debe estar activo)
                    if (empleado.id_estado !== 1) {
                        return [2 /*return*/, {
                                disponible: false,
                                razon: 'Empleado inactivo'
                            }];
                    }
                    if (!!novedades) return [3 /*break*/, 2];
                    return [4 /*yield*/, capa2_obtenerNovedadesPorFecha(fecha)];
                case 1:
                    novedades = _a.sent();
                    _a.label = 2;
                case 2:
                    novedad = novedades.get(empleado.id_empleado);
                    if (novedad) {
                        return [2 /*return*/, {
                                disponible: false,
                                razon: "Empleado con ".concat(novedad.tipo_novedad.toLowerCase()),
                                tipoNovedad: novedad.codigo
                            }];
                    }
                    return [2 /*return*/, {
                            disponible: true
                        }];
            }
        });
    });
}
/**
 * CAPA 2: Filtrar empleados disponibles para una fecha específica
 *
 * @param empleados Lista de empleados a filtrar
 * @param fecha Fecha para la cual verificar disponibilidad
 * @param opciones Opciones adicionales (por ahora vacías, preparado para expansión)
 * @returns Lista de empleados con información de disponibilidad
 */
function capa2_filtrarDisponibles(empleados, fecha, opciones) {
    return __awaiter(this, void 0, void 0, function () {
        var novedades, empleadosDisponibles;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, capa2_obtenerNovedadesPorFecha(fecha)];
                case 1:
                    novedades = _a.sent();
                    return [4 /*yield*/, Promise.all(empleados.map(function (empleado) { return __awaiter(_this, void 0, void 0, function () {
                            var verificacion;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, capa2_verificarDisponibilidad(empleado, fecha, novedades)];
                                    case 1:
                                        verificacion = _a.sent();
                                        return [2 /*return*/, __assign(__assign({}, empleado), { disponible: verificacion.disponible, razonNoDisponible: verificacion.razon, tipoNovedad: verificacion.tipoNovedad })];
                                }
                            });
                        }); }))];
                case 2:
                    empleadosDisponibles = _a.sent();
                    return [2 /*return*/, empleadosDisponibles];
            }
        });
    });
}
