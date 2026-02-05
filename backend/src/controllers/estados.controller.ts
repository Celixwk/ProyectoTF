import { Request, Response } from 'express';
import prisma from '../prisma/cliente';

export const estadosController = {
    obtenerEstados: async (req: Request, res: Response) => {
        try {
            const estados = await prisma.estados_empleado.findMany({
                orderBy: { nombre_estado: 'asc' }
            });
            res.json({ success: true, data: estados });
        } catch (error: any) {
            res.status(500).json({ success: false, data: [], error: error.message });
        }
    },

    crearEstado: async (req: Request, res: Response) => {
        try {
            const { nombre_estado } = req.body;
            const nuevoEstado = await prisma.estados_empleado.create({
                data: { nombre_estado }
            });
            res.json({ success: true, data: nuevoEstado });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    actualizarEstado: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { nombre_estado } = req.body;
            const estadoActualizado = await prisma.estados_empleado.update({
                where: { id_estado: Number(id) },
                data: { nombre_estado }
            });
            res.json({ success: true, data: estadoActualizado });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    eliminarEstado: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            // Verificar si hay empleados usándolo
            const empleadosUsando = await prisma.empleado.count({
                where: { id_estado: Number(id) }
            });

            if (empleadosUsando > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar el estado porque hay empleados asignados a él.'
                });
            }

            await prisma.estados_empleado.delete({
                where: { id_estado: Number(id) }
            });
            res.json({ success: true, message: 'Estado eliminado correctamente' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
