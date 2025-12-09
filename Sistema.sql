--
-- PostgreSQL database dump
--

\restrict swlpMN6u4C1UVyHxhf8r32WH4Gocac4prw5csrABdGeK6sEgSFiTHZtEmlxkpFb

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-12-05 22:16:24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16388)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 5979 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- TOC entry 458 (class 1255 OID 42293)
-- Name: calcular_horas_labor_mes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_horas_labor_mes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE labor_mes
    SET total_horas_trabajadas = (
        SELECT COALESCE(SUM(total_horas_laboradas), 0)
        FROM labor_turno
        WHERE id_labor_mes = NEW.id_labor_mes
    )
    WHERE id_labor_mes = NEW.id_labor_mes;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.calcular_horas_labor_mes() OWNER TO postgres;

--
-- TOC entry 491 (class 1255 OID 42284)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 42018)
-- Name: areas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.areas (
    id_area integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre_area character varying(100) NOT NULL,
    descripcion text,
    estado character varying(20) DEFAULT 'Activo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.areas OWNER TO postgres;

--
-- TOC entry 5980 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE areas; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.areas IS 'Tabla de  reas operativas del terminal';


--
-- TOC entry 225 (class 1259 OID 42017)
-- Name: areas_id_area_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.areas_id_area_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.areas_id_area_seq OWNER TO postgres;

--
-- TOC entry 5981 (class 0 OID 0)
-- Dependencies: 225
-- Name: areas_id_area_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.areas_id_area_seq OWNED BY public.areas.id_area;


--
-- TOC entry 224 (class 1259 OID 42007)
-- Name: cargos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cargos (
    id_cargo integer NOT NULL,
    nombre_cargo character varying(100) NOT NULL,
    salario_base numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cargos OWNER TO postgres;

--
-- TOC entry 5982 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE cargos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cargos IS 'Tabla que almacena los diferentes cargos y sus salarios base';


--
-- TOC entry 223 (class 1259 OID 42006)
-- Name: cargos_id_cargo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cargos_id_cargo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cargos_id_cargo_seq OWNER TO postgres;

--
-- TOC entry 5983 (class 0 OID 0)
-- Dependencies: 223
-- Name: cargos_id_cargo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cargos_id_cargo_seq OWNED BY public.cargos.id_cargo;


--
-- TOC entry 228 (class 1259 OID 42032)
-- Name: empleados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empleados (
    id_empleado integer NOT NULL,
    cedula character varying(20) NOT NULL,
    nombres_apellidos character varying(255) NOT NULL,
    edad integer,
    sexo character(1),
    id_cargo integer,
    id_area integer,
    vehiculo_placa character varying(20),
    vehiculo_marca character varying(50),
    estado character varying(20) DEFAULT 'Activo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT empleados_estado_check CHECK (((estado)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying, 'Licencia'::character varying, 'Vacaciones'::character varying])::text[]))),
    CONSTRAINT empleados_sexo_check CHECK ((sexo = ANY (ARRAY['M'::bpchar, 'F'::bpchar, 'O'::bpchar])))
);


ALTER TABLE public.empleados OWNER TO postgres;

--
-- TOC entry 5984 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE empleados; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.empleados IS 'Tabla principal de empleados del sistema';


--
-- TOC entry 227 (class 1259 OID 42031)
-- Name: empleados_id_empleado_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.empleados_id_empleado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empleados_id_empleado_seq OWNER TO postgres;

--
-- TOC entry 5985 (class 0 OID 0)
-- Dependencies: 227
-- Name: empleados_id_empleado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.empleados_id_empleado_seq OWNED BY public.empleados.id_empleado;


--
-- TOC entry 246 (class 1259 OID 42190)
-- Name: festivos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.festivos (
    id_festivo integer NOT NULL,
    fecha date NOT NULL,
    nombre_festivo character varying(100) NOT NULL,
    tipo character varying(50),
    recargable boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.festivos OWNER TO postgres;

--
-- TOC entry 5986 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE festivos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.festivos IS 'Calendario de d¡as festivos para c lculo de recargos';


--
-- TOC entry 245 (class 1259 OID 42189)
-- Name: festivos_id_festivo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.festivos_id_festivo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.festivos_id_festivo_seq OWNER TO postgres;

--
-- TOC entry 5987 (class 0 OID 0)
-- Dependencies: 245
-- Name: festivos_id_festivo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.festivos_id_festivo_seq OWNED BY public.festivos.id_festivo;


--
-- TOC entry 236 (class 1259 OID 42104)
-- Name: labor_mes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.labor_mes (
    id_labor_mes integer NOT NULL,
    id_empleado integer,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    total_horas_trabajadas integer DEFAULT 0,
    dias_trabajados integer DEFAULT 0,
    dias_descanso integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.labor_mes OWNER TO postgres;

--
-- TOC entry 5988 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE labor_mes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.labor_mes IS 'Registro mensual de trabajo de cada empleado';


--
-- TOC entry 235 (class 1259 OID 42103)
-- Name: labor_mes_id_labor_mes_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.labor_mes_id_labor_mes_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.labor_mes_id_labor_mes_seq OWNER TO postgres;

--
-- TOC entry 5989 (class 0 OID 0)
-- Dependencies: 235
-- Name: labor_mes_id_labor_mes_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.labor_mes_id_labor_mes_seq OWNED BY public.labor_mes.id_labor_mes;


--
-- TOC entry 238 (class 1259 OID 42121)
-- Name: labor_turno; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.labor_turno (
    id_registro integer NOT NULL,
    id_labor_mes integer,
    id_turno integer,
    id_area integer,
    fecha date NOT NULL,
    total_horas_laboradas integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT labor_turno_total_horas_laboradas_check CHECK ((total_horas_laboradas >= 0))
);


ALTER TABLE public.labor_turno OWNER TO postgres;

--
-- TOC entry 5990 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE labor_turno; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.labor_turno IS 'Detalle diario de turnos asignados';


--
-- TOC entry 237 (class 1259 OID 42120)
-- Name: labor_turno_id_registro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.labor_turno_id_registro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.labor_turno_id_registro_seq OWNER TO postgres;

--
-- TOC entry 5991 (class 0 OID 0)
-- Dependencies: 237
-- Name: labor_turno_id_registro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.labor_turno_id_registro_seq OWNED BY public.labor_turno.id_registro;


--
-- TOC entry 234 (class 1259 OID 42080)
-- Name: novedades_empleado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.novedades_empleado (
    id_novedad_registro integer NOT NULL,
    id_empleado integer,
    id_novedad_tipo integer,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    cantidad integer DEFAULT 1,
    observaciones text,
    etapa character varying(20) DEFAULT 'Pendiente'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT novedades_empleado_etapa_check CHECK (((etapa)::text = ANY ((ARRAY['Pendiente'::character varying, 'Aprobada'::character varying, 'Rechazada'::character varying])::text[])))
);


ALTER TABLE public.novedades_empleado OWNER TO postgres;

--
-- TOC entry 5992 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE novedades_empleado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.novedades_empleado IS 'Registro de novedades (incapacidades, vacaciones, etc)';


--
-- TOC entry 233 (class 1259 OID 42079)
-- Name: novedades_empleado_id_novedad_registro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.novedades_empleado_id_novedad_registro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.novedades_empleado_id_novedad_registro_seq OWNER TO postgres;

--
-- TOC entry 5993 (class 0 OID 0)
-- Dependencies: 233
-- Name: novedades_empleado_id_novedad_registro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.novedades_empleado_id_novedad_registro_seq OWNED BY public.novedades_empleado.id_novedad_registro;


--
-- TOC entry 244 (class 1259 OID 42177)
-- Name: parametros; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parametros (
    id_parametro integer NOT NULL,
    nombre_parametro character varying(100) NOT NULL,
    valor_parametro text NOT NULL,
    descripcion text,
    periodicidad character varying(50),
    horas_maximas integer,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.parametros OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 42176)
-- Name: parametros_id_parametro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parametros_id_parametro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parametros_id_parametro_seq OWNER TO postgres;

--
-- TOC entry 5994 (class 0 OID 0)
-- Dependencies: 243
-- Name: parametros_id_parametro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parametros_id_parametro_seq OWNED BY public.parametros.id_parametro;


--
-- TOC entry 242 (class 1259 OID 42157)
-- Name: recargos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recargos (
    id_recargo integer NOT NULL,
    id_labor_mes integer,
    id_recargo_tipo integer,
    fecha date NOT NULL,
    cantidad_horas integer NOT NULL,
    valor_total numeric(12,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recargos_cantidad_horas_check CHECK ((cantidad_horas >= 0))
);


ALTER TABLE public.recargos OWNER TO postgres;

--
-- TOC entry 5995 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE recargos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recargos IS 'Registro de recargos y horas extras';


--
-- TOC entry 241 (class 1259 OID 42156)
-- Name: recargos_id_recargo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recargos_id_recargo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recargos_id_recargo_seq OWNER TO postgres;

--
-- TOC entry 5996 (class 0 OID 0)
-- Dependencies: 241
-- Name: recargos_id_recargo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recargos_id_recargo_seq OWNED BY public.recargos.id_recargo;


--
-- TOC entry 248 (class 1259 OID 42201)
-- Name: refuerzos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refuerzos (
    id_refuerzo integer NOT NULL,
    id_empleado integer,
    areas_disponibles integer[],
    horario_preferido character varying(50),
    disponibilidad character varying(50),
    "experiencia_a¤os" integer,
    telefono character varying(20),
    estado character varying(20) DEFAULT 'Disponible'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refuerzos OWNER TO postgres;

--
-- TOC entry 5997 (class 0 OID 0)
-- Dependencies: 248
-- Name: TABLE refuerzos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.refuerzos IS 'Personal de refuerzo disponible para cobertura';


--
-- TOC entry 247 (class 1259 OID 42200)
-- Name: refuerzos_id_refuerzo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refuerzos_id_refuerzo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refuerzos_id_refuerzo_seq OWNER TO postgres;

--
-- TOC entry 5998 (class 0 OID 0)
-- Dependencies: 247
-- Name: refuerzos_id_refuerzo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refuerzos_id_refuerzo_seq OWNED BY public.refuerzos.id_refuerzo;


--
-- TOC entry 232 (class 1259 OID 42069)
-- Name: tipos_novedad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_novedad (
    id_novedad_tipo integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre_novedad character varying(100) NOT NULL,
    afecta_pago boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tipos_novedad OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 42068)
-- Name: tipos_novedad_id_novedad_tipo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipos_novedad_id_novedad_tipo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_novedad_id_novedad_tipo_seq OWNER TO postgres;

--
-- TOC entry 5999 (class 0 OID 0)
-- Dependencies: 231
-- Name: tipos_novedad_id_novedad_tipo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipos_novedad_id_novedad_tipo_seq OWNED BY public.tipos_novedad.id_novedad_tipo;


--
-- TOC entry 240 (class 1259 OID 42145)
-- Name: tipos_recargo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_recargo (
    id_recargo_tipo integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre_recargo character varying(100) NOT NULL,
    porcentaje_recargo numeric(5,2) NOT NULL,
    descripcion text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tipos_recargo OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 42144)
-- Name: tipos_recargo_id_recargo_tipo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipos_recargo_id_recargo_tipo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_recargo_id_recargo_tipo_seq OWNER TO postgres;

--
-- TOC entry 6000 (class 0 OID 0)
-- Dependencies: 239
-- Name: tipos_recargo_id_recargo_tipo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipos_recargo_id_recargo_tipo_seq OWNED BY public.tipos_recargo.id_recargo_tipo;


--
-- TOC entry 230 (class 1259 OID 42056)
-- Name: turnos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.turnos (
    id_turno integer NOT NULL,
    codigo_turno character varying(10) NOT NULL,
    hora_entrada time without time zone NOT NULL,
    hora_salida time without time zone NOT NULL,
    tipo_turno character varying(50),
    thl integer NOT NULL,
    estado character varying(20) DEFAULT 'Activo'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT turnos_thl_check CHECK ((thl >= 0))
);


ALTER TABLE public.turnos OWNER TO postgres;

--
-- TOC entry 6001 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE turnos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.turnos IS 'Tabla de turnos disponibles con sus horarios';


--
-- TOC entry 229 (class 1259 OID 42055)
-- Name: turnos_id_turno_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.turnos_id_turno_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.turnos_id_turno_seq OWNER TO postgres;

--
-- TOC entry 6002 (class 0 OID 0)
-- Dependencies: 229
-- Name: turnos_id_turno_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.turnos_id_turno_seq OWNED BY public.turnos.id_turno;


--
-- TOC entry 252 (class 1259 OID 42254)
-- Name: v_dashboard_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_dashboard_stats AS
 SELECT (( SELECT count(*) AS count
           FROM public.empleados
          WHERE ((empleados.estado)::text = 'Activo'::text)))::integer AS total_empleados,
    (( SELECT count(*) AS count
           FROM public.labor_turno
          WHERE (labor_turno.fecha >= (CURRENT_DATE - '30 days'::interval))))::integer AS turnos_asignados,
    (( SELECT count(*) AS count
           FROM public.novedades_empleado
          WHERE ((novedades_empleado.etapa)::text = 'Pendiente'::text)))::integer AS novedades_pendientes,
    ( SELECT COALESCE(sum(c.salario_base), (0)::numeric) AS "coalesce"
           FROM (public.empleados e
             JOIN public.cargos c ON ((e.id_cargo = c.id_cargo)))
          WHERE ((e.estado)::text = 'Activo'::text)) AS nomina_mensual;


ALTER VIEW public.v_dashboard_stats OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 42239)
-- Name: v_empleados_completos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_empleados_completos AS
 SELECT e.id_empleado,
    e.cedula,
    e.nombres_apellidos,
    e.edad,
    e.sexo,
    c.nombre_cargo,
    c.salario_base,
    a.codigo AS area_codigo,
    a.nombre_area,
    e.vehiculo_placa,
    e.vehiculo_marca,
    e.estado,
    e.created_at
   FROM ((public.empleados e
     LEFT JOIN public.cargos c ON ((e.id_cargo = c.id_cargo)))
     LEFT JOIN public.areas a ON ((e.id_area = a.id_area)));


ALTER VIEW public.v_empleados_completos OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 42264)
-- Name: v_mis_turnos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_mis_turnos AS
 SELECT lt.id_registro,
    lt.id_labor_mes,
    lt.id_turno,
    lt.id_area,
    lt.fecha,
    lt.total_horas_laboradas,
    lt.created_at,
    e.id_empleado,
    e.nombres_apellidos,
    t.codigo_turno,
    t.hora_entrada,
    t.hora_salida,
    t.tipo_turno,
    a.codigo AS area_codigo,
    a.nombre_area,
    lm.fecha_inicio AS periodo_inicio,
    lm.fecha_fin AS periodo_fin
   FROM ((((public.labor_turno lt
     JOIN public.labor_mes lm ON ((lt.id_labor_mes = lm.id_labor_mes)))
     JOIN public.empleados e ON ((lm.id_empleado = e.id_empleado)))
     JOIN public.turnos t ON ((lt.id_turno = t.id_turno)))
     LEFT JOIN public.areas a ON ((lt.id_area = a.id_area)));


ALTER VIEW public.v_mis_turnos OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 42279)
-- Name: v_nomina_quincenal; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_nomina_quincenal AS
 SELECT lm.id_labor_mes,
    e.id_empleado,
    e.nombres_apellidos,
    e.cedula,
    c.salario_base,
    lm.fecha_inicio,
    lm.fecha_fin,
    lm.total_horas_trabajadas,
    lm.dias_trabajados,
    ((c.salario_base / (240)::numeric) * (lm.total_horas_trabajadas)::numeric) AS salario_devengado,
    COALESCE(sum(r.valor_total), (0)::numeric) AS total_recargos,
    (((c.salario_base / (240)::numeric) * (lm.total_horas_trabajadas)::numeric) + COALESCE(sum(r.valor_total), (0)::numeric)) AS total_bruto,
    (((c.salario_base / (240)::numeric) * (lm.total_horas_trabajadas)::numeric) * 0.08) AS total_descuentos,
    ((((c.salario_base / (240)::numeric) * (lm.total_horas_trabajadas)::numeric) + COALESCE(sum(r.valor_total), (0)::numeric)) - (((c.salario_base / (240)::numeric) * (lm.total_horas_trabajadas)::numeric) * 0.08)) AS neto_a_pagar
   FROM (((public.labor_mes lm
     JOIN public.empleados e ON ((lm.id_empleado = e.id_empleado)))
     JOIN public.cargos c ON ((e.id_cargo = c.id_cargo)))
     LEFT JOIN public.recargos r ON ((lm.id_labor_mes = r.id_labor_mes)))
  GROUP BY lm.id_labor_mes, e.id_empleado, e.nombres_apellidos, e.cedula, c.salario_base, lm.fecha_inicio, lm.fecha_fin, lm.total_horas_trabajadas, lm.dias_trabajados;


ALTER VIEW public.v_nomina_quincenal OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 42269)
-- Name: v_novedades_recientes; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_novedades_recientes AS
 SELECT ne.id_novedad_registro,
    ne.id_empleado,
    ne.id_novedad_tipo,
    ne.fecha_inicio,
    ne.fecha_fin,
    ne.cantidad,
    ne.observaciones,
    ne.etapa,
    ne.created_at,
    ne.updated_at,
    e.nombres_apellidos,
    tn.nombre_novedad,
    tn.codigo,
    EXTRACT(day FROM (CURRENT_TIMESTAMP - (ne.created_at)::timestamp with time zone)) AS dias_pendiente
   FROM ((public.novedades_empleado ne
     JOIN public.empleados e ON ((ne.id_empleado = e.id_empleado)))
     JOIN public.tipos_novedad tn ON ((ne.id_novedad_tipo = tn.id_novedad_tipo)))
  ORDER BY ne.created_at DESC;


ALTER VIEW public.v_novedades_recientes OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 42259)
-- Name: v_programacion_por_area; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_programacion_por_area AS
 SELECT a.id_area,
    a.codigo,
    a.nombre_area,
    COALESCE(count(DISTINCT e.id_empleado), (0)::bigint) AS total_empleados,
    string_agg(DISTINCT (e.nombres_apellidos)::text, ', '::text ORDER BY (e.nombres_apellidos)::text) AS empleados_nombres
   FROM (public.areas a
     LEFT JOIN public.empleados e ON (((a.id_area = e.id_area) AND ((e.estado)::text = 'Activo'::text))))
  GROUP BY a.id_area, a.codigo, a.nombre_area
  ORDER BY a.codigo;


ALTER VIEW public.v_programacion_por_area OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 42244)
-- Name: v_programacion_turnos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_programacion_turnos AS
 SELECT lt.id_registro,
    lt.fecha,
    e.id_empleado,
    e.nombres_apellidos,
    e.cedula,
    c.nombre_cargo,
    t.codigo_turno,
    t.hora_entrada,
    t.hora_salida,
    t.tipo_turno,
    a.codigo AS area_codigo,
    a.nombre_area,
    lt.total_horas_laboradas
   FROM (((((public.labor_turno lt
     JOIN public.labor_mes lm ON ((lt.id_labor_mes = lm.id_labor_mes)))
     JOIN public.empleados e ON ((lm.id_empleado = e.id_empleado)))
     JOIN public.cargos c ON ((e.id_cargo = c.id_cargo)))
     JOIN public.turnos t ON ((lt.id_turno = t.id_turno)))
     LEFT JOIN public.areas a ON ((lt.id_area = a.id_area)))
  WHERE ((e.estado)::text = 'Activo'::text)
  ORDER BY lt.fecha DESC, e.nombres_apellidos;


