import { CONCEPTS } from '../../common/constants/concepts';

/**
 * Diccionario internacional de formas societarias (subtarea 1.1).
 *
 * ## Qué resuelve
 *
 * El registro de procesos pide, en los cinco módulos que dan de alta una
 * organización (médico, farmacia, laboratorio, imagen y aseguradora), que el
 * tipo societario se **elija de una lista cerrada**, «para tener DATA de
 * cuántos proveedores tenemos con SRL, UNIPERSONAL y S.A.». Las 8 formas
 * bolivianas ya eran conceptos y ya formaban la enumeración dinámica
 * `legal-entity-type` (`dynamic-enum-catalog.ts`); lo que faltaba era: (1) un
 * código estable por el que el DTO pueda pedirlas sin que el cliente adivine
 * un uuid, y (2) las figuras de otras jurisdicciones que el producto proyecta
 * cubrir.
 *
 * ## Por qué NO hay una columna `canonical_legal_category`
 *
 * La categoría canónica es una función determinista del tipo elegido — no un
 * hecho que alguien declare por separado —, así que vive como **propiedad del
 * concepto** (`legal-entity-canonical-category`, sembrada por
 * `LegalEntityTypesSeedService`) y se lee con
 * `GET /terminology/value-sets/:id/$expand?includeProperties=true` o con un
 * JOIN a `terminology.concept_properties` para BI. Agregar una columna a
 * `directory.tenants` para un dato derivado habría duplicado la fuente de
 * verdad sin necesidad.
 *
 * ## Los 8 códigos bolivianos NO se renombran
 *
 * `SRL`, `SA`, `UNIPERSONAL`... son los códigos que el DTO y el catálogo
 * bilateral ya usan (`bolivia-insurance-seed.service.ts`, `gen_seeds.py`
 * del modelo, filas ya persistidas). Prefijarlos con `BO_` sería un cambio de
 * contrato sin motivo: el país ya se deriva de `countryIso` acá abajo.
 */

/** Las 6 macro-categorías canónicas que agrupan cualquier forma societaria. */
export const CANONICAL_LEGAL_CATEGORIES = [
  'SOLE_PROPRIETORSHIP',
  'LIMITED_LIABILITY',
  'CORPORATION',
  'SIMPLIFIED_SHARES',
  'PARTNERSHIP',
  'FOREIGN_BRANCH',
] as const;

export type CanonicalLegalCategory =
  (typeof CANONICAL_LEGAL_CATEGORIES)[number];

/** Código de la propiedad que guarda el país (ISO-2) de cada forma societaria. */
export const LEGAL_ENTITY_COUNTRY_PROPERTY_CODE = 'legal-entity-country';

/** Código de la propiedad que guarda la categoría canónica de cada forma societaria. */
export const LEGAL_ENTITY_CANONICAL_CATEGORY_PROPERTY_CODE =
  'legal-entity-canonical-category';

/** Una forma societaria del diccionario internacional. */
export interface LegalEntityTypeDef {
  /** Código estable con el que el DTO la pide (`SRL`, `US_LLC`...). */
  readonly code: string;
  /** El concepto ya sembrado en `terminology.catalog_concepts`. */
  readonly conceptId: string;
  /** País donde rige esta figura, en ISO 3166-1 alfa-2. */
  readonly countryIso: 'BO' | 'BR' | 'US' | 'AR' | 'MX';
  /** La macro-categoría a la que pertenece. */
  readonly canonicalCategory: CanonicalLegalCategory;
  /** El acrónimo tal como se ve en un comprobante (`S.R.L.`, `LLC`...). */
  readonly acronym: string;
}

/**
 * El diccionario completo, en el orden en que se sembraron los conceptos
 * (Bolivia primero — no se reordena; ver `dynamic-enum-catalog.ts`).
 */
