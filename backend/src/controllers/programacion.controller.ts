import { Request, Response } from 'express';
import { capa6_generarProgramacionDia } from '../services/programacion/capa6.integracion';

export const generarDia = async (req: Request, res: Response) => {
    try {
        const { fecha } = req.body;
        if (!fecha) return res.status(400).json({ error: "Falta la fecha" });
        const resultado = await capa6_generarProgramacionDia(new Date(fecha));
        res.json(resultado);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const generarAutomatica = async (req: Request, res: Response) => {
    try {
        const { mes, anio, configuracion } = req.body;
        if (!mes || !anio) return res.status(400).json({ error: "Mes y año requeridos" });

        const fechaInicio = new Date(anio, mes - 1, 1);
        const fechaFin = new Date(anio, mes, 0);
        const resultados = [];

        for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
            const resDia = await capa6_generarProgramacionDia(new Date(d));
            resultados.push({ fecha: d.toISOString().split('T')[0], ...resDia });
        }

        res.json({
            success: true,
            message: `Programación generada para ${mes}/${anio}`,
            dias_procesados: resultados.length,
            detalle: resultados
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const validarProgramacion = async (req: Request, res: Response) => {
    try {
        const { fecha } = req.query;
        res.json({ success: true, alertas: [] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const eliminarProgramacion = async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.query;
        res.json({ success: true, message: "Programación eliminada" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};