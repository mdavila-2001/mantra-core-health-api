import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT, UUID_BAD } from '../smoke-kit';

/**
 * Smoke del módulo 10 — Audit, Provenance and Version Histories. Cubre los 11
 * endpoints HTTP (UC-10-01, 04, 05, 06, 07, 08, 09, 10, 11, 12) con un caso feliz
 * y casos límite (401 sin auth, 400 validación, 404 inexistente). UC-10-02
 * (versionado por trigger), UC-10-03 (sellado de cadena, plegado en POST /audit/events)
 * y UC-10-13 (proyección cross-store) no exponen endpoint HTTP.
 *
 * Parents con FK REAL en la BD de pruebas:
 * - `user_id`/`actor` → `iam.users`: `ctx.adminUserId`.
 * - `tenant_id` → `directory.tenants`: `ctx.tenantId`.
 * - `patient_profile_id` → `profiles.patient_profiles`: `ctx.vars.patientProfileId`
 *   (lo pobla el módulo profiles, que corre antes en el registro).
 * - `delegating_practitioner_profile_id` → `profiles.health_practitioner_profiles`:
 *   `ctx.vars.practitionerProfileId`.
 *
 * Los conceptos `AUDIT_*` deben estar sembrados (el orquestador cablea
 * `AUDIT_CONCEPT_SEEDS` en `module-concepts.ts`) para satisfacer las FK
 * `*_concept_id`.
 */