ALTER VIEW public.v_programacion_turnos OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 42274)
-- Name: v_refuerzos_disponibles; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_refuerzos_disponibles AS
SELECT
    NULL::integer AS id_refuerzo,
    NULL::integer AS id_empleado,
    NULL::character varying(50) AS horario_preferido,
    NULL::character varying(50) AS disponibilidad,
    NULL::integer AS "experiencia_a¤os",
    NULL::character varying(20) AS telefono,
    NULL::integer[] AS areas_disponibles,
    NULL::character varying(20) AS estado,
    NULL::character varying(255) AS nombres_apellidos,
    NULL::character varying(20) AS cedula,
    NULL::character varying(100) AS nombre_cargo,
    NULL::text AS areas_nombres;


ALTER VIEW public.v_refuerzos_disponibles OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 42249)
-- Name: v_resumen_horas_empleado; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_resumen_horas_empleado AS
 SELECT lm.id_labor_mes,
    e.id_empleado,
    e.nombres_apellidos,
    e.cedula,
    c.nombre_cargo,
    lm.fecha_inicio,
    lm.fecha_fin,
    lm.total_horas_trabajadas,
    lm.dias_trabajados,
    lm.dias_descanso,
    COALESCE(sum(r.cantidad_horas), (0)::bigint) AS total_horas_recargo,
    COALESCE(sum(r.valor_total), (0)::numeric) AS total_valor_recargo
   FROM (((public.labor_mes lm
     JOIN public.empleados e ON ((lm.id_empleado = e.id_empleado)))
     JOIN public.cargos c ON ((e.id_cargo = c.id_cargo)))
     LEFT JOIN public.recargos r ON ((lm.id_labor_mes = r.id_labor_mes)))
  GROUP BY lm.id_labor_mes, e.id_empleado, e.nombres_apellidos, e.cedula, c.nombre_cargo, lm.fecha_inicio, lm.fecha_fin, lm.total_horas_trabajadas, lm.dias_trabajados, lm.dias_descanso
  ORDER BY lm.fecha_inicio DESC, e.nombres_apellidos;


