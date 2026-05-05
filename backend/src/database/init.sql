CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "cargo" (
    "id_cargo" SERIAL NOT NULL,
    "nombre_cargo" VARCHAR(100) NOT NULL,
    "salario_base" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "estado" VARCHAR(10) DEFAULT 'Activo',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargo_pkey" PRIMARY KEY ("id_cargo")
);

CREATE TABLE "area" (
    "id_area" SERIAL NOT NULL,
    "nombre_area" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "max_trabajadores" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "area_pkey" PRIMARY KEY ("id_area")
);

CREATE TABLE "turno" (
    "id_turno" SERIAL NOT NULL,
    "hora_entrada" TIME(6) NOT NULL,
    "hora_salida" TIME(6) NOT NULL,
    "tipo_turno" VARCHAR(10) NOT NULL,
    "duracion_horas" DECIMAL(4,2),
    "estado" VARCHAR(10) DEFAULT 'Activo',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "hora_entrada_2" TIME(6),
    "hora_salida_2" TIME(6),

    CONSTRAINT "turno_pkey" PRIMARY KEY ("id_turno")
);

CREATE TABLE "tipo_novedad" (
    "id_novedad_tipo" SERIAL NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "nombre_novedad" VARCHAR(60) NOT NULL,
    "descripcion" TEXT,
    "afecta_pago" BOOLEAN DEFAULT false,
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipo_novedad_pkey" PRIMARY KEY ("id_novedad_tipo")
);

CREATE TABLE "tipo_recargo" (
    "id_recargo_tipo" SERIAL NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "nombre_recargo" VARCHAR(60) NOT NULL,
    "porcentaje_recargo" DECIMAL(5,2) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipo_recargo_pkey" PRIMARY KEY ("id_recargo_tipo")
);

CREATE TABLE "parametrizacion" (
    "id_parametro" SERIAL NOT NULL,
    "nombre_parametro" VARCHAR(100) NOT NULL,
    "horas_maximas" DECIMAL(6,2),
    "descripcion" TEXT,
    "periodicidad" VARCHAR(20),
    "fecha_actualizacion" DATE,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "valor_texto" TEXT,
    "activo" BOOLEAN DEFAULT true,

    CONSTRAINT "parametrizacion_pkey" PRIMARY KEY ("id_parametro")
);

CREATE TABLE "empleado" (
    "id_empleado" SERIAL NOT NULL,
    "cedula" VARCHAR(20) NOT NULL,
    "nombre1" VARCHAR(50) NOT NULL,
    "nombre2" VARCHAR(50),
    "apellido1" VARCHAR(50) NOT NULL,
    "apellido2" VARCHAR(50),
    "edad" SMALLINT,
    "sexo" CHAR(1),
    "vehiculo" TEXT DEFAULT 'No',
    "id_cargo" INTEGER NOT NULL,
    "id_estado" INTEGER DEFAULT 1,
    "id_area" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleado_pkey" PRIMARY KEY ("id_empleado")
);

CREATE TABLE "descanso" (
    "id_descanso" SERIAL NOT NULL,
    "id_empleado" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "dias_descanso" INTEGER[],
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "descanso_pkey" PRIMARY KEY ("id_descanso")
);

CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "usuario" VARCHAR(50) NOT NULL,
    "contrasenia" VARCHAR(255) NOT NULL,
    "tipo_usuario" VARCHAR(20) NOT NULL,
    "nombre_completo" VARCHAR(120) NOT NULL,
    "estado" VARCHAR(10) DEFAULT 'Activo',
    "fecha_creacion" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id_empleado" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

CREATE TABLE "labor_mes" (
    "id_labor_mes" SERIAL NOT NULL,
    "id_empleado" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "horas_mes" DECIMAL(6,2),
    "estado" VARCHAR(15) DEFAULT 'Abierto',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labor_mes_pkey" PRIMARY KEY ("id_labor_mes")
);

CREATE TABLE "novedad_empleado" (
    "id_novedad_empleado" SERIAL NOT NULL,
    "id_empleado" INTEGER NOT NULL,
    "id_novedad_tipo" INTEGER NOT NULL,
    "id_labor_mes" INTEGER,
    "fecha_solicitud" DATE NOT NULL,
    "fecha_registro" DATE NOT NULL,
    "fecha_vencimiento" DATE,
    "etapa" VARCHAR(15) NOT NULL,
    "id_usuario" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "novedad_empleado_pkey" PRIMARY KEY ("id_novedad_empleado")
);

