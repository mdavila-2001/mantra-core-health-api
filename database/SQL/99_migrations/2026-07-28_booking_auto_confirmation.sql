-- =============================================================================
-- Migración REDESA — Motor de confirmación automática de reservas (C-11)
-- =============================================================================
-- Crea la tabla de reglas deterministas que gobiernan si una solicitud de reserva
-- se auto-confirma, se auto-rechaza o se enruta a revisión manual. Las reglas no
-- se borran en duro: se desactivan (enabled=false) y versionan (version). La
-- evaluación se hace SIEMPRE contra datos congelados de la solicitud.
--
-- Se aplica con el rol propietario (mantra). Idempotente (IF NOT EXISTS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS scheduling.booking_confirmation_rules (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid        NOT NULL,                 -- FK → directory.tenants
  scope_type_concept_id  uuid        NOT NULL,                 -- FK → terminology.catalog_concepts (RULE_SCOPE_*)
  scope_id               uuid,                                 -- alcance concreto (practice/resource/service); NULL = todo el tipo
  priority               integer     NOT NULL DEFAULT 100,     -- menor número = mayor prioridad
  effective_from         timestamptz NOT NULL,
  effective_to           timestamptz,
  condition_json         jsonb       NOT NULL,                 -- gramática mínima fail-closed { field, op, value } + all/any/not
  decision_concept_id    uuid        NOT NULL,                 -- FK → terminology.catalog_concepts (AUTO_CONFIRM|AUTO_REJECT|MANUAL_REVIEW)
  enabled                boolean     NOT NULL DEFAULT true,
  version                integer     NOT NULL DEFAULT 1,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  created_by_user_id     uuid,                                 -- FK → iam.users
  updated_by_user_id     uuid,                                 -- FK → iam.users
  row_version            integer     NOT NULL DEFAULT 1
);

-- Filtro por tenant: toda evaluación arranca acotando por el tenant de la solicitud.
CREATE INDEX IF NOT EXISTS ix_booking_confirmation_rules_tenant
  ON scheduling.booking_confirmation_rules (tenant_id);

-- Filtro por alcance: se resuelven las reglas aplicables por (tipo de alcance, alcance).
CREATE INDEX IF NOT EXISTS ix_booking_confirmation_rules_scope
  ON scheduling.booking_confirmation_rules (scope_type_concept_id, scope_id);
