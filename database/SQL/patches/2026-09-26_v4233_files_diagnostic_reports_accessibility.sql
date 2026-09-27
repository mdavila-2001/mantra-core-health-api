-- ============================================================================
-- SALUD · patch v4.2.33 (common + clinical · texto alternativo, descripción y
-- transcripción de archivos y reportes diagnósticos) sobre BD viva
-- Fecha: 2026-09-26
-- Idempotente (ADD COLUMN IF NOT EXISTS / DROP CONSTRAINT IF EXISTS antes de
-- cada CHECK). UNA sola pasada. Sin backfill — ver más abajo.
--
-- ORIGEN. Este parche nace en la API, igual que los parches propios que ya
-- diferían del modelo (ver commit 6d123c52). `02_common/02_tables.sql` y
-- `08_clinical/02_tables.sql` de esta copia declaran las columnas, así que un
-- rebuild desde cero las crea; los CHECK viven sólo aquí porque `02_common` no
-- tiene `05_constraints.sql` y postgres-init aplica `patches/` también en una
-- base nueva. PENDIENTE: reflejarlo en el modelo canónico
-- (`diagram_02_common.puml`, `diagram_08_clinical.puml`, `gen_ddl.py 02 08`)
-- para que el próximo `yarn db:vendor` no lo borre.
--
-- QUÉ CIERRA. Un archivo clínico (una radiografía, un audio, un PDF escaneado)
-- no tenía dónde guardar su alternativa accesible: quien usa lector de
-- pantalla recibía «imagen» o el nombre del archivo, y un audio no tenía
-- transcripción. Tres columnas opcionales, las mismas en las dos tablas:
--
--   alt_text       texto alternativo breve (WCAG 1.1.1)            ≤ 500
--   description    descripción larga, cuando el breve no alcanza  ≤ 4 000
--   transcription  transcripción de audio, video o documento      ≤ 100 000
--
-- Ninguna de las dos tablas tenía ya una columna `description`.
--
-- POR QUÉ `char_length` Y NO `varchar(n)`. El modelo declara `varchar`/`text`
-- sin largo (política de tipos del `.puml`); el tope es una regla de negocio y
-- va como CHECK con nombre, que se puede cambiar sin reescribir la tabla.
-- La API valida lo mismo antes (400); el CHECK es el respaldo.
--
-- POR QUÉ NO HAY BACKFILL. Un texto alternativo lo escribe quien conoce el
-- contenido. Rellenarlo con el nombre del archivo produciría exactamente el
-- «imagen123.jpg» que un lector de pantalla ya anunciaba.
--
-- DATOS SENSIBLES. Los tres textos describen contenido clínico: son PHI con
-- la misma sensibilidad que el archivo. No se loguean ni viajan en URLs.
--
-- DELTAS ESPERADOS sobre la base viva:
--   columnas de common.files                 15 → 18
--   columnas de clinical.diagnostic_reports  16 → 19
--   CHECK                                    +6
--   tablas / FK / índices                    ±0
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- A. columnas
ALTER TABLE "common"."files"
    ADD COLUMN IF NOT EXISTS "alt_text" varchar;
ALTER TABLE "common"."files"
    ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "common"."files"
    ADD COLUMN IF NOT EXISTS "transcription" text;

ALTER TABLE "clinical"."diagnostic_reports"
    ADD COLUMN IF NOT EXISTS "alt_text" varchar;
ALTER TABLE "clinical"."diagnostic_reports"
    ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "clinical"."diagnostic_reports"
    ADD COLUMN IF NOT EXISTS "transcription" text;

-- ---------------------------------------------------------- B. CHECK de largo
ALTER TABLE "common"."files" DROP CONSTRAINT IF EXISTS "ck_files_alt_text_length";
ALTER TABLE "common"."files" ADD CONSTRAINT "ck_files_alt_text_length"
    CHECK ("alt_text" IS NULL OR char_length("alt_text") <= 500);
ALTER TABLE "common"."files" DROP CONSTRAINT IF EXISTS "ck_files_description_length";
ALTER TABLE "common"."files" ADD CONSTRAINT "ck_files_description_length"
    CHECK ("description" IS NULL OR char_length("description") <= 4000);
ALTER TABLE "common"."files" DROP CONSTRAINT IF EXISTS "ck_files_transcription_length";
ALTER TABLE "common"."files" ADD CONSTRAINT "ck_files_transcription_length"
    CHECK ("transcription" IS NULL OR char_length("transcription") <= 100000);

ALTER TABLE "clinical"."diagnostic_reports" DROP CONSTRAINT IF EXISTS "ck_diagnostic_reports_alt_text_length";
ALTER TABLE "clinical"."diagnostic_reports" ADD CONSTRAINT "ck_diagnostic_reports_alt_text_length"
    CHECK ("alt_text" IS NULL OR char_length("alt_text") <= 500);
ALTER TABLE "clinical"."diagnostic_reports" DROP CONSTRAINT IF EXISTS "ck_diagnostic_reports_description_length";
ALTER TABLE "clinical"."diagnostic_reports" ADD CONSTRAINT "ck_diagnostic_reports_description_length"
    CHECK ("description" IS NULL OR char_length("description") <= 4000);
ALTER TABLE "clinical"."diagnostic_reports" DROP CONSTRAINT IF EXISTS "ck_diagnostic_reports_transcription_length";
ALTER TABLE "clinical"."diagnostic_reports" ADD CONSTRAINT "ck_diagnostic_reports_transcription_length"
    CHECK ("transcription" IS NULL OR char_length("transcription") <= 100000);

-- ------------------------------------------------------------ C. verificación
-- Si algo no quedó, la transacción entera falla.
DO $$
DECLARE
    n_columnas integer;
    n_checks   integer;
BEGIN
    -- 6: tres columnas por tabla.
    SELECT count(*) INTO n_columnas
    FROM information_schema.columns
    WHERE ((table_schema = 'common' AND table_name = 'files')
        OR (table_schema = 'clinical' AND table_name = 'diagnostic_reports'))
      AND column_name IN ('alt_text', 'description', 'transcription');

    -- 6: un CHECK de largo por columna.
    SELECT count(*) INTO n_checks
    FROM pg_constraint
    WHERE contype = 'c'
      AND conname IN (
          'ck_files_alt_text_length',
          'ck_files_description_length',
          'ck_files_transcription_length',
          'ck_diagnostic_reports_alt_text_length',
          'ck_diagnostic_reports_description_length',
          'ck_diagnostic_reports_transcription_length');

    IF n_columnas <> 6 OR n_checks <> 6 THEN
        RAISE EXCEPTION
            'v4.2.33 incompleto: columnas=% (esperado 6), checks=% (esperado 6)',
            n_columnas, n_checks;
    END IF;

    RAISE NOTICE 'v4.2.33 aplicado: 6 columnas, 6 CHECK de largo.';
END $$;

COMMIT;
