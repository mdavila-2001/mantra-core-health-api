import { SEED, deterministicId } from '../constants/concepts';
import { AFFILIATION_DOCUMENT_VALUE_SETS } from '../../modules/directory/affiliation-documents';
import { LEGAL_REPRESENTATIVE_ROLE_VALUE_SET } from '../../modules/directory/legal-representatives';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';

/**
 * Los cuatro conjuntos de valores del onboarding legal de una organización:
 * documentos de afiliación, autoridad emisora, estado de verificación del
 * documento y rol del representante legal.
 *
 * ## Por qué viven acá
 *
 * `AffiliationDocumentConceptsService` los resuelve por `internal_code` y, si
 * falta alguno, el alta de organización responde 422 «El catálogo de documentos
 * de afiliación no está disponible» (defecto D6 del 26/09/2026). Hasta ahora
 * sólo los sembraba el paquete del modelo (`gen_seeds.py`), que el despliegue
 * no carga: su base es el DDL más `seed-cli`. Es el mismo caso que
 * `VS_BO_DEPARTMENT` y se resuelve igual: el catálogo se declara en el
 * repositorio de la API y lo materializa un seeder idempotente.
 *
 * ## Procedencia
 *
 * Catálogo **interno** (no oficial). Los códigos y su orden son los del paquete
 * del modelo `mantra-core-health-model` (`salud-db/gen_seeds.py`: `VS_OWNER`
 * v4.0.3 / v4.0.4, y `salud-db/data/value-set-extensions.json` para
 * `CERTIFICADO_RADIOPROTECCION`). No se agregó ni se quitó ningún código. Los
 * rótulos son esos mismos códigos escritos en castellano con tildes: el paquete
 * los deriva del código sin tildes (`Escritura Constitucion`), que no es lo que
 * se muestra a una persona.
 *
 * ## Por qué cada conjunto tiene su propia versión de sistema de códigos
 *
 * `catalog_concepts.code` es único por versión de sistema de códigos
 * (`uq_catalog_concepts_version_code`) y `OTRO` está en tres de los cuatro
 * conjuntos. El servicio busca el concepto por su código **crudo**
 * (`NIT_EXHIBICION`, `OTRO`…), así que no se puede prefijar para desambiguar
 * como hace `geo:bo:department:SC`. Se repite el criterio del paquete del
 * modelo: una versión por conjunto (`1.0.0-vs_<nombre>`), cada una bajo el
 * sistema de códigos interno.
 */

/** Código del valor «Otro», presente en tres de los cuatro conjuntos. */
const OTHER_CODE = 'OTRO';

/** Versión única que recibe cada conjunto. */
export const AFFILIATION_CATALOG_VERSION = '1.0.0';

/** Un valor del conjunto: el código que el servicio busca y su rótulo en castellano. */
export interface AffiliationCatalogMember {
  /** Código crudo, en MAYÚSCULAS. Es la clave estable del concepto dentro de su conjunto. */
  readonly code: string;
  /** Rótulo en castellano. */
  readonly display: string;
}

/** Un conjunto de valores del onboarding legal con todos sus miembros, en orden. */
export interface AffiliationCatalogSet {
  /** `internal_code` del conjunto; es lo que el servicio de dominio consulta. */
  readonly code: string;
  /** Nombre legible del conjunto. */
  readonly name: string;
  /** Qué gobierna, en una línea. */
  readonly description: string;
  /** Sus miembros, en el orden que se ofrecen (el índice es el `ordinal`). */
  readonly members: readonly AffiliationCatalogMember[];
}