export const LEGAL_ENTITY_TYPES: readonly LegalEntityTypeDef[] = [
  // --- Bolivia ---
  {
    code: 'UNIPERSONAL',
    conceptId: CONCEPTS.LEGAL_ENTITY_SOLE_PROPRIETORSHIP,
    countryIso: 'BO',
    canonicalCategory: 'SOLE_PROPRIETORSHIP',
    acronym: 'P.N.',
  },
  {
    code: 'SRL',
    conceptId: CONCEPTS.LEGAL_ENTITY_SRL,
    countryIso: 'BO',
    canonicalCategory: 'LIMITED_LIABILITY',
    acronym: 'S.R.L.',
  },
  {
    code: 'LTDA',
    conceptId: CONCEPTS.LEGAL_ENTITY_LTDA,
    countryIso: 'BO',
    canonicalCategory: 'LIMITED_LIABILITY',
    acronym: 'Ltda.',
  },
  {
    code: 'SA',
    conceptId: CONCEPTS.LEGAL_ENTITY_SA,
    countryIso: 'BO',
    canonicalCategory: 'CORPORATION',
    acronym: 'S.A.',
  },
  {
    code: 'SOCIEDAD_COLECTIVA',
    conceptId: CONCEPTS.LEGAL_ENTITY_GENERAL_PARTNERSHIP,
    countryIso: 'BO',
    canonicalCategory: 'PARTNERSHIP',
    acronym: 'S.C.',
  },
  {
    code: 'COMANDITA_SIMPLE',
    conceptId: CONCEPTS.LEGAL_ENTITY_LIMITED_PARTNERSHIP,
    countryIso: 'BO',
    canonicalCategory: 'PARTNERSHIP',
    acronym: 'S.C.S.',
  },
  {
    code: 'COMANDITA_ACCIONES',
    conceptId: CONCEPTS.LEGAL_ENTITY_PARTNERSHIP_BY_SHARES,
    countryIso: 'BO',
    canonicalCategory: 'PARTNERSHIP',
    acronym: 'S.C.A.',
  },
  {
    code: 'SUCURSAL_EXTRANJERA',
    conceptId: CONCEPTS.LEGAL_ENTITY_FOREIGN_BRANCH,
    countryIso: 'BO',
    canonicalCategory: 'FOREIGN_BRANCH',
    acronym: 'Suc.',
  },
  // --- Brasil ---
  {
    code: 'BR_LTDA',
    conceptId: CONCEPTS.LEGAL_ENTITY_BR_LTDA,
    countryIso: 'BR',
    canonicalCategory: 'LIMITED_LIABILITY',
    acronym: 'LTDA',
  },
  {
    code: 'BR_SA',
    conceptId: CONCEPTS.LEGAL_ENTITY_BR_SA,
    countryIso: 'BR',
    canonicalCategory: 'CORPORATION',
    acronym: 'S.A.',
  },
  {
    code: 'BR_MEI',
    conceptId: CONCEPTS.LEGAL_ENTITY_BR_MEI,
    countryIso: 'BR',
    canonicalCategory: 'SOLE_PROPRIETORSHIP',
    acronym: 'MEI',
  },
  {
    code: 'BR_EI',
    conceptId: CONCEPTS.LEGAL_ENTITY_BR_EI,
    countryIso: 'BR',
    canonicalCategory: 'SOLE_PROPRIETORSHIP',
    acronym: 'EI',
  },
  {
    code: 'BR_SLU',
    conceptId: CONCEPTS.LEGAL_ENTITY_BR_SLU,
    countryIso: 'BR',
    canonicalCategory: 'SIMPLIFIED_SHARES',
    acronym: 'SLU',
  },
  {
    code: 'BR_FILIAL_EST',
    conceptId: CONCEPTS.LEGAL_ENTITY_BR_FILIAL_EST,
    countryIso: 'BR',
    canonicalCategory: 'FOREIGN_BRANCH',
    acronym: 'Filial',
  },
  // --- Estados Unidos ---
  {
    code: 'US_LLC',
    conceptId: CONCEPTS.LEGAL_ENTITY_US_LLC,
    countryIso: 'US',
    canonicalCategory: 'LIMITED_LIABILITY',
    acronym: 'LLC',
  },
  {
    code: 'US_CORP',
    conceptId: CONCEPTS.LEGAL_ENTITY_US_CORP,
    countryIso: 'US',
    canonicalCategory: 'CORPORATION',
    acronym: 'Inc. / Corp.',
  },
  {
    code: 'US_SOLE_PROP',
    conceptId: CONCEPTS.LEGAL_ENTITY_US_SOLE_PROP,
    countryIso: 'US',
    canonicalCategory: 'SOLE_PROPRIETORSHIP',
    acronym: 'Sole Prop',
  },
  {
    code: 'US_LLP',
    conceptId: CONCEPTS.LEGAL_ENTITY_US_LLP,
    countryIso: 'US',
    canonicalCategory: 'PARTNERSHIP',
    acronym: 'LLP',
  },
  {
    code: 'US_BRANCH',
    conceptId: CONCEPTS.LEGAL_ENTITY_US_BRANCH,
    countryIso: 'US',
    canonicalCategory: 'FOREIGN_BRANCH',
    acronym: 'Branch',
  },
  // --- Argentina y México ---
  {
    code: 'AR_SAS',
    conceptId: CONCEPTS.LEGAL_ENTITY_AR_SAS,
    countryIso: 'AR',
    canonicalCategory: 'SIMPLIFIED_SHARES',
    acronym: 'S.A.S.',
  },
  {
    code: 'MX_S_RL',
    conceptId: CONCEPTS.LEGAL_ENTITY_MX_S_RL,
    countryIso: 'MX',
    canonicalCategory: 'LIMITED_LIABILITY',
    acronym: 'S. de R.L.',
  },
];

