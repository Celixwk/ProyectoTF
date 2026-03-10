/**
 * Motor de cálculo de Recargos Laborales
 * 
 * Categorías según legislación colombiana:
 *  D   - Horas Diurnas en Domingo (dominical ordinario)
 *  F   - Horas Diurnas en Festivo
 *  RNO - Recargo Nocturno Ordinario  (horas nocturnas en día hábil)
 *  RNF - Recargo Nocturno Festivo    (horas nocturnas en domingo o festivo)
 *  HEOD - Horas Extra Ordinarias Diurnas
 *  HEON - Horas Extra Ordinarias Nocturnas
 *  HEFD - Horas Extra Festivas/Dominicales Diurnas
 *  HEFN - Horas Extra Festivas/Dominicales Nocturnas
 *  THL  - Total Horas Laboradas
 */

export interface DesgloseDia {
    thl: number;    // Total horas laboradas
    ord: number;    // Horas ordinarias diurnas (sin recargo)
    D: number;      // Dominicales diurnas
    F: number;      // Festivas diurnas (no domingo)
    RNO: number;    // Recargo Nocturno Ordinario
    RNF: number;    // Recargo Nocturno Festivo/Dominical
    HEOD: number;   // Horas Extra Ordinaria Diurna
    HEON: number;   // Horas Extra Ordinaria Nocturna
    HEFD: number;   // Horas Extra Festiva/Dominical Diurna
    HEFN: number;   // Horas Extra Festiva/Dominical Nocturna
}

export interface ParametrosCalculo {
    horaInicioNocturna: number; // hora militar: 21 = 9PM
    horaFinNocturna: number;    // siempre 6 (AM del día siguiente)
    maximoHorasExtras: number;  // límite de horas extras acumuladas en el periodo
}

export const PARAMETROS_DEFAULT: ParametrosCalculo = {
    horaInicioNocturna: 21,
    horaFinNocturna: 6,
    maximoHorasExtras: 48,
};

/**
 * Convierte "HH:MM" a minutos desde medianoche.
 */
function horaAMinutos(hora: string): number {
    const partes = hora.split(':');
    return parseInt(partes[0]) * 60 + parseInt(partes[1] || '0');
}

/**
 * Dados los minutos del inicio y fin de un turno (puede cruzar medianoche),
 * retorna la cantidad de minutos que caen dentro del rango nocturno.
 * 
 * Nocturno: [horaInicioNocturna*60, (horaFinNocturna+24)*60] → puede cruzar medianoche
 */
function minutosNocturnos(
    inicioMin: number,
    finMin: number,
    horaInicioNocturna: number,
    horaFinNocturna: number
): number {
    // Rango nocturno en minutos, donde el fin est·á en el "día siguiente"
    const nocturnoInicio = horaInicioNocturna * 60;       // ej: 21*60 = 1260
    const nocturnoFin = (horaFinNocturna + 24) * 60;   // ej: (6+24)*60 = 1800

    // Normalizamos el turno para manejar el cruce de medianoche:
    // Si fin <= inicio, es turno nocturno → fin += 24h
    const finNorm = finMin <= inicioMin ? finMin + 1440 : finMin;

    let totalNocturno = 0;

    // Segmento 1: desde inicio hasta la medianoche (si aplica)
    // Nocturno entre [nocturnoInicio..1440) y el turno en esa zona
    const seg1Inicio = Math.max(inicioMin, nocturnoInicio);
    const seg1Fin = Math.min(finNorm <= 1440 ? finNorm : 1440, 1440);
    if (seg1Inicio < seg1Fin) totalNocturno += seg1Fin - seg1Inicio;

    // Segmento 2: desde medianoche hasta horaFinNocturna (en términos del "día siguiente")
    const seg2Inicio = Math.max(inicioMin <= 1440 ? 1440 : inicioMin, 1440);
    const seg2Fin = Math.min(finNorm, nocturnoFin);
    if (seg2Inicio < seg2Fin) totalNocturno += seg2Fin - seg2Inicio;

    return Math.max(0, totalNocturno);
}

/**
 * Calcula el desglose de recargos para un único segmento horario turno.
 * Retorna las categorías en horas decimales.
 * 
 * @param horaEntrada  "HH:MM"
 * @param horaSalida   "HH:MM" (puede ser < horaEntrada si cruza medianoche)
 * @param esDominical  true si es domingo
 * @param esFestivo    true si es festivo (distinto a domingo, o puede solaparse)
 * @param horasExtrasAcumuladas  horas extras ya usadas en el periodo
 * @param parametros   Configuración del sistema
 */
