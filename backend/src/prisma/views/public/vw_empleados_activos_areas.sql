SELECT
  e.id_empleado,
  concat(
    e.nombre1,
    COALESCE((' ' :: text || (e.nombre2) :: text), '' :: text),
    ' ',
    e.apellido1,
    COALESCE((' ' :: text || (e.apellido2) :: text), '' :: text)
  ) AS nombre_completo,
  e.cedula,
  CASE
    WHEN (e.id_estado = 1) THEN TRUE
    ELSE false
  END AS estado,
  c.nombre_cargo,
  c.salario_base,
  COALESCE(
    array_agg(DISTINCT dp.id_area) FILTER (
      WHERE
        (dp.id_area IS NOT NULL)
    ),
    ARRAY [] :: integer []
  ) AS areas_permitidas,
  count(DISTINCT dp.id_area) AS cantidad_areas
FROM
  (
    (
      (
        empleado e
        JOIN cargo c ON ((e.id_cargo = c.id_cargo))
      )
      LEFT JOIN labor_mes lm ON ((e.id_empleado = lm.id_empleado))
    )
    LEFT JOIN detalle_programacion dp ON ((lm.id_labor_mes = dp.id_labor_mes))
  )
WHERE
  (e.id_estado = 1)
GROUP BY
  e.id_empleado,
  e.nombre1,
  e.nombre2,
  e.apellido1,
  e.apellido2,
  e.cedula,
  e.id_estado,
  c.nombre_cargo,
  c.salario_base;