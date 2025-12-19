const {
  capa6_generarProgramacionDia,
  capa6_generarProgramacionRango,
  capa6_regenerarDia,
  capa6_guardarAsignaciones
} = require('../services/programacion/capa6.integracion');

/**
 * CONTROLADOR V2 PARA NUEVO SISTEMA DE PROGRAMACIÓN POR CAPAS
 * Este controlador es completamente independiente del anterior
 * NO modifica programacion.controller.js
 */

/**
 * Generar programación para un día específico
 * POST /api/v2/programacion/generar-dia
 */
const generarDia = async (req, res) => {
  try {
    const { fecha, opciones } = req.body;

    if (!fecha) {
      return res.status(400).json({
        error: 'La fecha es requerida'
      });
    }

    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      return res.status(400).json({
        error: 'La fecha proporcionada no es válida'
      });
    }

    const programacion = await capa6_generarProgramacionDia(fechaDate, opciones);

    res.json({
      mensaje: 'Programación generada exitosamente',
      programacion
    });
  } catch (error) {
    console.error('Error al generar programación del día:', error);
    res.status(500).json({
      error: 'Error al generar programación del día',
      detalles: error.message
    });
  }
};

/**
 * Generar programación para un rango de fechas
 * POST /api/v2/programacion/generar-rango
 */
const generarRango = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, opciones } = req.body;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        error: 'fecha_inicio y fecha_fin son requeridas'
      });
    }

    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return res.status(400).json({
        error: 'Las fechas proporcionadas no son válidas'
      });
    }

    if (fechaInicio > fechaFin) {
      return res.status(400).json({
        error: 'fecha_inicio debe ser anterior a fecha_fin'
      });
    }

    const programaciones = await capa6_generarProgramacionRango(
      fechaInicio,
      fechaFin,
      opciones
    );

    res.json({
      mensaje: 'Programación generada exitosamente',
      programaciones,
      total_dias: programaciones.length
    });
  } catch (error) {
    console.error('Error al generar programación del rango:', error);
    res.status(500).json({
      error: 'Error al generar programación del rango',
      detalles: error.message
    });
  }
};

/**
 * Regenerar programación para un día específico
 * POST /api/v2/programacion/regenerar-dia
 */
const regenerarDia = async (req, res) => {
  try {
    const { fecha, opciones } = req.body;

    if (!fecha) {
      return res.status(400).json({
        error: 'La fecha es requerida'
      });
    }

    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      return res.status(400).json({
        error: 'La fecha proporcionada no es válida'
      });
    }

    const programacion = await capa6_regenerarDia(fechaDate, opciones);

    res.json({
      mensaje: 'Programación regenerada exitosamente',
      programacion
    });
  } catch (error) {
    console.error('Error al regenerar programación del día:', error);
    res.status(500).json({
      error: 'Error al regenerar programación del día',
      detalles: error.message
    });
  }
};

/**
 * Obtener alertas para una fecha
 * GET /api/v2/programacion/alertas/:fecha
 */
const obtenerAlertas = async (req, res) => {
  try {
    const { fecha } = req.params;

    if (!fecha) {
      return res.status(400).json({
        error: 'La fecha es requerida'
      });
    }

    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      return res.status(400).json({
        error: 'La fecha proporcionada no es válida'
      });
    }

    // Generar programación para obtener alertas
    const programacion = await capa6_generarProgramacionDia(fechaDate);

    res.json({
      fecha: fechaDate,
      alertas: programacion.alertas,
      total_alertas: programacion.alertas.length,
      resumen: {
        errores: programacion.alertas.filter(a => a.tipo === 'error').length,
        advertencias: programacion.alertas.filter(a => a.tipo === 'advertencia').length,
        info: programacion.alertas.filter(a => a.tipo === 'info').length
      }
    });
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({
      error: 'Error al obtener alertas',
      detalles: error.message
    });
  }
};

/**
 * Preview de asignaciones sin guardar
 * GET /api/v2/programacion/preview/:fecha
 */
const preview = async (req, res) => {
  try {
    const { fecha } = req.params;
    const { opciones } = req.query;

    if (!fecha) {
      return res.status(400).json({
        error: 'La fecha es requerida'
      });
    }

    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) {
      return res.status(400).json({
        error: 'La fecha proporcionada no es válida'
      });
    }

    const opcionesParsed = opciones ? JSON.parse(opciones) : undefined;
    const programacion = await capa6_generarProgramacionDia(fechaDate, opcionesParsed);

    res.json({
      fecha: fechaDate,
      preview: true,
      programacion
    });
  } catch (error) {
    console.error('Error al generar preview:', error);
    res.status(500).json({
      error: 'Error al generar preview',
      detalles: error.message
    });
  }
};

/**
 * Guardar asignaciones en la base de datos
 * POST /api/v2/programacion/guardar
 */
const guardar = async (req, res) => {
  try {
    const { asignaciones } = req.body;

    if (!Array.isArray(asignaciones)) {
      return res.status(400).json({
        error: 'asignaciones debe ser un array'
      });
    }

    const resultado = await capa6_guardarAsignaciones(asignaciones);

    res.json({
      mensaje: 'Asignaciones guardadas exitosamente',
      resultado
    });
  } catch (error) {
    console.error('Error al guardar asignaciones:', error);
    res.status(500).json({
      error: 'Error al guardar asignaciones',
      detalles: error.message
    });
  }
};

module.exports = {
  generarDia,
  generarRango,
  regenerarDia,
  obtenerAlertas,
  preview,
  guardar
};



