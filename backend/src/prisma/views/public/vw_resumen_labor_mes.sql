SELECT
  lm.id_labor_mes,
  lm.fecha_inicio,
  lm.fecha_fin,
  to_char(
    (lm.fecha_inicio) :: timestamp WITH time zone,
    'YYYY-MM' :: text
  ) AS periodo,
  lm.id_empleado,
  concat(
    e.nombre1,
    COALESCE((' ' :: text || (e.nombre2) :: text), '' :: text),
    ' ',
    e.apellido1,
    COALESCE((' ' :: text || (e.apellido2) :: text), '' :: text)
  ) AS nombre_completo,
  e.cedula,
  c.nombre_cargo,
  c.salario_base,
  COALESCE(lm.horas_mes, (0) :: numeric) AS horas_ordinarias,
  COALESCE(
    (
      SELECT
        sum(COALESCE(dp.total_horas_laboradas, (0) :: numeric)) AS sum
      FROM
        detalle_programacion dp
      WHERE
        (dp.id_labor_mes = lm.id_labor_mes)
    ),
    (0) :: numeric
  ) AS total_horas,
  COALESCE(
    (
      SELECT
        sum(COALESCE(r.total_dinero, (0) :: numeric)) AS sum
      FROM
        (
          recargo r
          JOIN detalle_programacion dp ON (
            (
              r.id_detalle_programacion = dp.id_detalle_programacion
            )
          )
        )
      WHERE
        (dp.id_labor_mes = lm.id_labor_mes)
    ),
    (0) :: numeric
  ) AS total_recargos,
  (
    SELECT
      count(*) AS count
    FROM
      detalle_programacion dp
    WHERE
      (dp.id_labor_mes = lm.id_labor_mes)
  ) AS total_turnos,
  COALESCE(
    (
      SELECT
        sum(r.dominicales) AS sum
      FROM
        (
          recargo r
          JOIN detalle_programacion dp ON (
            (
              r.id_detalle_programacion = dp.id_detalle_programacion
            )
          )
        )
      WHERE
        (dp.id_labor_mes = lm.id_labor_mes)
    ),
    (0) :: bigint
  ) AS total_dominicales,
  COALESCE(
    (
      SELECT
        sum(r.festivos) AS sum
      FROM
        (
          recargo r
          JOIN detalle_programacion dp ON (
            (
              r.id_detalle_programacion = dp.id_detalle_programacion
            )
          )
        )
      WHERE
        (dp.id_labor_mes = lm.id_labor_mes)
    ),
    (0) :: bigint
  ) AS total_festivos,
  lm.created_at,
  lm.updated_at
FROM
  (
    (
      labor_mes lm
      JOIN empleado e ON ((lm.id_empleado = e.id_empleado))
    )
    JOIN cargo c ON ((e.id_cargo = c.id_cargo))
  );