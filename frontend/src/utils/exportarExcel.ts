import ExcelJS from 'exceljs';

interface InfoDia {
  fechaISO: string;
  numero: number;
  nombreDia: string;
  esFestivo?: boolean;
}

export async function buildProgramacionWorkbook(params: {
  areas: any[];
  turnos: any[];
  infoDias: InfoDia[];
  programacion: any[];
}): Promise<ExcelJS.Workbook> {
  const { areas, turnos, infoDias, programacion } = params;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Nómina';
  wb.created = new Date();

  // ── Hoja principal: formato referencia ────────────────────────────────────
  const ws = wb.addWorksheet('Programación', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  });

  // Ancho fijo de la columna de colaborador
  ws.getColumn(1).width = 28;
  // Ancho de columnas de días
  for (let c = 2; c <= infoDias.length + 1; c++) {
    ws.getColumn(c).width = 8;
  }

  // ── FILA DE ENCABEZADO ────────────────────────────────────────────────────
  const headerRow = ws.addRow([
    'COLABORADOR',
    ...infoDias.map(d => {
      const nombreCorto = d.nombreDia.substring(0, 3).toUpperCase();
      return `${nombreCorto}\n${d.numero}`;
    }),
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

  // Resaltar columnas de fin de semana en el encabezado
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

  // ── EMPLEADOS (Lista Plana con Colores por Área) ─────────────────────────
  const empleadoIds = new Set<number>();
  programacion.forEach((p: any) => empleadoIds.add(Number(p.id_empleado)));

  const turnosMap = new Map(turnos.map(t => [t.id_turno, t]));
  const areasMap = new Map(areas.map(a => [a.id_area, a.nombre_area]));

  const empleadosList = Array.from(empleadoIds).map(idEmp => {
    const asigs = programacion.filter((p: any) => Number(p.id_empleado) === idEmp);
    const nombre = asigs[0]?.nombre_empleado || asigs[0]?.empleado?.nombre_completo || `Emp ${idEmp}`;
    return { idEmp, nombre, asigs };
  }).sort((a, b) => a.nombre.localeCompare(b.nombre));

  for (const emp of empleadosList) {
    const rowData: (string | number)[] = [emp.nombre];

    // Espacios vacíos para los días (se llenarán celda a celda)
    infoDias.forEach(() => rowData.push(''));

    const empRow = ws.addRow(rowData);
    empRow.height = 25; // Altura para salto de línea

    // Celda de nombre
    empRow.getCell(1).font = { size: 8, bold: false };
    empRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    empRow.getCell(1).border = {
      bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };

    // Celdas de días
    infoDias.forEach((dia, idx) => {
      const cell = empRow.getCell(idx + 2);
      const asig = emp.asigs.find((p: any) => p.fecha?.split('T')[0] === dia.fechaISO);
      
      const fecha = new Date(dia.fechaISO + 'T12:00:00');
      const esDomingo = fecha.getDay() === 0;
      const esSabado = fecha.getDay() === 6;
      const esFestivo = !!dia.esFestivo;

      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        right: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      };

      if (!asig) {
        // Día libre o sin turno
        if (esDomingo || esFestivo) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          cell.font = { size: 7, bold: true, color: { argb: 'FFB91C1C' } };
        } else if (esSabado) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          cell.font = { size: 7, bold: true, color: { argb: 'FF94A3B8' } };
        }
      } else {
        const idTurno = Number(asig.id_turno);
        const idArea = Number(asig.id_area);

        // Filtro Estricto: Si el área de este turno no está en el mapa de áreas a exportar, lo ocultamos
        if (!areasMap.has(idArea)) {
            if (esDomingo || esFestivo) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
              cell.font = { size: 7, bold: true, color: { argb: 'FFB91C1C' } };
            } else if (esSabado) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
              cell.font = { size: 7, bold: true, color: { argb: 'FF94A3B8' } };
            }
        } else {
            // Celda con turno y área
            const turnoInfo = turnosMap.get(idTurno);
            const codigoTurno = turnoInfo?.tipo_turno || `T${idTurno}`;
            const nombreArea = areasMap.get(idArea)!;
            
            cell.value = `${codigoTurno}\n${nombreArea}`;
            // Mantener fuente oscura sin fondo de color
            cell.font = { size: 7, bold: true, color: { argb: 'FF1E293B' } };
        }
      }
    });
  }

  // ── Hoja Detalle (mantener para auditoría) ────────────────────────────────
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

  return wb;
}
