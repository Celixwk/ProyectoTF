SELECT
  lm.id_labor_mes,
  lm.id_empleado,
  concat(
    e.nombre1,
    COALESCE((' ' :: text || (e.nombre2) :: text), '' :: text),
    ' ',
    e.apellido1,
    COALESCE((' ' :: text || (e.apellido2) :: text), '' :: text)
  ) AS nombre_empleado,
  lm.fecha_inicio,
  lm.fecha_fin,
  lm.horas_mes,
  lm.estado,
  lm.updated_at AS fecha_modificacion,
  lm.created_at AS fecha_creacion
FROM
  (
    labor_mes lm
    JOIN empleado e ON ((lm.id_empleado = e.id_empleado))
  )
WHERE
  (lm.updated_at IS NOT NULL)
ORDER BY
  lm.updated_at DESC;