import { Request, Response } from 'express';
import { FestivosColombia } from '../utils/FestivosColombia';
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
                
                // Formatear fecha para evitar problemas de TZ
                const fIso = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                const { esFestivo, nombre } = FestivosColombia.esFestivo(fIso);

                days.push({
                    id_calendario: i, // ID temporal
                    fecha: fIso,
                    es_festivo: esFestivo,
                    es_domingo: dayOfWeek === 0,
                    nombre_festivo: nombre || null,
                    tipo_festivo: esFestivo ? 'nacional' : null
                });
            }

            res.json({ success: true, data: days });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    async obtenerFestivos(req: Request, res: Response) {
        try {
            const { anio } = req.params;
            if (!anio) {
                return res.status(400).json({ success: false, error: 'Año es requerido' });
            }
            const festivos = FestivosColombia.obtenerFestivos(Number(anio));
            const data = festivos.map(f => ({
                fecha: f.fecha,
                es_festivo: true,
                nombre_festivo: f.nombre,
                tipo_festivo: 'nacional'
            }));
            res.json({ success: true, data });
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
