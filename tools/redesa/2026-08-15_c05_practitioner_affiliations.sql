-- Carril 05 — tabla `profiles.practitioner_affiliations`.
--
-- Deuda upstream: la entidad, repositorio, servicio, controlador y DTOs de
-- UC-05-16 (historial laboral) se shippearon en un carril anterior SIN que la
-- tabla llegara nunca al modelo canónico (.puml), al DDL generado (SQL/) ni a
-- la base. Resultado: `GET/POST /profiles/practitioners/me/affiliations`
-- respondía 500 y la pestaña Trayectoria del perfil no tenía dónde persistir.
--
-- Este archivo es la MISMA salida que produce `gen_ddl.py 05` para la entidad
-- recién agregada al `.puml` — se extrae aparte porque regenerar el módulo
-- entero en este workspace pierde 7 FK ya resueltas (el generador las lee de
-- `vitara/SALUD/FK/`, un vault que no está presente acá).
--
-- Idempotente: se puede correr más de una vez.

CREATE TABLE IF NOT EXISTS "profiles"."practitioner_affiliations" (
    "id" uuid NOT NULL,
    "practitioner_profile_id" uuid NOT NULL,
    "organization_name" varchar NOT NULL,
    "practice_site_id" uuid,
    "role_title" varchar NOT NULL,
    "department_text" varchar,
    "affiliation_type_concept_id" uuid,
    "start_date" date NOT NULL,
    "end_date" date,
    "status_concept_id" uuid NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    -- `DEFAULT 1` no lo emite `gen_ddl.py` (el .puml no modela defaults), pero
    -- las 17 tablas hermanas de `profiles` lo tienen y MikroORM cuenta con él:
    -- sin el default, el INSERT manda `row_version` en NULL y la fila viola el
    -- NOT NULL. Se agrega para igualar la convención del schema.
    "row_version" integer NOT NULL DEFAULT 1,
    CONSTRAINT "pk_practitioner_affiliations" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ix_practitioner_affiliations_practitioner_profile_id" ON "profiles"."practitioner_affiliations" ("practitioner_profile_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_affiliations_practice_site_id" ON "profiles"."practitioner_affiliations" ("practice_site_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_affiliations_affiliation_type_concept_id" ON "profiles"."practitioner_affiliations" ("affiliation_type_concept_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_affiliations_status_concept_id" ON "profiles"."practitioner_affiliations" ("status_concept_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_affiliations_created_by_user_id" ON "profiles"."practitioner_affiliations" ("created_by_user_id");

CREATE INDEX IF NOT EXISTS "ix_practitioner_affiliations_updated_by_user_id" ON "profiles"."practitioner_affiliations" ("updated_by_user_id");

-- Mismo criterio de duplicado que aplica el servicio (`findSame`): misma
-- institución, mismo cargo y mismo inicio es un doble envío del formulario,
-- no dos vínculos reales.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_practitioner_affiliation_same" ON "profiles"."practitioner_affiliations" ("practitioner_profile_id", "organization_name", "role_title", "start_date");

-- FK del propio schema.
DO $$ BEGIN
    ALTER TABLE "profiles"."practitioner_affiliations"
        ADD CONSTRAINT "fk_practitioner_affiliations_practitioner_profile_id" FOREIGN KEY ("practitioner_profile_id")
        REFERENCES "profiles"."health_practitioner_profiles" ("profile_id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- FK cross-schema.
DO $$ BEGIN
    ALTER TABLE "profiles"."practitioner_affiliations"
        ADD CONSTRAINT "fk_practitioner_affiliations_practice_site_id" FOREIGN KEY ("practice_site_id")
        REFERENCES "practice"."practice_sites" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."practitioner_affiliations"
        ADD CONSTRAINT "fk_practitioner_affiliations_affiliation_type_concept_id" FOREIGN KEY ("affiliation_type_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."practitioner_affiliations"
        ADD CONSTRAINT "fk_practitioner_affiliations_status_concept_id" FOREIGN KEY ("status_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."practitioner_affiliations"
        ADD CONSTRAINT "fk_practitioner_affiliations_created_by_user_id" FOREIGN KEY ("created_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "profiles"."practitioner_affiliations"
        ADD CONSTRAINT "fk_practitioner_affiliations_updated_by_user_id" FOREIGN KEY ("updated_by_user_id")
        REFERENCES "iam"."users" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
