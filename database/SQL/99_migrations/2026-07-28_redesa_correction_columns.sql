-- =============================================================================
-- Migración REDESA — columnas aditivas de la corrección de reglas de negocio
-- =============================================================================
-- Todas son NULLABLE y aditivas (no rompen datos existentes). Se aplican con el
-- rol propietario (mantra). Necesarias para las nuevas máquinas de estado:
--   * Receta (CAN-RX): relación invalidar/reemplazar/renovar + sello de emisión.
--   * Cita (CAN-APT): snapshot congelado de la política de cancelación aceptada.
-- Idempotente (IF NOT EXISTS).
-- =============================================================================

ALTER TABLE clinical.medication_requests
  ADD COLUMN IF NOT EXISTS issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_reason_text text,
  ADD COLUMN IF NOT EXISTS replaces_request_id uuid,
  ADD COLUMN IF NOT EXISTS replaced_by_request_id uuid,
  ADD COLUMN IF NOT EXISTS renewed_from_request_id uuid;

ALTER TABLE scheduling.appointment_bookings
  ADD COLUMN IF NOT EXISTS cancellation_policy_snapshot jsonb;
