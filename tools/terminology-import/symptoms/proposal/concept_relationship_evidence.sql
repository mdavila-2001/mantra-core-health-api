-- =============================================================================
-- OBSOLETA (2026-10-27): el repo del modelo entregó la tabla el 2026-10-25 (v4.2.50,
-- SQL/patches/2026-10-25_v4250_terminology_relationship_evidence.sql, commit e8bd453)
-- con otras columnas. `load-disease-phenotypes.mjs` ya escribe contra ESA tabla; este
-- archivo queda sólo como registro de la propuesta original. No aplicar.
-- =============================================================================
-- =============================================================================
-- PROPUESTA para mantra-core-technologies/mantra-core-health-model (módulo 03).
-- NO es una migración: la API no escribe DDL (ADR-0021). Este archivo existe
-- para que el repo del modelo lo evalúe y para probar `load-disease-phenotypes.mjs`
-- contra un Postgres desechable. Ver docs/seed-research/symptoms.md § Modelo.
--
-- Problema: `terminology.concept_relationships` guarda origen, destino, tipo y
-- ordinal. Una anotación enfermedad → fenotipo publicada trae además fuente, id
-- de origen, versión, frecuencia (término HPO, n/m o %), evidencia (PCS, TAS,
-- IEA, ITM), referencias, inicio, sexo, modificadores y negación. Varias líneas
-- de la fuente (distintos artículos, distinta frecuencia) afirman la MISMA
-- arista, así que la evidencia es 1:N con la relación, no columnas de ella.
-- =============================================================================

CREATE TABLE IF NOT EXISTS "terminology"."concept_relationship_evidence" (
    "id" uuid NOT NULL,
    "relationship_id" uuid NOT NULL,
    "source_id" uuid NOT NULL,
    "source_record_key" varchar NOT NULL,
    "source_version" varchar,
    "source_uri" text,
    "retrieved_at" timestamptz,
    "negated" boolean NOT NULL DEFAULT false,
    "frequency_text" varchar,
    "frequency_concept_id" uuid,
    "frequency_numerator" integer,
    "frequency_denominator" integer,
    "frequency_percent" numeric(6, 3),
    "evidence_code" varchar,
    "onset_concept_id" uuid,
    "sex" varchar,
    "source_references" jsonb,
    "qualifiers" jsonb,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "created_by_user_id" uuid,
    "updated_by_user_id" uuid,
    "row_version" integer NOT NULL DEFAULT 1,
    CONSTRAINT "pk_concept_relationship_evidence" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_concept_relationship_evidence_record"
    ON "terminology"."concept_relationship_evidence" ("relationship_id", "source_id", "source_record_key");
CREATE INDEX IF NOT EXISTS "ix_concept_relationship_evidence_relationship_id"
    ON "terminology"."concept_relationship_evidence" ("relationship_id");
CREATE INDEX IF NOT EXISTS "ix_concept_relationship_evidence_source_id"
    ON "terminology"."concept_relationship_evidence" ("source_id");

ALTER TABLE "terminology"."concept_relationship_evidence"
    ADD CONSTRAINT "fk_concept_relationship_evidence_relationship_id" FOREIGN KEY ("relationship_id")
    REFERENCES "terminology"."concept_relationships" ("id");
ALTER TABLE "terminology"."concept_relationship_evidence"
    ADD CONSTRAINT "fk_concept_relationship_evidence_source_id" FOREIGN KEY ("source_id")
    REFERENCES "terminology"."terminology_sources" ("id");
ALTER TABLE "terminology"."concept_relationship_evidence"
    ADD CONSTRAINT "fk_concept_relationship_evidence_frequency_concept_id" FOREIGN KEY ("frequency_concept_id")
    REFERENCES "terminology"."catalog_concepts" ("id");
ALTER TABLE "terminology"."concept_relationship_evidence"
    ADD CONSTRAINT "fk_concept_relationship_evidence_onset_concept_id" FOREIGN KEY ("onset_concept_id")
    REFERENCES "terminology"."catalog_concepts" ("id");

-- Además (dato, no DDL; lo siembra la API en src/common/constants/concepts.ts):
--   REL_SYMPTOM_EXCLUDED  'terminology:relationship:symptom-excluded'
-- para las anotaciones que la fuente NIEGA (HPOA `qualifier = NOT`): una
-- negación nunca puede quedar como REL_SYMPTOM.
