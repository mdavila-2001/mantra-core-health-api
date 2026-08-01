-- SALUD v4.0.1 · tipos compartidos (aplicar PRIMERO, antes de cualquier tabla)
-- 'technical_data_type' es el único enum nativo permitido por el modelo
-- (doc: semantic-data-analysis §3.2). Usado en módulos 03/09/30/39/44.

CREATE SCHEMA IF NOT EXISTS "terminology";

DO $$ BEGIN
    CREATE TYPE "terminology"."technical_data_type" AS ENUM ();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TODO (modelo): poblar los valores reales cuando estén definidos, p.ej.:
--   ALTER TYPE "terminology"."technical_data_type" ADD VALUE 'string';
--   ALTER TYPE "terminology"."technical_data_type" ADD VALUE 'integer';
