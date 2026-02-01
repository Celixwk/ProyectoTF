import { Request, Response } from 'express';
import { configuracionService } from '../services/programacion/configuracion.service';

export const configuracionController = {
    async obtenerConfiguracion(req: Request, res: Response) {
        try {
            const { mes, anio } = req.query;
            if (!mes || !anio) {
                return res.status(400).json({ error: 'Se requieren mes y anio' });
            }
            const result = await configuracionService.obtenerConfiguracionMes(Number(mes), Number(anio));
            res.json(result);
        } catch (error: any) {
            console.error('Error obtenerConfiguracion:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async actualizarMaximos(req: Request, res: Response) {
        try {
            const { configs } = req.body;
            if (!Array.isArray(configs)) {
                return res.status(400).json({ error: 'Formato incorrecto para configs' });
            }
            const result = await configuracionService.actualizarMaximosAreas(configs);
            res.json(result);
        } catch (error: any) {
            console.error('Error actualizarMaximos:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async guardarDescansos(req: Request, res: Response) {
        try {
            const { id_empleado, mes, anio, dias, observaciones } = req.body;
            if (!id_empleado || !mes || !anio || !dias) {
                return res.status(400).json({ error: 'Datos incompletos' });
            }
            const result = await configuracionService.guardarDescansos(
                Number(id_empleado),
                Number(mes),
                Number(anio),
                dias,
                observaciones
            );
            res.json(result);
        } catch (error: any) {
            console.error('Error guardarDescansos:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async obtenerDescansoEmpleado(req: Request, res: Response) {
        try {
            const { id_empleado, mes, anio } = req.query;
            if (!id_empleado || !mes || !anio) {
                return res.status(400).json({ error: 'Datos incompletos' });
            }
            const result = await configuracionService.obtenerDescansoEmpleado(
                Number(id_empleado),
                Number(mes),
                Number(anio)
            );
            res.json(result);
        } catch (error: any) {
            console.error('Error obtenerDescansoEmpleado:', error);
            res.status(500).json({ error: error.message });
        }
    },

    async obtenerMaestros(req: Request, res: Response) {
        try {
            const data = await configuracionService.obtenerMaestrosConfiguracion();
            res.json({
                success: true,
                data: data
            });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};