-- =============================================================================
-- Migración REDESA — WORM real (tamper-RESISTANCE) sobre audit.audit_log
-- =============================================================================
-- CAN-AUDIT-001 / C-19: "los registros de auditoría no podrán modificarse ni
-- eliminarse". Hasta ahora la cadena hash daba tamper-EVIDENCE (se detecta la
-- manipulación al verificar), pero nada impedía un UPDATE/DELETE a nivel de base.
-- Este trigger convierte esa promesa en tamper-RESISTANCE: cualquier UPDATE o
-- DELETE sobre la tabla WORM aborta con excepción, sea cual sea el rol (incluido
-- el propietario). La única operación admitida es INSERT (append-only).
--
-- Idempotente. Aplicar con el rol propietario (mantra).
-- =============================================================================

CREATE OR REPLACE FUNCTION audit.deny_audit_log_mutation()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit.audit_log es WORM (append-only): % no permitido (CAN-AUDIT-001)', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_log_worm ON audit.audit_log;
CREATE TRIGGER trg_audit_log_worm
  BEFORE UPDATE OR DELETE ON audit.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION audit.deny_audit_log_mutation();

-- El log de accesos (data_access_log) también es append-only salvo la purga de
-- retención controlada (UC-10-09), que borra por ventana explícita. No se le
-- aplica el trigger de DELETE para no romper la retención; sí se prohíbe UPDATE.
CREATE OR REPLACE FUNCTION audit.deny_data_access_log_update()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit.data_access_log es append-only: UPDATE no permitido (CAN-AUDIT-001)'
    USING ERRCODE = 'restrict_violation';
END;
$$;

DROP TRIGGER IF EXISTS trg_data_access_log_no_update ON audit.data_access_log;
CREATE TRIGGER trg_data_access_log_no_update
  BEFORE UPDATE ON audit.data_access_log
  FOR EACH ROW
  EXECUTE FUNCTION audit.deny_data_access_log_update();
