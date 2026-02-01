"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.capa4_detectarHuecos = capa4_detectarHuecos;
exports.capa4_activarComodines = capa4_activarComodines;
exports.capa4_activarRefuerzos = capa4_activarRefuerzos;
function capa4_detectarHuecos(programacion, areas, fecha, maximosPorArea) {
    const asignacionesPorArea = new Map();
    programacion.forEach(asig => {
        if (asig.fecha.getTime() === fecha.getTime()) {
            asignacionesPorArea.set(asig.id_area, (asignacionesPorArea.get(asig.id_area) || 0) + 1);
        }
    });
    const huecos = areas.map(area => {
        var _a;
        const actuales = asignacionesPorArea.get(area.id_area) || 0;
        const requeridos = maximosPorArea.get(area.id_area) || 0;
        const deficit = Math.max(0, requeridos - actuales);
        return {
            id_area: area.id_area,
            nombre_area: area.nombre_area,
            deficit,
            prioridad: (_a = area.prioridad) !== null && _a !== void 0 ? _a : 999,
            trabajadores_actuales: actuales,
            trabajadores_requeridos: requeridos
        };
    }).filter(h => h.deficit > 0);
    return huecos.sort((a, b) => a.prioridad - b.prioridad || b.deficit - a.deficit);
}
function capa4_activarComodines(huecos, comodines, empleadosAsignados, fecha, turno, programacionExistente, empleadosDisponiblesInfo, validadorReglasDuras) {
    const comodinesParaActivar = [];
    const comodinesDisponibles = comodines.filter(comodin => {
        var _a;
        if (empleadosAsignados.has(comodin.id_empleado))
            return false;
        const infoDisponible = empleadosDisponiblesInfo.find(info => info.id_empleado === comodin.id_empleado);
        return (_a = infoDisponible === null || infoDisponible === void 0 ? void 0 : infoDisponible.disponible) !== null && _a !== void 0 ? _a : false;
    });
    for (const hueco of huecos) {
        if (hueco.deficit <= 0)
            continue;
        const comodinesDisponibles = comodines.filter(comodin => {
            var _a;
            if (empleadosAsignados.has(comodin.id_empleado))
                return false;
            const infoDisponible = empleadosDisponiblesInfo.find(info => info.id_empleado === comodin.id_empleado);
            return (_a = infoDisponible === null || infoDisponible === void 0 ? void 0 : infoDisponible.disponible) !== null && _a !== void 0 ? _a : false;
        });
        for (const comodin of comodinesDisponibles) {
            const puedeTrabajarEnArea = comodin.areas.length === 0 || comodin.areas.some(a => a.id_area === hueco.id_area);
            if (!puedeTrabajarEnArea)
                continue;
            const validacion = validadorReglasDuras(comodin, { id_area: hueco.id_area }, turno, fecha, programacionExistente);
            if (validacion.valido) {
                comodinesParaActivar.push({ empleado: comodin, area: hueco.id_area, hueco });
                empleadosAsignados.add(comodin.id_empleado);
                break;
            }
        }
    }
    return comodinesParaActivar;
}
function capa4_activarRefuerzos(huecos, empleadosRefuerzo) {
    return [];
}
