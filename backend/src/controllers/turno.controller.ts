import { Request, Response } from 'express';
import prisma from '../prisma/cliente';

const convertirHora = (hora: any): Date | null => {
    if (!hora || hora === '') return null;
    if (hora instanceof Date) return hora;
    if (typeof hora === 'string' && hora.includes('T')) return new Date(hora);

    let horaStr = String(hora).trim();
    const es12Horas = /am|pm/i.test(horaStr);

    if (es12Horas) {
        const match = horaStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (match) {
            let [_, h, m, periodo] = match;
            let horas = parseInt(h, 10);

            if (periodo.toUpperCase() === 'PM' && horas < 12) horas += 12;
            if (periodo.toUpperCase() === 'AM' && horas === 12) horas = 0;

            horaStr = `${horas.toString().padStart(2, '0')}:${m}`;
        }
    }

    return new Date(`1970-01-01T${horaStr}:00Z`);
};

const formatearSalida = (fecha: Date | null): string | null => {
    if (!fecha) return null;
    const horas = fecha.getUTCHours().toString().padStart(2, '0');
    const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
};

const calcularDuracion = (e1: Date | null, s1: Date | null, e2: Date | null, s2: Date | null): number => {
    let totalMs = 0;

    const sumarTramo = (inicio: Date, fin: Date) => {
        let diff = fin.getTime() - inicio.getTime();
        if (diff < 0) diff += 24 * 60 * 60 * 1000;
        return diff;
    };

    if (e1 && s1) totalMs += sumarTramo(e1, s1);
    if (e2 && s2) totalMs += sumarTramo(e2, s2);

    return Number((totalMs / (1000 * 60 * 60)).toFixed(2));
};

export const getTurnos = async (req: Request, res: Response) => {
    try {
        const { estado } = req.query;
        const turnosRaw = await prisma.turno.findMany({
            where: estado !== undefined ? {
                estado: estado === 'true' ? 'Activo' : 'Inactivo'
            } : {},
            orderBy: { tipo_turno: 'asc' }
        });

        const turnos = turnosRaw.map(t => ({
            ...t,
            hora_entrada: formatearSalida(t.hora_entrada),
            hora_salida: formatearSalida(t.hora_salida),
            hora_entrada_2: formatearSalida(t.hora_entrada_2),
            hora_salida_2: formatearSalida(t.hora_salida_2),
        }));

        res.json({ success: true, data: turnos });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener turnos' });
    }
};