function calcularSegmento(
    horaEntrada: string,
    horaSalida: string,
    esDominical: boolean,
    esFestivo: boolean,
    parametros: ParametrosCalculo
): DesgloseDia & { extrasGeneradas: number } {
    const resultado: DesgloseDia = {
        thl: 0, ord: 0,
        D: 0, F: 0,
        RNO: 0, RNF: 0,
        HEOD: 0, HEON: 0, HEFD: 0, HEFN: 0,
    };

    const inicioMin = horaAMinutos(horaEntrada);
    let finMin = horaAMinutos(horaSalida);

    // Si la hora de salida es menor o igual a la de entrada → turno que cruza medianoche
    if (finMin <= inicioMin) finMin += 1440;

    const totalMin = finMin - inicioMin;
    if (totalMin <= 0) return { ...resultado, extrasGeneradas: 0 };

    const totalHoras = totalMin / 60;
    resultado.thl = totalHoras;

    // Minutos nocturnos del segmento
    const noctMin = minutosNocturnos(
        inicioMin, finMin,
        parametros.horaInicioNocturna,
        parametros.horaFinNocturna
    );
    const noctHoras = noctMin / 60;
    const diurHoras = totalHoras - noctHoras;

    const esDomFest = esDominical || esFestivo;

    // Por el momento simplificamos: el motor detecta el recargo según tipo de día.
    // Las horas extras se calcularán en el nivel superior (periodo) comparando
    // horas acumuladas vs meta del periodo.

    if (esDomFest) {
        // Festivo / Dominical
        resultado.D = esDominical && !esFestivo ? diurHoras : 0;
        resultado.F = esFestivo ? diurHoras : 0;
        resultado.RNF = noctHoras;
    } else {
        // Día ordinario
        resultado.ord = diurHoras;
        resultado.RNO = noctHoras;
    }

    return { ...resultado, extrasGeneradas: 0 };
}

export interface TurnoParaCalculo {
    fecha: string;           // YYYY-MM-DD
    hora_entrada: string;    // HH:MM
    hora_salida: string;     // HH:MM
    hora_entrada_2?: string | null;
    hora_salida_2?: string | null;
    es_festivo: boolean;
    es_domingo: boolean;
    codigo_turno?: string;
    tipo_turno?: string;
}

/**
 * Dado un turno completo (incluyendo doble segmento), calcula el desglose de recargos.
 * horasExtrasDisponibles = espacio restante del cupo de extras del periodo.
 */
export function calcularDesgloseTurno(
    turno: TurnoParaCalculo,
    parametros: ParametrosCalculo = PARAMETROS_DEFAULT
): DesgloseDia {
    // Segmento 1 siempre presente
    const seg1 = calcularSegmento(
        turno.hora_entrada,
        turno.hora_salida,
        turno.es_domingo,
        turno.es_festivo,
        parametros
    );

    let desglose = { ...seg1 };

    // Segmento 2 (turnos partidos como T6: 08-12 & 14-18)
    if (turno.hora_entrada_2 && turno.hora_salida_2) {
        const seg2 = calcularSegmento(
            turno.hora_entrada_2,
            turno.hora_salida_2,
            turno.es_domingo,
            turno.es_festivo,
            parametros
        );

        desglose.thl += seg2.thl;
        desglose.ord += seg2.ord;
        desglose.D += seg2.D;
        desglose.F += seg2.F;
        desglose.RNO += seg2.RNO;
        desglose.RNF += seg2.RNF;
        desglose.HEOD += seg2.HEOD;
        desglose.HEON += seg2.HEON;
        desglose.HEFD += seg2.HEFD;
        desglose.HEFN += seg2.HEFN;
    }

    return desglose;
}

/**
 * Calcula el desglose completo de un periodo para un empleado.
 * Recibe la lista de turnos del empleado y retorna:
 *  - Un array de DesgloseDia (uno por turno) con campos para la tabla
 *  - Los totales acumulados
 * 
 * Las horas extras se distribuyen al final, comparando el total de horas
 * vs la meta del periodo (horas ordinarias) usando parametros.
 */
export interface FilaReporte extends DesgloseDia {
    fecha: string;
    diaSemana: string;
    codigoTurno: string;
    horario: string;
    esDescanso: boolean;
    esFestivo: boolean;
}

export interface ResultadoPeriodo {
    filas: FilaReporte[];
    totales: DesgloseDia;
}

