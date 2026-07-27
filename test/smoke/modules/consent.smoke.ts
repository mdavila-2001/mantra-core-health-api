import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT, UUID_BAD } from '../smoke-kit';
import { SEED } from '../../../src/common';
import { CONS } from '../../../src/modules/consent/consent.concepts';

/**
 * Smoke del módulo 07 — Consent (Privacy Directives, Legal Bases and Consent
 * Evidence). Cubre los 12 endpoints (UC-07-01..12) con un caso feliz y casos
 * límite (401 sin auth, 400 validación, 404 inexistente).
 *
 * Parents con FK REAL en la BD de pruebas:
 * - `processing_purpose_id` → `consent.processing_purposes`: se usa el propósito
 *   por defecto sembrado, `SEED.processingPurposeId`.
 * - `patient_profile_id` → `profiles.patient_profiles`: se usa
 *   `ctx.vars.patientProfileId` (lo pobla el módulo profiles, que corre antes en el
 *   registro); fallback a `ctx.adminUserId` solo por robustez.
 * - `tenant_id` → `directory.tenants`: se usa `ctx.tenantId`.
 *
 * Los ids creados (consentId, hipaaAuthId, objectionId) se capturan en `ctx.vars`
 * para encadenar los casos dependientes (withdraw, provisions, revoke, resolve).
 */
const patient = (c: {
  vars: Record<string, string>;
  adminUserId: string;
}): string => c.vars.patientProfileId ?? c.adminUserId;
const purpose = (): string => SEED.processingPurposeId;

