-- SALUD v4.0.10 · schema clinical · constraints de integridad (módulo 33)
-- Aplicar DESPUÉS de 04_indexes.sql y de SQL/_integrity/00_integrity_functions.sql.
-- Reglas textuales del modelo. Las UK/CHECK/EXCLUDE son SCAFFOLD (completar
-- columnas/expresión exactas contra la tabla): el modelo las declara en prosa.

CREATE EXTENSION IF NOT EXISTS btree_gist;  -- requerido por EXCLUDE


-- ═══ service_requests ═══
-- CHECK concreto declarado por el modelo (CHECK_SQL).
ALTER TABLE "clinical"."service_requests" DROP CONSTRAINT IF EXISTS "ck_service_requests_override_reason_requires_previous_report";
ALTER TABLE "clinical"."service_requests" ADD CONSTRAINT "ck_service_requests_override_reason_requires_previous_report" CHECK (("duplicate_override_reason" IS NULL OR "previous_diagnostic_report_id" IS NOT NULL));


-- ═══ appointments ═══
-- TODO EXCLUDE (practitioner/location time overlap): ALTER TABLE "clinical"."appointments" ADD CONSTRAINT "ex_appointments_..." EXCLUDE USING gist (... WITH =, tstzrange(...) WITH &&) [WHERE ...];
-- EXCLUDE concreto declarado por el modelo (EXCLUDE_SQL).
ALTER TABLE "clinical"."appointments" DROP CONSTRAINT IF EXISTS "ex_appointments_practitioner_time";
ALTER TABLE "clinical"."appointments" ADD CONSTRAINT "ex_appointments_practitioner_time"
    EXCLUDE USING gist ("practitioner_profile_id" WITH =, tstzrange("start_at", "end_at", '[)') WITH &&) WHERE ("practitioner_profile_id" IS NOT NULL AND "end_at" IS NOT NULL AND "status_concept_id" IN ('51530fd7-05b1-5c29-80c4-da740ede4d27', '37dded87-7a7a-5a24-86f6-0ef48cccb482'));

--   LOCK: reservation confirmation transaction


-- ═══ medication_requests (patch v4.2.35 · posología estructurada) ═══
ALTER TABLE "clinical"."medication_requests" DROP CONSTRAINT IF EXISTS "ck_medication_requests_timing_frequency_positive";
ALTER TABLE "clinical"."medication_requests" ADD CONSTRAINT "ck_medication_requests_timing_frequency_positive" CHECK (("timing_frequency" IS NULL OR "timing_frequency" >= 1));
ALTER TABLE "clinical"."medication_requests" DROP CONSTRAINT IF EXISTS "ck_medication_requests_timing_period_positive";
ALTER TABLE "clinical"."medication_requests" ADD CONSTRAINT "ck_medication_requests_timing_period_positive" CHECK (("timing_period" IS NULL OR "timing_period" > 0));
ALTER TABLE "clinical"."medication_requests" DROP CONSTRAINT IF EXISTS "ck_medication_requests_timing_period_unit";
ALTER TABLE "clinical"."medication_requests" ADD CONSTRAINT "ck_medication_requests_timing_period_unit" CHECK (("timing_period_unit" IS NULL OR "timing_period_unit" IN ('h', 'd', 'wk')));
ALTER TABLE "clinical"."medication_requests" DROP CONSTRAINT IF EXISTS "ck_medication_requests_timing_frequency_period_together";
ALTER TABLE "clinical"."medication_requests" ADD CONSTRAINT "ck_medication_requests_timing_frequency_period_together" CHECK ((("timing_frequency" IS NULL) = ("timing_period" IS NULL) AND ("timing_period" IS NULL) = ("timing_period_unit" IS NULL)));
ALTER TABLE "clinical"."medication_requests" DROP CONSTRAINT IF EXISTS "ck_medication_requests_timing_times_of_day_array";
ALTER TABLE "clinical"."medication_requests" ADD CONSTRAINT "ck_medication_requests_timing_times_of_day_array" CHECK (("timing_times_of_day" IS NULL OR jsonb_typeof("timing_times_of_day") = 'array'));
ALTER TABLE "clinical"."medication_requests" DROP CONSTRAINT IF EXISTS "ck_medication_requests_timing_exclusive";
ALTER TABLE "clinical"."medication_requests" ADD CONSTRAINT "ck_medication_requests_timing_exclusive" CHECK ((NOT ("timing_frequency" IS NOT NULL AND "timing_times_of_day" IS NOT NULL)) AND (NOT ("timing_as_needed" AND ("timing_frequency" IS NOT NULL OR "timing_times_of_day" IS NOT NULL))));
ALTER TABLE "clinical"."medication_requests" DROP CONSTRAINT IF EXISTS "ck_medication_requests_timing_duration_days";
ALTER TABLE "clinical"."medication_requests" ADD CONSTRAINT "ck_medication_requests_timing_duration_days" CHECK (("timing_duration_days" IS NULL OR "timing_duration_days" >= 0));
