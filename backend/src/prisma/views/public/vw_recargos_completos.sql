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
  COALESCE(('T' :: text || (dp.id_turno) :: text), 'N/A' :: text) AS codigo_turno,
  COALESCE((t.hora_entrada) :: text, 'N/A' :: text) AS hora_entrada,
  COALESCE((t.hora_salida) :: text, 'N/A' :: text) AS hora_salida,
  COALESCE(a.nombre_area, 'Sin área' :: character varying) AS nombre_area,
  lm.id_empleado,
  concat(
    e.nombre1,
    COALESCE((' ' :: text || (e.nombre2) :: text), '' :: text),
    ' ',
    e.apellido1,
    COALESCE((' ' :: text || (e.apellido2) :: text), '' :: text)
  ) AS nombre_completo,
  e.cedula,
  c.salario_base,
  lm.id_labor_mes,
  r.created_at,
  r.updated_at
FROM
  (
    (
      (
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
        JOIN cargo c ON ((e.id_cargo = c.id_cargo))
      )
      LEFT JOIN turno t ON ((dp.id_turno = t.id_turno))
    )
    LEFT JOIN area a ON ((dp.id_area = a.id_area))
  );