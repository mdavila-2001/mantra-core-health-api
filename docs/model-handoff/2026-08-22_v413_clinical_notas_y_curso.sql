-- ============================================================================
-- SALUD · patch v4.1.3 (notas clínicas, curso y indicaciones) sobre una BD viva
-- Fecha: 2026-08-22
-- Idempotente (ADD COLUMN ... IF NOT EXISTS / duplicate_object / IF NOT EXISTS)
--
-- ⚠️ COPIA DE ENTREGA — su lugar definitivo es `SQL/patches/`.
--
-- Este archivo NO es una fuente de DDL de la API y nadie debe aplicarlo desde
-- acá. Está en el repositorio porque `SQL/`, `Mantra Core Health Context/` y
-- `salud-db/` no son repositorios git: viven solo en la máquina de quien
-- mantiene el modelo, y no había otra forma de hacerle llegar esto a Marcelo.
-- El original ya está en `SQL/patches/2026-08-22_v413_clinical_notas_y_curso.sql`
-- de la copia local desde la que se generó.
--
-- Al recibirlo: moverlo a `SQL/patches/` y borrar esta copia. Dejar dos fuentes
-- de DDL es exactamente lo que la política de `ddl-sources.md` prohíbe, y lo que
-- ya rompió el esquema dos veces (v4.0.8 y v4.0.9).
--
-- POR QUÉ EXISTE
--
-- El commit `modelo(v4.1.3): notas clínicas, indicaciones al paciente y el hueco
-- de B-9` promovió estas cinco columnas al ORM —entidades, DTOs, repositorios y
-- servicios— pero no llegó a materializarlas en el esquema. Con el ORM
-- declarándolas y la base sin ellas, MikroORM las incluye en cada INSERT y
-- Postgres rechaza la sentencia entera:
--
--   column "patient_instructions_text" of relation "medication_requests"
--   does not exist
--
-- El efecto era total, no parcial: NINGUNA receta y NINGÚN diagnóstico se podían
-- guardar. En pantalla se veía como «Error interno del servidor» al prescribir.
--
-- QUÉ AGREGA
--
-- clinical.conditions
--   · clinical_course_concept_id  — agudo / crónico / subagudo / recurrente
--   · expected_resolution_at      — cuándo se espera que se resuelva
--   · note_text                   — hallazgos y justificación clínica; el campo
--                                   ya se ofrecía en pantalla y se descartaba en
--                                   silencio por no tener destino
--
-- clinical.medication_requests
--   · indication_condition_id     — el diagnóstico que justifica la receta: es
--                                   lo que permite responder «¿por qué toma
--                                   esto?» sin adivinar
--   · patient_instructions_text   — la indicación que se imprime en la receta,
--                                   en las palabras del médico
--
-- Las cinco NULLABLE: son datos que enriquecen el registro, no que lo
-- condicionan. Una receta puede no citar diagnóstico y un diagnóstico puede no
-- llevar nota, y ninguno de los dos casos es un error.
--
-- IMPORTANTE: aplicar con el rol propietario (mantra).
-- ============================================================================

-- ---- clinical.conditions ---------------------------------------------------

ALTER TABLE "clinical"."conditions"
    ADD COLUMN IF NOT EXISTS "clinical_course_concept_id" uuid;

ALTER TABLE "clinical"."conditions"
    ADD COLUMN IF NOT EXISTS "expected_resolution_at" timestamptz;

ALTER TABLE "clinical"."conditions"
    ADD COLUMN IF NOT EXISTS "note_text" text;

DO $$ BEGIN
    ALTER TABLE "clinical"."conditions"
        ADD CONSTRAINT "fk_conditions_clinical_course_concept_id"
        FOREIGN KEY ("clinical_course_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ix_conditions_clinical_course_concept_id"
    ON "clinical"."conditions" ("clinical_course_concept_id");

-- ---- clinical.medication_requests ------------------------------------------

ALTER TABLE "clinical"."medication_requests"
    ADD COLUMN IF NOT EXISTS "indication_condition_id" uuid;

ALTER TABLE "clinical"."medication_requests"
    ADD COLUMN IF NOT EXISTS "patient_instructions_text" text;

DO $$ BEGIN
    ALTER TABLE "clinical"."medication_requests"
        ADD CONSTRAINT "fk_medication_requests_indication_condition_id"
        FOREIGN KEY ("indication_condition_id")
        REFERENCES "clinical"."conditions" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "ix_medication_requests_indication_condition_id"
    ON "clinical"."medication_requests" ("indication_condition_id");

-- ---- Comprobación ----------------------------------------------------------
-- Las cinco columnas existen, son opcionales, y las dos FKs quedaron validadas.

DO $$
DECLARE faltan text;
BEGIN
    SELECT string_agg(c.col, ', ')
      INTO faltan
      FROM (VALUES
              ('conditions', 'clinical_course_concept_id'),
              ('conditions', 'expected_resolution_at'),
              ('conditions', 'note_text'),
              ('medication_requests', 'indication_condition_id'),
              ('medication_requests', 'patient_instructions_text')
           ) AS c(tab, col)
     WHERE NOT EXISTS (
              SELECT 1 FROM information_schema.columns ic
               WHERE ic.table_schema = 'clinical'
                 AND ic.table_name = c.tab
                 AND ic.column_name = c.col);

    IF faltan IS NOT NULL THEN
        RAISE EXCEPTION 'El patch no dejó el esquema completo; faltan: %', faltan;
    END IF;

    RAISE NOTICE 'Patch v4.1.3 aplicado: 5 columnas, 2 FKs, 2 índices.';
END $$;
