import prisma from '../../prisma/cliente';

export const configuracionService = {
    async actualizarMaximosAreas(configs: { id_area: number; max: number }[]) {
        const operaciones = configs.map(c =>
            prisma.area.update({
                where: { id_area: c.id_area },
                data: { max_trabajadores: c.max }
            })
        );
        return await prisma.$transaction(operaciones);
    },

    async guardarDescansos(id_empleado: number, mes: number, anio: number, dias: number[], obs?: string) {
        return await prisma.descanso.upsert({
            where: {
                id_empleado_mes_anio: { id_empleado, mes, anio }
            },
            update: { dias_descanso: dias, observaciones: obs },
            create: { id_empleado, mes, anio, dias_descanso: dias, observaciones: obs }
        });
    },

    async obtenerConfiguracionMes(mes: number, anio: number) {
        const areas = await prisma.area.findMany({
            select: {
                id_area: true,
                nombre_area: true,
                max_trabajadores: true
            }
        });

        const descansos = await prisma.descanso.findMany({
            where: { mes, anio },
            include: {
                empleado: {
                    select: {
                        nombre1: true,
                        apellido1: true,
                        cedula: true
                    }
                }
            }
        });

        return { areas, descansos };
    },

    async obtenerDescansoEmpleado(id_empleado: number, mes: number, anio: number) {
        return await prisma.descanso.findUnique({
            where: {
                id_empleado_mes_anio: { id_empleado, mes, anio }
            }
        });
    },

    async obtenerMaestrosConfiguracion() {
        const [empleados, areas, turnos] = await Promise.all([
            prisma.empleado.findMany({
                where: { id_estado: 1 },
                select: { id_empleado: true, nombre1: true, apellido1: true, cedula: true }
            }),
            prisma.area.findMany(),
            prisma.turno.findMany({ where: { estado: 'Activo' } })
        ]);
        return { empleados, areas, turnos };
    }
};