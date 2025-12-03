const {
  MINUTES_PER_DAY,
  MILLISECONDS_PER_DAY,
  MILLISECONDS_PER_MINUTE,
  HORAS_ORDINARIAS_POR_TURNO,
  NOCTURNO_SEGMENT,
  DOMINGO_DAY_INDEX,
} = require('../../utils/recargo.constants');

const formatDate = (value) => (value ? value.toISOString().split('T')[0] : null);

const horaAMinutos = (valor) => {
  if (!valor) return 0;
  const time = valor instanceof Date ? valor.toISOString().split('T')[1]?.slice(0, 5) : valor;
  const [horas, minutos] = time.split(':').map(Number);
  return horas * 60 + minutos;
};

const buildSegmento = ({
  codigo,
  horas,
  fecha,
  minutosDelDia,
  minutosIntervalo,
  esNocturno,
  esDomingo,
  esFestivo,
  esExtra,
}) => {
  if (!horas || horas <= 0) return null;

  const inicio = new Date(fecha.getTime() + minutosDelDia * MILLISECONDS_PER_MINUTE);
  const fin = new Date(inicio.getTime() + minutosIntervalo * MILLISECONDS_PER_MINUTE);

  return {
    codigo,
    horas: Math.round(horas * 1000) / 1000,
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    fecha: formatDate(fecha),
    esNocturno,
    esDomingo,
    esFestivo,
    esExtra,
  };
};

const calcularRecargosPorTurno = (turno, fechaStr, diasFestivosSet = new Set()) => {
  const resultado = {
    totales: {
      D: 0,
      F: 0,
      RNO: 0,
      RNF: 0,
      HEOD: 0,
      HEON: 0,
      HEFD: 0,
      HEFN: 0,
      THL: 0,
      horasNormales: 0,
    },
    segmentos: [],
  };

  if (!turno || !turno.codigo) {
    return resultado;
  }

  const fechaBase = new Date(`${fechaStr}T00:00:00Z`);
  const horaEntrada = horaAMinutos(turno.hora_entrada);
  const horaSalida = horaAMinutos(turno.hora_salida);

  let minutosTrabajados = 0;
  let cruzaMedianoche = false;

  if (horaSalida > horaEntrada) {
    minutosTrabajados = horaSalida - horaEntrada;
  } else {
    minutosTrabajados = MINUTES_PER_DAY - horaEntrada + horaSalida;
    cruzaMedianoche = true;
  }

  const horasTrabajadas = minutosTrabajados / 60;
  resultado.totales.THL = Math.round(horasTrabajadas * 10) / 10;

  const limiteHorasNormales = Math.min(HORAS_ORDINARIAS_POR_TURNO, horasTrabajadas);
  const inicioNocturno = NOCTURNO_SEGMENT.startMinutes;
  const finNocturno = NOCTURNO_SEGMENT.endMinutes;

  let minutosProcesados = 0;
  let horasNormalesProcesadas = 0;

  while (minutosProcesados < minutosTrabajados) {
    const minutosDesdeInicio = minutosProcesados;
    const minutosDelDia = (horaEntrada + minutosDesdeInicio) % MINUTES_PER_DAY;

    let fechaActual = new Date(fechaBase);
    if (cruzaMedianoche && minutosDelDia < horaEntrada) {
      fechaActual = new Date(fechaActual.getTime() + MILLISECONDS_PER_DAY);
    }

    const fechaActualStr = formatDate(fechaActual);
    const esDomingoActual = fechaActual.getUTCDay() === DOMINGO_DAY_INDEX;
    const esFestivoActual = diasFestivosSet.has(fechaActualStr);
    const esNocturno =
      minutosDelDia >= inicioNocturno || minutosDelDia < finNocturno;

    const minutosIntervalo = Math.min(60, minutosTrabajados - minutosProcesados);
    const horasIntervalo = minutosIntervalo / 60;

    const horasRestantesNormales = limiteHorasNormales - horasNormalesProcesadas;
    const esHoraNormal = horasRestantesNormales > 0;

    const pushSegmento = (codigo, horas, esExtra = false) => {
      if (!horas || horas <= 0) return;
      resultado.totales[codigo] = Math.round(
        (resultado.totales[codigo] + horas) * 10
      ) / 10;

      const segmento = buildSegmento({
        codigo,
        horas,
        fecha: fechaActual,
        minutosDelDia,
        minutosIntervalo,
        esNocturno,
        esDomingo: esDomingoActual,
        esFestivo: esFestivoActual,
        esExtra,
      });
      if (segmento) {
        resultado.segmentos.push(segmento);
      }
    };

    if (esHoraNormal) {
      const horasANormal = Math.min(horasIntervalo, horasRestantesNormales);

      if (esDomingoActual) {
        pushSegmento('D', horasANormal);
        if (esNocturno) pushSegmento('RNF', horasANormal);
      } else if (esFestivoActual) {
        pushSegmento('F', horasANormal);
        if (esNocturno) pushSegmento('RNF', horasANormal);
      } else {
        resultado.totales.horasNormales = Math.round(
          (resultado.totales.horasNormales + horasANormal) * 10
        ) / 10;
        if (esNocturno) pushSegmento('RNO', horasANormal);
      }

      horasNormalesProcesadas += horasANormal;
      const horasExtrasEnIntervalo = horasIntervalo - horasANormal;

      if (horasExtrasEnIntervalo > 0) {
        if (esDomingoActual || esFestivoActual) {
          if (esNocturno) {
            pushSegmento('HEFN', horasExtrasEnIntervalo, true);
          } else {
            pushSegmento('HEFD', horasExtrasEnIntervalo, true);
          }
        } else if (esNocturno) {
          pushSegmento('HEON', horasExtrasEnIntervalo, true);
        } else {
          pushSegmento('HEOD', horasExtrasEnIntervalo, true);
        }
      }
    } else {
      if (esDomingoActual || esFestivoActual) {
        if (esNocturno) {
          pushSegmento('HEFN', horasIntervalo, true);
        } else {
          pushSegmento('HEFD', horasIntervalo, true);
        }
      } else if (esNocturno) {
        pushSegmento('HEON', horasIntervalo, true);
      } else {
        pushSegmento('HEOD', horasIntervalo, true);
      }
    }

    minutosProcesados += minutosIntervalo;
  }

  return resultado;
};

module.exports = {
  calcularRecargosPorTurno,
  formatDate,
};