export const CONSENT_SMOKE: SmokeCase[] = [
  // --- UC-07-10: evidencia inmutable (happy autónomo, sin parent duro) ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/consent-evidence',
    name: 'happy: registra evidencia inmutable',
    method: 'post',
    path: () => '/consent/consent-evidence',
    body: (c) => ({
      subjectType: 'CONSENT',
      subjectId: c.adminUserId,
      evidenceHash: `h-${c.u}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      if (b.id) c.vars.consentEvidenceId = String(b.id);
    },
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/consent-evidence',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/consent/consent-evidence',
    auth: false,
    body: (c) => ({ subjectType: 'CONSENT', subjectId: c.adminUserId }),
    expectedStatus: 401,
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/consent-evidence',
    name: 'límite: subjectType inválido -> 400',
    method: 'post',
    path: () => '/consent/consent-evidence',
    body: (c) => ({ subjectType: 'NOPE', subjectId: c.adminUserId }),
    expectedStatus: 400,
  },

  // --- UC-07-11: barrido de expiraciones (happy autónomo) ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/internal/expiration-sweep',
    name: 'happy: ejecuta barrido de expiraciones',
    method: 'post',
    path: () => '/consent/internal/expiration-sweep',
    expectedStatus: 200,
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/internal/expiration-sweep',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/consent/internal/expiration-sweep',
    auth: false,
    expectedStatus: 401,
  },

  // --- UC-07-06: base legal de procesamiento ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/processing-legal-bases',
    name: 'happy: versiona base legal',
    method: 'post',
    path: () => '/consent/processing-legal-bases',
    body: (c) => ({
      processingPurposeId: purpose(),
      tenantId: c.tenantId,
      policyVersion: `v-${c.u}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      if (b.id) c.vars.legalBasisId = String(b.id);
    },
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/processing-legal-bases',
    name: 'límite: processingPurposeId no-uuid -> 400',
    method: 'post',
    path: () => '/consent/processing-legal-bases',
    body: () => ({ processingPurposeId: UUID_BAD }),
    expectedStatus: 400,
  },

  // --- UC-07-01: capturar consentimiento ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/consents',
    name: 'happy: captura consentimiento con provisiones',
    method: 'post',
    path: () => '/consent/consents',
    body: (c) => ({
      patientProfileId: patient(c),
      processingPurposeId: purpose(),
      tenantId: c.tenantId,
      policyVersion: `v-${c.u}`,
      provisions: [{ action: 'PERMIT' }],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      if (b.id) c.vars.consentId = String(b.id);
    },
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/consents',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/consent/consents',
    auth: false,
    body: (c) => ({
      patientProfileId: patient(c),
      processingPurposeId: purpose(),
    }),
    expectedStatus: 401,
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/consents',
    name: 'límite: patientProfileId ausente -> 400',
    method: 'post',
    path: () => '/consent/consents',
    body: (c) => ({ processingPurposeId: purpose() }),
    expectedStatus: 400,
  },

  // --- UC-07-09: actualizar provisiones ---
  {
    module: 'Consent',
    endpoint: 'PATCH /consent/consents/{id}/provisions',
    name: 'happy: actualiza provisiones (si hay consentId)',
    method: 'patch',
    path: (c) =>
      `/consent/consents/${c.vars.consentId ?? UUID_ABSENT}/provisions`,
    body: () => ({ provisions: [{ action: 'DENY' }] }),
    expectedStatus: 200,
  },
  {
    module: 'Consent',
    endpoint: 'PATCH /consent/consents/{id}/provisions',
    name: 'límite: id inexistente -> 404',
    method: 'patch',
    path: () => `/consent/consents/${UUID_ABSENT}/provisions`,
    body: () => ({ provisions: [{ action: 'PERMIT' }] }),
    expectedStatus: 404,
  },

  // --- UC-07-02: retirar consentimiento ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/consents/{id}/withdraw',
    name: 'happy: retira consentimiento (si hay consentId)',
    method: 'post',
    path: (c) =>
      `/consent/consents/${c.vars.consentId ?? UUID_ABSENT}/withdraw`,
    body: () => ({}),
    expectedStatus: 200,
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/consents/{id}/withdraw',
    name: 'límite: id inexistente -> 404',
    method: 'post',
    path: () => `/consent/consents/${UUID_ABSENT}/withdraw`,
    body: () => ({}),
    expectedStatus: 404,
  },

  // --- UC-07-04: autorización HIPAA ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/hipaa-authorizations',
    name: 'happy: otorga autorización HIPAA',
    method: 'post',
    path: () => '/consent/hipaa-authorizations',
    body: (c) => ({
      patientProfileId: patient(c),
      processingPurposeId: purpose(),
      tenantId: c.tenantId,
      recipientDescription: 'Aseguradora',
      informationDescription: 'Resumen clínico',
      expirationType: 'DATE',
      expiresAt: '2030-01-01T00:00:00.000Z',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      if (b.id) c.vars.hipaaAuthId = String(b.id);
    },
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/hipaa-authorizations',
    name: 'límite: expirationType inválido -> 400',
    method: 'post',
    path: () => '/consent/hipaa-authorizations',
    body: (c) => ({
      patientProfileId: patient(c),
      processingPurposeId: purpose(),
      recipientDescription: 'x',
      informationDescription: 'y',
      expirationType: 'FOREVER',
    }),
    expectedStatus: 400,
  },

  // --- UC-07-05: revocar HIPAA ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/hipaa-authorizations/{id}/revoke',
    name: 'happy: revoca HIPAA (si hay hipaaAuthId)',
    method: 'post',
    path: (c) =>
      `/consent/hipaa-authorizations/${c.vars.hipaaAuthId ?? UUID_ABSENT}/revoke`,
    expectedStatus: 200,
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/hipaa-authorizations/{id}/revoke',
    name: 'límite: id inexistente -> 404',
    method: 'post',
    path: () => `/consent/hipaa-authorizations/${UUID_ABSENT}/revoke`,
    expectedStatus: 404,
  },

  // --- UC-07-03: objeción del paciente ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/patient-objections',
    name: 'happy: registra objeción con restricción',
    method: 'post',
    path: () => '/consent/patient-objections',
    body: (c) => ({
      patientProfileId: patient(c),
      processingPurposeId: purpose(),
      tenantId: c.tenantId,
      reasonText: 'No autorizo marketing',
      applyRestriction: true,
      restrictionDataClassConceptId: CONS.DATA_CLASS_ALL,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      if (b.id) c.vars.objectionId = String(b.id);
    },
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/patient-objections',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/consent/patient-objections',
    auth: false,
    body: (c) => ({
      patientProfileId: patient(c),
      processingPurposeId: purpose(),
    }),
    expectedStatus: 401,
  },

  // --- UC-07-12: resolver objeción ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/patient-objections/{id}/resolve',
    name: 'happy: resuelve objeción (si hay objectionId)',
    method: 'post',
    path: (c) =>
      `/consent/patient-objections/${c.vars.objectionId ?? UUID_ABSENT}/resolve`,
    body: () => ({ resolution: 'UPHELD' }),
    expectedStatus: 200,
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/patient-objections/{id}/resolve',
    name: 'límite: id inexistente -> 404',
    method: 'post',
    path: () => `/consent/patient-objections/${UUID_ABSENT}/resolve`,
    body: () => ({ resolution: 'REJECTED' }),
    expectedStatus: 404,
  },

  // --- UC-07-07: restricción de privacidad ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/privacy-restrictions',
    name: 'happy: aplica restricción de privacidad',
    method: 'post',
    path: () => '/consent/privacy-restrictions',
    body: (c) => ({
      patientProfileId: patient(c),
      tenantId: c.tenantId,
      dataClassConceptId: CONS.DATA_CLASS_ALL,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/privacy-restrictions',
    name: 'límite: dataClassConceptId ausente -> 400',
    method: 'post',
    path: () => '/consent/privacy-restrictions',
    body: (c) => ({ patientProfileId: patient(c) }),
    expectedStatus: 400,
  },

  // --- UC-07-08: consentimiento informado de tratamiento ---
  {
    module: 'Consent',
    endpoint: 'POST /consent/treatment-informed-consents',
    name: 'happy: firma consentimiento informado',
    method: 'post',
    path: () => '/consent/treatment-informed-consents',
    body: (c) => ({
      patientProfileId: patient(c),
      tenantId: c.tenantId,
      // El encuentro real lo aporta el módulo clinical (corre antes en el registro);
      // si no estuviera disponible, el caso quedaría dependiente de ese id.
      encounterId: c.vars.clinEncounterId ?? c.adminUserId,
      decision: 'ACCEPTED',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Consent',
    endpoint: 'POST /consent/treatment-informed-consents',
    name: 'límite: decision inválida -> 400',
    method: 'post',
    path: () => '/consent/treatment-informed-consents',
    body: (c) => ({
      patientProfileId: patient(c),
      encounterId: c.adminUserId,
      decision: 'MAYBE',
    }),
    expectedStatus: 400,
  },
];