ALTER VIEW public.v_resumen_horas_empleado OWNER TO postgres;

--
-- TOC entry 5654 (class 2604 OID 42021)
-- Name: areas id_area; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas ALTER COLUMN id_area SET DEFAULT nextval('public.areas_id_area_seq'::regclass);


--
-- TOC entry 5651 (class 2604 OID 42010)
-- Name: cargos id_cargo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargos ALTER COLUMN id_cargo SET DEFAULT nextval('public.cargos_id_cargo_seq'::regclass);


--
-- TOC entry 5658 (class 2604 OID 42035)
-- Name: empleados id_empleado; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados ALTER COLUMN id_empleado SET DEFAULT nextval('public.empleados_id_empleado_seq'::regclass);


--
-- TOC entry 5690 (class 2604 OID 42193)
-- Name: festivos id_festivo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.festivos ALTER COLUMN id_festivo SET DEFAULT nextval('public.festivos_id_festivo_seq'::regclass);


--
-- TOC entry 5674 (class 2604 OID 42107)
-- Name: labor_mes id_labor_mes; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labor_mes ALTER COLUMN id_labor_mes SET DEFAULT nextval('public.labor_mes_id_labor_mes_seq'::regclass);


--
-- TOC entry 5680 (class 2604 OID 42124)
-- Name: labor_turno id_registro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labor_turno ALTER COLUMN id_registro SET DEFAULT nextval('public.labor_turno_id_registro_seq'::regclass);


