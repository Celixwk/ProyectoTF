import { Request, Response } from 'express';
import prisma from '../prisma/cliente';

export const recargosController = {
  async guardarMasivo(req: Request, res: Response) {
    try {
      const { id_empleado, fecha_inicio, fecha_fin, filas } = req.body;

      if (!id_empleado || !fecha_inicio || !fecha_fin || !Array.isArray(filas)) {
        return res.status(400).json({ success: false, error: 'Datos incompletos o inválidos' });
      }

      // Convertir fechas a objetos Date considerando zona horaria UTC para coincidir con DB
      const [yI, mI, dI] = fecha_inicio.split('-').map(Number);
      const [yF, mF, dF] = fecha_fin.split('-').map(Number);

      const start = new Date(Date.UTC(yI, mI - 1, dI, 0, 0, 0));
      const end = new Date(Date.UTC(yF, mF - 1, dF, 23, 59, 59));

      // Mapeo interno para conocer los ID de TipoRecargo de la BD (asumiendo IDs estándar)
      // Se consulta en BDD para mapear códigos lógicos con los IDs reales
      const tiposRecargo = await prisma.tipoRecargo.findMany({
        where: { activo: true },
      });

      const mapTipos: Record<string, number> = {};

      tiposRecargo.forEach(t => {
        // Mapear basándose exactamente en el código (RNO, HED, D, etc.) de la Base de Datos
        if (t.codigo) {
          mapTipos[t.codigo] = t.id_recargo_tipo;
        }
      });


      await prisma.$transaction(async (tx) => {
        // 1. Eliminar recargos existentes en este periodo para este empleado
        // Para evitar duplicidad si el usuario vuelve a presionar "Guardar"
        const recargosExistentes = await tx.recargo.findMany({
          where: {
            detalle_programacion: {
              id_empleado: Number(id_empleado)
            },
            fecha_inicio: { gte: start },
            fecha_fin: { lte: end } // usamos la fecha de la fila como 'inicio' y 'fin' del recargo diario
          },
          select: { id_recargo: true }
        });

        if (recargosExistentes.length > 0) {
          const ids = recargosExistentes.map(r => r.id_recargo);
          await tx.detalleRecargo.deleteMany({ where: { id_recargo: { in: ids } } });
          await tx.recargo.deleteMany({ where: { id_recargo: { in: ids } } });
        }

        // 2. Insertar los nuevos recargos calculados
        for (const fila of filas) {
          if (!fila.fecha) continue;

          const [y, m, d] = fila.fecha.split('-').map(Number);
          const fechaFila = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
          const inicioDia = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
          const finDia = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));

          // Buscar el DetalleProgramacion de ese día
          const detProg = await tx.detalleProgramacion.findFirst({
            where: {
              id_empleado: Number(id_empleado),
              fecha: { gte: inicioDia, lte: finDia }
            }
          });

          if (!detProg) continue; // Si no estaba programado, no podemos vincular el recargo (según diagrama)

          // Crear cabecera Recargo
          const recargo = await tx.recargo.create({
            data: {
              id_detalle_programacion: detProg.id_detalle_programacion,
              fecha_inicio: fechaFila,  // Guardamos la misma fecha de la fila
              fecha_fin: fechaFila,
              total_horas: Number(fila.thl) || 0,
              total_diurno: Number(fila.ord) || 0,
              dominicales: Number(fila.D) > 0 ? 1 : 0, // En la BD está como SmallInt (0 o 1)
              festivos: Number(fila.F) > 0 ? 1 : 0,    // En la BD está como SmallInt (0 o 1)
              rno: Number(fila.RNO) || 0,
              rnf: Number(fila.RNF) || 0,
              hed: Number(fila.HEOD) || 0,
              heon: Number(fila.HEON) || 0,
              hefd: Number(fila.HEFD) || 0,
              hefn: Number(fila.HEFN) || 0,
              total_dinero: 0, // Se calculará después si el sistema de nómina lo requiere (o un trigger)
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          // Crear desgloses DetalleRecargo solo para los valores > 0
          const detallesAInsertar = [];

          const revisarYAgregar = (claveObj: string, siglaMapa: string) => {
            const valor = Number(fila[claveObj]) || 0;
            if (valor > 0 && mapTipos[siglaMapa]) {
              detallesAInsertar.push({
                id_recargo: recargo.id_recargo,
                id_recargo_tipo: mapTipos[siglaMapa],
                horas_registradas: valor,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
          };

          // Revisa los rubros que son horas
          revisarYAgregar('RNO', 'RNO');
          revisarYAgregar('RNF', 'RNF');
          revisarYAgregar('HEOD', 'HEOD');
          revisarYAgregar('HEON', 'HEON');
          revisarYAgregar('HEFD', 'HEFD');
          revisarYAgregar('HEFN', 'HEFN');
          // También se pueden agregar dominicales y festivos si en el catálogo se tratan como "horas" 
          // (actualmente en tu recargo.tsx guardamos "horas" de dominical D y F diurno)
          revisarYAgregar('D', 'D');
          revisarYAgregar('F', 'F');

          if (detallesAInsertar.length > 0) {
            await tx.detalleRecargo.createMany({
              data: detallesAInsertar
            });
          }
        }
      });

      res.status(200).json({ success: true, message: 'Recargos sincronizados y guardados correctamente' });
    } catch (error: any) {
      console.error('Error al guardar recargos masivos:', error);
      res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
    }
  }
};
