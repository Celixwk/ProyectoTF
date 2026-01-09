import * as XLSX from 'xlsx';

export function buildProgramacionWorkbook(params: {
    areas: any[];
    turnos: any[];
    infoDias: { fechaISO: string; numero: number; nombreDia: string }[];
    programacion: any[];
    configAreasTurnos: Record<number, number[]>;
}) {
    const { areas, turnos, infoDias, programacion, configAreasTurnos } = params;
    const matrizRows: any[] = [];
    const header = ['Área', 'Turno', ...infoDias.map(d => d.fechaISO)];
    matrizRows.push(header);
    areas.filter(area => (configAreasTurnos[area.id_area] || []).length > 0).forEach(area => {
        const turnosIds = configAreasTurnos[area.id_area] || [];
        turnosIds.forEach(tId => {
            const turnoInfo = turnos.find(t => t.id_turno === tId);
            const row = [area.nombre_area, turnoInfo?.tipo_turno || `T${tId}`];
            infoDias.forEach(dia => {
                const asignados = programacion.filter((p: any) => Number(p.id_area) === area.id_area && Number(p.id_turno) === tId && p.fecha.split('T')[0] === dia.fechaISO);
                if (asignados.length === 0) {
                    row.push('');
                } else {
                    const nombres = asignados.map((a: any) => a.nombre_empleado || a.empleado?.nombre_completo || '').filter(Boolean);
                    row.push(nombres.join('\n'));
                }
            });
            matrizRows.push(row);
        });
    });
    const wsMatriz = XLSX.utils.aoa_to_sheet(matrizRows);
    const detalleRows: any[] = [];
    detalleRows.push(['Área', 'Turno', 'Fecha', 'Empleado', 'IdDetalle', 'Modificado']);
    programacion.forEach((p: any) => {
        const area = areas.find(a => a.id_area === Number(p.id_area));
        const turno = turnos.find(t => t.id_turno === Number(p.id_turno));
        detalleRows.push([
            area?.nombre_area || '',
            turno?.tipo_turno || `T${p.id_turno}`,
            p.fecha.split('T')[0],
            p.nombre_empleado || p.empleado?.nombre_completo || '',
            p.id_detalle_programacion || '',
            Boolean(p._modificado) || false
        ]);
    });
    const wsDetalle = XLSX.utils.aoa_to_sheet(detalleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsMatriz, 'Matriz');
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');
    const applyBoldToHeader = (ws: XLSX.WorkSheet) => {
        const ref = ws['!ref'];
        if (!ref) return;
        const range = XLSX.utils.decode_range(ref);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = ws[cellAddress].s || {};
            ws[cellAddress].s.font = { bold: true };
            ws[cellAddress].s.alignment = { vertical: 'center', horizontal: 'center' };
        }
    };
    applyBoldToHeader(wsMatriz);
    applyBoldToHeader(wsDetalle);
    const rangeD = wsDetalle['!ref'] ? XLSX.utils.decode_range(wsDetalle['!ref']) : null;
    if (rangeD) {
        for (let R = 1; R <= rangeD.e.r; ++R) {
            const modCell = XLSX.utils.encode_cell({ r: R, c: 5 });
            const cell = wsDetalle[modCell];
            const isMod = cell && (cell.v === true || cell.v === 'true' || cell.v === 'TRUE');
            if (isMod) {
                for (let C = rangeD.s.c; C <= rangeD.e.c; ++C) {
                    const addr = XLSX.utils.encode_cell({ r: R, c: C });
                    wsDetalle[addr] = wsDetalle[addr] || { t: 's', v: '' };
                    wsDetalle[addr].s = wsDetalle[addr].s || {};
                    wsDetalle[addr].s.fill = { fgColor: { rgb: 'FFF7E0' } };
                }
            }
        }
    }
    wsMatriz['!cols'] = header.map(() => ({ wch: 20 }));
    wsDetalle['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 10 }];
    return wb;
}
