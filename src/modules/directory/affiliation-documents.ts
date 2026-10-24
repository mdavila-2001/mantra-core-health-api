import type { LegalEntityTypeDef } from './legal-entity-types';
import { LEGAL_ENTITY_TYPE_BY_CODE } from './legal-entity-types';

/** El ISO-2 de país que declara el diccionario de tipos societarios. */
export type LegalEntityCountryIso = LegalEntityTypeDef['countryIso'];

/**
 * Roles canónicos y códigos de catálogo de los documentos legales de
 * afiliación (subtarea 1.2).
 *
 * ## Qué resuelve
 *
 * El registro de procesos pide, en el alta de aseguradora (y, repetido igual,
 * en farmacia/laboratorio/imagenología), que se adjunten en PDF la
 * Constitución, el NIT, el SEPREC, la licencia de funcionamiento y el
 * certificado del SEDES. `directory.tenant_affiliation_documents` ya existe
 * completa desde v4.0.3 con sus tres value sets (`vs_affiliation_document_type`,
 * `vs_issuing_authority`, `vs_affiliation_document_verification_status`),
 * **dueño la bóveda** (`gen_seeds.py`, no `dynamic-enum-catalog.ts`): lo único
 * que faltaba era el diccionario que traduce «qué documento pide el
 * formulario» a «qué código tiene ese documento en el value set».
 *
 * ## Por qué los nombres del DTO no son las siglas bolivianas
 *
 * El prompt original pedía `nitFileId`/`seprecFileId`/`sedesCertificateFileId`.
 * La convención del proyecto es API en inglés, así que el contrato usa los
 * roles canónicos (`TAX_IDENTIFIER_DOC`, `COMMERCE_REGISTRY_DOC`,
 * `HEALTH_AUTHORITY_CERT_DOC`…) y este archivo es el único lugar que sabe que,
 * en Bolivia, eso se traduce a `NIT_EXHIBICION`/`MATRICULA_SEPREC`/
 * `CERTIFICADO_SEDES`.
 *
 * ## Por qué la autoridad emisora depende del país
 *
 * `vs_issuing_authority` sólo nombra autoridades bolivianas. Fuera de Bolivia
 * se persiste `otro`: inventar una autoridad de otra jurisdicción sin que el
 * value set la declare sería alucinar un dato que nadie pidió sembrar
 * (diccionario internacional de autoridades emisoras, tarjeta T-32 de la
 * bóveda).
 */
export const AFFILIATION_DOCUMENT_VALUE_SETS = {
  documentType: 'VS_AFFILIATION_DOCUMENT_TYPE',
  issuingAuthority: 'VS_ISSUING_AUTHORITY',
  verificationStatus: 'VS_AFFILIATION_DOCUMENT_VERIFICATION_STATUS',
} as const;

/** Los seis roles que `tenant_affiliation_documents` puede representar. */
export const AFFILIATION_DOCUMENT_ROLES = [
  'CONSTITUTION_DOC',
  'TAX_IDENTIFIER_DOC',
  'COMMERCE_REGISTRY_DOC',
  'OPERATING_LICENSE_DOC',
  'HEALTH_AUTHORITY_CERT_DOC',
  // Reservado para el hito 1.4 (representante legal); el autorregistro de
  // organización de la subtarea 1.2 no lo pide.
  'POWER_OF_ATTORNEY_DOC',
] as const;

export type AffiliationDocumentRole =
  (typeof AFFILIATION_DOCUMENT_ROLES)[number];

/**
 * Los cinco que el autorregistro público de organización exige (1.1.2 · 1.2.1
 * · 1.3 · 1.4 · 1.5 del registro de procesos). `POWER_OF_ATTORNEY_DOC` queda
 * fuera de este tipo a propósito: es el único rol que este alta no pide, y
 * tipar la exclusión evita que un llamador construya un bloque de cinco
 * archivos con una clave que el DTO no declara.
 */
export type RegistrationDocumentRole = Exclude<
  AffiliationDocumentRole,
  'POWER_OF_ATTORNEY_DOC'
>;

