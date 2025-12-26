import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { areasService } from '@/services/api.service';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { Area } from '@/types/api.types';

// Función auxiliar para formatear fecha a YYYY-MM-DD sin problemas de zona horaria
const formatearFechaISO = (fecha: Date): string => {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
};

// Función para generar fechas desde una fecha de inicio hasta una fecha de fin
const generarFechas = (fechaInicioStr: string, fechaFinStr: string) => {
    // Parsear fechas correctamente (YYYY-MM-DD)
    const [añoInicio, mesInicio, diaInicio] = fechaInicioStr.split('-').map(Number);
    const [añoFin, mesFin, diaFin] = fechaFinStr.split('-').map(Number);
    
    const fechaInicio = new Date(añoInicio, mesInicio - 1, diaInicio);
    const fechaFin = new Date(añoFin, mesFin - 1, diaFin);
    
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const fechas = [];
    const fechaActual = new Date(fechaInicio);
    
    while (fechaActual <= fechaFin) {
        const dia = fechaActual.getDate();
        const mes = fechaActual.getMonth();
        const año = fechaActual.getFullYear();
        const fechaISO = formatearFechaISO(fechaActual);
        
        fechas.push({
            fecha: fechaISO, // Formato YYYY-MM-DD
            diaSemana: diasSemana[fechaActual.getDay()],
            dia: dia,
            mes: meses[mes],
            año: año,
            fechaCompleta: `${diasSemana[fechaActual.getDay()]} - ${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${año}`
        });
        
        fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    return fechas;
};

// Función para obtener la fecha inicial por defecto (lunes 8 de diciembre)
const obtenerFechaInicioDefault = (): string => {
    const añoActual = new Date().getFullYear();
    const fechaInicio = new Date(añoActual, 11, 8); // Diciembre es mes 11 (0-indexed)
    
    // Ajustar al lunes más cercano
    const diaSemana = fechaInicio.getDay();
    const ajuste = diaSemana === 0 ? -6 : -(diaSemana - 1);
    fechaInicio.setDate(fechaInicio.getDate() + ajuste);
    
    return formatearFechaISO(fechaInicio);
};

// Función para obtener la fecha fin por defecto (15 días después)
const obtenerFechaFinDefault = (): string => {
    const fechaInicioStr = obtenerFechaInicioDefault();
    const [año, mes, dia] = fechaInicioStr.split('-').map(Number);
    const fechaInicio = new Date(año, mes - 1, dia);
    fechaInicio.setDate(fechaInicio.getDate() + 14); // 15 días total (incluyendo el día inicial)
    return formatearFechaISO(fechaInicio);
};

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

// Componente para el contenido de programación (reutilizable para cada pestaña)
function ContenidoProgramacion({ 
    areaId, 
    areaNombre,
    fechaInicio,
    fechaFin,
    onFechaInicioChange,
    onFechaFinChange
}: { 
    areaId: number;
    areaNombre: string;
    fechaInicio: string;
    fechaFin: string;
    onFechaInicioChange: (fecha: string) => void;
    onFechaFinChange: (fecha: string) => void;
}) {
    const fechas = useMemo(() => {
        if (!fechaInicio || !fechaFin) return [];
        return generarFechas(fechaInicio, fechaFin);
    }, [fechaInicio, fechaFin]);

    const handleCrearProgramacion = () => {
        if (!fechaInicio || !fechaFin) {
            toast.error('Por favor selecciona un rango de fechas');
            return;
        }
        
        // Parsear fechas sin problemas de zona horaria
        const [añoInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
        const [añoFin, mesFin, diaFin] = fechaFin.split('-').map(Number);
        const fechaInicioDate = new Date(añoInicio, mesInicio - 1, diaInicio);
        const fechaFinDate = new Date(añoFin, mesFin - 1, diaFin);
        
        if (fechaInicioDate > fechaFinDate) {
            toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }
        
        const diasDiferencia = Math.ceil((fechaFinDate.getTime() - fechaInicioDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        toast.success(
            `Creando programación para ${areaNombre} desde ${formatearFechaDDMMYYYY(fechaInicio)} hasta ${formatearFechaDDMMYYYY(fechaFin)} (${diasDiferencia} días)...`
        );
        // Aquí se implementará la lógica para crear la programación
    };

    const formatearFechaDDMMYYYY = (fechaStr: string): string => {
        if (!fechaStr) return '';
        // Parsear fecha correctamente (YYYY-MM-DD) y convertir a DD/MM/YYYY
        // Usar split directo para evitar problemas de zona horaria
        const partes = fechaStr.split('-');
        if (partes.length !== 3) return fechaStr;
        const [año, mes, dia] = partes.map(Number);
        return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${año}`;
    };

    // Convertir DD/MM/YYYY a YYYY-MM-DD
    const convertirDDMMYYYYaYYYYMMDD = (fechaDDMMYYYY: string): string => {
        if (!fechaDDMMYYYY) return '';
        const partes = fechaDDMMYYYY.split('/');
        if (partes.length !== 3) return '';
        const [dia, mes, año] = partes.map(Number);
        if (isNaN(dia) || isNaN(mes) || isNaN(año)) return '';
        return `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    };

    // Validar formato DD/MM/YYYY
    const validarFormatoFecha = (fecha: string): boolean => {
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!regex.test(fecha)) return false;
        const [, dia, mes, año] = fecha.match(regex)!;
        const diaNum = parseInt(dia);
        const mesNum = parseInt(mes);
        const añoNum = parseInt(año);
        
        if (mesNum < 1 || mesNum > 12) return false;
        if (diaNum < 1 || diaNum > 31) return false;
        if (añoNum < 1900 || añoNum > 2100) return false;
        
        // Validar días del mes
        const diasEnMes = new Date(añoNum, mesNum, 0).getDate();
        return diaNum <= diasEnMes;
    };

    // Manejar cambio de fecha en formato DD/MM/YYYY
    const handleFechaInicioChangeDDMM = (valor: string) => {
        // Permitir borrar
        if (valor === '') {
            onFechaInicioChange('');
            return;
        }
        
        // Aplicar máscara automática
        let valorLimpio = valor.replace(/\D/g, '');
        if (valorLimpio.length > 8) valorLimpio = valorLimpio.substring(0, 8);
        
        let valorFormateado = '';
        if (valorLimpio.length > 0) {
            valorFormateado = valorLimpio.substring(0, 2);
            if (valorLimpio.length > 2) {
                valorFormateado += '/' + valorLimpio.substring(2, 4);
            }
            if (valorLimpio.length > 4) {
                valorFormateado += '/' + valorLimpio.substring(4, 8);
            }
        }
        
        // Si tiene formato completo y es válido, convertir a YYYY-MM-DD
        if (valorFormateado.length === 10 && validarFormatoFecha(valorFormateado)) {
            const fechaISO = convertirDDMMYYYYaYYYYMMDD(valorFormateado);
            onFechaInicioChange(fechaISO);
        }
    };

    const handleFechaFinChangeDDMM = (valor: string) => {
        // Permitir borrar
        if (valor === '') {
            onFechaFinChange('');
            return;
        }
        
        // Aplicar máscara automática
        let valorLimpio = valor.replace(/\D/g, '');
        if (valorLimpio.length > 8) valorLimpio = valorLimpio.substring(0, 8);
        
        let valorFormateado = '';
        if (valorLimpio.length > 0) {
            valorFormateado = valorLimpio.substring(0, 2);
            if (valorLimpio.length > 2) {
                valorFormateado += '/' + valorLimpio.substring(2, 4);
            }
            if (valorLimpio.length > 4) {
                valorFormateado += '/' + valorLimpio.substring(4, 8);
            }
        }
        
        // Si tiene formato completo y es válido, convertir a YYYY-MM-DD
        if (valorFormateado.length === 10 && validarFormatoFecha(valorFormateado)) {
            const fechaISO = convertirDDMMYYYYaYYYYMMDD(valorFormateado);
            onFechaFinChange(fechaISO);
        }
    };

    return (
        <div className="space-y-4">
            {/* Selector de Rango de Fechas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Rango de Fechas para Programación
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor={`fecha-inicio-${areaId}`}>Fecha de Inicio (DD/MM/YYYY)</Label>
                            <Input
                                id={`fecha-inicio-${areaId}`}
                                type="text"
                                placeholder="DD/MM/YYYY"
                                value={fechaInicio ? formatearFechaDDMMYYYY(fechaInicio) : ''}
                                onChange={(e) => handleFechaInicioChangeDDMM(e.target.value)}
                                maxLength={10}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`fecha-fin-${areaId}`}>Fecha de Fin (DD/MM/YYYY)</Label>
                            <Input
                                id={`fecha-fin-${areaId}`}
                                type="text"
                                placeholder="DD/MM/YYYY"
                                value={fechaFin ? formatearFechaDDMMYYYY(fechaFin) : ''}
                                onChange={(e) => handleFechaFinChangeDDMM(e.target.value)}
                                maxLength={10}
                                className="w-full"
                            />
                        </div>
                        <div className="space-y-2">
                            <Button onClick={handleCrearProgramacion} className="w-full" size="default">
                                <Plus className="h-4 w-4 mr-2" />
                                Crear Programación
                            </Button>
                            {fechaInicio && fechaFin && (
                                <p className="text-xs text-muted-foreground text-center">
                                    {fechas.length} día{fechas.length !== 1 ? 's' : ''} de programación
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Programación */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Programación Semanal</CardTitle>
                </CardHeader>
                <CardContent>
                    {!fechaInicio || !fechaFin ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg font-medium mb-2">Selecciona un rango de fechas para ver la programación</p>
                            <p className="text-sm">Define las fechas de inicio y fin para generar la programación de esta área</p>
                        </div>
                    ) : fechas.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg font-medium">No hay fechas en el rango seleccionado</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                    {fechas.map((fechaInfo) => (
                        <div key={fechaInfo.fecha} className="border rounded-lg overflow-hidden">
                            {/* Encabezado del Día con Fecha */}
                            <div className="bg-muted p-3 border-b">
                                <h3 className="font-bold text-lg">{fechaInfo.fechaCompleta}</h3>
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
                                                <TableRow key={`${fechaInfo.fecha}-${turno.id}`}>
                                                    {/* Columna Turno */}
                                                    <TableCell className="font-medium border-r bg-muted/30 whitespace-nowrap">
                                                        {turno.nombre}
                                                    </TableCell>

                                                    {/* Celdas de empleados */}
                                                    {empleados.map((emp, idx) => (
                                                        <TableCell key={idx} className="border-r w-auto p-2 text-center">
                                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-600/20">
                                                                {emp}
                                                            </span>
                                                        </TableCell>
                                                    ))}

                                                    {/* Rellenar para mantener alineación visual */}
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProgramacionAreas() {
    const [activeTab, setActiveTab] = useState<string>('');
    // Estado para almacenar rangos de fechas por área
    const [rangosFechas, setRangosFechas] = useState<Record<number, { inicio: string; fin: string }>>({});

    // Obtener áreas
    const { data: areas, isLoading: areasLoading } = useQuery({
        queryKey: ['areas'],
        queryFn: () => areasService.listar(),
    });

    // Establecer la primera área como activa cuando se cargan las áreas
    useEffect(() => {
        if (areas && areas.length > 0 && !activeTab) {
            setActiveTab(areas[0].id_area.toString());
        }
    }, [areas, activeTab]);

    // Inicializar rangos de fechas por defecto para cada área
    useEffect(() => {
        if (areas && areas.length > 0) {
            setRangosFechas(prev => {
                const nuevosRangos: Record<number, { inicio: string; fin: string }> = {};
                areas.forEach((area: Area) => {
                    if (!prev[area.id_area]) {
                        nuevosRangos[area.id_area] = {
                            inicio: obtenerFechaInicioDefault(),
                            fin: obtenerFechaFinDefault()
                        };
                    }
                });
                if (Object.keys(nuevosRangos).length > 0) {
                    return { ...prev, ...nuevosRangos };
                }
                return prev;
            });
        }
    }, [areas]);

    const handleFechaInicioChange = (areaId: number, fecha: string) => {
        setRangosFechas(prev => ({
            ...prev,
            [areaId]: {
                ...prev[areaId],
                inicio: fecha
            }
        }));
    };

    const handleFechaFinChange = (areaId: number, fecha: string) => {
        setRangosFechas(prev => ({
            ...prev,
            [areaId]: {
                ...prev[areaId],
                fin: fecha
            }
        }));
    };

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

            {areasLoading ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-[400px] w-full" />
                        </div>
                    </CardContent>
                </Card>
            ) : areas && areas.length > 0 ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="w-full overflow-x-auto flex flex-wrap gap-1 h-auto p-1">
                        {areas.map((area: Area) => (
                            <TabsTrigger 
                                key={area.id_area} 
                                value={area.id_area.toString()}
                                className="whitespace-nowrap data-[state=active]:bg-[#2B62FF] data-[state=active]:text-white data-[state=active]:font-semibold"
                            >
                                {area.nombre_area}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {areas.map((area: Area) => {
                        const rango = rangosFechas[area.id_area] || {
                            inicio: obtenerFechaInicioDefault(),
                            fin: obtenerFechaFinDefault()
                        };
                        return (
                            <TabsContent key={area.id_area} value={area.id_area.toString()} className="space-y-4">
                                <ContenidoProgramacion 
                                    areaId={area.id_area}
                                    areaNombre={area.nombre_area}
                                    fechaInicio={rango.inicio}
                                    fechaFin={rango.fin}
                                    onFechaInicioChange={(fecha) => handleFechaInicioChange(area.id_area, fecha)}
                                    onFechaFinChange={(fecha) => handleFechaFinChange(area.id_area, fecha)}
                                />
                            </TabsContent>
                        );
                    })}
                </Tabs>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg font-medium">No hay áreas disponibles</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