export const AUDIT_SMOKE: SmokeCase[] = [
  // --- UC-10-04 / UC-10-03: evento de provenance + sellado de cadena ---
  {
    module: 'Audit',
    endpoint: 'POST /audit/events',
    name: 'happy: sella evento en la cadena hash',
    method: 'post',
    path: () => '/audit/events',
    body: () => ({ action: 'UPDATE', entity: 'users', outcome: 'SUCCESS' }),
    expectedStatus: 201,
    capture: (b, c) => {
      if (b.id) c.vars.auditEventId = String(b.id);
    },
  },
  {
    module: 'Audit',
    endpoint: 'POST /audit/events',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/audit/events',
    auth: false,
    body: () => ({ action: 'UPDATE', entity: 'users', outcome: 'SUCCESS' }),
    expectedStatus: 401,
  },
  {
    module: 'Audit',
    endpoint: 'POST /audit/events',
    name: 'límite: outcome inválido -> 400',
    method: 'post',
    path: () => '/audit/events',
    body: () => ({ action: 'UPDATE', entity: 'users', outcome: 'MAYBE' }),
    expectedStatus: 400,
  },

  // --- UC-10-01: registrar acceso/lectura clínica (accounting WORM) ---
  {
    module: 'Audit',
    endpoint: 'POST /audit/data-access',
    name: 'happy: registra acceso clínico',
    method: 'post',
    path: () => '/audit/data-access',
    body: (c) => ({
      resourceType: 'clinical_note',
      tenantId: c.tenantId,
      purpose: 'care',
      purposeOfUse: 'TREATMENT',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Audit',
    endpoint: 'POST /audit/data-access',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/audit/data-access',
    auth: false,
    body: () => ({ resourceType: 'clinical_note' }),
    expectedStatus: 401,
  },
  {
    module: 'Audit',
    endpoint: 'POST /audit/data-access',
    name: 'límite: patientProfileId no-uuid -> 400',
    method: 'post',
    path: () => '/audit/data-access',
    body: () => ({ patientProfileId: UUID_BAD }),
    expectedStatus: 400,
  },

  // --- UC-10-05: consultar historial / línea de tiempo ---
  {
    module: 'Audit',
    endpoint: 'GET /audit/history/{entity}/{id}',
    name: 'happy: línea de tiempo (vacía) de un usuario',
    method: 'get',
    path: (c) => `/audit/history/users/${c.adminUserId}`,
    expectedStatus: 200,
  },
  {
    module: 'Audit',
    endpoint: 'GET /audit/history/{entity}/{id}',
    name: 'límite: entidad no soportada -> 404',
    method: 'get',
    path: (c) => `/audit/history/nope/${c.adminUserId}`,
    expectedStatus: 404,
  },
  {
    module: 'Audit',
    endpoint: 'GET /audit/history/{entity}/{id}',
    name: 'límite: id no-uuid -> 400',
    method: 'get',
    path: () => `/audit/history/users/${UUID_BAD}`,
    expectedStatus: 400,
  },

  // --- UC-10-06: verificar integridad tamper-evidence ---
  {
    module: 'Audit',
    endpoint: 'POST /audit/integrity/verify',
    name: 'happy: verifica la cadena y atesta',
    method: 'post',
    path: () => '/audit/integrity/verify',
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Audit',
    endpoint: 'POST /audit/integrity/verify',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/audit/integrity/verify',
    auth: false,
    body: () => ({}),
    expectedStatus: 401,
  },

  // --- UC-10-07: exportar evidencia de auditoría ---
  {
    module: 'Audit',
    endpoint: 'POST /compliance/audit-export',
    name: 'happy: exporta evidencia',
    method: 'post',
    path: () => '/compliance/audit-export',
    body: (c) => ({
      entity: 'audit_log',
      queryHash: `qh-${c.u}`,
      affectedSubjectCount: 3,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Audit',
    endpoint: 'POST /compliance/audit-export',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/compliance/audit-export',
    auth: false,
    body: () => ({ entity: 'audit_log' }),
    expectedStatus: 401,
  },

  // --- UC-10-08: DSAR (alta + transición) ---
  {
    module: 'Audit',
    endpoint: 'POST /privacy/dsar',
    name: 'happy: da de alta una solicitud DSAR',
    method: 'post',
    path: () => '/privacy/dsar',
    body: () => ({ type: 'ACCESS', jurisdiction: 'PE' }),
    expectedStatus: 201,
    capture: (b, c) => {
      if (b.id) c.vars.dsarId = String(b.id);
    },
  },
  {
    module: 'Audit',
    endpoint: 'POST /privacy/dsar',
    name: 'límite: type inválido -> 400',
    method: 'post',
    path: () => '/privacy/dsar',
    body: () => ({ type: 'WHATEVER' }),
    expectedStatus: 400,
  },
  {
    module: 'Audit',
    endpoint: 'PATCH /privacy/dsar/{id}',
    name: 'happy: avanza a en progreso (si hay dsarId)',
    method: 'patch',
    path: (c) => `/privacy/dsar/${c.vars.dsarId ?? UUID_ABSENT}`,
    body: () => ({ status: 'IN_PROGRESS' }),
    expectedStatus: 200,
  },
  {
    module: 'Audit',
    endpoint: 'PATCH /privacy/dsar/{id}',
    name: 'límite: id inexistente -> 404',
    method: 'patch',
    path: () => `/privacy/dsar/${UUID_ABSENT}`,
    body: () => ({ status: 'COMPLETED' }),
    expectedStatus: 404,
  },

  // --- UC-10-09: aplicar retención / archivado ---
  {
    module: 'Audit',
    endpoint: 'POST /audit/retention/apply',
    name: 'happy: registra aplicación de retención',
    method: 'post',
    path: () => '/audit/retention/apply',
    body: () => ({ scope: 'audit_log' }),
    expectedStatus: 200,
  },
  {
    module: 'Audit',
    endpoint: 'POST /audit/retention/apply',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/audit/retention/apply',
    auth: false,
    body: () => ({}),
    expectedStatus: 401,
  },

  // --- UC-10-10: detectar acceso anómalo ---
  {
    module: 'Audit',
    endpoint: 'POST /audit/anomaly/scan',
    name: 'happy: barrido de anomalías',
    method: 'post',
    path: () => '/audit/anomaly/scan',
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Audit',
    endpoint: 'POST /audit/anomaly/scan',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/audit/anomaly/scan',
    auth: false,
    body: () => ({}),
    expectedStatus: 401,
  },

  // --- UC-10-11: decisión de moderación / gobernanza ---
  {
    module: 'Audit',
    endpoint: 'POST /moderation/decisions',
    name: 'happy: registra decisión de moderación WORM',
    method: 'post',
    path: () => '/moderation/decisions',
    body: (c) => ({
      targetType: 'CONTENT',
      targetId: c.adminUserId,
      action: 'REMOVE',
      reason: 'POLICY',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Audit',
    endpoint: 'POST /moderation/decisions',
    name: 'límite: action inválida -> 400',
    method: 'post',
    path: () => '/moderation/decisions',
    body: (c) => ({
      targetType: 'CONTENT',
      targetId: c.adminUserId,
      action: 'NUKE',
    }),
    expectedStatus: 400,
  },

  // --- UC-10-12: acceso delegado / de tercero gobernado ---
  {
    module: 'Audit',
    endpoint: 'POST /audit/third-party-access',
    name: 'happy: acceso delegado (canal DELEGATED)',
    method: 'post',
    path: () => '/audit/third-party-access',
    body: (c) => ({
      channel: 'DELEGATED',
      outcome: 'SUCCESS',
      delegatingPractitionerProfileId: c.vars.practitionerProfileId,
      patientProfileId: c.vars.patientProfileId,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Audit',
    endpoint: 'POST /audit/third-party-access',
    name: 'límite: canal inválido -> 400',
    method: 'post',
    path: () => '/audit/third-party-access',
    body: () => ({ channel: 'ALIEN', outcome: 'SUCCESS' }),
    expectedStatus: 400,
  },
  {
    module: 'Audit',
    endpoint: 'POST /audit/third-party-access',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/audit/third-party-access',
    auth: false,
    body: () => ({ channel: 'DELEGATED', outcome: 'SUCCESS' }),
    expectedStatus: 401,
  },
];
