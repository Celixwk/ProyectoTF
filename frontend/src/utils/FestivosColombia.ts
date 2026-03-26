export class FestivosColombia {
    /**
     * Calcula la fecha del Domingo de Pascua para un año dado usando el algoritmo de Computus (Meeus/Jones/Butcher).
     */
    static calcularPascua(anio: number): Date {
        const a = anio % 19;
        const b = Math.floor(anio / 100);
        const c = anio % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-index para JS Date
        const dia = ((h + l - 7 * m + 114) % 31) + 1;

        return new Date(anio, mes, dia);
    }

    /**
     * Mueve una fecha al siguiente Lunes (Ley Emiliani)
     */
    static moverALunes(fecha: Date): Date {
        const diaSemana = fecha.getDay();
        if (diaSemana !== 1) { // Si no es Lunes (1)
            const diasParaSumar = diaSemana === 0 ? 1 : 8 - diaSemana;
            fecha.setDate(fecha.getDate() + diasParaSumar);
        }
        return fecha;
    }

    static sumarDias(fecha: Date, dias: number): Date {
        const nuevaFecha = new Date(fecha);
        nuevaFecha.setDate(nuevaFecha.getDate() + dias);
        return nuevaFecha;
    }

    static obtenerFestivos(anio: number): Array<{ fecha: string; nombre: string }> {
        const pascua = this.calcularPascua(anio);
        const festivos: Array<{ fecha: string; nombre: string }> = [];

        // Función auxiliar para agregar formateando a YYYY-MM-DD local
        const agregar = (fechaObj: Date, nombre: string) => {
            // Ajuste para evitar problemas de Timezone, tomamos Año, Mes, Día
            const fIso = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth() + 1).padStart(2, '0')}-${String(fechaObj.getDate()).padStart(2, '0')}`;
            festivos.push({ fecha: fIso, nombre });
        };

        // 1. Festivos Fijos (No se mueven pase lo que pase)
        agregar(new Date(anio, 0, 1), 'Año Nuevo');
        agregar(new Date(anio, 4, 1), 'Día del Trabajo');
        agregar(new Date(anio, 6, 20), 'Día de la Independencia');
        agregar(new Date(anio, 7, 7), 'Batalla de Boyacá');
        agregar(new Date(anio, 11, 8), 'Día de la Inmaculada Concepción');
        agregar(new Date(anio, 11, 25), 'Navidad');

        // 2. Festivos que se mueven al Lunes (Ley Emiliani)
        agregar(this.moverALunes(new Date(anio, 0, 6)), 'Día de los Reyes Magos');
        agregar(this.moverALunes(new Date(anio, 2, 19)), 'Día de San José');
        agregar(this.moverALunes(new Date(anio, 5, 29)), 'San Pedro y San Pablo');
        agregar(this.moverALunes(new Date(anio, 7, 15)), 'La Asunción de la Virgen');
        agregar(this.moverALunes(new Date(anio, 9, 12)), 'Día de la Raza');
        agregar(this.moverALunes(new Date(anio, 10, 1)), 'Todos los Santos');
        agregar(this.moverALunes(new Date(anio, 10, 11)), 'Independencia de Cartagena');

        // 3. Festivos relativos a la Pascua (Jueves y Viernes Santo no se mueven al lunes)
        agregar(this.sumarDias(pascua, -3), 'Jueves Santo');
        agregar(this.sumarDias(pascua, -2), 'Viernes Santo');

        // 4. Festivos relativos a la Pascua que SI se mueven al Lunes
        agregar(this.moverALunes(this.sumarDias(pascua, 43)), 'Día de la Ascensión');
        agregar(this.moverALunes(this.sumarDias(pascua, 64)), 'Corpus Christi');
        agregar(this.moverALunes(this.sumarDias(pascua, 71)), 'Sagrado Corazón de Jesús');

        return festivos;
    }

    /**
     * Determina si una fecha específica (YYYY-MM-DD o Date) es festivo en Colombia
     */
    static esFestivo(fecha: string | Date): { esFestivo: boolean; nombre?: string } {
        const dateObj = typeof fecha === 'string' ? new Date(`${fecha}T12:00:00Z`) : fecha;
        const anio = dateObj.getFullYear();
        const fIso = `${anio}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        
        const festivosDelAnio = this.obtenerFestivos(anio);
        const festivoEncontrado = festivosDelAnio.find(f => f.fecha === fIso);

        if (festivoEncontrado) {
            return { esFestivo: true, nombre: festivoEncontrado.nombre };
        }
        return { esFestivo: false };
    }
}