CREATE TABLE "detalle_programacion" (
    "id_detalle_programacion" SERIAL NOT NULL,
    "id_labor_mes" INTEGER,
    "id_turno" INTEGER,
    "id_area" INTEGER,
    "fecha" DATE NOT NULL,
    "tipo_dia" VARCHAR(10),
    "total_horas_laboradas" DECIMAL(5,2),
    "observaciones" TEXT,
    "estado" VARCHAR(20) DEFAULT 'Activo',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id_empleado" INTEGER NOT NULL,
    "id_usuario_registro" INTEGER,
    "origen_registro" VARCHAR(20) DEFAULT 'Sistema',
    "hora_entrada_real" TIMESTAMP(6),
    "hora_salida_real" TIMESTAMP(6),

    CONSTRAINT "detalle_programacion_pkey" PRIMARY KEY ("id_detalle_programacion")
);

CREATE TABLE "detalle_novedad" (
    "id_detalle_novedad" SERIAL NOT NULL,
    "id_novedad_empleado" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "cantidad" DECIMAL(5,2),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalle_novedad_pkey" PRIMARY KEY ("id_detalle_novedad")
);

CREATE TABLE "recargo" (
    "id_recargo" SERIAL NOT NULL,
    "id_detalle_programacion" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "total_horas" DECIMAL(5,2),
    "total_dinero" DECIMAL(10,2),
    "total_diurno" DECIMAL(5,2),
    "dominicales" SMALLINT DEFAULT 0,
    "festivos" SMALLINT DEFAULT 0,
    "hed" DECIMAL(5,2) DEFAULT 0,
    "hen" DECIMAL(5,2) DEFAULT 0,
    "rno" DECIMAL(5,2) DEFAULT 0,
    "rnf" DECIMAL(5,2) DEFAULT 0,
    "heon" DECIMAL(5,2) DEFAULT 0,
    "hefd" DECIMAL(5,2) DEFAULT 0,
    "hefn" DECIMAL(5,2) DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recargo_pkey" PRIMARY KEY ("id_recargo")
);

CREATE TABLE "detalle_recargo" (
    "id_detalle_recargo" SERIAL NOT NULL,
    "id_recargo" INTEGER NOT NULL,
    "id_recargo_tipo" INTEGER NOT NULL,
    "horas_registradas" DECIMAL(5,2) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalle_recargo_pkey" PRIMARY KEY ("id_detalle_recargo")
);

CREATE TABLE "estados_empleado" (
    "id_estado" SERIAL NOT NULL,
    "nombre_estado" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estados_empleado_pkey" PRIMARY KEY ("id_estado")
);

CREATE TABLE "mes" (
    "id_mes" SERIAL NOT NULL,
    "nombre_mes" VARCHAR(20) NOT NULL,
    "numero_mes" SMALLINT NOT NULL,
    "anio" SMALLINT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estado" VARCHAR(15) DEFAULT 'Abierto',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mes_pkey" PRIMARY KEY ("id_mes")
);

CREATE TABLE "empleado_area" (
    "id_empleado" INTEGER NOT NULL,
    "id_area" INTEGER NOT NULL,

    CONSTRAINT "empleado_area_pkey" PRIMARY KEY ("id_empleado","id_area")
);

CREATE TABLE "alertas_programacion" (
    "id_alerta" SERIAL NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "codigo" TEXT,
    "mensaje" TEXT NOT NULL,
    "id_area" INTEGER,
    "id_empleado" INTEGER,
    "datos_completos" JSONB,

    CONSTRAINT "alertas_programacion_pkey" PRIMARY KEY ("id_alerta")
);

