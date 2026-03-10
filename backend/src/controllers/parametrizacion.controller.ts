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
            const { horas_maximas } = req.body;

            if (horas_maximas === undefined || isNaN(Number(horas_maximas))) {
                res.status(400).json({ success: false, error: 'El valor de horas_maximas es inválido o requerido' });
                return;
            }

            const parametro = await parametrizacionService.upsertParametro(nombre, Number(horas_maximas));
            res.json({ success: true, data: parametro });
        } catch (error) {
            console.error('Error al guardar parametro:', error);
            res.status(500).json({ success: false, error: 'Error al actualizar el parámetro' });
        }
    }
};
