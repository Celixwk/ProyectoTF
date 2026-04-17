import { Request, Response } from 'express';
import { parametrizacionService } from '../services/parametrizacion.service';

export const parametrizacionController = {
    obtenerParametro: async (req: Request, res: Response): Promise<void> => {
        try {
            const { nombre } = req.params;
            const parametro = await parametrizacionService.obtenerParametro(nombre);
            res.json({ success: true, data: parametro });
        } catch (error) {
            console.error('Error al obtener parametro:', error);
            res.status(500).json({ success: false, error: 'Error interno del servidor' });
        }
    },

    upsertParametro: async (req: Request, res: Response): Promise<void> => {
        try {
            const { nombre } = req.params;
            const { horas_maximas, valor_texto, descripcion } = req.body;

            const parametro = await parametrizacionService.upsertParametro(
                nombre, 
                horas_maximas !== undefined ? Number(horas_maximas) : undefined, 
                valor_texto, 
                descripcion
            );
            res.json({ success: true, data: parametro });
        } catch (error) {
            console.error('Error al guardar parametro:', error);
            res.status(500).json({ success: false, error: 'Error al actualizar el parámetro' });
        }
    }
};
