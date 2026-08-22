-- ============================================================================
-- SALUD · patch v4.1.4 (catálogo boliviano en el perfil, y sigla/dirección de
-- aseguradora) sobre una BD viva
-- Fecha: 2026-08-22
-- Idempotente (ADD COLUMN ... IF NOT EXISTS / duplicate_object / IF NOT EXISTS)
--
-- POR QUÉ EXISTE
--
-- Dos commits del 2026-08-21 promovieron seis columnas al ORM —entidades, DTOs
-- y servicios— sin materializarlas en el esquema:
--
--   ceba7c4d  feat(profiles): catálogo boliviano de departamento/municipio/
--             ocupación en el perfil de paciente
--   880857d6  feat(insurance,directory): sigla y direccion de aseguradora en
--             alta y panel propio
--
-- Es exactamente el mismo defecto que v4.1.3 (notas clínicas): el ORM declara
-- la columna, MikroORM la incluye en el INSERT en cuanto el campo viene con
-- valor, y Postgres rechaza la sentencia entera.
--
-- COMPROBADO EN RUNTIME, no deducido del código. Alta de paciente enviando el
-- departamento emisor de la cédula:
--
--   POST /iam/auth/register-patient  → HTTP 500
--   InvalidFieldNameException: column "issuer_administrative_area_concept_id"
--   of relation "identifiers" does not exist
--
-- El alta SIN ese campo devuelve 201, así que el fallo es intermitente por
-- construcción: aparece sólo cuando la persona completa el desplegable. Es la
-- peor forma de tenerlo, porque no se reproduce en la prueba mínima.
--
-- QUÉ AGREGA
--
-- common.identifiers
--   · issuer_administrative_area_concept_id — el departamento que emitió el
--     documento (SC, LP, CB…). El registro de procesos lo pide con nombre y
--     motivo: «la app tiene que tener como opciones para que el paciente elija
--     la terminación del CI, como SC, LP, CB, etc. … con esto evitamos
--     duplicidad o error del Departamento de la emisión de la cedula».
--
-- common.addresses
--   · municipality_concept_id — el municipio de la dirección.
--
-- profiles.persons
--   · occupation_concept_id  — ocupación tomada del catálogo (el registro de
--     procesos pide las 896 del SEGIP).
--   · occupation_free_text   — «dejar uno al final libre para que él pueda
--     detallar la ocupación que no encontró si no está en ese detalle».
--
-- insurance.insurance_carriers
--   · sigla   — cómo se nombra a la aseguradora en el giro comercial.
--   · address — dirección de su oficina principal.
--
-- Las seis NULLABLE: ninguna condiciona el registro. Una persona puede no
-- declarar ocupación y una aseguradora puede no tener sigla, y ninguno de los
-- dos casos es un error.
--
-- IMPORTANTE: aplicar con el rol propietario (mantra).
-- ============================================================================

-- ---- common.identifiers ----------------------------------------------------

ALTER TABLE "common"."identifiers"
    ADD COLUMN IF NOT EXISTS "issuer_administrative_area_concept_id" uuid;

DO $$ BEGIN
    ALTER TABLE "common"."identifiers"
        ADD CONSTRAINT "fk_identifiers_issuer_administrative_area_concept_id"
        FOREIGN KEY ("issuer_administrative_area_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ix_identifiers_issuer_administrative_area_concept_id"
    ON "common"."identifiers" ("issuer_administrative_area_concept_id");

-- ---- common.addresses ------------------------------------------------------

ALTER TABLE "common"."addresses"
    ADD COLUMN IF NOT EXISTS "municipality_concept_id" uuid;

DO $$ BEGIN
    ALTER TABLE "common"."addresses"
        ADD CONSTRAINT "fk_addresses_municipality_concept_id"
        FOREIGN KEY ("municipality_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ix_addresses_municipality_concept_id"
    ON "common"."addresses" ("municipality_concept_id");

-- ---- profiles.persons ------------------------------------------------------

ALTER TABLE "profiles"."persons"
    ADD COLUMN IF NOT EXISTS "occupation_concept_id" uuid;

ALTER TABLE "profiles"."persons"
    ADD COLUMN IF NOT EXISTS "occupation_free_text" varchar(255);

DO $$ BEGIN
    ALTER TABLE "profiles"."persons"
        ADD CONSTRAINT "fk_persons_occupation_concept_id"
        FOREIGN KEY ("occupation_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ix_persons_occupation_concept_id"
    ON "profiles"."persons" ("occupation_concept_id");

-- ---- insurance.insurance_carriers ------------------------------------------
-- Sin FK ni índice: son dos textos descriptivos, no claves de nada.

ALTER TABLE "insurance"."insurance_carriers"
    ADD COLUMN IF NOT EXISTS "sigla" varchar(255);

ALTER TABLE "insurance"."insurance_carriers"
    ADD COLUMN IF NOT EXISTS "address" varchar(255);

-- ---- Comprobación ----------------------------------------------------------
-- Las seis columnas existen. Si falta alguna, esto rompe en vez de dejar el
-- esquema a medias en silencio.

DO $$
DECLARE faltan text;
BEGIN
    SELECT string_agg(c.sch||'.'||c.tab||'.'||c.col, ', ')
      INTO faltan
      FROM (VALUES
              ('common',    'identifiers',        'issuer_administrative_area_concept_id'),
              ('common',    'addresses',          'municipality_concept_id'),
              ('profiles',  'persons',            'occupation_concept_id'),
              ('profiles',  'persons',            'occupation_free_text'),
              ('insurance', 'insurance_carriers', 'sigla'),
              ('insurance', 'insurance_carriers', 'address')
           ) AS c(sch, tab, col)
     WHERE NOT EXISTS (
              SELECT 1 FROM information_schema.columns ic
               WHERE ic.table_schema = c.sch
                 AND ic.table_name   = c.tab
                 AND ic.column_name  = c.col);

    IF faltan IS NOT NULL THEN
        RAISE EXCEPTION 'El patch no dejó el esquema completo; faltan: %', faltan;
    END IF;

    RAISE NOTICE 'Patch v4.1.4 aplicado: 6 columnas, 3 FKs, 3 índices.';
END $$;