CREATE UNIQUE INDEX "cargo_nombre_cargo_key" ON "cargo"("nombre_cargo");
CREATE UNIQUE INDEX "area_nombre_area_key" ON "area"("nombre_area");
CREATE UNIQUE INDEX "turno_tipo_turno_unique" ON "turno"("tipo_turno");
CREATE UNIQUE INDEX "tipo_novedad_codigo_key" ON "tipo_novedad"("codigo");
CREATE UNIQUE INDEX "tipo_recargo_codigo_key" ON "tipo_recargo"("codigo");
CREATE UNIQUE INDEX "parametrizacion_nombre_parametro_key" ON "parametrizacion"("nombre_parametro");
CREATE UNIQUE INDEX "empleado_cedula_key" ON "empleado"("cedula");
CREATE INDEX "idx_empleado_cargo" ON "empleado"("id_cargo");
CREATE INDEX "idx_empleado_estado" ON "empleado"("id_estado");
CREATE INDEX "idx_empleado_cedula" ON "empleado"("cedula");
CREATE UNIQUE INDEX "descanso_id_empleado_mes_anio_key" ON "descanso"("id_empleado", "mes", "anio");
CREATE UNIQUE INDEX "usuario_usuario_key" ON "usuario"("usuario");
CREATE UNIQUE INDEX "usuario_id_empleado_key" ON "usuario"("id_empleado");
CREATE INDEX "idx_usuario_empleado" ON "usuario"("id_empleado");
CREATE INDEX "idx_labor_mes_empleado" ON "labor_mes"("id_empleado");
CREATE INDEX "idx_labor_mes_fechas" ON "labor_mes"("fecha_inicio", "fecha_fin");
CREATE INDEX "idx_novedad_empleado" ON "novedad_empleado"("id_empleado");
CREATE INDEX "idx_novedad_tipo" ON "novedad_empleado"("id_novedad_tipo");
CREATE INDEX "idx_detalle_prog_fecha" ON "detalle_programacion"("fecha");
CREATE UNIQUE INDEX "detalle_programacion_id_empleado_fecha_key" ON "detalle_programacion"("id_empleado", "fecha");
CREATE INDEX "idx_detalle_novedad_nov" ON "detalle_novedad"("id_novedad_empleado");
CREATE INDEX "idx_recargo_detalle" ON "recargo"("id_detalle_programacion");
CREATE INDEX "idx_detalle_recargo_recargo" ON "detalle_recargo"("id_recargo");
CREATE UNIQUE INDEX "detalle_recargo_id_recargo_id_recargo_tipo_key" ON "detalle_recargo"("id_recargo", "id_recargo_tipo");
CREATE UNIQUE INDEX "estados_empleado_nombre_estado_key" ON "estados_empleado"("nombre_estado");
CREATE UNIQUE INDEX "mes_numero_mes_anio_key" ON "mes"("numero_mes", "anio");

ALTER TABLE "empleado" ADD CONSTRAINT "empleado_id_cargo_fkey" FOREIGN KEY ("id_cargo") REFERENCES "cargo"("id_cargo") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "empleado" ADD CONSTRAINT "empleado_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "estados_empleado"("id_estado") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "descanso" ADD CONSTRAINT "descanso_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleado"("id_empleado") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleado"("id_empleado") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "labor_mes" ADD CONSTRAINT "labor_mes_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleado"("id_empleado") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "novedad_empleado" ADD CONSTRAINT "novedad_empleado_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleado"("id_empleado") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "novedad_empleado" ADD CONSTRAINT "novedad_empleado_id_labor_mes_fkey" FOREIGN KEY ("id_labor_mes") REFERENCES "labor_mes"("id_labor_mes") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "novedad_empleado" ADD CONSTRAINT "novedad_empleado_id_novedad_tipo_fkey" FOREIGN KEY ("id_novedad_tipo") REFERENCES "tipo_novedad"("id_novedad_tipo") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "novedad_empleado" ADD CONSTRAINT "novedad_empleado_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "detalle_programacion" ADD CONSTRAINT "detalle_programacion_id_area_fkey" FOREIGN KEY ("id_area") REFERENCES "area"("id_area") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "detalle_programacion" ADD CONSTRAINT "detalle_programacion_id_empleado_fkey" FOREIGN KEY ("id_empleado") REFERENCES "empleado"("id_empleado") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "detalle_programacion" ADD CONSTRAINT "detalle_programacion_id_labor_mes_fkey" FOREIGN KEY ("id_labor_mes") REFERENCES "labor_mes"("id_labor_mes") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "detalle_programacion" ADD CONSTRAINT "detalle_programacion_id_turno_fkey" FOREIGN KEY ("id_turno") REFERENCES "turno"("id_turno") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "detalle_programacion" ADD CONSTRAINT "detalle_programacion_id_usuario_registro_fkey" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "detalle_novedad" ADD CONSTRAINT "detalle_novedad_id_novedad_empleado_fkey" FOREIGN KEY ("id_novedad_empleado") REFERENCES "novedad_empleado"("id_novedad_empleado") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "recargo" ADD CONSTRAINT "recargo_id_detalle_programacion_fkey" FOREIGN KEY ("id_detalle_programacion") REFERENCES "detalle_programacion"("id_detalle_programacion") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "detalle_recargo" ADD CONSTRAINT "detalle_recargo_id_recargo_fkey" FOREIGN KEY ("id_recargo") REFERENCES "recargo"("id_recargo") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "detalle_recargo" ADD CONSTRAINT "detalle_recargo_id_recargo_tipo_fkey" FOREIGN KEY ("id_recargo_tipo") REFERENCES "tipo_recargo"("id_recargo_tipo") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "empleado_area" ADD CONSTRAINT "fk_ea_area" FOREIGN KEY ("id_area") REFERENCES "area"("id_area") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "empleado_area" ADD CONSTRAINT "fk_ea_empleado" FOREIGN KEY ("id_empleado") REFERENCES "empleado"("id_empleado") ON DELETE CASCADE ON UPDATE NO ACTION;


