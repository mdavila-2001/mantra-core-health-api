import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo Identity Assurance (proofing de identidad,
 * aserciones NIST 800-63 IAL/AAL y controles de fraude). Cada estado / resultado
 * que los servicios fijan en una columna `*_concept_id` NOT NULL sale de aquí; los
 * valores que aporta el cliente (tipo/severidad de señal de fraude, calidad de
 * evidencia, etc.) se reciben por DTO y no se declaran en este catálogo. Para el
 * estado genérico "activo" de autoridades / endpoints / políticas se reutiliza
 * `CONCEPTS.STATE_ACTIVE`.
 *
 * **Excepción deliberada**: los bloques `SUBJECT_*`, `CHECK_TYPE_*`,
 * `EVIDENCE_TYPE_*`, `AUTHORITY_TYPE_*`, `ASSURANCE_*` y `TRANSACTION_RISK_*` SÍ
 * se declaran aquí aunque el resto del módulo los trate como valores del cliente.
 * La razón: los flujos de autoservicio (paciente sube foto con su carnet,
 * profesional pide verificar su matrícula, institución sus documentos) abren el
 * caso desde el propio backend, no desde un admin que conozca ids de concepto —
 * el backend necesita nombrarlos, y el worker necesita elegir el endpoint de la
 * autoridad por capacidad. Los datos de referencia que los usan (autoridad,
 * endpoints y las tres políticas) los siembra `IdentityVerificationSeedService`.
 *
 * El prefijo `identity_assurance` espacia las claves para derivar UUIDv5 sin
 * colisionar con otros módulos. `IDENTITY_ASSURANCE_CONCEPT_SEEDS` lo consume el
 * agregador central (lo cablea el orquestador); `IDA` lo consumen servicios y smoke.
 */
