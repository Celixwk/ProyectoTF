"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const capa2_disponibilidad_1 = require("../../../services/programacion/capa2.disponibilidad");
async function testReal() {
    const hoy = new Date(); // O una fecha donde sepas que hay novedades
    console.log(`🔍 Buscando en BD real para la fecha: ${hoy.toISOString()}`);
    try {
        const mapa = await (0, capa2_disponibilidad_1.capa2_obtenerNovedadesPorFecha)(hoy);
        console.log(`✅ Conexión exitosa. Novedades encontradas: ${mapa.size}`);
        for (const [id, nov] of mapa) {
            console.log(`ID: ${id} | Tipo: ${nov.tipo_novedad} | Código: ${nov.codigo}`);
        }
    }
    catch (error) {
        console.error("❌ Error conectando a la base de datos:", error);
    }
}
testReal();
