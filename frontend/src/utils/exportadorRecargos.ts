import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExportarRecargosParams {
    empleadoInfo: any;
    fechaInicio: string;
    fechaFin: string;
    filas: any[];
    totales: any;
    COLS: any[];
}

const fmtH = (val: number) => {
    if (val === 0) return '';
    if (Number.isInteger(val)) return val.toString();
    const hrs = Math.floor(val);
    const mins = Math.round((val - hrs) * 60);
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}`;
};

// ─── EXPORTAR PDF ──────────────────────────────────────────────────────────────
export const exportarRecargosPDF = ({ empleadoInfo, fechaInicio, fechaFin, filas, totales, COLS }: ExportarRecargosParams) => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const dInicio = format(new Date(fechaInicio + 'T12:00:00'), 'dd/MM/yyyy', { locale: es });
    const dFin = format(new Date(fechaFin + 'T12:00:00'), 'dd/MM/yyyy', { locale: es });

    // Márgenes compactos para maximizar espacio
    const margin = { top: 15, left: 20, right: 20, bottom: 15 };

    // ─── CABECERA EMPLEADO ────────────────────────────────────────────────────
    autoTable(doc, {
        theme: 'grid',
        startY: margin.top,
        margin: { left: margin.left, right: margin.right },
        styles: { fontSize: 8, fontStyle: 'bold', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.4, cellPadding: 2 },
        body: [
            [
                { content: 'Cedula:', styles: { fillColor: [241, 245, 249], halign: 'left' } },
                { content: empleadoInfo?.cedula || '', styles: { fillColor: [226, 232, 240], halign: 'center' } },
                { content: 'Cargo:', styles: { fillColor: [241, 245, 249], halign: 'left' } },
                { content: empleadoInfo?.nombre_cargo || '', colSpan: 3, styles: { halign: 'center' } },
                { content: 'Edad:', styles: { fillColor: [241, 245, 249], halign: 'left' } },
                { content: String(empleadoInfo?.edad || '-'), styles: { halign: 'center' } },
                { content: 'Sexo:', styles: { fillColor: [241, 245, 249], halign: 'left' } },
                { content: String(empleadoInfo?.sexo || '-'), styles: { halign: 'center' } },
            ],
            [
                { content: 'Nombres y apellidos:', colSpan: 3, styles: { fillColor: [241, 245, 249], halign: 'left' } },
                { content: empleadoInfo?.nombre_completo || '', colSpan: 4, styles: { halign: 'center' } },
                { content: 'Salario', styles: { fillColor: [241, 245, 249], halign: 'right' } },
                { content: Number(empleadoInfo?.salario_base || 0).toLocaleString('es-CO'), colSpan: 2, styles: { halign: 'center' } },
            ],
            [
                { content: 'Periodo desde:', colSpan: 2, styles: { fillColor: [164, 212, 164], halign: 'left' } },
                { content: dInicio, colSpan: 3, styles: { fillColor: [255, 255, 255], halign: 'center' } },
                { content: 'hasta:', colSpan: 2, styles: { fillColor: [164, 212, 164], halign: 'center' } },
                { content: dFin, colSpan: 3, styles: { fillColor: [255, 255, 255], halign: 'center' } },
            ]
        ]
    });

    // ─── TABLA PRINCIPAL ──────────────────────────────────────────────────────
    const tableHeaders = ['Fecha', 'T', 'Horario', ...COLS.map(c => c.label), 'VHE'];

    const tableBody = filas.map(fila => {
        const esRojo = fila.diaSemana === 'Dom' || fila.esFestivo;
        const textoDia = `${fila.diaSemana.toLowerCase()} ${format(new Date(fila.fecha + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })}`;

        const rowData: any[] = [];
        rowData.push({ content: textoDia, styles: { textColor: esRojo ? [220, 38, 38] : [0, 0, 0] } });
        rowData.push({ content: fila.esDescanso ? 'D' : fila.codigoTurno, styles: { halign: 'center', textColor: (esRojo && fila.codigoTurno !== 'D') ? [220, 38, 38] : [0, 0, 0] } });
        rowData.push({ content: fila.esDescanso ? 'Descansa' : fila.horario, styles: { halign: 'center', textColor: fila.esDescanso ? [220, 38, 38] : [0, 0, 0] } });

        COLS.forEach(c => {
            const val = fila[c.key] as number;
            rowData.push({
                content: val > 0 ? fmtH(val) : '',
                styles: { halign: 'center', textColor: (esRojo && val > 0) ? [220, 38, 38] : [0, 0, 0] }
            });
        });

        rowData.push({ content: '-', styles: { halign: 'center' } });
        return rowData;
    });

    // Fila Totales
    const totalesRow = [
        { content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fillColor: [226, 232, 240], fontStyle: 'bold' } },
        ...COLS.map(c => ({ content: totales[c.key] > 0 ? fmtH(totales[c.key]) : '', styles: { halign: 'center', fontStyle: 'bold' } })),
        { content: '', styles: { halign: 'center' } }
    ];

    // Fila conversiones D y F
    const convRow = [
        { content: '', colSpan: 3, styles: { halign: 'right', lineWidth: 0 } },
        ...COLS.map(c => {
            const val = totales[c.key] as number;
            let textoInferior = '';
            if ((c.key === 'D' || c.key === 'F') && val > 0) {
                textoInferior = (val / 8).toLocaleString('es-CO', { minimumFractionDigits: 2 });
            }
            return { content: textoInferior, styles: { halign: 'center', lineWidth: 0 } };
        }),
        { content: '', styles: { halign: 'center', lineWidth: 0 } }
    ];

    tableBody.push(totalesRow as any);
    tableBody.push(convRow as any);

    // Reservar espacio para las firmas (~50pt)
    const firmasHeight = 50;
    const startYTable = (doc as any).lastAutoTable.finalY + 6;

    autoTable(doc, {
        theme: 'grid',
        startY: startYTable,
        head: [tableHeaders],
        body: tableBody,
        margin: { left: margin.left, right: margin.right, bottom: firmasHeight + margin.bottom },
        styles: { fontSize: 7.5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.4, cellPadding: 2 },
        headStyles: { fillColor: [226, 232, 240], textColor: [0, 0, 0], halign: 'center', fontStyle: 'bold' },
        // Evitar salto de página automático al final de la tabla principal
    });

    // ─── FIRMAS – siempre en la misma página, sin addPage() ───────────────────
    // Calcular posición Y de las firmas
    let firmasY = (doc as any).lastAutoTable.finalY + 20;

    // Si las firmas se salen de la página, las subimos un poco (no se agrega página)
    if (firmasY + 20 > pageHeight - margin.bottom) {
        firmasY = pageHeight - margin.bottom - 20;
    }

    doc.setLineWidth(0.8);
    doc.setFontSize(8);

    // Línea Coordinador
    doc.line(margin.left, firmasY, pageWidth / 2 - 40, firmasY);
    doc.text('Coordinador Operativo', margin.left, firmasY + 10);

    // Línea Funcionario
    doc.line(pageWidth / 2 + 40, firmasY, pageWidth - margin.right, firmasY);
    doc.text('Funcionario', pageWidth / 2 + 40, firmasY + 10);

    doc.save(`Recargos_${empleadoInfo?.cedula}_${fechaInicio}_al_${fechaFin}.pdf`);
};

// ─── EXPORTAR EXCEL (ExcelJS) ─────────────────────────────────────────────────
export const exportarRecargosExcel = async ({ empleadoInfo, fechaInicio, fechaFin, filas, totales, COLS }: ExportarRecargosParams) => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Sistema Nómina';
    const ws = wb.addWorksheet('Recargos', { views: [{ showGridLines: true }] });

    const dInicio = format(new Date(fechaInicio + 'T12:00:00'), 'dd/MM/yyyy', { locale: es });
    const dFin = format(new Date(fechaFin + 'T12:00:00'), 'dd/MM/yyyy', { locale: es });

    // Helpers de estilos
    const borderThin: ExcelJS.Borders = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
        diagonal: { style: 'thin', color: { argb: 'FF000000' } },
    };
    const fillGray = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
    const bold = (size = 9): Partial<ExcelJS.Font> => ({ bold: true, size, name: 'Calibri' });

    // Total de columnas = 3 (Fecha, T, Horario) + COLS.length + 1 (VHE) – solo para referencia

    // ─── CABECERA ─────────────────────────────────────────────────────────────
    // Fila 1: Cedula | cedula | Cargo | cargo (colSpan3) | _ | _ | Edad | edad | Sexo | sexo
    const row1 = ws.addRow([
        'Cedula:', empleadoInfo?.cedula || '',
        'Cargo:', empleadoInfo?.nombre_cargo || '', '', '',
        'Edad:', String(empleadoInfo?.edad || ''),
        'Sexo:', String(empleadoInfo?.sexo || '')
    ]);
    row1.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.border = borderThin;
        cell.font = bold(9);
        if ([1, 3, 7, 9].includes(colNum)) cell.fill = fillGray('FFF1F5F9');
        else if (colNum === 2) cell.fill = fillGray('FFE2E8F0');
        cell.alignment = { vertical: 'middle', horizontal: colNum % 2 === 0 ? 'center' : 'left' };
    });
    ws.mergeCells(`D1:F1`);

    // Fila 2: Nombres y apellidos | nombre (colSpan4) | Salario | salario (colSpan2)
    const row2 = ws.addRow([
        'Nombres y apellidos:', '', '',
        empleadoInfo?.nombre_completo || '', '', '', '',
        'Salario', Number(empleadoInfo?.salario_base || 0).toLocaleString('es-CO'), ''
    ]);
    ws.mergeCells('A2:C2');
    ws.mergeCells('D2:G2');
    ws.mergeCells('I2:J2');
    row2.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.border = borderThin;
        cell.font = bold(9);
        if ([1, 8].includes(colNum)) cell.fill = fillGray('FFF1F5F9');
        cell.alignment = { vertical: 'middle', horizontal: colNum === 1 ? 'left' : 'center' };
    });

    // Fila 3: Periodo desde | _ | dInicio (colSpan3) | hasta | _ | dFin (colSpan3)
    const row3 = ws.addRow([
        'Periodo desde:', '', dInicio, '', '',
        'hasta:', '', dFin, '', ''
    ]);
    ws.mergeCells('A3:B3');
    ws.mergeCells('C3:E3');
    ws.mergeCells('F3:G3');
    ws.mergeCells('H3:J3');
    row3.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.border = borderThin;
        cell.font = bold(9);
        if ([1, 6].includes(colNum)) cell.fill = fillGray('FFA4D4A4');
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Fila vacía
    ws.addRow([]);

    // ─── CABECERA TABLA ──────────────────────────────────────────────────────
    const headerRow = ws.addRow(['Fecha', 'T', 'Horario', ...COLS.map((c: any) => c.label), 'VHE']);
    headerRow.height = 18;
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = fillGray('FFE2E8F0');
        cell.font = bold(9);
        cell.border = borderThin;
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
    });

    // ─── FILAS DE DATOS ──────────────────────────────────────────────────────
    filas.forEach(fila => {
        const esRojo = fila.diaSemana === 'Dom' || fila.esFestivo;
        const textoDia = `${fila.diaSemana.toLowerCase()} ${format(new Date(fila.fecha + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })}`;
        const t = fila.esDescanso ? 'D' : fila.codigoTurno;
        const hor = fila.esDescanso ? 'Descansa' : fila.horario;
        const colVals = COLS.map((c: any) => {
            const val = fila[c.key] as number;
            return val > 0 ? fmtH(val) : '';
        });

        const dataRow = ws.addRow([textoDia, t, hor, ...colVals, '-']);
        dataRow.height = 14;

        dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
            cell.border = borderThin;
            cell.font = {
                name: 'Calibri', size: 9,
                bold: colNum === 1 && (t === 'D'),
                color: esRojo ? { argb: 'FFDC2626' } : { argb: 'FF1E293B' }
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: colNum <= 1 ? 'left' : 'center'
            };
        });
    });

    // ─── FILA TOTALES ─────────────────────────────────────────────────────────
    const totVals = COLS.map((c: any) => {
        const val = totales[c.key] as number;
        return val > 0 ? fmtH(val) : '';
    });
    const totRow = ws.addRow(['TOTAL', '', '', ...totVals, '']);
    ws.mergeCells(`A${totRow.number}:C${totRow.number}`);
    totRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = fillGray('FFF1F5F9');
        cell.font = bold(9);
        cell.border = borderThin;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    (totRow.getCell(1) as ExcelJS.Cell).alignment = { vertical: 'middle', horizontal: 'right' };

    // ─── FILA CONVERSIONES ────────────────────────────────────────────────────
    const convVals = COLS.map((c: any) => {
        const val = totales[c.key] as number;
        if ((c.key === 'D' || c.key === 'F') && val > 0) {
            return (val / 8).toLocaleString('es-CO', { minimumFractionDigits: 2 });
        }
        return '';
    });
    const convRow = ws.addRow(['', '', '', ...convVals, '']);
    convRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { name: 'Calibri', size: 9, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // ─── FIRMAS ───────────────────────────────────────────────────────────────
    ws.addRow([]);
    ws.addRow([]);
    ws.addRow([]);
    
    const firmaRow = ws.addRow(['Coordinador Operativo', '', '', '', '', '', 'Funcionario']);
    ws.mergeCells(`A${firmaRow.number}:D${firmaRow.number}`);
    ws.mergeCells(`G${firmaRow.number}:J${firmaRow.number}`);
    firmaRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = bold(9);
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // ─── ANCHOS DE COLUMNA ────────────────────────────────────────────────────
    ws.columns = [
        { width: 18 }, // Fecha
        { width: 5 },  // T
        { width: 18 }, // Horario
        ...COLS.map(() => ({ width: 7 })),
        { width: 6 },  // VHE
    ];

    // ─── DESCARGAR ─────────────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Recargos_${empleadoInfo?.cedula}_${fechaInicio}_al_${fechaFin}.xlsx`);
};