export const { seeds: IDENTITY_ASSURANCE_CONCEPT_SEEDS, ids: IDA } =
  defineModuleConcepts('identity_assurance', {
    // --- Autoridad de identidad (verification_status_concept_id) --------------
    AUTHORITY_VERIFIED: {
      code: 'IDA_AUTH_VERIFIED',
      display: 'Identity authority verified',
    },

    // --- Ciclo de vida del caso de verificación (cases.status_concept_id) -----
    CASE_OPEN: { code: 'IDA_CASE_OPEN', display: 'Verification case open' },
    CASE_IN_VERIFICATION: {
      code: 'IDA_CASE_IN_VERIFICATION',
      display: 'Case in verification',
    },
    CASE_AT_RISK: { code: 'IDA_CASE_AT_RISK', display: 'Case flagged at risk' },
    CASE_MANUAL_REVIEW: {
      code: 'IDA_CASE_MANUAL_REVIEW',
      display: 'Case in manual review',
    },
    CASE_VERIFIED: { code: 'IDA_CASE_VERIFIED', display: 'Case verified' },
    CASE_REJECTED: { code: 'IDA_CASE_REJECTED', display: 'Case rejected' },
    CASE_ASSERTED: { code: 'IDA_CASE_ASSERTED', display: 'Case asserted' },
    CASE_REVOKED: {
      code: 'IDA_CASE_REVOKED',
      display: 'Case assertion revoked',
    },
    CASE_EXPIRED: { code: 'IDA_CASE_EXPIRED', display: 'Case expired' },

    // --- Evidencia (evidence.verification_status_concept_id) ------------------
    EVIDENCE_PENDING: {
      code: 'IDA_EVIDENCE_PENDING',
      display: 'Evidence pending verification',
    },

    // --- Checks (checks.status_concept_id) ------------------------------------
    CHECK_PENDING: { code: 'IDA_CHECK_PENDING', display: 'Check pending' },
    CHECK_IN_PROGRESS: {
      code: 'IDA_CHECK_IN_PROGRESS',
      display: 'Check in progress',
    },
    CHECK_COMPLETED: {
      code: 'IDA_CHECK_COMPLETED',
      display: 'Check completed',
    },
    CHECK_FAILED: { code: 'IDA_CHECK_FAILED', display: 'Check failed' },
    CHECK_CANCELLED: {
      code: 'IDA_CHECK_CANCELLED',
      display: 'Check cancelled',
    },

    // --- Intentos contra autoridad (attempts.outcome_concept_id) --------------
    ATTEMPT_SUCCESS: {
      code: 'IDA_ATTEMPT_SUCCESS',
      display: 'Authority attempt succeeded',
    },
    ATTEMPT_PENDING: {
      code: 'IDA_ATTEMPT_PENDING',
      display: 'Authority attempt pending',
    },
    ATTEMPT_FAILED: {
      code: 'IDA_ATTEMPT_FAILED',
      display: 'Authority attempt failed',
    },

    // --- Resultados de check (results.result_concept_id) ----------------------
    RESULT_MATCH: { code: 'IDA_RESULT_MATCH', display: 'Check result match' },
    RESULT_NO_MATCH: {
      code: 'IDA_RESULT_NO_MATCH',
      display: 'Check result no match',
    },

    // --- Actor que registra el resultado (checked_by_actor_type_concept_id) ---
    ACTOR_TYPE_SYSTEM: {
      code: 'IDA_ACTOR_SYSTEM',
      display: 'System worker actor',
    },

    // --- Señales de fraude (fraud_signals.resolution_concept_id) --------------
    FRAUD_OPEN: { code: 'IDA_FRAUD_OPEN', display: 'Fraud signal open' },
    FRAUD_RESOLVED: {
      code: 'IDA_FRAUD_RESOLVED',
      display: 'Fraud signal resolved',
    },

    // --- Revisión manual (manual_review.status_concept_id / decision) ---------
    REVIEW_OPEN: { code: 'IDA_REVIEW_OPEN', display: 'Manual review open' },
    REVIEW_DECIDED: {
      code: 'IDA_REVIEW_DECIDED',
      display: 'Manual review decided',
    },
    DECISION_APPROVED: {
      code: 'IDA_DECISION_APPROVED',
      display: 'Manual review approved',
    },
    DECISION_REJECTED: {
      code: 'IDA_DECISION_REJECTED',
      display: 'Manual review rejected',
    },

    // --- Aserciones (assertions.assertion_type / revocation_reason) -----------
    ASSERTION_IDENTITY: {
      code: 'IDA_ASSERTION_IDENTITY',
      display: 'Identity assertion',
    },
    REVOCATION_FRAUD: {
      code: 'IDA_REVOCATION_FRAUD',
      display: 'Assertion revoked for fraud',
    },

    // --- Sujeto del caso (cases.subject_type_concept_id) ----------------------
    // Distinguen QUÉ se está verificando, y por tanto qué efecto de dominio se
    // aplica al verificarse (ver `IdentityVerificationEffectsService`).
    SUBJECT_PATIENT_IDENTITY: {
      code: 'IDA_SUBJECT_PATIENT_IDENTITY',
      display: 'Patient identity',
    },
    SUBJECT_PRACTITIONER_IDENTITY: {
      code: 'IDA_SUBJECT_PRACTITIONER_IDENTITY',
      display: 'Practitioner identity',
    },
    SUBJECT_PRACTITIONER_LICENSE: {
      code: 'IDA_SUBJECT_PRACTITIONER_LICENSE',
      display: 'Practitioner professional license',
    },
    SUBJECT_TENANT_IDENTITY: {
      code: 'IDA_SUBJECT_TENANT_IDENTITY',
      display: 'Institution identity',
    },

    // --- Tipo de check (checks.check_type_concept_id) -------------------------
    // Doble uso: también son la `capability_concept_id` del endpoint de la
    // autoridad, para que el worker sepa a qué endpoint despachar cada check.
    CHECK_TYPE_IDENTITY_CARD: {
      code: 'IDA_CHECK_TYPE_IDENTITY_CARD',
      display: 'Identity card check',
    },
    CHECK_TYPE_MEDICAL_LICENSE: {
      code: 'IDA_CHECK_TYPE_MEDICAL_LICENSE',
      display: 'Medical license check',
    },
    CHECK_TYPE_INSTITUTION_DOCUMENT: {
      code: 'IDA_CHECK_TYPE_INSTITUTION_DOCUMENT',
      display: 'Institution document check',
    },

    // --- Tipo de evidencia (evidence.evidence_type_concept_id) ---------------
    EVIDENCE_TYPE_SELFIE_WITH_ID: {
      code: 'IDA_EVIDENCE_TYPE_SELFIE_WITH_ID',
      display: 'Selfie holding identity document',
    },
    EVIDENCE_TYPE_LICENSE_DOCUMENT: {
      code: 'IDA_EVIDENCE_TYPE_LICENSE_DOCUMENT',
      display: 'Professional license document',
    },
    EVIDENCE_TYPE_INSTITUTION_DOCUMENT: {
      code: 'IDA_EVIDENCE_TYPE_INSTITUTION_DOCUMENT',
      display: 'Institution registration document',
    },

    // --- Datos de referencia sembrados (autoridad y políticas) ---------------
    AUTHORITY_TYPE_REGISTRY: {
      code: 'IDA_AUTHORITY_TYPE_REGISTRY',
      display: 'Official registry authority',
    },
    ASSURANCE_LEVEL_IAL2: {
      code: 'IDA_ASSURANCE_IAL2',
      display: 'Identity assurance level 2',
    },
    TRANSACTION_RISK_STANDARD: {
      code: 'IDA_TRANSACTION_RISK_STANDARD',
      display: 'Standard transaction risk',
    },
  });
