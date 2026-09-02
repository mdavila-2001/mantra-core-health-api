-- =============================================================================
-- Migración — evita credenciales de contraseña duplicadas por external_subject
-- =============================================================================
-- `iam.authentication_credentials.external_subject` (email o documento de
-- identidad, según el método) no tenía ningún índice único: dos requests
-- concurrentes a POST /iam/auth/register-patient (o a la creación de usuarios
-- por email) con el mismo identificador pasaban ambas el chequeo
-- "¿ya existe?" bajo READ COMMITTED y creaban dos cuentas para el mismo
-- documento/correo.
--
-- Índice PARCIAL (no una constraint UNIQUE llana) porque sólo debe haber una
-- credencial de contraseña VIVA por sujeto — una revocada o expirada con el
-- mismo `external_subject` no debe bloquear un alta nueva. El predicado de un
-- índice parcial debe ser inmutable (Postgres no admite subconsultas ahí), así
-- que los `state_concept_id`/`method_concept_id` van como UUID literales: son
-- deterministas (UUIDv5 sobre `SALUD_UUID_NAMESPACE`, ver
-- `src/common/constants/concepts.ts`) y no cambian entre entornos.
--   CRED_PASSWORD  = 37da1281-cc62-5032-b598-1eb39dc46060
--   STATE_ACTIVE   = 38a1d301-f40d-5b17-a695-5e6d605f8b19
--   STATE_PENDING  = 2e38dae4-c0c2-52ff-b1c9-a954ff880a38
--
-- Verificado contra la base real antes de escribir esto: no hay duplicados
-- existentes bajo este predicado, así que el índice se crea sin conflicto.
-- Idempotente (IF NOT EXISTS).
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS ux_authentication_credentials_live_password_subject
  ON iam.authentication_credentials (external_subject)
  WHERE method_concept_id = '37da1281-cc62-5032-b598-1eb39dc46060'
    AND external_subject IS NOT NULL
    AND state_concept_id IN (
      '38a1d301-f40d-5b17-a695-5e6d605f8b19',
      '2e38dae4-c0c2-52ff-b1c9-a954ff880a38'
    );
