-- =====================================================
-- VISTAS PARA EL SISTEMA DE NÓMINA
-- Basadas en el esquema actual de la base de datos
-- =====================================================

-- =====================================================
-- VISTA 1: vw_empleados_completos
-- Empleados con toda su información, cargo y estado
-- =====================================================
CREATE OR REPLACE VIEW vw_empleados_completos AS
SELECT 
    e.id_empleado,
    e.cedula,
    CONCAT(
        e.nombre1, 
        COALESCE(' ' || e.nombre2, ''), 
        ' ', 
        e.apellido1, 
        COALESCE(' ' || e.apellido2, '')
    ) AS nombre_completo,
    e.edad,
    e.sexo,
    e.vehiculo,
    CASE 
        WHEN e.id_estado = 1 THEN true 
        ELSE false 
    END AS estado,
    e.id_cargo,
    c.nombre_cargo,
    c.salario_base,
    -- Areas permitidas (si existe tabla de relación, sino null)
    NULL::integer[] AS areas_permitidas,
    e.created_at,
    e.updated_at
FROM empleado e
LEFT JOIN cargo c ON e.id_cargo = c.id_cargo;

-- =====================================================
-- VISTA 2: vw_turnos_asignados
-- Turnos asignados con información completa de empleado, turno y área
-- =====================================================
CREATE OR REPLACE VIEW vw_turnos_asignados AS
SELECT 
    dp.id_detalle_programacion AS id_detalle_turno,
    dp.fecha,
    TO_CHAR(dp.fecha, 'Day') AS dia_semana,
    CASE 
        WHEN EXTRACT(DOW FROM dp.fecha) = 0 THEN true 
        ELSE false 
    END AS es_domingo,
    false AS es_festivo, -- Se puede mejorar con tabla de calendario
    dp.id_turno,
    ('T' || dp.id_turno::text) AS codigo_turno,
    t.hora_entrada::text AS hora_entrada,
    t.hora_salida::text AS hora_salida,
    t.tipo_turno,
    dp.total_horas_laboradas AS thl,
    dp.id_area,
    COALESCE(a.nombre_area, 'Sin área') AS nombre_area,
    dp.id_labor_mes,
    lm.id_empleado,
    CONCAT(
        e.nombre1, 
        COALESCE(' ' || e.nombre2, ''), 
        ' ', 
        e.apellido1, 
        COALESCE(' ' || e.apellido2, '')
    ) AS nombre_completo,
    e.cedula,
    c.nombre_cargo,
    c.salario_base,
    dp.created_at,
    dp.updated_at
FROM detalle_programacion dp
INNER JOIN labor_mes lm ON dp.id_labor_mes = lm.id_labor_mes
INNER JOIN empleado e ON lm.id_empleado = e.id_empleado
INNER JOIN cargo c ON e.id_cargo = c.id_cargo
LEFT JOIN turno t ON dp.id_turno = t.id_turno
LEFT JOIN area a ON dp.id_area = a.id_area;

-- =====================================================
-- VISTA 3: vw_novedades_completas
-- Novedades con información completa de empleado, tipo y usuario
-- =====================================================
CREATE OR REPLACE VIEW vw_novedades_completas AS
SELECT 
    ne.id_novedad_empleado AS id_novedad_registro,
    ne.fecha_solicitud,
    ne.fecha_registro,
    ne.fecha_vencimiento,
    ne.etapa,
    ne.id_empleado,
    CONCAT(
        e.nombre1, 
        COALESCE(' ' || e.nombre2, ''), 
        ' ', 
        e.apellido1, 
        COALESCE(' ' || e.apellido2, '')
    ) AS empleado,
    e.cedula,
    c.nombre_cargo,
    ne.id_novedad_tipo,
    tn.codigo AS codigo_novedad,
    tn.nombre_novedad AS tipo,
    tn.afecta_pago,
    -- Detalle de novedad (primera fecha si existe)
    (SELECT MIN(dn.fecha) FROM detalle_novedad dn WHERE dn.id_novedad_empleado = ne.id_novedad_empleado) AS fecha_inicio,
    (SELECT SUM(dn.cantidad) FROM detalle_novedad dn WHERE dn.id_novedad_empleado = ne.id_novedad_empleado) AS cantidad,
    (SELECT STRING_AGG(dn.observaciones, '; ') FROM detalle_novedad dn WHERE dn.id_novedad_empleado = ne.id_novedad_empleado) AS observaciones,
    COALESCE(u.nombre_completo, 'Sistema') AS usuario_registro,
    ne.created_at,
    ne.updated_at
