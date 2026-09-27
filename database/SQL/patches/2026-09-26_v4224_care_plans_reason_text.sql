-- ============================================================================
-- SALUD · patch v4.2.24 (chart · motivo escrito del plan de cuidados)
-- Fecha: 2026-09-26
-- Idempotente (ADD COLUMN IF NOT EXISTS). UNA sola pasada. SIN backfill.
--
-- Contexto: el alta del plan de cuidados en el expediente (front,
-- `care-plan-block.ts`) exige un motivo: o el plan cuelga de un diagnóstico ya
-- registrado (`condition_id`), o el motivo se escribe a mano. Ese texto viajaba
-- como `reasonText` en `POST /charts/care-plans`, pero ni el DTO ni la tabla lo
-- tenían: con `forbidNonWhitelisted` cada alta con motivo escrito respondía 400.
--
-- QUÉ ENTRA. Una columna nullable en chart.care_plans: `reason_text` (text).
-- No reemplaza a `condition_id`: son las dos formas de decir por qué se abre el
-- plan, y el cliente manda una u otra.
--
-- POR QUÉ NO HAY BACKFILL. Los planes existentes nacieron sin motivo escrito;
-- inventarlo sería peor que dejarlo vacío.
--
-- DELTAS ESPERADOS sobre la base viva:
--   columnas de chart.care_plans   15 → 16
--   FKs                            ±0
--   índices                        ±0
--   tablas                         ±0
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- A. columnas
ALTER TABLE "chart"."care_plans"
    ADD COLUMN IF NOT EXISTS "reason_text" text;

-- ------------------------------------------------------------ D. verificación
DO $$
DECLARE
    n_columnas integer;
BEGIN
    SELECT count(*) INTO n_columnas
    FROM information_schema.columns
    WHERE table_schema = 'chart'
      AND table_name = 'care_plans'
      AND column_name = 'reason_text';

    IF n_columnas <> 1 THEN
        RAISE EXCEPTION
            'v4.2.24 incompleto: columnas=% (esperado 1)',
            n_columnas;
    END IF;

    RAISE NOTICE 'v4.2.24 aplicado: reason_text en chart.care_plans (sin backfill).';
END $$;

COMMIT;
