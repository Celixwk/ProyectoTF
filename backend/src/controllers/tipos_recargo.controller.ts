import { Request, Response } from 'express';
import prisma from '../prisma/cliente';

export const tiposRecargoController = {
    // Obtener todos los tipos de recargo
    async listar(req: Request, res: Response) {
        try {
            const tipos = await prisma.tipoRecargo.findMany({
                orderBy: { nombre_recargo: 'asc' },
            });
            res.status(200).json({ success: true, data: tipos });
        } catch (error: any) {
            console.error('Error al listar tipos de recargo:', error);
            res.status(500).json({ success: false, error: 'Error al listar tipos de recargo' });
        }
    },

    // Crear un nuevo tipo de recargo
    async crear(req: Request, res: Response) {
        try {
            const { codigo, nombre_recargo, porcentaje_recargo, descripcion, activo } = req.body;

            if (!codigo || !nombre_recargo || porcentaje_recargo === undefined) {
                return res.status(400).json({ success: false, error: 'Faltan campos requeridos (código, nombre_recargo, porcentaje_recargo)' });
            }

            // Validar si el código ya existe
            const existente = await prisma.tipoRecargo.findUnique({
                where: { codigo }
            });

            if (existente) {
                return res.status(400).json({ success: false, error: 'Ya existe un tipo de recargo con este código.' });
            }

            const nuevoTipo = await prisma.tipoRecargo.create({
                data: {
                    codigo,
                    nombre_recargo,
                    porcentaje_recargo: Number(porcentaje_recargo),
                    descripcion,
                    activo: activo !== undefined ? activo : true
                }
            });

            res.status(201).json({ success: true, data: nuevoTipo });
        } catch (error: any) {
            console.error('Error al crear tipo de recargo:', error);
            res.status(500).json({ success: false, error: 'Error al crear tipo de recargo' });
        }
    },

    // Actualizar un tipo de recargo existente
    async actualizar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { codigo, nombre_recargo, porcentaje_recargo, descripcion, activo } = req.body;

            const tipoExistente = await prisma.tipoRecargo.findUnique({
                where: { id_recargo_tipo: Number(id) }
            });

            if (!tipoExistente) {
                return res.status(404).json({ success: false, error: 'Tipo de recargo no encontrado' });
            }

            // Si cambian el código, asegurar que no choque con otro existente
            if (codigo && codigo !== tipoExistente.codigo) {
                const codigoDuplicado = await prisma.tipoRecargo.findUnique({
                    where: { codigo }
                });
                if (codigoDuplicado) {
                    return res.status(400).json({ success: false, error: 'Ya existe otro tipo de recargo con este código.' });
                }
            }

            const tipoActualizado = await prisma.tipoRecargo.update({
                where: { id_recargo_tipo: Number(id) },
                data: {
                    codigo: codigo || tipoExistente.codigo,
                    nombre_recargo: nombre_recargo || tipoExistente.nombre_recargo,
                    porcentaje_recargo: porcentaje_recargo !== undefined ? Number(porcentaje_recargo) : tipoExistente.porcentaje_recargo,
                    descripcion: descripcion !== undefined ? descripcion : tipoExistente.descripcion,
                    activo: activo !== undefined ? activo : tipoExistente.activo
                }
            });

            res.status(200).json({ success: true, data: tipoActualizado });
        } catch (error: any) {
            console.error('Error al actualizar tipo de recargo:', error);
            res.status(500).json({ success: false, error: 'Error al actualizar tipo de recargo' });
        }
    },

    // Eliminar un tipo de recargo
    async eliminar(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const tipoExistente = await prisma.tipoRecargo.findUnique({
                where: { id_recargo_tipo: Number(id) }
            });

            if (!tipoExistente) {
                return res.status(404).json({ success: false, error: 'Tipo de recargo no encontrado' });
            }

            // Se podría hacer un borrado físico, pero por seguridad, si está atado a recargos,
            // se recomienda un borrado lógico o que Prisma falle si hay restricciones (o eliminar).
            // Aquí eliminamos físicamente. Si falla por on delete restrict, el try-catch lo atrapará.
            await prisma.tipoRecargo.delete({
                where: { id_recargo_tipo: Number(id) }
            });

            res.status(200).json({ success: true, message: 'Tipo de recargo eliminado correctamente' });
        } catch (error: any) {
            console.error('Error al eliminar tipo de recargo:', error);
            if (error.code === 'P2003') {
                return res.status(400).json({ success: false, error: 'No se puede eliminar el tipo de recargo porque tiene recargos asociados.' });
            }
            res.status(500).json({ success: false, error: 'Error al eliminar tipo de recargo' });
        }
    }
};