--
-- TOC entry 5669 (class 2604 OID 42083)
-- Name: novedades_empleado id_novedad_registro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.novedades_empleado ALTER COLUMN id_novedad_registro SET DEFAULT nextval('public.novedades_empleado_id_novedad_registro_seq'::regclass);


--
-- TOC entry 5687 (class 2604 OID 42180)
-- Name: parametros id_parametro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametros ALTER COLUMN id_parametro SET DEFAULT nextval('public.parametros_id_parametro_seq'::regclass);


--
-- TOC entry 5684 (class 2604 OID 42160)
-- Name: recargos id_recargo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recargos ALTER COLUMN id_recargo SET DEFAULT nextval('public.recargos_id_recargo_seq'::regclass);


--
-- TOC entry 5693 (class 2604 OID 42204)
-- Name: refuerzos id_refuerzo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refuerzos ALTER COLUMN id_refuerzo SET DEFAULT nextval('public.refuerzos_id_refuerzo_seq'::regclass);


--
-- TOC entry 5666 (class 2604 OID 42072)
-- Name: tipos_novedad id_novedad_tipo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_novedad ALTER COLUMN id_novedad_tipo SET DEFAULT nextval('public.tipos_novedad_id_novedad_tipo_seq'::regclass);


--
-- TOC entry 5682 (class 2604 OID 42148)
-- Name: tipos_recargo id_recargo_tipo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_recargo ALTER COLUMN id_recargo_tipo SET DEFAULT nextval('public.tipos_recargo_id_recargo_tipo_seq'::regclass);


