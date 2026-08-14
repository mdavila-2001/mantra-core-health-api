import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { CONCEPTS } from '../../../src/common';

/**
 * Smoke del módulo telemetry (28). Encadena definiciones de gobernanza
 * (propósito → esquema de evento → funnel) y el sujeto analítico + consentimiento,
 * usando conceptos reales (`CONCEPTS.STATE_ACTIVE`) para las columnas `*_concept_id`
 * FK-forzadas, más casos límite 401. Los eventos de actividad de alto volumen
 * dependen de un sujeto/sesión y se cubren con su caso de autenticación.
 */
const C = CONCEPTS.STATE_ACTIVE;

export const TELEMETRY_SMOKE: SmokeCase[] = [
  // UC: propósito de tracking
  {
    module: 'Telemetry',
    endpoint: 'POST /telemetry/tracking-purposes',
    name: 'happy: propósito',
    method: 'post',
    path: () => '/telemetry/tracking-purposes',
    body: (c) => ({
      purposeCode: `TP-${c.u}`,
      name: 'Analítica de producto',
      purposeCategoryConceptId: C,
      legalBasisConceptId: C,
      requiresConsent: true,
      permitsMarketingUse: false,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.telePurposeId = String(b.id);
    },
  },
  {
    module: 'Telemetry',
    endpoint: 'POST /telemetry/tracking-purposes',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/telemetry/tracking-purposes',
    auth: false,
    body: () => ({ purposeCode: 'x', name: 'x' }),
    expectedStatus: 401,
  },
  // sujeto analítico (seudónimo)
  {
    module: 'Telemetry',
    endpoint: 'POST /telemetry/analytics-subjects',
    name: 'happy: sujeto analítico',
    method: 'post',
    path: () => '/telemetry/analytics-subjects',
    body: (c) => ({
      pseudonymousSubjectKey: `subj-${c.u}`,
      keyVersion: 1,
      userId: c.adminUserId,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.teleSubjectId = String(b.id);
    },
  },
  // consentimiento de tracking
  {
    module: 'Telemetry',
    endpoint: 'POST /telemetry/tracking-consents',
    name: 'happy: consentimiento',
    method: 'post',
    path: (c) => '/telemetry/tracking-consents',
    body: (c) => ({
      purposeDefinitionId: c.vars.telePurposeId,
      userId: c.adminUserId,
      jurisdictionConceptId: C,
      consentVersion: '1.0',
      evidenceHash: 'a'.repeat(64),
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.teleConsentId = String(b.id);
    },
  },
  {
    module: 'Telemetry',
    endpoint: 'POST /telemetry/tracking-consents',
    name: 'límite: propósito inexistente',
    method: 'post',
    path: () => '/telemetry/tracking-consents',
    body: (c) => ({
      purposeDefinitionId: UUID_ABSENT,
      userId: c.adminUserId,
      consentVersion: '1.0',
      evidenceHash: 'a'.repeat(64),
    }),
    expectedStatus: 404,
  },
  // esquema de evento
  {
    module: 'Telemetry',
    endpoint: 'POST /telemetry/event-schemas',
    name: 'happy: esquema de evento',
    method: 'post',
    path: () => '/telemetry/event-schemas',
    body: (c) => ({
      eventName: `evt-${c.u}`,
      schemaVersion: 1,
      purposeDefinitionId: c.vars.telePurposeId,
      portalTypeConceptId: C,
      propertySchemaJson: { type: 'object' },
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.teleSchemaId = String(b.id);
    },
  },
  // funnel
  {
    module: 'Telemetry',
    endpoint: 'POST /telemetry/funnels',
    name: 'happy: funnel',
    method: 'post',
    path: () => '/telemetry/funnels',
    body: (c) => ({
      funnelCode: `FN-${c.u}`,
      name: 'Registro',
      purposeDefinitionId: c.vars.telePurposeId,
      portalTypeConceptId: C,
      steps: [{ stepNumber: 1, eventSchemaDefinitionId: c.vars.teleSchemaId }],
    }),
    expectedStatus: 201,
  },
  // eventos de actividad de alto volumen: dependen de sujeto/sesión → 401
  {
    module: 'Telemetry',
    endpoint: 'POST /telemetry/activity-events',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/telemetry/activity-events',
    auth: false,
    body: () => ({ events: [] }),
    expectedStatus: 401,
  },
];
