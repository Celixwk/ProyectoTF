import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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

export const exportarRecargosPDF = ({ empleadoInfo, fechaInicio, fechaFin, filas, totales, COLS }: ExportarRecargosParams) => {
    const doc = new jsPDF('landscape', 'pt', 'a4');

    // ─── DATOS EMPLEADO ──────────────────────────────────────────────────────────
    const dInicio = format(new Date(fechaInicio + 'T12:00:00'), 'dd/MM/yyyy', { locale: es });
    const dFin = format(new Date(fechaFin + 'T12:00:00'), 'dd/MM/yyyy', { locale: es });

    autoTable(doc, {
        theme: 'grid',
        startY: 30,
        margin: { top: 30, left: 30, right: 30 },
        styles: { fontSize: 9, fontStyle: 'bold', textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
        body: [
            [
                { content: 'Cedula:', styles: { fillColor: [241, 245, 249], halign: 'left' } },
                { content: empleadoInfo?.cedula || '', styles: { fillColor: [226, 232, 240], halign: 'center' } },
                { content: 'Cargo:', styles: { fillColor: [241, 245, 249], halign: 'left' } },
                { content: empleadoInfo?.nombre_cargo || '', colSpan: 3, styles: { halign: 'center' } },
                { content: 'Edad:', styles: { fillColor: [241, 245, 249], halign: 'left' } },
                { content: '', styles: { halign: 'center' } },
                { content: 'Sexo:', styles: { fillColor: [241, 245, 249], halign: 'left' } },
                { content: '', styles: { halign: 'center' } },
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

    // ─── TABLA PRINCIPAL ────────────────────────────────────────────────────────
    const tableHeaders = [
        'Fecha', 'T', 'Horario',
        ...COLS.map(c => c.label),
        'VHE'
    ];

    const tableBody = filas.map(fila => {
        const esRojo = fila.diaSemana === 'Dom' || fila.esFestivo;
        const textoDia = `${fila.diaSemana.toLowerCase()} ${format(new Date(fila.fecha + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })}`;

        let rowData: any[] = [];
        rowData.push({ content: textoDia, styles: { textColor: esRojo ? [220, 38, 38] : [0, 0, 0] } });
        rowData.push({ content: fila.esDescanso ? 'D' : fila.codigoTurno, styles: { halign: 'center', textColor: (esRojo && fila.codigoTurno !== 'D') ? [220, 38, 38] : [0, 0, 0] } });
        rowData.push({ content: fila.esDescanso ? 'Descansa' : fila.horario, styles: { halign: 'center', textColor: fila.esDescanso ? [220, 38, 38] : [0, 0, 0] } });

        COLS.forEach(c => {
            const val = fila[c.key] as number;
            rowData.push({
                content: val > 0 ? fmtH(val) : '',
                styles: {
                    halign: 'center',
                    textColor: (esRojo && val > 0) ? [220, 38, 38] : [0, 0, 0]
                }
            });
        });

        rowData.push({ content: '-', styles: { halign: 'center' } });
        return rowData;
    });

    // Fila Totales
    const totalesRow = [
        { content: 'TOTAL', colSpan: 3, styles: { halign: 'right', fillColor: [241, 245, 249], fontStyle: 'bold' } },
        ...COLS.map(c => ({ content: totales[c.key] > 0 ? fmtH(totales[c.key]) : '', styles: { halign: 'center', fontStyle: 'bold' } })),
        { content: '', styles: { halign: 'center' } }
    ];

    // Fila conversiones D y F
    const convRow = [
        { content: '', colSpan: 3, styles: { halign: 'right', lineWidth: 0 } },
        ...COLS.map(c => {
            let textoInferior = "";
            const val = totales[c.key] as number;
            if ((c.key === 'D' || c.key === 'F') && val > 0) {
                textoInferior = (val / 8).toLocaleString('es-CO', { minimumFractionDigits: 2 });
            }
            return { content: textoInferior, styles: { halign: 'center', lineWidth: 0 } };
        }),
        { content: '', styles: { halign: 'center', lineWidth: 0 } }
    ];

    tableBody.push(totalesRow as any);
    tableBody.push(convRow as any);

    autoTable(doc, {
        theme: 'grid',
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [tableHeaders],
        body: tableBody,
        margin: { left: 30, right: 30 },
        styles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.5 },
        headStyles: { fillColor: [226, 232, 240], textColor: [0, 0, 0], halign: 'center' },
    });

    // ─── FIRMAS ──────────────────────────────────────────────────────────────────
    let renderY = (doc as any).lastAutoTable.finalY + 80;

    // Si la tabla llega muy al final, saltar pagina
    if (renderY > doc.internal.pageSize.height - 50) {
        doc.addPage();
        renderY = 80;
    }

    const pageWidth = doc.internal.pageSize.width;
    doc.setLineWidth(1);

    // Linea Coordinador
    doc.line(50, renderY, (pageWidth / 2) - 50, renderY);
    doc.text('Coordinador Operativo', 50, renderY + 12);

    // Linea Funcionario
    doc.line((pageWidth / 2) + 50, renderY, pageWidth - 50, renderY);
    doc.text('Funcionario', (pageWidth / 2) + 50, renderY + 12);

    doc.save(`Recargos_${empleadoInfo?.cedula}_${fechaInicio}_al_${fechaFin}.pdf`);
};

export const exportarRecargosExcel = ({ empleadoInfo, fechaInicio, fechaFin, filas, totales, COLS }: ExportarRecargosParams) => {
    const wb = XLSX.utils.book_new();

    const dInicio = format(new Date(fechaInicio + 'T12:00:00'), 'dd/MM/yyyy', { locale: es });
    const dFin = format(new Date(fechaFin + 'T12:00:00'), 'dd/MM/yyyy', { locale: es });

    // Armar data en Array de Arrays (AoA)
    const wsData: any[][] = [];

    // Fila 1
    wsData.push(['Cedula:', empleadoInfo?.cedula || '', 'Cargo:', empleadoInfo?.nombre_cargo || '', '', '', 'Edad:', '', 'Sexo:', '']);
    // Fila 2
    wsData.push(['Nombres y apellidos:', '', '', empleadoInfo?.nombre_completo || '', '', '', '', 'Salario', Number(empleadoInfo?.salario_base || 0).toLocaleString('es-CO'), '']);
    // Fila 3
    wsData.push(['Periodo desde:', '', dInicio, '', '', 'hasta:', '', dFin, '', '']);
    // Espacio en blanco
    wsData.push([]);

    // Cabeceras tabla
    const headers = ['Fecha', 'T', 'Horario', ...COLS.map(c => c.label), 'VHE'];
    wsData.push(headers);

    // Filas de datos
    filas.forEach(fila => {
        const textoDia = `${fila.diaSemana.toLowerCase()} ${format(new Date(fila.fecha + 'T12:00:00'), 'dd/MM/yyyy', { locale: es })}`;
        const t = fila.esDescanso ? 'D' : fila.codigoTurno;
        const hor = fila.esDescanso ? 'Descansa' : fila.horario;

        const row = [textoDia, t, hor];
        COLS.forEach(c => {
            const val = fila[c.key] as number;
            row.push(val > 0 ? val.toString() : ''); // Para Excel es mejor usar números o strings limpios sin formateo de string si es entero
        });
        row.push('-');
        wsData.push(row);
    });

    // Fila Totales
    const rowTot = ['TOTAL', '', ''];
    COLS.forEach(c => {
        const val = totales[c.key] as number;
        rowTot.push(val > 0 ? val.toString() : '');
    });
    rowTot.push('');
    wsData.push(rowTot);

    // Fila Conversiones
    const rowConv = ['', '', ''];
    COLS.forEach(c => {
        let textoInferior = "";
        const val = totales[c.key] as number;
        if ((c.key === 'D' || c.key === 'F') && val > 0) {
            textoInferior = (val / 8).toLocaleString('es-CO', { minimumFractionDigits: 2 });
        }
        rowConv.push(textoInferior);
    });
    rowConv.push('');
    wsData.push(rowConv);

    // Espacios
    wsData.push([]);
    wsData.push([]);
    wsData.push([]);
    wsData.push([]);

    // Fila Firmas
    wsData.push(['Coordinador Operativo', '', '', '', '', '', 'Funcionario']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Configuraciones opcionales (merge cells) para emular el encabezado
    ws['!merges'] = [
        // Cargo colSpan 3
        { s: { r: 0, c: 3 }, e: { r: 0, c: 5 } },
        // Nombres y apellidos colSpan 3
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
        // Nombres (valor) colSpan 4
        { s: { r: 1, c: 3 }, e: { r: 1, c: 6 } },
        // Salario (valor) colSpan 2
        { s: { r: 1, c: 8 }, e: { r: 1, c: 9 } },
        // Periodo desde colSpan 2
        { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
        // Fecha inicio colSpan 3
        { s: { r: 2, c: 2 }, e: { r: 2, c: 4 } },
        // hasta colSpan 2
        { s: { r: 2, c: 5 }, e: { r: 2, c: 6 } },
        // Fecha fin colSpan 3
        { s: { r: 2, c: 7 }, e: { r: 2, c: 9 } },

        // TOTAL colSpan 3
        { s: { r: wsData.length - 7, c: 0 }, e: { r: wsData.length - 7, c: 2 } }, // La fila de totales
        // Firmas
        { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 3 } },
        { s: { r: wsData.length - 1, c: 6 }, e: { r: wsData.length - 1, c: 9 } }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Recargos');
    XLSX.writeFile(wb, `Recargos_${empleadoInfo?.cedula}_${fechaInicio}_al_${fechaFin}.xlsx`);
};
