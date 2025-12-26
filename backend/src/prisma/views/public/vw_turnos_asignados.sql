SELECT
  dp.id_detalle_programacion AS id_detalle_turno,
  dp.fecha,
  to_char(
    (dp.fecha) :: timestamp WITH time zone,
    'Day' :: text
  ) AS dia_semana,
  CASE
    WHEN (
      EXTRACT(
        dow
        FROM
          dp.fecha
      ) = (0) :: numeric
    ) THEN TRUE
    ELSE false
  END AS es_domingo,
  false AS es_festivo,
  dp.id_turno,
  ('T' :: text || (dp.id_turno) :: text) AS codigo_turno,
  (t.hora_entrada) :: text AS hora_entrada,
  (t.hora_salida) :: text AS hora_salida,
  t.tipo_turno,
  dp.total_horas_laboradas AS thl,
  dp.id_area,
  COALESCE(a.nombre_area, 'Sin área' :: character varying) AS nombre_area,
  dp.id_labor_mes,
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
  dp.created_at,
  dp.updated_at
FROM
  (
    (
      (
        (
          (
            detalle_programacion dp
            JOIN labor_mes lm ON ((dp.id_labor_mes = lm.id_labor_mes))
          )
          JOIN empleado e ON ((lm.id_empleado = e.id_empleado))
        )
        JOIN cargo c ON ((e.id_cargo = c.id_cargo))
      )
      LEFT JOIN turno t ON ((dp.id_turno = t.id_turno))
    )
    LEFT JOIN area a ON ((dp.id_area = a.id_area))
  );