const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function calcularPeriodo(
    turnos: TurnoParaCalculo[],
    metaHorasPeriodo: number,
    parametros: ParametrosCalculo = PARAMETROS_DEFAULT
): ResultadoPeriodo {
    let horasAcumuladas = 0;
    const filas: FilaReporte[] = [];

    const totales: DesgloseDia = {
        thl: 0, ord: 0,
        D: 0, F: 0,
        RNO: 0, RNF: 0,
        HEOD: 0, HEON: 0, HEFD: 0, HEFN: 0,
    };

    for (const turno of turnos) {
        // Turno de descanso → fila vacía
        if (!turno.hora_entrada || turno.tipo_turno === 'DESCANSO' || turno.codigo_turno === 'D') {
            const fecha = new Date(turno.fecha + 'T12:00:00');
            filas.push({
                fecha: turno.fecha,
                diaSemana: DIAS_ES[fecha.getDay()] || '?',
                codigoTurno: 'D',
                horario: 'Descansa',
                esDescanso: true,
                esFestivo: turno.es_festivo || turno.es_domingo,
                thl: 0, ord: 0, D: 0, F: 0,
                RNO: 0, RNF: 0, HEOD: 0, HEON: 0, HEFD: 0, HEFN: 0,
            });
            continue;
        }

        const desglose = calcularDesgloseTurno(turno, parametros);

        // Calcular horas extras: el excedente sobre la meta del periodo
        // Las extras se aplican sobre las horas ordinarias del turno
        const horasPrevias = horasAcumuladas;
        horasAcumuladas += desglose.thl;

        // Cuántas horas de este turno son "extra" (superan la meta del periodo)
        if (horasPrevias < metaHorasPeriodo && horasAcumuladas > metaHorasPeriodo) {
            // Este turno cruza el umbral; las que pasan de la meta son extras
            const extraEnTurno = horasAcumuladas - metaHorasPeriodo;
            // Distribuir: primero nocturnos, luego diurnos
            const extraNoct = Math.min(desglose.RNO + desglose.RNF, extraEnTurno);
            const extraDiur = extraEnTurno - extraNoct;

            if (turno.es_domingo || turno.es_festivo) {
                desglose.HEFN = Math.min(desglose.RNF, extraNoct);
                desglose.HEFD = extraDiur;
                desglose.RNF -= desglose.HEFN;
                desglose.D = Math.max(0, desglose.D - extraDiur);
                desglose.F = Math.max(0, desglose.F - extraDiur);
            } else {
                desglose.HEON = Math.min(desglose.RNO, extraNoct);
                desglose.HEOD = extraDiur;
                desglose.RNO -= desglose.HEON;
                desglose.ord = Math.max(0, desglose.ord - extraDiur);
            }
        } else if (horasPrevias >= metaHorasPeriodo) {
            // Todo este turno es extra
            const extraDiur = desglose.D + desglose.F + desglose.ord;

            if (turno.es_domingo || turno.es_festivo) {
                desglose.HEFN = Math.min(desglose.RNF, parametros.maximoHorasExtras);
                desglose.HEFD = extraDiur;
                desglose.RNF = 0; desglose.D = 0; desglose.F = 0;
            } else {
                desglose.HEON = Math.min(desglose.RNO, parametros.maximoHorasExtras);
                desglose.HEOD = extraDiur;
                desglose.RNO = 0; desglose.ord = 0;
            }
        }

        // Sumar a totales
        totales.thl += desglose.thl;
        totales.ord += desglose.ord;
        totales.D += desglose.D;
        totales.F += desglose.F;
        totales.RNO += desglose.RNO;
        totales.RNF += desglose.RNF;
        totales.HEOD += desglose.HEOD;
        totales.HEON += desglose.HEON;
        totales.HEFD += desglose.HEFD;
        totales.HEFN += desglose.HEFN;

        const fechaObj = new Date(turno.fecha + 'T12:00:00');
        const seg2 = turno.hora_entrada_2 && turno.hora_salida_2
            ? ` & ${turno.hora_entrada_2.slice(0, 5)} - ${turno.hora_salida_2.slice(0, 5)}`
            : '';

        filas.push({
            ...desglose,
            fecha: turno.fecha,
            diaSemana: DIAS_ES[fechaObj.getDay()] || '?',
            codigoTurno: turno.codigo_turno || '?',
            horario: `${turno.hora_entrada.slice(0, 5)} - ${turno.hora_salida.slice(0, 5)}${seg2}`,
            esDescanso: false,
            esFestivo: turno.es_festivo || turno.es_domingo,
        });
    }

    // Redondear totales
    (Object.keys(totales) as Array<keyof DesgloseDia>).forEach(k => {
        totales[k] = Math.round(totales[k] * 100) / 100;
    });

    return { filas, totales };
}

/** Formatea horas decimales a string legible: "4.0" → "4", "4.5" → "4.5" */
export function fmtH(h: number): string {
    if (h === 0) return '';
    return h % 1 === 0 ? h.toString() : h.toFixed(1);
}
