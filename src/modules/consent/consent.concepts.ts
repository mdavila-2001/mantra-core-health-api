import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo `consent` (07 — Privacy Directives, Legal Bases and
 * Consent Evidence). Se declaran aquí, con el prefijo `consent`, para no tocar
 * archivos compartidos (`src/common/constants/concepts.ts`): así varios módulos se
 * pueden implementar en paralelo sin colisionar en el UUID derivado.
 *
 * Cada clave cubre una columna `*_concept_id` NOT NULL de los INSERT/UPDATE del
 * módulo (estados del ciclo de vida, tipos de directiva, tipos de evento y
 * resultados de resolución). El orquestador de seeds reúne `CONSENT_CONCEPT_SEEDS`
 * junto con los del resto de módulos ya integrados.
 */
export const { seeds: CONSENT_CONCEPT_SEEDS, ids: CONS } = defineModuleConcepts(
  'consent',
  {
    // --- Estados de ciclo de vida ---
    CONSENT_ACTIVE: { code: 'CONSENT_ACTIVE', display: 'Consent active' },
    CONSENT_WITHDRAWN: {
      code: 'CONSENT_WITHDRAWN',
      display: 'Consent withdrawn',
    },
    CONSENT_EXPIRED: { code: 'CONSENT_EXPIRED', display: 'Consent expired' },
    HIPAA_ACTIVE: {
      code: 'HIPAA_AUTH_ACTIVE',
      display: 'HIPAA authorization active',
    },
    HIPAA_REVOKED: {
      code: 'HIPAA_AUTH_REVOKED',
      display: 'HIPAA authorization revoked',
    },
    HIPAA_EXPIRED: {
      code: 'HIPAA_AUTH_EXPIRED',
      display: 'HIPAA authorization expired',
    },
    OBJECTION_STATUS_RAISED: {
      code: 'OBJECTION_RAISED',
      display: 'Objection raised',
    },
    OBJECTION_STATUS_RESOLVED: {
      code: 'OBJECTION_RESOLVED',
      display: 'Objection resolved',
    },
    RESTRICTION_ACTIVE: {
      code: 'RESTRICTION_ACTIVE',
      display: 'Privacy restriction active',
    },
    RESTRICTION_REVOKED: {
      code: 'RESTRICTION_REVOKED',
      display: 'Privacy restriction revoked',
    },
    RESTRICTION_EXPIRED: {
      code: 'RESTRICTION_EXPIRED',
      display: 'Privacy restriction expired',
    },
    LEGAL_BASIS_ACTIVE: {
      code: 'LEGAL_BASIS_ACTIVE',
      display: 'Legal basis active',
    },
    LEGAL_BASIS_SUPERSEDED: {
      code: 'LEGAL_BASIS_SUPERSEDED',
      display: 'Legal basis superseded',
    },
    TREATMENT_DRAFT: {
      code: 'TREATMENT_CONSENT_DRAFT',
      display: 'Treatment consent draft',
    },
    TREATMENT_SIGNED: {
      code: 'TREATMENT_CONSENT_SIGNED',
      display: 'Treatment consent signed',
    },
    STATUS_NONE: { code: 'STATUS_NONE', display: 'No prior status' },

    // --- FT-07: vínculo médico-paciente por consentimiento ---
    // El médico busca por nombre/CI (TAREA-07 S1+S3, ya en dev) pero eso sólo
    // encuentra a la persona: todavía no le da acceso al expediente. Estos tres
    // estados son el ciclo de la solicitud que falta — pedida, y las dos
    // resoluciones posibles — antes de que `capture()` la deje ACTIVE.
    ACCESS_REQUEST_PENDING: {
      code: 'PRACTITIONER_ACCESS_PENDING',
      display: 'Practitioner access requested, awaiting patient decision',
    },
    ACCESS_REQUEST_DECLINED: {
      code: 'PRACTITIONER_ACCESS_DECLINED',
      display: 'Practitioner access declined by patient',
    },
    // Provisión "pedida, todavía no autorizada ni negada": distinto de
    // ACTION_PERMIT/ACTION_DENY, que son la decisión ya tomada del paciente.
    ACTION_REQUESTED: {
      code: 'CONSENT_ACTION_REQUESTED',
      display: 'Requested, decision pending',
    },
    CATEGORY_PRACTITIONER_ACCESS: {
      code: 'CONSENT_CAT_PRACTITIONER_ACCESS',
      display: 'Practitioner record-access consent',
    },
    EVENT_ACCESS_REQUESTED: {
      code: 'EVENT_ACCESS_REQUESTED',
      display: 'Practitioner access requested',
    },
    EVENT_ACCESS_DECLINED: {
      code: 'EVENT_ACCESS_DECLINED',
      display: 'Practitioner access declined',
    },
    NOTICE_ACCESS_REQUESTED: {
      code: 'CONSENT_NOTICE_ACCESS_REQUESTED',
      display: 'Notice: practitioner access requested',
    },
    NOTICE_ACCESS_DECIDED: {
      code: 'CONSENT_NOTICE_ACCESS_DECIDED',
      display: 'Notice: practitioner access request decided',
    },

    // --- Categorías / tipos de directiva ---
    CATEGORY_PRIVACY: {
      code: 'CONSENT_CAT_PRIVACY',
      display: 'Privacy directive consent',
    },
    PROVISION_TYPE_BASE: {
      code: 'PROVISION_TYPE_BASE',
      display: 'Base provision',
    },
    ACTION_PERMIT: { code: 'CONSENT_ACTION_PERMIT', display: 'Permit' },
    ACTION_DENY: { code: 'CONSENT_ACTION_DENY', display: 'Deny' },
    OBJECTION_TYPE_PROCESSING: {
      code: 'OBJECTION_TYPE_PROCESSING',
      display: 'Objection to processing',
    },
    RESTRICTION_TYPE_BLOCK: {
      code: 'RESTRICTION_TYPE_BLOCK',
      display: 'Block disclosure restriction',
    },
    DATA_CLASS_ALL: { code: 'DATA_CLASS_ALL', display: 'All data classes' },
    JURISDICTION_PE: { code: 'JURISDICTION_PE', display: 'Peru jurisdiction' },
    // Bolivia. El módulo nació con Perú como única jurisdicción y es el valor
    // por defecto de `ProcessingLegalBasesService`; la base legal que ampara la
    // representación de un menor por su madre o su padre es boliviana, así que
    // no puede heredar esa.
    JURISDICTION_BO: { code: 'JURISDICTION_BO', display: 'Bolivia jurisdiction' },
    LEGAL_BASIS_CONSENT: {
      code: 'GEN_LEGAL_BASIS_CONSENT',
      display: 'Consent legal basis',
    },
    // Lo que ampara que un tutor vea los datos de su dependiente. NO es
    // consentimiento: un menor de tres años no consiente nada, y llamar
    // consentimiento a lo que decide otro por él sería registrar en la base una
    // afirmación falsa. Es la representación legal, que es su propia base.
    LEGAL_BASIS_LEGAL_REPRESENTATION: {
      code: 'GEN_LEGAL_BASIS_LEGAL_REPRESENTATION',
      display: 'Legal representation legal basis',
    },
    EXPIRATION_TYPE_DATE: {
      code: 'EXPIRATION_TYPE_DATE',
      display: 'Expires on date',
    },
    EXPIRATION_TYPE_EVENT: {
      code: 'EXPIRATION_TYPE_EVENT',
      display: 'Expires on event',
    },
    DECISION_ACCEPTED: {
      code: 'TREATMENT_DECISION_ACCEPTED',
      display: 'Accepted',
    },
    DECISION_DECLINED: {
      code: 'TREATMENT_DECISION_DECLINED',
      display: 'Declined',
    },
    EVIDENCE_TYPE_SIGNATURE: {
      code: 'EVIDENCE_TYPE_SIGNATURE',
      display: 'Signature evidence',
    },
    CHANNEL_IN_PERSON: {
      code: 'CAPTURE_CHANNEL_IN_PERSON',
      display: 'Captured in person',
    },
    RESOLUTION_UPHELD: {
      code: 'OBJECTION_RESOLUTION_UPHELD',
      display: 'Objection upheld',
    },
    RESOLUTION_REJECTED: {
      code: 'OBJECTION_RESOLUTION_REJECTED',
      display: 'Objection rejected',
    },

    // --- Tipos de sujeto (subject_type) para eventos y evidencia ---
    SUBJECT_CONSENT: { code: 'SUBJECT_CONSENT', display: 'Consent subject' },
    SUBJECT_HIPAA: {
      code: 'SUBJECT_HIPAA_AUTHORIZATION',
      display: 'HIPAA authorization subject',
    },
    SUBJECT_OBJECTION: {
      code: 'SUBJECT_OBJECTION',
      display: 'Patient objection subject',
    },
    SUBJECT_RESTRICTION: {
      code: 'SUBJECT_PRIVACY_RESTRICTION',
      display: 'Privacy restriction subject',
    },
    SUBJECT_TREATMENT: {
      code: 'SUBJECT_TREATMENT_CONSENT',
      display: 'Treatment consent subject',
    },

    // --- Tipos de evento (consent_events.event_type) ---
    EVENT_GRANTED: { code: 'EVENT_GRANTED', display: 'Consent granted' },
    EVENT_WITHDRAWN: { code: 'EVENT_WITHDRAWN', display: 'Consent withdrawn' },
    EVENT_PROVISIONS_AMENDED: {
      code: 'EVENT_PROVISIONS_AMENDED',
      display: 'Provisions amended',
    },
    EVENT_OBJECTION_RAISED: {
      code: 'EVENT_OBJECTION_RAISED',
      display: 'Objection raised',
    },
    EVENT_OBJECTION_RESOLVED: {
      code: 'EVENT_OBJECTION_RESOLVED',
      display: 'Objection resolved',
    },
    EVENT_AUTHORIZED: {
      code: 'EVENT_AUTHORIZED',
      display: 'HIPAA authorization granted',
    },
    EVENT_REVOKED: {
      code: 'EVENT_REVOKED',
      display: 'HIPAA authorization revoked',
    },
    EVENT_RESTRICTION_APPLIED: {
      code: 'EVENT_RESTRICTION_APPLIED',
      display: 'Restriction applied',
    },
    EVENT_SIGNED: { code: 'EVENT_SIGNED', display: 'Treatment consent signed' },
    EVENT_EXPIRED: { code: 'EVENT_EXPIRED', display: 'Directive expired' },
  },
);
