-- =============================================================================
-- Migración REDESA — idempotencia de emisión de receta (CAN §6, MISSING_IDEMPOTENCY)
-- =============================================================================
-- La emisión (`issue`) de una receta no era idempotente: un reintento del cliente
-- podía re-ejecutar el sellado. Se añade una clave de idempotencia opcional; un
-- reintento con la misma clave devuelve la receta ya emitida (replay). Aditiva y
-- nullable. El índice UNIQUE es PARCIAL (solo filas con clave) para no forzar la
-- clave en emisiones históricas sin ella.
-- =============================================================================

ALTER TABLE clinical.medication_requests
  ADD COLUMN IF NOT EXISTS issue_idempotency_key varchar;

CREATE UNIQUE INDEX IF NOT EXISTS uq_medication_requests_issue_idempotency_key
  ON clinical.medication_requests (issue_idempotency_key)
  WHERE issue_idempotency_key IS NOT NULL;
