-- =============================================================================
-- Migración REDESA C-17 — máquina de estados del asiento contable
-- =============================================================================
-- Añade la traza de aprobación para el flujo canónico del asiento:
--   DRAFT → AUTO_CLASSIFIED → PENDING_REVIEW → APPROVED → POSTED → REVERSED
--
-- Los estados en sí NO requieren columnas nuevas: viven en
-- journal_transactions.status_concept_id (concept ids nuevos declarados en
-- src/modules/accounting/accounting.concepts.ts). Estas dos columnas solo sellan
-- QUIÉN aprobó y CUÁNDO (equivalente a posted_at/posted_by_user_id para el post).
--
-- Todas NULLABLE y aditivas (no rompen datos existentes). Idempotente.
-- =============================================================================

ALTER TABLE accounting.journal_transactions
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by_user_id uuid; -- FK → iam.users
