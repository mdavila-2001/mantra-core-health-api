-- ============================================================================
-- SALUD · patch v4.2.47 (clinical · justificación al repetir sobre una orden
-- activa sin informe) sobre BD viva
-- Fecha: 2026-10-11
-- Idempotente (ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS /
-- ADD CONSTRAINT bajo guarda). UNA sola pasada. SIN backfill.
--
-- Contexto: la antiduplicación (v4.2.17) sólo detectaba informes previos. Hoy
-- también detecta una orden ACTIVA del mismo estudio que todavía no tiene
-- informe; el médico puede repetirla con justificación, pero el CHECK
-- `ck_service_requests_override_reason_requires_previous_report` exigía un
-- informe previo y la justificación se perdía (sólo quedaba en el log).
--
-- QUÉ ENTRA. Columna nullable `previous_service_request_id` (FK a la propia
-- tabla, índice): la orden a la que se repite. El CHECK se reemplaza por
-- `ck_service_requests_override_reason_requires_previous_study`: la
-- justificación exige informe previo O orden previa; y una orden no puede
-- apuntarse a sí misma.
--
-- SIN BACKFILL: las justificaciones antiguas siempre tuvieron informe previo,
-- por lo que cumplen el CHECK nuevo.
--
-- DELTAS: columnas 18 → 19; FKs +1; índices +1; CHECK +1 (−1 el viejo).
-- ============================================================================

BEGIN;

ALTER TABLE "clinical"."service_requests"
    ADD COLUMN IF NOT EXISTS "previous_service_request_id" uuid;

CREATE INDEX IF NOT EXISTS "ix_service_requests_previous_service_request_id"
    ON "clinical"."service_requests" ("previous_service_request_id");

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_service_requests_previous_service_request_id'
    ) THEN
        ALTER TABLE "clinical"."service_requests"
            ADD CONSTRAINT "fk_service_requests_previous_service_request_id"
            FOREIGN KEY ("previous_service_request_id")
            REFERENCES "clinical"."service_requests" ("id");
    END IF;
END $$;

ALTER TABLE "clinical"."service_requests"
    DROP CONSTRAINT IF EXISTS "ck_service_requests_override_reason_requires_previous_report";
ALTER TABLE "clinical"."service_requests"
    DROP CONSTRAINT IF EXISTS "ck_service_requests_override_reason_requires_previous_study";
ALTER TABLE "clinical"."service_requests"
    ADD CONSTRAINT "ck_service_requests_override_reason_requires_previous_study"
    CHECK (("duplicate_override_reason" IS NULL
            OR "previous_diagnostic_report_id" IS NOT NULL
            OR "previous_service_request_id" IS NOT NULL)) NOT VALID;

-- Algunas bases vivas no tenían el CHECK viejo y guardan justificaciones sin
-- enlace (filas de prueba): NOT VALID las respeta y exige el CHECK a las filas
-- nuevas. Se valida sólo si no hay filas fuera de regla.
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "clinical"."service_requests"
        WHERE "duplicate_override_reason" IS NOT NULL
          AND "previous_diagnostic_report_id" IS NULL
          AND "previous_service_request_id" IS NULL
    ) THEN
        ALTER TABLE "clinical"."service_requests"
            VALIDATE CONSTRAINT "ck_service_requests_override_reason_requires_previous_study";
    ELSE
        RAISE NOTICE 'CHECK de justificación queda NOT VALID: hay filas históricas sin enlace.';
    END IF;
END $$;

ALTER TABLE "clinical"."service_requests"
    DROP CONSTRAINT IF EXISTS "ck_service_requests_previous_service_request_not_self";
ALTER TABLE "clinical"."service_requests"
    ADD CONSTRAINT "ck_service_requests_previous_service_request_not_self"
    CHECK (("previous_service_request_id" IS NULL OR "previous_service_request_id" <> "id"));

DO $$
DECLARE
    n_col integer; n_fk integer; n_idx integer; n_chk integer;
BEGIN
    SELECT count(*) INTO n_col FROM information_schema.columns
    WHERE table_schema = 'clinical' AND table_name = 'service_requests'
      AND column_name = 'previous_service_request_id';
    SELECT count(*) INTO n_fk FROM pg_constraint
    WHERE conname = 'fk_service_requests_previous_service_request_id' AND convalidated;
    SELECT count(*) INTO n_idx FROM pg_indexes
    WHERE schemaname = 'clinical' AND indexname = 'ix_service_requests_previous_service_request_id';
    SELECT count(*) INTO n_chk FROM pg_constraint
    WHERE conname IN ('ck_service_requests_override_reason_requires_previous_study',
                      'ck_service_requests_previous_service_request_not_self')
      ;
    IF n_col <> 1 OR n_fk <> 1 OR n_idx <> 1 OR n_chk <> 2 THEN
        RAISE EXCEPTION 'v4.2.47 incompleto: col=% fk=% idx=% chk=%', n_col, n_fk, n_idx, n_chk;
    END IF;
    RAISE NOTICE 'v4.2.47 aplicado.';
END $$;

COMMIT;
