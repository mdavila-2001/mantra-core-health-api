import { deterministicId } from '../../common/constants/concepts';
import { IDA } from './identity_assurance.concepts';

/**
 * Identificadores deterministas de los **datos de referencia** de verificación
 * de identidad: la autoridad verificadora, sus endpoints por capacidad y las
 * tres políticas (carnet, matrícula profesional, documento de institución).
 *
 * No son conceptos de catálogo sino filas reales con columnas propias, así que
 * viven aquí y no en `identity_assurance.concepts.ts`. Se derivan con el mismo
 * UUIDv5 que los conceptos por el mismo motivo: el seed y el runtime coinciden
 * sin coordinación, y los servicios de autoservicio (UC de la fase 6) pueden
 * abrir un caso citando la política por id sin un lookup por texto.
 *
 * `IdentityVerificationSeedService` materializa exactamente estas filas.
 */
export const IDA_SEED = {
  /** Proveedor externo en `integrations.external_providers`. */
  providerId: deterministicId(
    'seed:integrations-provider:identity-verification',
  ),
  providerCode: 'IDENTITY_VERIFICATION',
  /** Endpoint HTTP del proveedor en `integrations.integration_endpoints`. */
  integrationEndpointId: deterministicId(
    'seed:integration-endpoint:identity-verification',
  ),
  integrationEndpointCode: 'IDENTITY_VERIFICATION_EXECUTE',
  /** Autoridad en `identity_assurance.identity_authorities`. */
  authorityId: deterministicId('seed:identity-authority:default'),
  authorityCode: 'DEFAULT_IDENTITY_REGISTRY',
} as const;

/**
 * Qué necesita cada vertical de verificación para abrir su caso: política,
 * tipo de sujeto, tipo de check (que es también la capacidad del endpoint de la
 * autoridad) y tipo de evidencia esperado.
 *
 * Tenerlo en una sola tabla evita que cada endpoint de autoservicio repita la
 * combinación y que se desalineen entre sí (p. ej. abrir un caso de matrícula
 * planificando un check de carnet, que el proveedor resolvería contra el
 * registro equivocado).
 */
export interface IdentityVerificationVertical {
  /** Código legible de la política; también su `policy_code` en base. */
  policyCode: string;
  /** Id determinista de la fila en `identity_verification_policies`. */
  policyId: string;
  /** Id determinista del `identity_authority_endpoints` que atiende el check. */
  authorityEndpointId: string;
  subjectTypeConceptId: string;
  checkTypeConceptId: string;
  evidenceTypeConceptId: string;
}

/** Construye una vertical derivando sus ids del `policyCode`. */
function vertical(
  policyCode: string,
  subjectTypeConceptId: string,
  checkTypeConceptId: string,
  evidenceTypeConceptId: string,
): IdentityVerificationVertical {
  return {
    policyCode,
    policyId: deterministicId(`seed:identity-policy:${policyCode}`),
    authorityEndpointId: deterministicId(
      `seed:identity-authority-endpoint:${policyCode}`,
    ),
    subjectTypeConceptId,
    checkTypeConceptId,
    evidenceTypeConceptId,
  };
}

/** Verificación de identidad de una persona por su carnet (paciente o profesional). */
export const IDENTITY_CARD_VERTICAL = vertical(
  'IDENTITY_CARD_BASIC',
  IDA.SUBJECT_PATIENT_IDENTITY,
  IDA.CHECK_TYPE_IDENTITY_CARD,
  IDA.EVIDENCE_TYPE_SELFIE_WITH_ID,
);

/** Verificación de matrícula profesional contra el registro sanitario. */
export const MEDICAL_LICENSE_VERTICAL = vertical(
  'MEDICAL_LICENSE_BASIC',
  IDA.SUBJECT_PRACTITIONER_LICENSE,
  IDA.CHECK_TYPE_MEDICAL_LICENSE,
  IDA.EVIDENCE_TYPE_LICENSE_DOCUMENT,
);

/** Verificación de una institución por su documentación registral. */
export const INSTITUTION_DOCUMENT_VERTICAL = vertical(
  'INSTITUTION_DOCUMENT_BASIC',
  IDA.SUBJECT_TENANT_IDENTITY,
  IDA.CHECK_TYPE_INSTITUTION_DOCUMENT,
  IDA.EVIDENCE_TYPE_INSTITUTION_DOCUMENT,
);

/**
 * La identidad de un profesional usa la misma política y el mismo check que la
 * de un paciente (mismo carnet, mismo registro civil): sólo cambia el tipo de
 * sujeto, para que el efecto de dominio pueda distinguirlos.
 */
export const PRACTITIONER_IDENTITY_VERTICAL: IdentityVerificationVertical = {
  ...IDENTITY_CARD_VERTICAL,
  subjectTypeConceptId: IDA.SUBJECT_PRACTITIONER_IDENTITY,
};

/** Las tres políticas distintas que se materializan en base. */
export const IDENTITY_VERIFICATION_VERTICALS: readonly IdentityVerificationVertical[] =
  [
    IDENTITY_CARD_VERTICAL,
    MEDICAL_LICENSE_VERTICAL,
    INSTITUTION_DOCUMENT_VERTICAL,
  ];
