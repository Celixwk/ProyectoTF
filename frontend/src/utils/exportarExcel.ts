import ExcelJS from 'exceljs';

interface InfoDia {
  fechaISO: string;
  numero: number;
  nombreDia: string;
  esFestivo?: boolean;
}

// Paleta de colores Excel para cada tipo de novedad (ARGB, fondo claro)
const PALETA_NOVEDAD_BG = [
  'FFD1FAE5', // emerald-100
  'FFFE2626', // no — changed below
  'FFE0E7FF', // indigo-100
  'FFFEF9C3', // yellow-100
  'FFFCE7F3', // pink-100
  'FFF0FDF4', // green-50
  'FFFFF7ED', // orange-50
  'FFF0F9FF', // sky-50
];

const PALETA_NOVEDAD_FONT = [
  'FF065F46', // emerald-800
  'FF991B1B', // red-800
  'FF3730A3', // indigo-800
  'FF92400E', // amber-800
  'FF9D174D', // pink-800
  'FF166534', // green-800
  'FF9A3412', // orange-800
  'FF0C4A6E', // sky-900
];

export async function buildProgramacionWorkbook(params: {
  areas: any[];
  turnos: any[];
  infoDias: InfoDia[];
  programacion: any[];
  novedades?: any[];
  tiposNovedad?: any[];
}): Promise<ExcelJS.Workbook> {
  const { areas, turnos, infoDias, programacion, novedades = [], tiposNovedad = [] } = params;

  // Mapa: id_novedad_tipo → { codigo, index } para colores
  const tipoNovedadMap = new Map<number, { codigo: string; idx: number }>();
  tiposNovedad.forEach((t: any, idx: number) => {
    const codigo = t.codigo || t.nombre_novedad?.substring(0, 3).toUpperCase() || 'NOV';
    tipoNovedadMap.set(Number(t.id_novedad_tipo), { codigo, idx });
  });

  // Índice de novedades: "idEmpleado_fechaISO" → { codigo, idx }
  const novedadIndex = new Map<string, { codigo: string; idx: number }>();
  novedades.forEach((nov: any) => {
    const fecha = (nov.fecha || '').split('T')[0];
    const idEmp = Number(nov.id_empleado);
    if (!fecha || !idEmp) return;
    const tipo = tipoNovedadMap.get(Number(nov.id_novedad_tipo));
    if (tipo) {
      novedadIndex.set(`${idEmp}_${fecha}`, tipo);
    } else {
      // Fallback si no se resuelve el tipo
      const codigoDirecto = nov.codigo_novedad || 'NOV';
      novedadIndex.set(`${idEmp}_${fecha}`, { codigo: codigoDirecto, idx: 0 });
    }
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Nómina';
  wb.created = new Date();

  // ── Hoja principal ────────────────────────────────────────────────────────
  const ws = wb.addWorksheet('Programación', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  });

  ws.getColumn(1).width = 28;
  for (let c = 2; c <= infoDias.length + 1; c++) {
    ws.getColumn(c).width = 8;
  }

  // ── Encabezado ─────────────────────────────────────────────────────────────
  const headerRow = ws.addRow([
    'COLABORADOR',
    ...infoDias.map(d => `${d.nombreDia.substring(0, 3).toUpperCase()}\n${d.numero}`),
  ]);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNum) => {
    cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
    if (colNum === 1) {
      cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    }
  });

  infoDias.forEach((dia, idx) => {
    const cell = headerRow.getCell(idx + 2);
    const fecha = new Date(dia.fechaISO + 'T12:00:00');
    const esDomingo = fecha.getDay() === 0;
    const esSabado = fecha.getDay() === 6;
    if (esDomingo || dia.esFestivo) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } };
    } else if (esSabado) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    }
  });

  // ── Filas de empleados ─────────────────────────────────────────────────────
  const empleadoIds = new Set<number>();
  programacion.forEach((p: any) => empleadoIds.add(Number(p.id_empleado)));

  // También incluir empleados que solo tienen novedades (sin turno en ese rango)
  novedades.forEach((nov: any) => {
    if (nov.id_empleado) empleadoIds.add(Number(nov.id_empleado));
  });

  const turnosMap = new Map(turnos.map(t => [t.id_turno, t]));
  const areasMap = new Map(areas.map(a => [a.id_area, a.nombre_area]));

  // Obtener nombre del empleado (de programacion o novedades)
  const nombrePorEmp = new Map<number, string>();
  programacion.forEach((p: any) => {
    const id = Number(p.id_empleado);
    if (!nombrePorEmp.has(id)) {
      nombrePorEmp.set(id, p.nombre_empleado || p.empleado?.nombre_completo || `Emp ${id}`);
    }
  });
  novedades.forEach((nov: any) => {
    const id = Number(nov.id_empleado);
    if (!nombrePorEmp.has(id)) {
      const nombre = nov.nombre_completo || (nov.empleado ? `${nov.empleado.nombre1} ${nov.empleado.apellido1}` : `Emp ${id}`);
      nombrePorEmp.set(id, nombre);
    }
  });

  const empleadosList = Array.from(empleadoIds)
    .map(idEmp => ({
      idEmp,
      nombre: nombrePorEmp.get(idEmp) || `Emp ${idEmp}`,
      asigs: programacion.filter((p: any) => Number(p.id_empleado) === idEmp),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  for (const emp of empleadosList) {
    const rowData: (string | number)[] = [emp.nombre];
    infoDias.forEach(() => rowData.push(''));

    const empRow = ws.addRow(rowData);
    empRow.height = 25;

    empRow.getCell(1).font = { size: 8, bold: false };
    empRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    empRow.getCell(1).border = {
      bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };

    infoDias.forEach((dia, idx) => {
      const cell = empRow.getCell(idx + 2);
      const fecha = new Date(dia.fechaISO + 'T12:00:00');
      const esDomingo = fecha.getDay() === 0;
      const esSabado = fecha.getDay() === 6;
      const esFestivo = !!dia.esFestivo;

      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        right: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      };

      // ── Prioridad 1: novedad ────────────────────────────────────────────────
      const novedad = novedadIndex.get(`${emp.idEmp}_${dia.fechaISO}`);
      if (novedad) {
        const bgArgb = PALETA_NOVEDAD_BG[novedad.idx % PALETA_NOVEDAD_BG.length];
        const fontArgb = PALETA_NOVEDAD_FONT[novedad.idx % PALETA_NOVEDAD_FONT.length];
        cell.value = novedad.codigo;
        cell.font = { size: 8, bold: true, color: { argb: fontArgb } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        return;
      }

      // ── Prioridad 2: turno asignado ─────────────────────────────────────────
      const asig = emp.asigs.find((p: any) => p.fecha?.split('T')[0] === dia.fechaISO);

      if (!asig) {
        if (esDomingo || esFestivo) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { size: 7, bold: true, color: { argb: 'FFB91C1C' } };
        } else if (esSabado) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          cell.font = { size: 7, bold: true, color: { argb: 'FF94A3B8' } };
        }
        return;
      }

      const idTurno = Number(asig.id_turno);
      const idArea = Number(asig.id_area);

      if (!areasMap.has(idArea)) {
        if (esDomingo || esFestivo) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { size: 7, bold: true, color: { argb: 'FFB91C1C' } };
        } else if (esSabado) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          cell.font = { size: 7, bold: true, color: { argb: 'FF94A3B8' } };
        }
        return;
      }

      const turnoInfo = turnosMap.get(idTurno);
      const codigoTurno = turnoInfo?.tipo_turno || `T${idTurno}`;
      const nombreArea = areasMap.get(idArea)!;

      cell.value = `${codigoTurno}\n${nombreArea}`;
      cell.font = { size: 7, bold: true, color: { argb: 'FF1E293B' } };
    });
  }

  // ── Hoja Detalle ───────────────────────────────────────────────────────────
  const wsDetalle = wb.addWorksheet('Detalle');
  wsDetalle.addRow(['Área', 'Turno', 'Fecha', 'Empleado', 'IdDetalle', 'Modificado']);
  wsDetalle.getRow(1).font = { bold: true };

  programacion.forEach((p: any) => {
    const areaInfo = areas.find(a => a.id_area === Number(p.id_area));
    const turnoInfo = turnos.find(t => t.id_turno === Number(p.id_turno));
    wsDetalle.addRow([
      areaInfo?.nombre_area || '',
      turnoInfo?.tipo_turno || `T${p.id_turno}`,
      p.fecha?.split('T')[0] || '',
      p.nombre_empleado || p.empleado?.nombre_completo || '',
      p.id_detalle_programacion || '',
      Boolean(p._modificado),
    ]);
  });

  wsDetalle.columns = [
    { width: 30 }, { width: 10 }, { width: 12 }, { width: 30 }, { width: 12 }, { width: 12 },
  ];

  // ── Hoja Novedades ─────────────────────────────────────────────────────────
  if (novedades.length > 0) {
    const wsNov = wb.addWorksheet('Novedades');
    wsNov.addRow(['Empleado', 'Fecha', 'Tipo', 'Código']);
    wsNov.getRow(1).font = { bold: true };
    wsNov.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    wsNov.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const novedadesOrdenadas = [...novedades].sort((a: any, b: any) => {
      const nombreA = nombrePorEmp.get(Number(a.id_empleado)) || '';
      const nombreB = nombrePorEmp.get(Number(b.id_empleado)) || '';
      return nombreA.localeCompare(nombreB) || (a.fecha || '').localeCompare(b.fecha || '');
    });

    novedadesOrdenadas.forEach((nov: any) => {
      const nombre = nombrePorEmp.get(Number(nov.id_empleado)) || `Emp ${nov.id_empleado}`;
      const tipo = tipoNovedadMap.get(Number(nov.id_novedad_tipo));
      wsNov.addRow([
        nombre,
        (nov.fecha || '').split('T')[0],
        nov.tipo || nov.codigo_novedad || tipo?.codigo || 'NOV',
        tipo?.codigo || nov.codigo_novedad || '',
      ]);
    });

    wsNov.columns = [{ width: 30 }, { width: 12 }, { width: 20 }, { width: 8 }];
  }

  return wb;
}
