const prisma = require('../config/database');

/**
 * LISTAR CALENDARIO (festivos y domingos)
 */
const listarCalendario = async (req, res) => {
  try {
    const { anio, mes, es_festivo } = req.query;

    const where = {};

    // Filtrar por año y mes si se proporcionan
    if (anio) {
      const year = parseInt(anio);
      where.fecha = {
        gte: new Date(year, mes ? parseInt(mes) - 1 : 0, 1),
        lt: new Date(year, mes ? parseInt(mes) : 12, 1)
      };
    }

    // Filtrar solo festivos
    if (es_festivo === 'true') {
      where.es_festivo = true;
    }

    const calendario = await prisma.calendario.findMany({
      where,
      orderBy: {
        fecha: 'asc'
      }
    });

    // Si se solicita un mes específico, asegurar que TODOS los días del mes estén en la respuesta
    // (incluyendo domingos aunque no estén en BD)
    if (anio && mes) {
      const year = parseInt(anio);
      const month = parseInt(mes) - 1;
      const primerDia = new Date(year, month, 1);
      const ultimoDia = new Date(year, month + 1, 0);
      
      // Crear un mapa de fechas del calendario para búsqueda rápida
      const calendarioMap = new Map();
      calendario.forEach(c => {
        let fechaBD = '';
        
        if (c.fecha instanceof Date) {
          fechaBD = c.fecha.toISOString().split('T')[0];
        } else if (typeof c.fecha === 'string') {
          fechaBD = c.fecha.includes('T') ? c.fecha.split('T')[0] : c.fecha;
        } else if (c.fecha && c.fecha.toISOString) {
          fechaBD = c.fecha.toISOString().split('T')[0];
        }
        
        if (fechaBD && /^\d{4}-\d{2}-\d{2}$/.test(fechaBD)) {
          calendarioMap.set(fechaBD, c);
          
          // Log para festivos
          if (c.es_festivo) {
            console.log(`🎉 Festivo en calendario: ${fechaBD} - ${c.nombre_festivo || 'Sin nombre'}`);
          }
        }
      });
      
      // Generar todos los días del mes
      const todosLosDias = [];
      for (let d = new Date(primerDia); d <= ultimoDia; d.setDate(d.getDate() + 1)) {
        const fechaStr = d.toISOString().split('T')[0];
        const diaEnBD = calendarioMap.get(fechaStr);
        
        if (diaEnBD) {
          todosLosDias.push(diaEnBD);
        } else {
          // Si no está en BD, crear entrada con es_domingo calculado
          todosLosDias.push({
            fecha: new Date(d),
            es_festivo: false,
            es_domingo: d.getDay() === 0,
            nombre_festivo: null,
            tipo_festivo: null
          });
        }
      }
      
      console.log(`📅 Calendario: ${todosLosDias.length} días generados para ${year}-${month + 1} (${todosLosDias.filter(d => d.es_domingo || d.es_festivo).length} días especiales)`);
      return res.json(todosLosDias);
    }

    res.json(calendario);
  } catch (error) {
    console.error('Error al listar calendario:', error);
    res.status(500).json({ error: 'Error al listar calendario' });
  }
};

/**
 * OBTENER DÍA DEL CALENDARIO
 */
const obtenerDia = async (req, res) => {
  try {
    const { fecha } = req.params;

    const dia = await prisma.calendario.findUnique({
      where: { fecha: new Date(fecha) }
    });

    if (!dia) {
      // Si no existe, devolver un objeto con valores por defecto
      const fechaObj = new Date(fecha);
      return res.json({
        fecha: fechaObj,
        es_festivo: false,
        es_domingo: fechaObj.getDay() === 0,
        nombre_festivo: null,
        tipo_festivo: null
      });
    }

    res.json(dia);
  } catch (error) {
    console.error('Error al obtener día:', error);
    res.status(500).json({ error: 'Error al obtener día' });
  }
};

