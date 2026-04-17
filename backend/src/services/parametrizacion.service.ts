import prisma from '../prisma/cliente';

export const parametrizacionService = {
    obtenerParametro: async (nombre_parametro: string) => {
        return prisma.parametrizacion.findUnique({
            where: { nombre_parametro }
        });
    },

    upsertParametro: async (nombre_parametro: string, horas_maximas?: number | null, valor_texto?: string | null, descripcion?: string) => {
        const updateData: any = { fecha_actualizacion: new Date() };
        if (horas_maximas !== undefined) updateData.horas_maximas = horas_maximas;
        if (valor_texto !== undefined) updateData.valor_texto = valor_texto;
        if (descripcion !== undefined) updateData.descripcion = descripcion;

        return prisma.parametrizacion.upsert({
            where: { nombre_parametro },
            update: updateData,
            create: {
                nombre_parametro,
                horas_maximas: horas_maximas ?? null,
                valor_texto: valor_texto ?? null,
                descripcion: descripcion || 'Parámetro del sistema',
                activo: true,
                fecha_actualizacion: new Date()
            }
        });
    }
};
