import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Datos ficticios para la visualización
const diasSemana = [
    { id: 'lunes', nombre: 'Lunes' },
    { id: 'martes', nombre: 'Martes' },
    { id: 'miercoles', nombre: 'Miércoles' },
    { id: 'jueves', nombre: 'Jueves' },
    { id: 'viernes', nombre: 'Viernes' },
    { id: 'sabado', nombre: 'Sábado' },
    { id: 'domingo', nombre: 'Domingo' }
];

// Generar 10 turnos de ejemplo
const turnos = Array.from({ length: 10 }, (_, i) => ({
    id: `t${i + 1}`,
    nombre: `Turno ${i + 1}`
}));

// Generador de empleados aleatorios para demo
const obtenerEmpleadosTurno = () => {
    const empleadosBase = ['Jaime', 'Johan', 'Jean', 'Laura', 'Pancracio', 'María', 'Carlos', 'Ana', 'Pedro', 'Luisa', 'Sofia', 'Miguel', 'David'];
    // Seleccionar aleatoriamente 1-6 empleados para cada celda
    const cantidad = Math.floor(Math.random() * 6) + 1;
    const seleccionados = [];
    const copia = [...empleadosBase];

    for (let i = 0; i < cantidad; i++) {
        const idx = Math.floor(Math.random() * copia.length);
        seleccionados.push(copia[idx]);
        copia.splice(idx, 1);
    }
    return seleccionados;
};

export default function ProgramacionAreas() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Programación por Áreas</h2>
                    <p className="text-muted-foreground">
                        Visualización semanal de turnos y personal asignado.
                    </p>
                </div>
            </div>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Programación Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {diasSemana.map((dia) => (
                            <div key={dia.id} className="border rounded-lg overflow-hidden">
                                {/* Encabezado del Día */}
                                <div className="bg-muted p-3 border-b">
                                    <h3 className="font-bold text-lg">{dia.nombre}</h3>
                                </div>

                                {/* Tabla de Turnos para el Día */}
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[120px] bg-background font-bold border-r">Turno</TableHead>
                                                {/* Header general para empleados */}
                                                <TableHead colSpan={6} className="text-center bg-background font-bold px-4">Empleados Asignados</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {turnos.map((turno) => {
                                                const empleados = obtenerEmpleadosTurno();
                                                return (
                                                    <TableRow key={`${dia.id}-${turno.id}`}>
                                                        {/* Columna Turno */}
                                                        <TableCell className="font-medium border-r bg-muted/30 whitespace-nowrap">
                                                            {turno.nombre}
                                                        </TableCell>

                                                        {/* Celdas de empleados renderizadas como un grupo flexible o celdas individuales si el diseño lo permite.
                                                            El usuario pidió "en cada celda", lo que sugiere columnas separadas.
                                                            Para lograr "Turno | Ja | Jo | Je", necesitamos renderizar múltiples celdas.
                                                            Pero la cabecera es única. Haremos un truco: renderizar celdas y dejar que la cabecera abarque todo.
                                                        */}

                                                        {empleados.map((emp, idx) => (
                                                            <TableCell key={idx} className="border-r w-auto p-2 text-center">
                                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">
                                                                    {emp}
                                                                </span>
                                                            </TableCell>
                                                        ))}

                                                        {/* Rellenar para mantener alineación visual (opcional, pero se ve mejor) */}
                                                        {Array.from({ length: Math.max(0, 6 - empleados.length) }).map((_, idx) => (
                                                            <TableCell key={`empty-${idx}`} className="border-r w-auto"></TableCell>
                                                        ))}
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
