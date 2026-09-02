-- =============================================================================
-- Migración REDESA — profiles.persons: la ocupación de la persona
-- =============================================================================
-- `Persons` declara desde hace tiempo `occupation_concept_id` (miembro de
-- `VS_SEGIP_OCCUPATION`, backlog T-02) y `occupation_free_text`, y
-- `RegisterPatientDto` acepta los dos, pero la columna nunca llegó al DDL:
-- `diagram_05_profiles.puml` no las declara, así que `SQL/05_profiles/02_tables.sql`
-- tampoco.
--
-- Ojo con el falso negativo, el mismo que documenta el patch de
-- `persons.photo_file_id`: la ausencia NO rompe las lecturas, porque MikroORM
-- emite `select "p0".*`. Sólo revientan los INSERT/UPDATE que la escriben — y
-- eso es exactamente lo que pasa hoy: un alta de paciente que completa la
-- ocupación responde 500 con
-- `column "occupation_concept_id" of relation "persons" does not exist`,
-- mientras que una que la deja vacía pasa sin enterarse. Por eso el alta pública
-- convivió con el fallo: el campo era opcional y casi nadie lo llenaba.
--
-- Las dos columnas van juntas porque son el mismo dato con dos formas —el
-- concepto del catálogo, y el texto para lo que no esté en él— y el repositorio
-- escribe ambas en el mismo INSERT: declarar sólo una deja el fallo intacto.
--
-- Cambios ADITIVOS e IDEMPOTENTES (IF NOT EXISTS). Seguro de re-aplicar.
-- =============================================================================

ALTER TABLE "profiles"."persons"
    ADD COLUMN IF NOT EXISTS "occupation_concept_id" uuid NULL;

ALTER TABLE "profiles"."persons"
    ADD COLUMN IF NOT EXISTS "occupation_free_text" varchar NULL;

-- Buscar pacientes por ocupación es lo que motiva el catálogo (riesgos propios
-- de cada oficio), así que la columna nace indexada.
CREATE INDEX IF NOT EXISTS "ix_persons_occupation_concept_id"
    ON "profiles"."persons" USING btree ("occupation_concept_id");

-- La FK se envuelve porque ADD CONSTRAINT no admite IF NOT EXISTS. Apunta al
-- catálogo global de conceptos, como el resto de los `*_concept_id` de la tabla.
DO $$
BEGIN
    ALTER TABLE "profiles"."persons"
        ADD CONSTRAINT "fk_persons_occupation_concept_id"
        FOREIGN KEY ("occupation_concept_id")
        REFERENCES "terminology"."catalog_concepts" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-- Sin COMMENT ON COLUMN: un comentario acá sale como divergencia en el
-- verificador de fidelidad contra el .puml. Misma nota que los otros patches.
