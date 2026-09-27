-- ============================================================================
-- SALUD · patch v4.2.35 (clinical · posología estructurada de la receta y
-- deduplicación de recordatorios de toma)
-- Fecha: 2026-09-26
-- Idempotente (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS /
-- CREATE INDEX IF NOT EXISTS / ADD CONSTRAINT bajo EXCEPTION duplicate_object /
-- DROP CONSTRAINT IF EXISTS antes de cada CHECK). UNA sola pasada. Sin backfill:
-- las recetas previas quedan sin posología estructurada (timing_* nulos,
-- timing_as_needed = false) y siguen leyéndose por `frequency_text`.
--
-- ORIGEN. Este parche nace en la API (carril «recordatorios de dosis + .ics»,
-- 2026-09-26), no en `mantra-core-health-model`: es uno de los parches propios
-- de la API y tiene que reflejarse en el modelo (entidad `medication_requests`,
-- tabla nueva y sus <<INDEX_SET>>) para que un rebuild desde cero lo incluya.
-- `gen_apply.py` no escanea SQL/patches/.
--
-- QUÉ CIERRA. `clinical.medication_requests` sólo tenía la posología en texto
-- libre (`dose_text`, `frequency_text`). Sin una forma estructurada no hay
-- cronograma de tomas, ni recordatorios, ni exportación a calendario: parsear
-- «cada 8 horas» sería inventar la posología. Se agrega un subconjunto de FHIR
-- `Timing.repeat`:
--
--   timing_as_needed      PRN / «según necesidad»: sin tomas programadas.
--   timing_frequency      tomas por período (FHIR repeat.frequency).
--   timing_period         longitud del período (FHIR repeat.period).
--   timing_period_unit    'h' | 'd' | 'wk' (FHIR repeat.periodUnit, acotado).
--   timing_times_of_day   jsonb: ["08:00","20:00"], horas locales del paciente
--                         (FHIR repeat.timeOfDay). Excluyente con
--                         frequency/period (decisión D1 del PLAN).
--   timing_start_at       ancla de la primera toma.
--   timing_duration_days  duración del tratamiento; 0 = sin tomas.
--   timing_time_zone      zona IANA en la que se leen las horas del día.
--
-- Y la tabla `clinical.medication_reminder_dispatches`: una fila por
-- (receta, toma) avisada. El UNIQUE es lo que hace a prueba de carreras el
-- despacho del worker (INSERT … ON CONFLICT DO NOTHING RETURNING): dos
-- procesos que calculan la misma toma no producen dos avisos.
--
-- El texto firmado de la receta NO cambia: el sello (`prescription-seal.ts`)
-- sigue cubriendo `frequency_text`. `timing_*` es dato operativo para el
-- recordatorio, editable sólo en borrador, igual que `frequency_text`.
-- ============================================================================

BEGIN;

-- 1. Columnas nuevas de la receta
ALTER TABLE "clinical"."medication_requests" ADD COLUMN IF NOT EXISTS "timing_as_needed" boolean NOT NULL DEFAULT false;
ALTER TABLE "clinical"."medication_requests" ADD COLUMN IF NOT EXISTS "timing_frequency" integer;
ALTER TABLE "clinical"."medication_requests" ADD COLUMN IF NOT EXISTS "timing_period" numeric;
ALTER TABLE "clinical"."medication_requests" ADD COLUMN IF NOT EXISTS "timing_period_unit" varchar;
ALTER TABLE "clinical"."medication_requests" ADD COLUMN IF NOT EXISTS "timing_times_of_day" jsonb;
ALTER TABLE "clinical"."medication_requests" ADD COLUMN IF NOT EXISTS "timing_start_at" timestamptz;
ALTER TABLE "clinical"."medication_requests" ADD COLUMN IF NOT EXISTS "timing_duration_days" integer;
ALTER TABLE "clinical"."medication_requests" ADD COLUMN IF NOT EXISTS "timing_time_zone" varchar;

-- 2. Tabla de deduplicación de recordatorios
CREATE TABLE IF NOT EXISTS "clinical"."medication_reminder_dispatches" (
    "id" uuid NOT NULL,
    "medication_request_id" uuid NOT NULL,
    "dose_at" timestamptz NOT NULL,
    "notification_request_id" uuid,
    "created_at" timestamptz NOT NULL,
    CONSTRAINT "pk_medication_reminder_dispatches" PRIMARY KEY ("id")
);

-- 3. Índices
CREATE UNIQUE INDEX IF NOT EXISTS "uq_medication_reminder_dispatches_request_dose" ON "clinical"."medication_reminder_dispatches" ("medication_request_id", "dose_at");
CREATE INDEX IF NOT EXISTS "ix_medication_reminder_dispatches_notification_request_id" ON "clinical"."medication_reminder_dispatches" ("notification_request_id");
-- El barrido del worker filtra por estado y por posología programable.
CREATE INDEX IF NOT EXISTS "ix_medication_requests_schedulable" ON "clinical"."medication_requests" ("status_concept_id", "timing_start_at") WHERE "timing_as_needed" = false AND ("timing_frequency" IS NOT NULL OR "timing_times_of_day" IS NOT NULL);

-- 4. Claves foráneas
DO $$ BEGIN
    ALTER TABLE "clinical"."medication_reminder_dispatches"
        ADD CONSTRAINT "fk_medication_reminder_dispatches_medication_request_id" FOREIGN KEY ("medication_request_id")
        REFERENCES "clinical"."medication_requests" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;  -- (inferida por convención)

-- destino: messaging.notification_requests (requiere schema messaging)
DO $$ BEGIN
    ALTER TABLE "clinical"."medication_reminder_dispatches"
        ADD CONSTRAINT "fk_medication_reminder_dispatches_notification_request_id" FOREIGN KEY ("notification_request_id")
        REFERENCES "messaging"."notification_requests" ("id");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;  -- (inferida por convención)

-- 5. CHECK (respaldo en base de datos; el DTO valida antes y responde 400)
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

-- 6. Aserción: si algo no quedó, la transacción entera falla.
DO $$
DECLARE
    v_columns int; v_tables int; v_fks int; v_checks int;
BEGIN
    SELECT count(*) INTO v_columns FROM information_schema.columns
     WHERE table_schema = 'clinical' AND table_name = 'medication_requests'
       AND column_name LIKE 'timing\_%';
    SELECT count(*) INTO v_tables FROM information_schema.tables
     WHERE table_schema = 'clinical' AND table_name = 'medication_reminder_dispatches';
    SELECT count(*) INTO v_fks FROM pg_constraint
     WHERE contype = 'f'
       AND conrelid = '"clinical"."medication_reminder_dispatches"'::regclass;
    SELECT count(*) INTO v_checks FROM pg_constraint
     WHERE contype = 'c'
       AND conrelid = '"clinical"."medication_requests"'::regclass
       AND conname LIKE 'ck_medication_requests_timing_%';
    IF v_columns <> 8 OR v_tables <> 1 OR v_fks <> 2 OR v_checks <> 7 THEN
        RAISE EXCEPTION 'v4235: esperaba 8 columnas timing_*, 1 tabla, 2 FK y 7 CHECK; hay % / % / % / %',
            v_columns, v_tables, v_fks, v_checks;
    END IF;
END $$;

COMMIT;
