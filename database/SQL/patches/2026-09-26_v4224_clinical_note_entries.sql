-- ============================================================================
-- SALUD · patch v4.2.24 (chart · filas clave/valor de la nota médica) sobre BD viva
-- Fecha: 2026-09-26
-- Idempotente (ADD COLUMN IF NOT EXISTS). Se puede correr más de una vez.
--
-- Contexto: SQL/15_chart/02_tables.sql ya declara la columna, así que en un
-- rebuild desde cero este patch NO hace falta. Existe para una base ya
-- aplicada y poblada. gen_apply.py no escanea SQL/patches/, así que no entra
-- en apply_all.sql.
--
-- QUÉ CIERRA. Pendiente P39 del front: la nota médica lleva filas
-- `{ label, value }` («Presión arterial» → «120/80 mmHg») además de los
-- bloques SOAP. Se guardan en la propia versión (`entries_json`), así quedan
-- inmutables con ella al firmar, igual que el texto.
--
-- POR QUÉ NULLABLE. Las versiones existentes no tienen filas, y una nota
-- puede no tenerlas nunca. NULL = sin filas; la API lo devuelve como `[]`.
--
-- POR QUÉ NO HAY BACKFILL. No hay de dónde sacar filas para versiones
-- anteriores; inventarlas sería reescribir historia clínica firmada.
--
-- DELTAS ESPERADOS sobre la base viva:
--   columnas de chart.clinical_note_versions  19 → 20
--   FKs                                        ±0
--   índices                                    ±0
--   tablas                                     ±0
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- A. columnas
ALTER TABLE "chart"."clinical_note_versions"
    ADD COLUMN IF NOT EXISTS "entries_json" jsonb;

-- ------------------------------------------------------------ B. verificación
-- Se comprueba la columna por nombre y tipo, no el total de columnas: el
-- total depende de qué otros parches ya corrieron sobre esta tabla.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'chart'
          AND table_name = 'clinical_note_versions'
          AND column_name = 'entries_json'
          AND data_type = 'jsonb'
    ) THEN
        RAISE EXCEPTION
            'v4.2.24 incompleto: falta chart.clinical_note_versions.entries_json (jsonb)';
    END IF;

    RAISE NOTICE 'v4.2.24 aplicado: chart.clinical_note_versions.entries_json (jsonb).';
END $$;

COMMIT;
