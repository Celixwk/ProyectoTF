SELECT
  ne.id_novedad_empleado AS id_novedad_registro,
  ne.fecha_solicitud,
  ne.fecha_registro,
  ne.fecha_vencimiento,
  ne.etapa,
  ne.id_empleado,
  concat(
    e.nombre1,
    COALESCE((' ' :: text || (e.nombre2) :: text), '' :: text),
    ' ',
    e.apellido1,
    COALESCE((' ' :: text || (e.apellido2) :: text), '' :: text)
  ) AS empleado,
  e.cedula,
  c.nombre_cargo,
  ne.id_novedad_tipo,
  tn.codigo AS codigo_novedad,
  tn.nombre_novedad AS tipo,
  tn.afecta_pago,
  (
    SELECT
      min(dn.fecha) AS min
    FROM
      detalle_novedad dn
    WHERE
      (dn.id_novedad_empleado = ne.id_novedad_empleado)
  ) AS fecha_inicio,
  (
    SELECT
      sum(dn.cantidad) AS sum
    FROM
      detalle_novedad dn
    WHERE
      (dn.id_novedad_empleado = ne.id_novedad_empleado)
  ) AS cantidad,
  (
    SELECT
      string_agg(dn.observaciones, '; ' :: text) AS string_agg
    FROM
      detalle_novedad dn
    WHERE
      (dn.id_novedad_empleado = ne.id_novedad_empleado)
  ) AS observaciones,
  COALESCE(u.nombre_completo, 'Sistema' :: character varying) AS usuario_registro,
  ne.created_at,
  ne.updated_at
FROM
  (
    (
      (
        (
          novedad_empleado ne
          JOIN empleado e ON ((ne.id_empleado = e.id_empleado))
        )
        JOIN cargo c ON ((e.id_cargo = c.id_cargo))
      )
      JOIN tipo_novedad tn ON ((ne.id_novedad_tipo = tn.id_novedad_tipo))
    )
    LEFT JOIN usuario u ON ((ne.id_usuario = u.id_usuario))
  );