--
-- TOC entry 5662 (class 2604 OID 42059)
-- Name: turnos id_turno; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos ALTER COLUMN id_turno SET DEFAULT nextval('public.turnos_id_turno_seq'::regclass);


--
-- TOC entry 5951 (class 0 OID 42018)
-- Dependencies: 226
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.areas (id_area, codigo, nombre_area, descripcion, estado, created_at, updated_at) FROM stdin;
1	C5	Sala Principal	Sala principal de operaciones	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
2	PTA1	Puertas y Sala PTA1	Puertas y sala primera secci¢n	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
3	PTA2	Puertas y Sala PTA2	Puertas y sala segunda secci¢n	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
4	B¥O1	Ba¤o 1	Instalaciones sanitarias  rea 1	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
5	B¥O3	Ba¤os 3	Instalaciones sanitarias  rea 3	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
6	STX	Sala Taxis	µrea de atenci¢n a taxis	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
7	CTE	Caseta de Entrada	Control de entrada	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
8	CTS	Caseta de Salida	Control de salida	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
9	C	Conduce	Personal conductor	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
10	PQA1	Parqueadero 1	Primera zona de parqueo	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
11	PQA2	Parqueadero 2	Segunda zona de parqueo	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
12	PN	Perif‚rico Norte	Zona perif‚rica norte	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
13	PS	Perif‚rico Sur	Zona perif‚rica sur	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
14	REF	Refuerzos	Personal de refuerzo	Activo	2025-11-02 20:25:39.861813	2025-11-02 20:25:39.861813
\.


--
-- TOC entry 5949 (class 0 OID 42007)
-- Dependencies: 224
-- Data for Name: cargos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cargos (id_cargo, nombre_cargo, salario_base, created_at, updated_at) FROM stdin;
1	Supervisor Control	1782000.00	2025-11-02 20:25:39.839985	2025-11-02 20:25:39.839985
2	Auxiliar Control	1586898.00	2025-11-02 20:25:39.839985	2025-11-02 20:25:39.839985
3	Auxiliar Alcoholimetr¡a	1300000.00	2025-11-02 20:25:39.839985	2025-11-02 20:25:39.839985
\.


