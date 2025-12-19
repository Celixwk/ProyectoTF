SELECT
  ne.id_novedad_empleado AS id_novedad_registro,
  ne.id_empleado,
  concat(
    e.nombre1,
    COALESCE((' ' :: text || (e.nombre2) :: text), '' :: text),
    ' ',
    e.apellido1,
    COALESCE((' ' :: text || (e.apellido2) :: text), '' :: text)
  ) AS nombre_empleado,
  ne.id_novedad_tipo,
  tn.nombre_novedad AS tipo_novedad,
  ne.fecha_solicitud,
  ne.fecha_registro,
  ne.etapa,
  ne.updated_at AS fecha_modificacion,
  ne.created_at AS fecha_creacion
FROM
  (
    (
      novedad_empleado ne
      JOIN empleado e ON ((ne.id_empleado = e.id_empleado))
    )
    JOIN tipo_novedad tn ON ((ne.id_novedad_tipo = tn.id_novedad_tipo))
  )
WHERE
  (ne.updated_at IS NOT NULL)
ORDER BY
  ne.updated_at DESC;