export const AFFILIATION_CATALOG_SETS: readonly AffiliationCatalogSet[] = [
  {
    code: AFFILIATION_DOCUMENT_VALUE_SETS.documentType,
    name: 'Tipo de documento de afiliación',
    description:
      'Documentos legales con los que una organización acredita su afiliación ' +
      '(`tenant_affiliation_documents.document_type_concept_id`).',
    members: [
      { code: 'ESCRITURA_CONSTITUCION', display: 'Escritura de constitución' },
      {
        code: 'PODER_REPRESENTANTE_LEGAL',
        display: 'Poder del representante legal',
      },
      { code: 'MATRICULA_SEPREC', display: 'Matrícula del SEPREC' },
      { code: 'NIT_EXHIBICION', display: 'NIT (exhibición)' },
      {
        code: 'CI_REPRESENTANTE_LEGAL',
        display: 'Cédula de identidad del representante legal',
      },
      {
        code: 'LICENCIA_FUNCIONAMIENTO',
        display: 'Licencia de funcionamiento',
      },
      { code: OTHER_CODE, display: 'Otro' },
      { code: 'CERTIFICADO_SEDES', display: 'Certificado del SEDES' },
      {
        code: 'CERTIFICADO_RADIOPROTECCION',
        display: 'Certificado de radioprotección',
      },
    ],
  },
  {
    code: AFFILIATION_DOCUMENT_VALUE_SETS.issuingAuthority,
    name: 'Autoridad emisora',
    description:
      'Organismo que emite el documento de afiliación ' +
      '(`tenant_affiliation_documents.issuing_authority_concept_id`).',
    members: [
      { code: 'SEPREC', display: 'SEPREC' },
      { code: 'SIAT', display: 'SIAT' },
      { code: 'SEGIP', display: 'SEGIP' },
      { code: 'NOTARIA', display: 'Notaría' },
      { code: 'GOBIERNO_MUNICIPAL', display: 'Gobierno municipal' },
      { code: OTHER_CODE, display: 'Otro' },
      { code: 'SEDES', display: 'SEDES' },
    ],
  },
  {
    code: AFFILIATION_DOCUMENT_VALUE_SETS.verificationStatus,
    name: 'Estado de verificación del documento de afiliación',
    description:
      'Estado de revisión de un documento de afiliación ' +
      '(`tenant_affiliation_documents.verification_status_concept_id`).',
    members: [
      { code: 'PENDIENTE', display: 'Pendiente' },
      { code: 'EN_REVISION', display: 'En revisión' },
      { code: 'VERIFICADO', display: 'Verificado' },
      { code: 'RECHAZADO', display: 'Rechazado' },
      { code: 'VENCIDO', display: 'Vencido' },
    ],
  },
  {
    code: LEGAL_REPRESENTATIVE_ROLE_VALUE_SET,
    name: 'Rol del representante legal',
    description:
      'Cargo con el que una persona representa o gerencia la organización ' +
      '(`tenant_legal_representatives.representative_role_concept_id`).',
    members: [
      { code: 'REPRESENTANTE_LEGAL', display: 'Representante legal' },
      { code: 'APODERADO', display: 'Apoderado' },
      { code: 'GERENTE_GENERAL', display: 'Gerente general' },
      { code: 'ADMINISTRADOR_UNICO', display: 'Administrador único' },
      { code: OTHER_CODE, display: 'Otro' },
      { code: 'GERENTE_COMERCIAL', display: 'Gerente comercial' },
      { code: 'GERENTE_MARKETING', display: 'Gerente de marketing' },
    ],
  },
];

/** Id determinista del conjunto de valores. */
export const affiliationSetId = (set: AffiliationCatalogSet): string =>
  valueSetId(set.code);

/** Id determinista de la versión única del conjunto. */
export const affiliationSetVersionId = (set: AffiliationCatalogSet): string =>
  valueSetVersionId(set.code);

/** URL canónica FHIR del conjunto. */
export const affiliationSetCanonicalUrl = (
  set: AffiliationCatalogSet,
): string => valueSetCanonicalUrl(set.code);

/** Id determinista de la versión del sistema de códigos que aloja los conceptos del conjunto. */
export const affiliationCodeSystemVersionId = (
  set: AffiliationCatalogSet,
): string =>
  deterministicId(
    `seed:code-system-version:${SEED.codeSystemInternalCode}:${set.code}`,
  );

/** Etiqueta de esa versión, `1.0.0-vs_<nombre>`, la misma que usa el paquete del modelo. */
export const affiliationCodeSystemVersionLabel = (
  set: AffiliationCatalogSet,
): string => `${AFFILIATION_CATALOG_VERSION}-${set.code.toLowerCase()}`;

/** Id determinista del concepto de un miembro. */
export const affiliationConceptId = (
  set: AffiliationCatalogSet,
  code: string,
): string => deterministicId(`affiliation:${set.code}:concept:${code}`);

/** Id determinista de la membresía `(conjunto, concepto)`. */
export const affiliationMemberId = (
  set: AffiliationCatalogSet,
  code: string,
): string => valueSetMemberId(set.code, affiliationConceptId(set, code));
