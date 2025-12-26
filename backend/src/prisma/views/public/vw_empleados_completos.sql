SELECT
  e.id_empleado,
  e.cedula,
  concat(
    e.nombre1,
    COALESCE((' ' :: text || (e.nombre2) :: text), '' :: text),
    ' ',
    e.apellido1,
    COALESCE((' ' :: text || (e.apellido2) :: text), '' :: text)
  ) AS nombre_completo,
  e.edad,
  e.sexo,
  e.vehiculo,
  CASE
    WHEN (e.id_estado = 1) THEN TRUE
    ELSE false
  END AS estado,
  e.id_cargo,
  c.nombre_cargo,
  c.salario_base,
  NULL :: integer [] AS areas_permitidas,
  e.created_at,
  e.updated_at
FROM
  (
    empleado e
    LEFT JOIN cargo c ON ((e.id_cargo = c.id_cargo))
  );