FROM novedad_empleado ne
INNER JOIN empleado e ON ne.id_empleado = e.id_empleado
INNER JOIN cargo c ON e.id_cargo = c.id_cargo
INNER JOIN tipo_novedad tn ON ne.id_novedad_tipo = tn.id_novedad_tipo
LEFT JOIN usuario u ON ne.id_usuario = u.id_usuario;

-- =====================================================
-- VISTA 4: vw_recargos_completos
-- Recargos con información completa de empleado, turno y área
-- =====================================================
CREATE OR REPLACE VIEW vw_recargos_completos AS
SELECT 
    r.id_recargo,
    r.fecha_inicio,
    r.fecha_fin,
    r.total_horas,
    r.total_dinero,
    r.dominicales,
    r.festivos,
    r.rno,
    r.rnf,
    r.heon,
    r.hed AS heod,
    r.hefd,
    r.hefn,
    r.id_detalle_programacion AS id_detalle_turno,
    dp.fecha,
    COALESCE('T' || dp.id_turno::text, 'N/A') AS codigo_turno,
    COALESCE(t.hora_entrada::text, 'N/A') AS hora_entrada,
    COALESCE(t.hora_salida::text, 'N/A') AS hora_salida,
    COALESCE(a.nombre_area, 'Sin área') AS nombre_area,
    lm.id_empleado,
    CONCAT(
        e.nombre1, 
        COALESCE(' ' || e.nombre2, ''), 
        ' ', 
        e.apellido1, 
        COALESCE(' ' || e.apellido2, '')
    ) AS nombre_completo,
    e.cedula,
    c.salario_base,
    lm.id_labor_mes,
    r.created_at,
    r.updated_at
FROM recargo r
INNER JOIN detalle_programacion dp ON r.id_detalle_programacion = dp.id_detalle_programacion
INNER JOIN labor_mes lm ON dp.id_labor_mes = lm.id_labor_mes
INNER JOIN empleado e ON lm.id_empleado = e.id_empleado
INNER JOIN cargo c ON e.id_cargo = c.id_cargo
LEFT JOIN turno t ON dp.id_turno = t.id_turno
LEFT JOIN area a ON dp.id_area = a.id_area;

-- =====================================================
-- VISTA 5: vw_empleados_activos_areas
-- Empleados activos con sus áreas permitidas
-- =====================================================
CREATE OR REPLACE VIEW vw_empleados_activos_areas AS
SELECT 
    e.id_empleado,
    CONCAT(
        e.nombre1, 
        COALESCE(' ' || e.nombre2, ''), 
        ' ', 
        e.apellido1, 
        COALESCE(' ' || e.apellido2, '')
    ) AS nombre_completo,
    e.cedula,
    CASE 
        WHEN e.id_estado = 1 THEN true 
        ELSE false 
    END AS estado,
    c.nombre_cargo,
    c.salario_base,
    -- Areas permitidas (array de áreas únicas asignadas al empleado)
    COALESCE(
        ARRAY_AGG(DISTINCT dp.id_area) FILTER (WHERE dp.id_area IS NOT NULL),
        ARRAY[]::integer[]
    ) AS areas_permitidas,
    COUNT(DISTINCT dp.id_area) AS cantidad_areas
FROM empleado e
INNER JOIN cargo c ON e.id_cargo = c.id_cargo
LEFT JOIN labor_mes lm ON e.id_empleado = lm.id_empleado
LEFT JOIN detalle_programacion dp ON lm.id_labor_mes = dp.id_labor_mes
WHERE e.id_estado = 1
GROUP BY e.id_empleado, e.nombre1, e.nombre2, e.apellido1, e.apellido2, e.cedula, e.id_estado, c.nombre_cargo, c.salario_base;

