import { Request, Response } from 'express';

export const calendarioController = {
    async listar(req: Request, res: Response) {
        try {
            const { anio, mes } = req.query;

            if (!anio || !mes) {
                return res.status(400).json({ success: false, error: 'Año y mes son requeridos' });
            }

            const year = Number(anio);
            const month = Number(mes);
            const daysInMonth = new Date(year, month, 0).getDate();
            const days = [];

            // Generar días del mes
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(year, month - 1, i);
                const dayOfWeek = date.getDay(); // 0 = Domingo

                days.push({
                    id_calendario: i, // ID temporal
                    fecha: date.toISOString().split('T')[0],
                    es_festivo: false, // Por ahora sin festivos
                    es_domingo: dayOfWeek === 0,
                    nombre_festivo: null,
                    tipo_festivo: null
                });
            }

            res.json({ success: true, data: days });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async obtenerFestivos(req: Request, res: Response) {
        try {
            // Retornar array vacío por ahora ya que no hay tabla de festivos
            res.json({ success: true, data: [] });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async crearFestivo(req: Request, res: Response) {
        try {
            // Mock response
            res.json({ success: true, message: 'Festivo creado' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
