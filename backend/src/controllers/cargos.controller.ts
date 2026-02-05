import { Request, Response } from 'express';
import prisma from '../prisma/cliente';

export const cargosController = {
    obtenerCargos: async (req: Request, res: Response) => {
        try {
            const cargos = await prisma.cargo.findMany({
                orderBy: { nombre_cargo: 'asc' }
            });
            res.json({ success: true, data: cargos });
        } catch (error: any) {
            res.status(500).json({ success: false, data: [], error: error.message });
        }
    },

    crearCargo: async (req: Request, res: Response) => {
        try {
            const { nombre_cargo, salario_base, descripcion, estado } = req.body;
            const nuevoCargo = await prisma.cargo.create({
                data: {
                    nombre_cargo,
                    salario_base,
                    descripcion,
                    estado: estado || 'Activo'
                }
            });
            res.json({ success: true, data: nuevoCargo });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    actualizarCargo: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { nombre_cargo, salario_base, descripcion, estado } = req.body;
            const cargoActualizado = await prisma.cargo.update({
                where: { id_cargo: Number(id) },
                data: {
                    nombre_cargo,
                    salario_base,
                    descripcion,
                    estado
                }
            });
            res.json({ success: true, data: cargoActualizado });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    eliminarCargo: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await prisma.cargo.delete({
                where: { id_cargo: Number(id) }
            });
            res.json({ success: true, message: 'Cargo eliminado correctamente' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