export const obtenerTurnosAsignados = async (req: Request, res: Response) => {
    try {
        const { fecha_inicio, fecha_fin, id_empleado } = req.query;

        const where: any = {};

        if (fecha_inicio) where.fecha = { ...where.fecha, gte: new Date(String(fecha_inicio)) };
        if (fecha_fin) where.fecha = { ...where.fecha, lte: new Date(String(fecha_fin)) };
        if (id_empleado) where.id_empleado = Number(id_empleado);

        const turnos = await prisma.vw_turnos_asignados.findMany({
            where,
            orderBy: { fecha: 'asc' }
        });

        res.json({ success: true, data: { turnos } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getTurnoById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const turnoRaw = await prisma.turno.findUnique({
            where: { id_turno: Number(id) }
        });

        if (!turnoRaw) return res.status(404).json({ success: false, error: 'No encontrado' });

        const turno = {
            ...turnoRaw,
            hora_entrada: formatearSalida(turnoRaw.hora_entrada),
            hora_salida: formatearSalida(turnoRaw.hora_salida),
            hora_entrada_2: formatearSalida(turnoRaw.hora_entrada_2),
            hora_salida_2: formatearSalida(turnoRaw.hora_salida_2),
        };

        res.json({ success: true, data: turno });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener turno' });
    }
};

export const createTurno = async (req: Request, res: Response) => {
    try {
        const { codigo, hora_entrada, hora_salida, hora_entrada_2, hora_salida_2, duracion_horas, ...rest } = req.body;

        const hEntrada = convertirHora(hora_entrada);
        const hSalida = convertirHora(hora_salida);
        const hEntrada2 = convertirHora(hora_entrada_2);
        const hSalida2 = convertirHora(hora_salida_2);

        let duracionFinal = Number(duracion_horas);
        if (isNaN(duracionFinal) || duracionFinal === 0) {
            duracionFinal = calcularDuracion(hEntrada, hSalida, hEntrada2, hSalida2);
        }

        const dataToSave = {
            ...rest,
            duracion_horas: duracionFinal,
            hora_entrada: hEntrada,
            hora_salida: hSalida,
            hora_entrada_2: hEntrada2,
            hora_salida_2: hSalida2,
            estado: rest.estado || 'Activo'
        };

        const nuevoTurno = await prisma.turno.create({
            data: dataToSave
        });

        const respuesta = {
            ...nuevoTurno,
            hora_entrada: formatearSalida(nuevoTurno.hora_entrada),
            hora_salida: formatearSalida(nuevoTurno.hora_salida),
            hora_entrada_2: formatearSalida(nuevoTurno.hora_entrada_2),
            hora_salida_2: formatearSalida(nuevoTurno.hora_salida_2),
        };

        res.status(201).json({ success: true, data: respuesta });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateTurno = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { codigo, hora_entrada, hora_salida, hora_entrada_2, hora_salida_2, duracion_horas, ...rest } = req.body;

        const dataToUpdate: any = { ...rest };

        const hEntrada = hora_entrada ? convertirHora(hora_entrada) : undefined;
        const hSalida = hora_salida ? convertirHora(hora_salida) : undefined;

        if (hEntrada !== undefined) dataToUpdate.hora_entrada = hEntrada;
        if (hSalida !== undefined) dataToUpdate.hora_salida = hSalida;
        if (hora_entrada_2 !== undefined) dataToUpdate.hora_entrada_2 = convertirHora(hora_entrada_2);
        if (hora_salida_2 !== undefined) dataToUpdate.hora_salida_2 = convertirHora(hora_salida_2);

        if (duracion_horas) {
            dataToUpdate.duracion_horas = Number(duracion_horas);
        } else if (hEntrada && hSalida) {
            // Recalcular si se actualizan las horas pero no se manda duración
            const turnoActual = await prisma.turno.findUnique({ where: { id_turno: Number(id) } });
            const hE2 = dataToUpdate.hora_entrada_2 || turnoActual?.hora_entrada_2;
            const hS2 = dataToUpdate.hora_salida_2 || turnoActual?.hora_salida_2;
            dataToUpdate.duracion_horas = calcularDuracion(hEntrada, hSalida, hE2, hS2);
        }

        const turnoActualizado = await prisma.turno.update({
            where: { id_turno: Number(id) },
            data: dataToUpdate
        });

        const respuesta = {
            ...turnoActualizado,
            hora_entrada: formatearSalida(turnoActualizado.hora_entrada),
            hora_salida: formatearSalida(turnoActualizado.hora_salida),
            hora_entrada_2: formatearSalida(turnoActualizado.hora_entrada_2),
            hora_salida_2: formatearSalida(turnoActualizado.hora_salida_2),
        };

        res.json({ success: true, data: respuesta });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteTurno = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.turno.delete({
            where: { id_turno: Number(id) }
        });
        res.json({ success: true, message: 'Turno eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al eliminar turno' });
    }
};

export const asignarTurno = async (req: Request, res: Response) => {
    try {
        const { id_empleado, fecha, id_turno, id_area, id_usuario_registro } = req.body;

        const fechaDate = new Date(fecha);

        const laborMes = await prisma.laborMes.findFirst({
            where: {
                id_empleado: Number(id_empleado),
                fecha_inicio: { lte: fechaDate },
                fecha_fin: { gte: fechaDate },
                estado: 'Abierto'
            }
        });

        if (!laborMes) {
            return res.status(400).json({ success: false, error: 'No existe periodo laboral abierto para esta fecha.' });
        }

        const asignacion = await prisma.detalleProgramacion.upsert({
            where: {
                uq_empleado_fecha: {
                    id_empleado: Number(id_empleado),
                    fecha: fechaDate
                }
            },
            update: {
                id_area: Number(id_area),
                id_turno: Number(id_turno),
                id_labor_mes: laborMes.id_labor_mes,
                updated_at: new Date(),
                tipo_dia: "Laborado",
                id_usuario_registro: id_usuario_registro ? Number(id_usuario_registro) : null,
                origen_registro: "Manual"
            },
            create: {
                id_empleado: Number(id_empleado),
                fecha: fechaDate,
                id_area: Number(id_area),
                id_turno: Number(id_turno),
                id_labor_mes: laborMes.id_labor_mes,
                tipo_dia: "Laborado",
                estado: "Activo",
                id_usuario_registro: id_usuario_registro ? Number(id_usuario_registro) : null,
                origen_registro: "Manual"
            }
        });

        res.json({ success: true, data: asignacion });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};