INSERT INTO estados_empleado (id_estado, nombre_estado) VALUES (1, 'Activo'), (2, 'Inactivo'), (3, 'Vacaciones');

INSERT INTO usuario (usuario, contrasenia, tipo_usuario, nombre_completo, estado)
VALUES ('admin', 'admin123', 'Administrador', 'Administrador del Sistema', 'Activo')
ON CONFLICT (usuario) DO NOTHING;

-- ─── Tipos de Recargo (Legislación Colombiana) ──────────────────────────────
INSERT INTO tipo_recargo (codigo, nombre_recargo, porcentaje_recargo, descripcion, activo) VALUES
    ('RNO',  'Recargo Nocturno Ordinario',        35,  'Recargo por laborar en jornada ordinaria nocturna (21:00 a 06:00)', true),
    ('RNF',  'Recargo Nocturno Festivo',           110, 'Recargo por laborar en jornada nocturna durante domingo o festivo', true),
    ('HEOD', 'Hora Extra Ordinaria Diurna',        25,  'Hora extra laborada en jornada diurna (06:00 a 21:00)', true),
    ('HEON', 'Hora Extra Ordinaria Nocturna',      75,  'Hora extra laborada en jornada nocturna (21:00 a 06:00)', true),
    ('HEFD', 'Hora Extra Festiva Diurna',          100, 'Hora extra laborada en domingo o festivo en jornada diurna', true),
    ('HEFN', 'Hora Extra Festiva Nocturna',        150, 'Hora extra laborada en domingo o festivo en jornada nocturna', true),
    ('D',    'Dominical Diurno',                   75,  'Recargo por laborar en día de descanso obligatorio (Domingo)', true),
    ('F',    'Festivo Diurno',                     75,  'Recargo por laborar en día festivo', true)
ON CONFLICT (codigo) DO NOTHING;

-- ─── Tipos de Novedad ────────────────────────────────────────────────────────
INSERT INTO tipo_novedad (codigo, nombre_novedad, descripcion, afecta_pago, activo) VALUES
    ('VAC',  'Vacaciones',            'Periodo de vacaciones remuneradas del empleado',              false, true),
    ('INC',  'Incapacidad',           'Ausencia por incapacidad médica certificada',                 true,  true),
    ('LIC',  'Licencia',              'Licencia autorizada remunerada o no remunerada',              false, true),
    ('AUS',  'Ausencia Injustificada','Falta al trabajo sin justificación válida',                   true,  true),
    ('COM',  'Compensatorio',         'Día compensatorio por trabajo en festivo o domingo',          false, true),
    ('CAP',  'Capacitación',          'Ausencia autorizada por capacitación o formación',            false, true),
    ('PER',  'Permiso',               'Permiso particular autorizado por el empleador',              false, true),
    ('MAT',  'Maternidad/Paternidad', 'Licencia de maternidad o paternidad',                        false, true)
ON CONFLICT (codigo) DO NOTHING;

-- ─── Parámetros del Sistema (valores por defecto) ────────────────────────────
INSERT INTO parametrizacion (nombre_parametro, horas_maximas, descripcion, periodicidad, activo) VALUES
    ('META_HORAS_PERIODO',    192, 'Horas ordinarias a cumplir por periodo (ej: 192 mensual, 96 quincenal)', 'MENSUAL',   true),
    ('HORA_INICIO_NOCTURNA',   21, 'Hora de inicio de la jornada nocturna en formato militar (21 = 9PM)',    'SIEMPRE',   true),
    ('MAXIMO_HORAS_EXTRAS',    48, 'Límite de horas extras laborables por periodo (legal Colombia: 48/mes)', 'MENSUAL',   true),
    ('MAX_DIAS_CONSECUTIVOS',   6, 'Máximo de días consecutivos que un empleado puede trabajar en la misma área y turno', 'SIEMPRE', true)
ON CONFLICT (nombre_parametro) DO NOTHING;