--
-- TOC entry 5953 (class 0 OID 42032)
-- Dependencies: 228
-- Data for Name: empleados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.empleados (id_empleado, cedula, nombres_apellidos, edad, sexo, id_cargo, id_area, vehiculo_placa, vehiculo_marca, estado, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5971 (class 0 OID 42190)
-- Dependencies: 246
-- Data for Name: festivos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.festivos (id_festivo, fecha, nombre_festivo, tipo, recargable, created_at) FROM stdin;
\.


--
-- TOC entry 5961 (class 0 OID 42104)
-- Dependencies: 236
-- Data for Name: labor_mes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.labor_mes (id_labor_mes, id_empleado, fecha_inicio, fecha_fin, total_horas_trabajadas, dias_trabajados, dias_descanso, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5963 (class 0 OID 42121)
-- Dependencies: 238
-- Data for Name: labor_turno; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.labor_turno (id_registro, id_labor_mes, id_turno, id_area, fecha, total_horas_laboradas, created_at) FROM stdin;
\.


--
-- TOC entry 5959 (class 0 OID 42080)
-- Dependencies: 234
-- Data for Name: novedades_empleado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.novedades_empleado (id_novedad_registro, id_empleado, id_novedad_tipo, fecha_inicio, fecha_fin, cantidad, observaciones, etapa, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5969 (class 0 OID 42177)
-- Dependencies: 244
-- Data for Name: parametros; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parametros (id_parametro, nombre_parametro, valor_parametro, descripcion, periodicidad, horas_maximas, fecha_actualizacion, updated_at) FROM stdin;
1	SALARIO_MINIMO	1300000	Salario m¡nimo legal vigente	Anual	\N	2025-11-02 20:25:39.866806	2025-11-02 20:25:39.866806
2	AUXILIO_TRANSPORTE	162000	Valor del auxilio de transporte	Anual	\N	2025-11-02 20:25:39.866806	2025-11-02 20:25:39.866806
3	DIAS_DESCANSO_MES	6	D¡as de descanso obligatorios por mes	Mensual	\N	2025-11-02 20:25:39.866806	2025-11-02 20:25:39.866806
4	HORAS_MAXIMAS_DIA	12	M ximo de horas laboradas por d¡a	Diario	12	2025-11-02 20:25:39.866806	2025-11-02 20:25:39.866806
5	HORAS_MAXIMAS_SEMANA	48	M ximo de horas laboradas por semana	Semanal	48	2025-11-02 20:25:39.866806	2025-11-02 20:25:39.866806
\.


--
-- TOC entry 5967 (class 0 OID 42157)
-- Dependencies: 242
-- Data for Name: recargos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recargos (id_recargo, id_labor_mes, id_recargo_tipo, fecha, cantidad_horas, valor_total, created_at) FROM stdin;
\.


--
-- TOC entry 5973 (class 0 OID 42201)
-- Dependencies: 248
-- Data for Name: refuerzos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refuerzos (id_refuerzo, id_empleado, areas_disponibles, horario_preferido, disponibilidad, "experiencia_a¤os", telefono, estado, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5650 (class 0 OID 16710)
-- Dependencies: 219
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 5957 (class 0 OID 42069)
-- Dependencies: 232
-- Data for Name: tipos_novedad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_novedad (id_novedad_tipo, codigo, nombre_novedad, afecta_pago, created_at) FROM stdin;
1	INC	Incapacidad	t	2025-11-02 20:25:39.851745
2	VAC	Vacaciones	f	2025-11-02 20:25:39.851745
3	PER	Permiso	t	2025-11-02 20:25:39.851745
4	LIC	Licencia	t	2025-11-02 20:25:39.851745
5	COM	Compensatorio	f	2025-11-02 20:25:39.851745
6	LL	Ley de Luto	f	2025-11-02 20:25:39.851745
7	LM	Licencia Maternidad	f	2025-11-02 20:25:39.851745
\.


--
-- TOC entry 5965 (class 0 OID 42145)
-- Dependencies: 240
-- Data for Name: tipos_recargo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_recargo (id_recargo_tipo, codigo, nombre_recargo, porcentaje_recargo, descripcion, created_at) FROM stdin;
1	RNO	Recargo Nocturno Ordinario	35.00	Recargo por trabajo nocturno entre 10PM y 6AM	2025-11-02 20:25:39.855768
2	RNF	Recargo Nocturno Festivo	100.00	Recargo por trabajo nocturno en d¡a festivo	2025-11-02 20:25:39.855768
3	HEOD	Horas Extras Diurnas Ordinarias	25.00	Horas extras en horario diurno	2025-11-02 20:25:39.855768
4	HEON	Horas Extras Nocturnas Ordinarias	75.00	Horas extras en horario nocturno	2025-11-02 20:25:39.855768
5	HEFD	Horas Extras Festivas Diurnas	100.00	Horas extras en d¡a festivo diurno	2025-11-02 20:25:39.855768
6	HEFN	Horas Extras Festivas Nocturnas	150.00	Horas extras en d¡a festivo nocturno	2025-11-02 20:25:39.855768
7	DOM	Dominical	75.00	Recargo por trabajo dominical	2025-11-02 20:25:39.855768
8	FES	Festivo	75.00	Recargo por trabajo en d¡a festivo	2025-11-02 20:25:39.855768
\.


--
-- TOC entry 5955 (class 0 OID 42056)
-- Dependencies: 230
-- Data for Name: turnos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.turnos (id_turno, codigo_turno, hora_entrada, hora_salida, tipo_turno, thl, estado, created_at, updated_at) FROM stdin;
1	T1	04:00:00	12:00:00	Diurno	8	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
2	T2	05:00:00	13:00:00	Diurno	8	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
3	T3	11:00:00	19:00:00	Diurno	8	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
4	T5	06:00:00	14:00:00	Diurno	8	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
5	T6	08:00:00	18:00:00	Diurno	8	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
6	T7	12:00:00	20:00:00	Diurno	8	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
7	T8	13:00:00	21:00:00	Diurno	8	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
8	T9	04:00:00	13:00:00	Diurno	9	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
9	T10	13:00:00	22:00:00	Mixto	9	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
10	T11	14:00:00	22:00:00	Nocturno	8	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
11	T13	22:00:00	06:00:00	Nocturno	8	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
12	D	00:00:00	00:00:00	Descanso	0	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
13	C	00:00:00	00:00:00	Compensatorio	0	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
14	I	00:00:00	00:00:00	Incapacidad	0	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
15	P	00:00:00	00:00:00	Permiso No Remunerado	0	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
16	V	00:00:00	00:00:00	Vacaciones	0	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
17	LT	00:00:00	00:00:00	Ley de Luto	0	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
18	LM	00:00:00	00:00:00	Licencia Maternidad	0	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
19	R	00:00:00	00:00:00	Permiso Remunerado	0	Activo	2025-11-02 20:25:39.847521	2025-11-02 20:25:39.847521
\.


--
-- TOC entry 6003 (class 0 OID 0)
-- Dependencies: 225
-- Name: areas_id_area_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.areas_id_area_seq', 14, true);


--
-- TOC entry 6004 (class 0 OID 0)
-- Dependencies: 223
-- Name: cargos_id_cargo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cargos_id_cargo_seq', 3, true);


--
-- TOC entry 6005 (class 0 OID 0)
-- Dependencies: 227
-- Name: empleados_id_empleado_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empleados_id_empleado_seq', 1, false);


--
-- TOC entry 6006 (class 0 OID 0)
-- Dependencies: 245
-- Name: festivos_id_festivo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.festivos_id_festivo_seq', 1, false);


--
-- TOC entry 6007 (class 0 OID 0)
-- Dependencies: 235
-- Name: labor_mes_id_labor_mes_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.labor_mes_id_labor_mes_seq', 1, false);


--
-- TOC entry 6008 (class 0 OID 0)
-- Dependencies: 237
-- Name: labor_turno_id_registro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.labor_turno_id_registro_seq', 1, false);


--
-- TOC entry 6009 (class 0 OID 0)
-- Dependencies: 233
-- Name: novedades_empleado_id_novedad_registro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.novedades_empleado_id_novedad_registro_seq', 1, false);


--
-- TOC entry 6010 (class 0 OID 0)
-- Dependencies: 243
-- Name: parametros_id_parametro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parametros_id_parametro_seq', 5, true);


--
-- TOC entry 6011 (class 0 OID 0)
-- Dependencies: 241
-- Name: recargos_id_recargo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recargos_id_recargo_seq', 1, false);


--
-- TOC entry 6012 (class 0 OID 0)
-- Dependencies: 247
-- Name: refuerzos_id_refuerzo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refuerzos_id_refuerzo_seq', 1, false);


--
-- TOC entry 6013 (class 0 OID 0)
-- Dependencies: 231
-- Name: tipos_novedad_id_novedad_tipo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipos_novedad_id_novedad_tipo_seq', 7, true);


--
-- TOC entry 6014 (class 0 OID 0)
-- Dependencies: 239
-- Name: tipos_recargo_id_recargo_tipo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipos_recargo_id_recargo_tipo_seq', 8, true);


--
-- TOC entry 6015 (class 0 OID 0)
-- Dependencies: 229
-- Name: turnos_id_turno_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.turnos_id_turno_seq', 19, true);


--
-- TOC entry 5711 (class 2606 OID 42030)
-- Name: areas areas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_codigo_key UNIQUE (codigo);


--
-- TOC entry 5713 (class 2606 OID 42028)
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id_area);


--
-- TOC entry 5707 (class 2606 OID 42016)
-- Name: cargos cargos_nombre_cargo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_nombre_cargo_key UNIQUE (nombre_cargo);


--
-- TOC entry 5709 (class 2606 OID 42014)
-- Name: cargos cargos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_pkey PRIMARY KEY (id_cargo);


--
-- TOC entry 5717 (class 2606 OID 42044)
-- Name: empleados empleados_cedula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_cedula_key UNIQUE (cedula);


--
-- TOC entry 5719 (class 2606 OID 42042)
-- Name: empleados empleados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id_empleado);


--
-- TOC entry 5761 (class 2606 OID 42199)
-- Name: festivos festivos_fecha_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.festivos
    ADD CONSTRAINT festivos_fecha_key UNIQUE (fecha);


--
-- TOC entry 5763 (class 2606 OID 42197)
-- Name: festivos festivos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.festivos
    ADD CONSTRAINT festivos_pkey PRIMARY KEY (id_festivo);


--
-- TOC entry 5740 (class 2606 OID 42114)
-- Name: labor_mes labor_mes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labor_mes
    ADD CONSTRAINT labor_mes_pkey PRIMARY KEY (id_labor_mes);


--
-- TOC entry 5746 (class 2606 OID 42128)
-- Name: labor_turno labor_turno_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labor_turno
    ADD CONSTRAINT labor_turno_pkey PRIMARY KEY (id_registro);


--
-- TOC entry 5736 (class 2606 OID 42092)
-- Name: novedades_empleado novedades_empleado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.novedades_empleado
    ADD CONSTRAINT novedades_empleado_pkey PRIMARY KEY (id_novedad_registro);


--
-- TOC entry 5757 (class 2606 OID 42188)
-- Name: parametros parametros_nombre_parametro_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametros
    ADD CONSTRAINT parametros_nombre_parametro_key UNIQUE (nombre_parametro);


--
-- TOC entry 5759 (class 2606 OID 42186)
-- Name: parametros parametros_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parametros
    ADD CONSTRAINT parametros_pkey PRIMARY KEY (id_parametro);


--
-- TOC entry 5755 (class 2606 OID 42165)
-- Name: recargos recargos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recargos
    ADD CONSTRAINT recargos_pkey PRIMARY KEY (id_recargo);


--
-- TOC entry 5768 (class 2606 OID 42211)
-- Name: refuerzos refuerzos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refuerzos
    ADD CONSTRAINT refuerzos_pkey PRIMARY KEY (id_refuerzo);


--
-- TOC entry 5729 (class 2606 OID 42078)
-- Name: tipos_novedad tipos_novedad_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_novedad
    ADD CONSTRAINT tipos_novedad_codigo_key UNIQUE (codigo);


--
-- TOC entry 5731 (class 2606 OID 42076)
-- Name: tipos_novedad tipos_novedad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_novedad
    ADD CONSTRAINT tipos_novedad_pkey PRIMARY KEY (id_novedad_tipo);


--
-- TOC entry 5748 (class 2606 OID 42155)
-- Name: tipos_recargo tipos_recargo_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_recargo
    ADD CONSTRAINT tipos_recargo_codigo_key UNIQUE (codigo);


--
-- TOC entry 5750 (class 2606 OID 42153)
-- Name: tipos_recargo tipos_recargo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_recargo
    ADD CONSTRAINT tipos_recargo_pkey PRIMARY KEY (id_recargo_tipo);


--
-- TOC entry 5725 (class 2606 OID 42067)
-- Name: turnos turnos_codigo_turno_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_codigo_turno_key UNIQUE (codigo_turno);


--
-- TOC entry 5727 (class 2606 OID 42065)
-- Name: turnos turnos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_pkey PRIMARY KEY (id_turno);


--
-- TOC entry 5714 (class 1259 OID 42221)
-- Name: idx_areas_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_areas_codigo ON public.areas USING btree (codigo);


--
-- TOC entry 5715 (class 1259 OID 42222)
-- Name: idx_areas_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_areas_estado ON public.areas USING btree (estado);


--
-- TOC entry 5720 (class 1259 OID 42218)
-- Name: idx_empleados_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empleados_area ON public.empleados USING btree (id_area);


--
-- TOC entry 5721 (class 1259 OID 42217)
-- Name: idx_empleados_cargo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empleados_cargo ON public.empleados USING btree (id_cargo);


--
-- TOC entry 5722 (class 1259 OID 42219)
-- Name: idx_empleados_cedula; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empleados_cedula ON public.empleados USING btree (cedula);


--
-- TOC entry 5723 (class 1259 OID 42220)
-- Name: idx_empleados_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_empleados_estado ON public.empleados USING btree (estado);


--
-- TOC entry 5764 (class 1259 OID 42224)
-- Name: idx_festivos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_festivos_fecha ON public.festivos USING btree (fecha);


--
-- TOC entry 5737 (class 1259 OID 42227)
-- Name: idx_labor_mes_empleado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_labor_mes_empleado ON public.labor_mes USING btree (id_empleado);


--
-- TOC entry 5738 (class 1259 OID 42228)
-- Name: idx_labor_mes_fechas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_labor_mes_fechas ON public.labor_mes USING btree (fecha_inicio, fecha_fin);


--
-- TOC entry 5741 (class 1259 OID 42223)
-- Name: idx_labor_turno_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_labor_turno_area ON public.labor_turno USING btree (id_area);


--
-- TOC entry 5742 (class 1259 OID 42231)
-- Name: idx_labor_turno_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_labor_turno_fecha ON public.labor_turno USING btree (fecha);


--
-- TOC entry 5743 (class 1259 OID 42229)
-- Name: idx_labor_turno_labor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_labor_turno_labor ON public.labor_turno USING btree (id_labor_mes);


--
-- TOC entry 5744 (class 1259 OID 42230)
-- Name: idx_labor_turno_turno; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_labor_turno_turno ON public.labor_turno USING btree (id_turno);


--
-- TOC entry 5732 (class 1259 OID 42235)
-- Name: idx_novedades_empleado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_novedades_empleado ON public.novedades_empleado USING btree (id_empleado);


--
-- TOC entry 5733 (class 1259 OID 42237)
-- Name: idx_novedades_fechas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_novedades_fechas ON public.novedades_empleado USING btree (fecha_inicio, fecha_fin);


--
-- TOC entry 5734 (class 1259 OID 42236)
-- Name: idx_novedades_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_novedades_tipo ON public.novedades_empleado USING btree (id_novedad_tipo);


--
-- TOC entry 5751 (class 1259 OID 42234)
-- Name: idx_recargos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recargos_fecha ON public.recargos USING btree (fecha);


--
-- TOC entry 5752 (class 1259 OID 42232)
-- Name: idx_recargos_labor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recargos_labor ON public.recargos USING btree (id_labor_mes);


--
-- TOC entry 5753 (class 1259 OID 42233)
-- Name: idx_recargos_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recargos_tipo ON public.recargos USING btree (id_recargo_tipo);


--
-- TOC entry 5765 (class 1259 OID 42225)
-- Name: idx_refuerzos_empleado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refuerzos_empleado ON public.refuerzos USING btree (id_empleado);


--
-- TOC entry 5766 (class 1259 OID 42226)
-- Name: idx_refuerzos_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refuerzos_estado ON public.refuerzos USING btree (estado);


--
-- TOC entry 5946 (class 2618 OID 42277)
-- Name: v_refuerzos_disponibles _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.v_refuerzos_disponibles AS
 SELECT r.id_refuerzo,
    r.id_empleado,
    r.horario_preferido,
    r.disponibilidad,
    r."experiencia_a¤os",
    r.telefono,
    r.areas_disponibles,
    r.estado,
    e.nombres_apellidos,
    e.cedula,
    c.nombre_cargo,
    string_agg((a.nombre_area)::text, ', '::text ORDER BY (a.nombre_area)::text) AS areas_nombres
   FROM ((((public.refuerzos r
     JOIN public.empleados e ON ((r.id_empleado = e.id_empleado)))
     JOIN public.cargos c ON ((e.id_cargo = c.id_cargo)))
     LEFT JOIN LATERAL unnest(r.areas_disponibles) area_id(area_id) ON (true))
     LEFT JOIN public.areas a ON ((area_id.area_id = a.id_area)))
  WHERE ((r.estado)::text = 'Disponible'::text)
  GROUP BY r.id_refuerzo, e.id_empleado, e.nombres_apellidos, e.cedula, c.nombre_cargo, r.horario_preferido, r.disponibilidad, r."experiencia_a¤os", r.telefono, r.areas_disponibles, r.estado;


--
-- TOC entry 5786 (class 2620 OID 42294)
-- Name: labor_turno trigger_calcular_horas; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_calcular_horas AFTER INSERT OR DELETE OR UPDATE ON public.labor_turno FOR EACH ROW EXECUTE FUNCTION public.calcular_horas_labor_mes();


--
-- TOC entry 5781 (class 2620 OID 42291)
-- Name: areas update_areas_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5780 (class 2620 OID 42286)
-- Name: cargos update_cargos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON public.cargos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5782 (class 2620 OID 42285)
-- Name: empleados update_empleados_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON public.empleados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5785 (class 2620 OID 42288)
-- Name: labor_mes update_labor_mes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_labor_mes_updated_at BEFORE UPDATE ON public.labor_mes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5784 (class 2620 OID 42289)
-- Name: novedades_empleado update_novedades_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_novedades_updated_at BEFORE UPDATE ON public.novedades_empleado FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5787 (class 2620 OID 42290)
-- Name: parametros update_parametros_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_parametros_updated_at BEFORE UPDATE ON public.parametros FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5788 (class 2620 OID 42292)
-- Name: refuerzos update_refuerzos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_refuerzos_updated_at BEFORE UPDATE ON public.refuerzos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5783 (class 2620 OID 42287)
-- Name: turnos update_turnos_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_turnos_updated_at BEFORE UPDATE ON public.turnos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5769 (class 2606 OID 42050)
-- Name: empleados empleados_id_area_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_id_area_fkey FOREIGN KEY (id_area) REFERENCES public.areas(id_area);


--
-- TOC entry 5770 (class 2606 OID 42045)
-- Name: empleados empleados_id_cargo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_id_cargo_fkey FOREIGN KEY (id_cargo) REFERENCES public.cargos(id_cargo);


--
-- TOC entry 5773 (class 2606 OID 42115)
-- Name: labor_mes labor_mes_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labor_mes
    ADD CONSTRAINT labor_mes_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.empleados(id_empleado);


--
-- TOC entry 5774 (class 2606 OID 42139)
-- Name: labor_turno labor_turno_id_area_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labor_turno
    ADD CONSTRAINT labor_turno_id_area_fkey FOREIGN KEY (id_area) REFERENCES public.areas(id_area);


--
-- TOC entry 5775 (class 2606 OID 42129)
-- Name: labor_turno labor_turno_id_labor_mes_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labor_turno
    ADD CONSTRAINT labor_turno_id_labor_mes_fkey FOREIGN KEY (id_labor_mes) REFERENCES public.labor_mes(id_labor_mes);


--
-- TOC entry 5776 (class 2606 OID 42134)
-- Name: labor_turno labor_turno_id_turno_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.labor_turno
    ADD CONSTRAINT labor_turno_id_turno_fkey FOREIGN KEY (id_turno) REFERENCES public.turnos(id_turno);


--
-- TOC entry 5771 (class 2606 OID 42093)
-- Name: novedades_empleado novedades_empleado_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.novedades_empleado
    ADD CONSTRAINT novedades_empleado_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.empleados(id_empleado);


--
-- TOC entry 5772 (class 2606 OID 42098)
-- Name: novedades_empleado novedades_empleado_id_novedad_tipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.novedades_empleado
    ADD CONSTRAINT novedades_empleado_id_novedad_tipo_fkey FOREIGN KEY (id_novedad_tipo) REFERENCES public.tipos_novedad(id_novedad_tipo);


--
-- TOC entry 5777 (class 2606 OID 42166)
-- Name: recargos recargos_id_labor_mes_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recargos
    ADD CONSTRAINT recargos_id_labor_mes_fkey FOREIGN KEY (id_labor_mes) REFERENCES public.labor_mes(id_labor_mes);


--
-- TOC entry 5778 (class 2606 OID 42171)
-- Name: recargos recargos_id_recargo_tipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recargos
    ADD CONSTRAINT recargos_id_recargo_tipo_fkey FOREIGN KEY (id_recargo_tipo) REFERENCES public.tipos_recargo(id_recargo_tipo);


--
-- TOC entry 5779 (class 2606 OID 42212)
-- Name: refuerzos refuerzos_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refuerzos
    ADD CONSTRAINT refuerzos_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.empleados(id_empleado);


-- Completed on 2025-12-05 22:16:24

--
-- PostgreSQL database dump complete
--

\unrestrict swlpMN6u4C1UVyHxhf8r32WH4Gocac4prw5csrABdGeK6sEgSFiTHZtEmlxkpFb