/**
 * CREAR/ACTUALIZAR DÍA FESTIVO
 */
const crearFestivo = async (req, res) => {
  try {
    const {
      fecha,
      nombre_festivo,
      tipo_festivo
    } = req.body;

    if (!fecha || !nombre_festivo) {
      return res.status(400).json({ 
        error: 'Fecha y nombre del festivo son requeridos' 
      });
    }

    const fechaObj = new Date(fecha);
    const es_domingo = fechaObj.getDay() === 0;

    // Upsert: crear o actualizar
    const festivo = await prisma.calendario.upsert({
      where: { fecha: fechaObj },
      update: {
        es_festivo: true,
        nombre_festivo,
        tipo_festivo: tipo_festivo || 'nacional'
      },
      create: {
        fecha: fechaObj,
        es_festivo: true,
        es_domingo,
        nombre_festivo,
        tipo_festivo: tipo_festivo || 'nacional'
      }
    });

    res.status(201).json({
      mensaje: 'Festivo registrado exitosamente',
      festivo
    });
  } catch (error) {
    console.error('Error al crear festivo:', error);
    res.status(500).json({ error: 'Error al crear festivo' });
  }
};

/**
 * ELIMINAR FESTIVO
 */
const eliminarFestivo = async (req, res) => {
  try {
    const { fecha } = req.params;

    await prisma.calendario.delete({
      where: { fecha: new Date(fecha) }
    });

    res.json({ mensaje: 'Festivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar festivo:', error);
    res.status(500).json({ error: 'Error al eliminar festivo' });
  }
};

/**
 * SINCRONIZAR DOMINGOS DEL AÑO
 */
const sincronizarDomingos = async (req, res) => {
  try {
    const { anio } = req.body;

    if (!anio) {
      return res.status(400).json({ 
        error: 'El año es requerido' 
      });
    }

    const year = parseInt(anio);
    const domingos = [];

    // Generar todos los domingos del año
    for (let mes = 0; mes < 12; mes++) {
      const primerDia = new Date(year, mes, 1);
      const ultimoDia = new Date(year, mes + 1, 0);

      for (let dia = primerDia; dia <= ultimoDia; dia.setDate(dia.getDate() + 1)) {
        if (dia.getDay() === 0) {
          domingos.push(new Date(dia));
        }
      }
    }

    // Insertar o actualizar domingos como festivos también
    for (const domingo of domingos) {
      await prisma.calendario.upsert({
        where: { fecha: domingo },
        update: { 
          es_domingo: true,
          es_festivo: true, // Marcar también como festivo
          nombre_festivo: 'Domingo',
          tipo_festivo: 'dominical'
        },
        create: {
          fecha: domingo,
          es_domingo: true,
          es_festivo: true, // Marcar también como festivo
          nombre_festivo: 'Domingo',
          tipo_festivo: 'dominical'
        }
      });
    }

    res.json({
      mensaje: `Sincronizados ${domingos.length} domingos del año ${year}`,
      cantidad: domingos.length
    });
  } catch (error) {
    console.error('Error al sincronizar domingos:', error);
    res.status(500).json({ error: 'Error al sincronizar domingos' });
  }
};

/**
 * OBTENER FESTIVOS DEL AÑO
 */
const obtenerFestivosAnio = async (req, res) => {
  try {
    const { anio } = req.params;
    const year = parseInt(anio);

    const festivos = await prisma.calendario.findMany({
      where: {
        es_festivo: true,
        fecha: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      },
      orderBy: {
        fecha: 'asc'
      }
    });

    res.json(festivos);
  } catch (error) {
    console.error('Error al obtener festivos del año:', error);
    res.status(500).json({ error: 'Error al obtener festivos del año' });
  }
};

module.exports = {
  listarCalendario,
  obtenerDia,
  crearFestivo,
  eliminarFestivo,
  sincronizarDomingos,
  obtenerFestivosAnio
};

