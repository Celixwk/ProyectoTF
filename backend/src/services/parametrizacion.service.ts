import prisma from '../prisma/cliente';

export const parametrizacionService = {
    obtenerParametro: async (nombre_parametro: string) => {
        return prisma.parametrizacion.findUnique({
            where: { nombre_parametro }
        });
    },

    upsertParametro: async (nombre_parametro: string, horas_maximas: number) => {
        return prisma.parametrizacion.upsert({
            where: { nombre_parametro },
            update: {
                horas_maximas,
                fecha_actualizacion: new Date()
            },
            create: {
                nombre_parametro,
                horas_maximas,
                descripcion: 'Meta de horas configurables',
                activo: true,
                fecha_actualizacion: new Date()
            }
        });
    }
};