export const REGISTRATION_DOCUMENT_ROLES: readonly RegistrationDocumentRole[] =
  [
    'CONSTITUTION_DOC',
    'TAX_IDENTIFIER_DOC',
    'COMMERCE_REGISTRY_DOC',
    'OPERATING_LICENSE_DOC',
    'HEALTH_AUTHORITY_CERT_DOC',
  ];

/** Código de `vs_affiliation_document_type` que corresponde a cada rol. */
export const DOCUMENT_TYPE_CODE_BY_ROLE: Readonly<
  Record<AffiliationDocumentRole, string>
> = {
  CONSTITUTION_DOC: 'ESCRITURA_CONSTITUCION',
  TAX_IDENTIFIER_DOC: 'NIT_EXHIBICION',
  COMMERCE_REGISTRY_DOC: 'MATRICULA_SEPREC',
  OPERATING_LICENSE_DOC: 'LICENCIA_FUNCIONAMIENTO',
  HEALTH_AUTHORITY_CERT_DOC: 'CERTIFICADO_SEDES',
  POWER_OF_ATTORNEY_DOC: 'PODER_REPRESENTANTE_LEGAL',
};

/**
 * Código de `vs_issuing_authority` que corresponde a cada rol, **cuando el
 * país de constitución es Bolivia**. Fuera de Bolivia, {@link issuingAuthorityCodeFor}
 * devuelve {@link ISSUING_AUTHORITY_OTHER}.
 */
export const BOLIVIAN_ISSUING_AUTHORITY_BY_ROLE: Readonly<
  Record<AffiliationDocumentRole, string>
> = {
  CONSTITUTION_DOC: 'NOTARIA',
  TAX_IDENTIFIER_DOC: 'SIAT',
  COMMERCE_REGISTRY_DOC: 'SEPREC',
  OPERATING_LICENSE_DOC: 'GOBIERNO_MUNICIPAL',
  HEALTH_AUTHORITY_CERT_DOC: 'SEDES',
  POWER_OF_ATTORNEY_DOC: 'NOTARIA',
};

/** Código de `vs_issuing_authority` para una jurisdicción sin autoridad nombrada. */
export const ISSUING_AUTHORITY_OTHER = 'OTRO';

/** Código de `vs_affiliation_document_verification_status` con el que nace toda fila. */
export const DOCUMENT_VERIFICATION_PENDING = 'PENDIENTE';

/**
 * Resuelve la autoridad emisora de un documento según el país de constitución.
 *
 * Sólo Bolivia tiene autoridades nombradas en `vs_issuing_authority` hoy; el
 * resto de jurisdicciones persiste `OTRO` hasta que exista un diccionario
 * internacional de autoridades (T-32). Sin `countryIso` declarado —la forma
 * legada `COMPANY`, que no pasa por el diccionario de tipos societarios— se
 * asume Bolivia: es el país por defecto del producto, el mismo que
 * `resolveLegalEntityType` usa como último recurso.
 *
 * @param role - Rol canónico del documento.
 * @param countryIso - País de constitución declarado o derivado, si lo hay.
 * @returns El código de `vs_issuing_authority` a persistir.
 */
export function issuingAuthorityCodeFor(
  role: AffiliationDocumentRole,
  countryIso: LegalEntityCountryIso | undefined,
): string {
  if (countryIso === undefined || countryIso === 'BO') {
    return BOLIVIAN_ISSUING_AUTHORITY_BY_ROLE[role];
  }
  return ISSUING_AUTHORITY_OTHER;
}

/**
 * El país de constitución de un alta, derivado del tipo societario declarado.
 *
 * Mismo criterio que `countryConceptForLegalEntityType`: el país lo dice el
 * tipo societario elegido, no una pregunta aparte.
 *
 * @param legalEntityType - Código del diccionario de tipos societarios.
 * @returns El ISO-2 del país, o `undefined` si el código no se conoce.
 */
export function countryIsoForLegalEntityType(
  legalEntityType: string | undefined,
): LegalEntityCountryIso | undefined {
  if (!legalEntityType) return undefined;
  return LEGAL_ENTITY_TYPE_BY_CODE.get(legalEntityType)?.countryIso;
}
