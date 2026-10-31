-- ============================================================================
-- Fixtures SQL del smoke del gobierno de accesos (test/smoke/modules/support_staff_governance.smoke.ts).
-- Se cargan DESPUÉS de los demos 04, 07 y 09 del modelo, dentro de la corrida del smoke, y solo agregan lo que el demo NO debe traer.
-- Idempotentes (ids deterministas + ON CONFLICT DO NOTHING). Datos 100 % ficticios; solo para una base descartable de pruebas.
--
-- Desde el modelo v4.2.72-B7d el demo ya trae lo que antes se parchaba aquí (agendas con `resource_ref_type = health_practitioner_profiles`, la cita A4 en
-- N102, el vínculo de Nora posterior a `onboardingRequiredSince` y Ana con `next_recertification_at = 2026-11-23`; lo verifica 08-verifica-gobierno.sql, G-9y1…4).
-- Lo único que queda es propio de la PRUEBA y no del demo: la regla de red del bucle local.
-- ============================================================================
BEGIN;

-- 1 · Red: el smoke llega por el bucle local (supertest no pasa por un proxy de confianza), así que la regla
-- ALLOW del hospital (192.0.2.0/24) nunca le daría `network.require = ORG_RULES`. Se agrega el bucle local.
INSERT INTO authz.ip_access_rules (id, tenant_id, scope_concept_id, rule_type_concept_id, cidr, description, priority, status_concept_id, created_at, updated_at, row_version)
VALUES
  ('5d3f7a10-7e5b-5c10-9a0e-00b7a0000001', '830e47e1-8e82-50ff-99c0-bfed0a7971a4', '1b45f74f-f39e-58eb-b29a-86c100efeb67', '32909f2c-edc4-5318-871a-e91a3879ad3e', '127.0.0.0/8', 'Bucle local del smoke (ficticio)', 20, '38a1d301-f40d-5b17-a695-5e6d605f8b19', now(), now(), 1),
  ('5d3f7a10-7e5b-5c10-9a0e-00b7a0000002', '830e47e1-8e82-50ff-99c0-bfed0a7971a4', '1b45f74f-f39e-58eb-b29a-86c100efeb67', '32909f2c-edc4-5318-871a-e91a3879ad3e', '::1/128', 'Bucle local IPv6 del smoke (ficticio)', 20, '38a1d301-f40d-5b17-a695-5e6d605f8b19', now(), now(), 1)
ON CONFLICT DO NOTHING;

COMMIT;