export type LegalEntityTypeCode = (typeof LEGAL_ENTITY_TYPES)[number]['code'];

/** Los códigos válidos, para `@IsIn` y para la documentación OpenAPI. */
export const LEGAL_ENTITY_TYPE_CODES: readonly string[] =
  LEGAL_ENTITY_TYPES.map((entry) => entry.code);

/** Mapea el código (DTO) a su concept id. */
export const LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE: Readonly<
  Record<string, string>
> = Object.fromEntries(
  LEGAL_ENTITY_TYPES.map((entry) => [entry.code, entry.conceptId]),
);

/** Mapea el concept id a su definición completa; para la lectura inversa. */
export const LEGAL_ENTITY_TYPE_BY_CONCEPT_ID: ReadonlyMap<
  string,
  LegalEntityTypeDef
> = new Map(LEGAL_ENTITY_TYPES.map((entry) => [entry.conceptId, entry]));

/** Mapea el código de la forma societaria a su definición completa. */
export const LEGAL_ENTITY_TYPE_BY_CODE: ReadonlyMap<
  string,
  LegalEntityTypeDef
> = new Map(LEGAL_ENTITY_TYPES.map((entry) => [entry.code, entry]));

/** El concepto de país (`common:country:*`) de cada ISO que el diccionario declara. */
export const LEGAL_ENTITY_COUNTRY_CONCEPT_BY_ISO: Readonly<
  Record<LegalEntityTypeDef['countryIso'], string>
> = {
  BO: CONCEPTS.COUNTRY_BO,
  BR: CONCEPTS.COUNTRY_BR,
  US: CONCEPTS.COUNTRY_US,
  AR: CONCEPTS.COUNTRY_AR,
  MX: CONCEPTS.COUNTRY_MX,
};

/**
 * Resuelve el tipo societario a su concept id.
 *
 * Mismo patrón que `resolveTenantType` (`directory-tenants.service.ts`): el
 * código (`legalEntityType`) manda sobre el UUID crudo
 * (`legalEntityTypeConceptId`), que queda como escotilla para un tipo que un
 * despliegue haya sembrado por su cuenta fuera del diccionario. Sin ninguno de
 * los dos, el `fallback` (`CONCEPTS.LEGAL_ENTITY_COMPANY`, el legado).
 *
 * @param code - Código del diccionario, si el cliente lo declaró.
 * @param conceptId - Concept id crudo, si el cliente lo declaró.
 * @param fallback - Concepto a usar cuando el cliente no declara ninguno.
 * @returns El `legal_entity_type_concept_id` a persistir.
 */
export function resolveLegalEntityType(
  code: string | undefined,
  conceptId: string | undefined,
  fallback: string,
): string {
  if (code) return LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE[code] ?? fallback;
  return conceptId ?? fallback;
}

/**
 * El país de constitución que corresponde a un tipo societario, si el
 * diccionario lo declara.
 *
 * Se usa para derivar `countryConceptId` en el autoalta público cuando el
 * cliente eligió el tipo societario pero no declaró país explícitamente — el
 * caso de uso es justamente ofrecer «país de constitución» como una sola
 * pregunta en vez de dos.
 *
 * @param code - Código del diccionario.
 * @returns El concept id del país, o `undefined` si el código no se conoce.
 */
export function countryConceptForLegalEntityType(
  code: string | undefined,
): string | undefined {
  if (!code) return undefined;
  const entry = LEGAL_ENTITY_TYPE_BY_CODE.get(code);
  if (!entry) return undefined;
  return LEGAL_ENTITY_COUNTRY_CONCEPT_BY_ISO[entry.countryIso];
}
