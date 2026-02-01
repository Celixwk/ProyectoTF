SELECT
  r.id_recargo,
  r.id_detalle_programacion,
  r.fecha_inicio,
  r.fecha_fin,
  r.total_horas,
  r.total_dinero,
  lm.id_empleado,
  concat(
    e.nombre1,
    COALESCE((' ' :: text || (e.nombre2) :: text), '' :: text),
    ' ',
    e.apellido1,
    COALESCE((' ' :: text || (e.apellido2) :: text), '' :: text)
  ) AS nombre_empleado,
  r.updated_at AS fecha_modificacion,
  r.created_at AS fecha_creacion
FROM
  (
    (
      (
        recargo r
        JOIN detalle_programacion dp ON (
          (
            r.id_detalle_programacion = dp.id_detalle_programacion
          )
        )
      )
      JOIN labor_mes lm ON ((dp.id_labor_mes = lm.id_labor_mes))
    )
    JOIN empleado e ON ((lm.id_empleado = e.id_empleado))
  )
WHERE
  (r.updated_at IS NOT NULL)
ORDER BY
  r.updated_at DESC;