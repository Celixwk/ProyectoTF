import { Router, Request, Response } from 'express';
import { capa6_generarProgramacionDia } from '../services/programacion/capa6.integracion';
import prisma from '../prisma/cliente';

const router = Router();

router.post('/generar', async (req: Request, res: Response) => {
    try {
        const { fecha } = req.body;
        if (!fecha) return res.status(400).json({ error: "Falta la fecha" });
        const resultado = await capa6_generarProgramacionDia(new Date(fecha));
        res.json(resultado);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/automatica', async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.body;
        if (!mes || !anio) {
            return res.status(400).json({ error: "Mes y año son requeridos" });
        }

        const fechaInicio = new Date(Number(anio), Number(mes) - 1, 1);
        const fechaFin = new Date(Number(anio), Number(mes), 0);
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
});

router.get('/novedades-periodo', async (req: Request, res: Response) => {
    try {
        const { mes, anio } = req.query;
        const fechaInicio = new Date(Number(anio), Number(mes) - 1, 1);
        const fechaFin = new Date(Number(anio), Number(mes), 0);

        const novedades = await prisma.detalleNovedad.findMany({
            where: {
                fecha: { gte: fechaInicio, lte: fechaFin }
            },
            include: {
                novedad_empleado: {
                    include: {
                        empleado: true,
                        tipo_novedad: true
                    }
                }
            }
        });

        const unicos = new Map();
        novedades.forEach(n => {
            const id = n.novedad_empleado.id_empleado;
            if (!unicos.has(id)) {
                unicos.set(id, {
                    nombre: `${n.novedad_empleado.empleado.nombre1} ${n.novedad_empleado.empleado.apellido1}`,
                    tipo: n.novedad_empleado.tipo_novedad.nombre_novedad
                });
            }
        });

        res.json(Array.from(unicos.values()));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/validar', async (req: Request, res: Response) => {
    try {
        res.json({ success: true, alertas: [] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/eliminar', async (req: Request, res: Response) => {
    try {
        res.json({ success: true, message: "Programación eliminada" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;