-- =====================================================
-- VISTA 6: vw_resumen_labor_mes
-- Resumen mensual de trabajo por empleado
-- =====================================================
CREATE OR REPLACE VIEW vw_resumen_labor_mes AS
SELECT 
    lm.id_labor_mes,
    lm.fecha_inicio,
    lm.fecha_fin,
    TO_CHAR(lm.fecha_inicio, 'YYYY-MM') AS periodo,
    lm.id_empleado,
    CONCAT(
        e.nombre1, 
        COALESCE(' ' || e.nombre2, ''), 
        ' ', 
        e.apellido1, 
        COALESCE(' ' || e.apellido2, '')
    ) AS nombre_completo,
    e.cedula,
    c.nombre_cargo,
    c.salario_base,
    COALESCE(lm.horas_mes, 0) AS horas_ordinarias,
    COALESCE(
        (SELECT SUM(COALESCE(dp.total_horas_laboradas, 0))
         FROM detalle_programacion dp
         WHERE dp.id_labor_mes = lm.id_labor_mes),
        0
    ) AS total_horas,
    COALESCE(
        (SELECT SUM(COALESCE(r.total_dinero, 0))
         FROM recargo r
         INNER JOIN detalle_programacion dp ON r.id_detalle_programacion = dp.id_detalle_programacion
         WHERE dp.id_labor_mes = lm.id_labor_mes),
        0
    ) AS total_recargos,
    (SELECT COUNT(*) 
     FROM detalle_programacion dp
     WHERE dp.id_labor_mes = lm.id_labor_mes) AS total_turnos,
    COALESCE(
        (SELECT SUM(r.dominicales)
         FROM recargo r
         INNER JOIN detalle_programacion dp ON r.id_detalle_programacion = dp.id_detalle_programacion
         WHERE dp.id_labor_mes = lm.id_labor_mes),
        0
    ) AS total_dominicales,
    COALESCE(
        (SELECT SUM(r.festivos)
         FROM recargo r
         INNER JOIN detalle_programacion dp ON r.id_detalle_programacion = dp.id_detalle_programacion
         WHERE dp.id_labor_mes = lm.id_labor_mes),
        0
    ) AS total_festivos,
    lm.created_at,
    lm.updated_at
FROM labor_mes lm
INNER JOIN empleado e ON lm.id_empleado = e.id_empleado
INNER JOIN cargo c ON e.id_cargo = c.id_cargo;

-- =====================================================
-- VISTA 7: vw_auditoria_labor_mes
-- Historial de cambios en labor_mes (basado en updated_at)
-- =====================================================
CREATE OR REPLACE VIEW vw_auditoria_labor_mes AS
SELECT 
    lm.id_labor_mes,
    lm.id_empleado,
    CONCAT(
        e.nombre1, 
        COALESCE(' ' || e.nombre2, ''), 
        ' ', 
        e.apellido1, 
        COALESCE(' ' || e.apellido2, '')
    ) AS nombre_empleado,
    lm.fecha_inicio,
    lm.fecha_fin,
    lm.horas_mes,
    lm.estado,
    lm.updated_at AS fecha_modificacion,
    lm.created_at AS fecha_creacion
FROM labor_mes lm
INNER JOIN empleado e ON lm.id_empleado = e.id_empleado
WHERE lm.updated_at IS NOT NULL
ORDER BY lm.updated_at DESC;

-- =====================================================
-- VISTA 8: vw_auditoria_recargos
-- Historial de cambios en recargos
-- =====================================================
CREATE OR REPLACE VIEW vw_auditoria_recargos AS
SELECT 
    r.id_recargo,
    r.id_detalle_programacion,
    r.fecha_inicio,
    r.fecha_fin,
    r.total_horas,
    r.total_dinero,
    lm.id_empleado,
    CONCAT(
        e.nombre1, 
        COALESCE(' ' || e.nombre2, ''), 
        ' ', 
        e.apellido1, 
        COALESCE(' ' || e.apellido2, '')
    ) AS nombre_empleado,
    r.updated_at AS fecha_modificacion,
    r.created_at AS fecha_creacion
FROM recargo r
INNER JOIN detalle_programacion dp ON r.id_detalle_programacion = dp.id_detalle_programacion
INNER JOIN labor_mes lm ON dp.id_labor_mes = lm.id_labor_mes
INNER JOIN empleado e ON lm.id_empleado = e.id_empleado
WHERE r.updated_at IS NOT NULL
ORDER BY r.updated_at DESC;

-- =====================================================
-- VISTA 9: vw_auditoria_novedades
-- Historial de cambios en novedades
-- =====================================================
CREATE OR REPLACE VIEW vw_auditoria_novedades AS
SELECT 
    ne.id_novedad_empleado AS id_novedad_registro,
    ne.id_empleado,
    CONCAT(
        e.nombre1, 
        COALESCE(' ' || e.nombre2, ''), 
        ' ', 
        e.apellido1, 
        COALESCE(' ' || e.apellido2, '')
    ) AS nombre_empleado,
    ne.id_novedad_tipo,
    tn.nombre_novedad AS tipo_novedad,
    ne.fecha_solicitud,
    ne.fecha_registro,
    ne.etapa,
    ne.updated_at AS fecha_modificacion,
    ne.created_at AS fecha_creacion
FROM novedad_empleado ne
INNER JOIN empleado e ON ne.id_empleado = e.id_empleado
INNER JOIN tipo_novedad tn ON ne.id_novedad_tipo = tn.id_novedad_tipo
WHERE ne.updated_at IS NOT NULL
ORDER BY ne.updated_at DESC;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

