-- 2026-10-31 · Secretaria (personal de apoyo): quién inició cada vínculo.
--
-- Los vínculos de la secretaria viven en dos tablas que ya existían:
--   delegated_access.organization_user_assignments  (hospital, sede, servicio o piso)
--   practice.practitioner_support_assignments       (doctor)
-- y se aceptan por solicitud y aceptación: decide la parte que NO inició el vínculo, y sólo la
-- aprobación del hospital abre su membresía. Quién inició no puede deducirse de
-- created_by_user_id (una cuenta puede ser a la vez secretaria, doctor o administradora), así que
-- se guarda explícito al crear el vínculo:
--   DA_INITIATOR_SUPPORT_STAFF  · la propia secretaria pidió
--   DA_INITIATOR_ORGANIZATION   · lo ofreció un OWNER/ADMIN del hospital (comprobado al crear)
--   DA_INITIATOR_PRACTITIONER   · lo ofreció el doctor sobre su propia vinculación
-- Los conceptos los siembra la API (`delegated_access.concepts.ts`, code-system delegated_access).
--
-- NULLABLE a propósito: una fila sin iniciador (anterior a este parche, o escrita por otro flujo
-- como `POST /role-assignments/:roleId/support-assignments`) la API la trata como no decidible y
-- no abre nada (falla cerrado). Idempotente: se puede aplicar N veces.

ALTER TABLE "delegated_access"."organization_user_assignments"
    ADD COLUMN IF NOT EXISTS "initiated_by_party_concept_id" uuid;

ALTER TABLE "practice"."practitioner_support_assignments"
    ADD COLUMN IF NOT EXISTS "initiated_by_party_concept_id" uuid;

-- Una sola FK por columna, con los nombres que emite gen_ddl.py en el modelo (v4.2.80,
-- SQL/patches/2026-10-31_v4280_iniciador_vinculos.sql): si la columna ya tiene alguna FK a
-- terminology.catalog_concepts (la del modelo o una anterior), no se agrega otra.
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN SELECT * FROM (VALUES
        ('delegated_access.organization_user_assignments'::regclass, 'fk_organization_user_assignments_initiated_by_party_concept_id'),
        ('practice.practitioner_support_assignments'::regclass, 'fk_practitioner_support_assignments_initiated_by_party_7e268d24')
    ) v(rel, conname) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint c
              JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
             WHERE c.conrelid = t.rel AND c.contype = 'f' AND a.attname = 'initiated_by_party_concept_id'
               AND c.confrelid = 'terminology.catalog_concepts'::regclass) THEN
            EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY ("initiated_by_party_concept_id") '
                           'REFERENCES "terminology"."catalog_concepts" ("id")', t.rel, t.conname);
        END IF;
    END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS "ix_org_user_assignments_initiated_by_party"
    ON "delegated_access"."organization_user_assignments" ("initiated_by_party_concept_id");

CREATE INDEX IF NOT EXISTS "ix_prac_support_assignments_initiated_by_party"
    ON "practice"."practitioner_support_assignments" ("initiated_by_party_concept_id");
