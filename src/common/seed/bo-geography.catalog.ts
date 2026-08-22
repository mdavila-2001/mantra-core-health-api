import { deterministicId } from '../constants/concepts';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';

/**
 * Los nueve departamentos de Bolivia, que es la división política de primer
 * nivel del país y el único catálogo geográfico que hoy pide un formulario.
 *
 * ## Qué columnas gobierna
 *
 * - `common.identifiers.issuer_administrative_area_concept_id` — el «SC», «LP»…
 *   que lleva la cédula de identidad, y que el registro público pregunta como
 *   «departamento que emitió tu documento».
 * - `common.addresses.administrative_area_concept_id` — el departamento del
 *   domicilio, en el perfil.
 *
 * ## Por qué no es una enumeración dinámica
 *
 * Mismo caso que la taxonomía del glosario (`glossary-taxonomy.ts`): las dos
 * columnas son FK a `terminology.catalog_concepts` y **no** tienen una
 * `DynamicEnumBinding` que las ate a un campo destino. El cliente resuelve el
 * catálogo por su **código de conjunto de valores**
 * (`BoDepartmentsCatalog.listar()` en el frontend pide
 * `GET /terminology/value-sets?code=VS_BO_DEPARTMENT` y expande el que
 * encuentra), así que lo que tiene que existir es el conjunto con ese código,
 * no un amarre columna → enumeración.
 *
 * Se reutilizan sólo los derivadores deterministas de id de
 * `dynamic-enum-catalog.ts`, que son funciones puras `código -> uuid` sin
 * ninguna atadura a la mecánica de enumeraciones.
 *
 * ## Por qué los códigos son los de la cédula
 *
 * `CH`, `LP`, `CB`… son los que la propia cédula imprime y los que la gente
 * reconoce; el formulario los ofrece con esa pista («El "SC", "LP"… de tu
 * cédula»). Usar el ISO 3166-2 (`BO-C`, `BO-L`…) obligaría a traducir en
 * pantalla algo que ya viene traducido en el documento.
 */

/** Código interno del conjunto de valores, el que el cliente pide por `?code=`. */
export const BO_DEPARTMENT_VALUE_SET = 'VS_BO_DEPARTMENT';

/** Nombre del conjunto de valores; `ValueSets.name` no tiene idioma declarado y la plataforma es ES. */
export const BO_DEPARTMENT_VALUE_SET_NAME = 'Departamentos de Bolivia';

/** Única versión que recibe el conjunto. */
export const BO_DEPARTMENT_VERSION = '1.0.0';

/** Un departamento: su sigla, su nombre y el código ISO con el que se cruza hacia afuera. */
export interface BoDepartmentSeed {
  /** Sigla de la cédula (`SC`, `LP`…). Es la clave estable del concepto. */
  readonly code: string;
  /** Nombre en castellano, tal como se muestra en el desplegable. */
  readonly name: string;
  /** Subdivisión ISO 3166-2, para quien tenga que cruzar con un sistema externo. */
  readonly iso: string;
}

/**
 * Los nueve, en el orden en que los ordena el INE de Bolivia (norte a sur por
 * número de departamento), que es el orden en que aparecen en todo documento
 * oficial. La expansión los devuelve con ese `ordinal`, así que el desplegable
 * los muestra igual sin ordenar nada del lado del cliente.
 */
export const BO_DEPARTMENTS: readonly BoDepartmentSeed[] = [
  { code: 'CH', name: 'Chuquisaca', iso: 'BO-H' },
  { code: 'LP', name: 'La Paz', iso: 'BO-L' },
  { code: 'CB', name: 'Cochabamba', iso: 'BO-C' },
  { code: 'OR', name: 'Oruro', iso: 'BO-O' },
  { code: 'PT', name: 'Potosí', iso: 'BO-P' },
  { code: 'TJ', name: 'Tarija', iso: 'BO-T' },
  { code: 'SC', name: 'Santa Cruz', iso: 'BO-S' },
  { code: 'BE', name: 'Beni', iso: 'BO-B' },
  { code: 'PD', name: 'Pando', iso: 'BO-N' },
];

/** Id determinista del conjunto de valores. */
export const boDepartmentValueSetId = (): string =>
  valueSetId(BO_DEPARTMENT_VALUE_SET);

/** Id determinista de la versión única del conjunto. */
export const boDepartmentVersionId = (): string =>
  valueSetVersionId(BO_DEPARTMENT_VALUE_SET);

/** URL canónica FHIR del conjunto. */
export const boDepartmentCanonicalUrl = (): string =>
  valueSetCanonicalUrl(BO_DEPARTMENT_VALUE_SET);

/** Id determinista del concepto de un departamento, a partir de su sigla. */
export function boDepartmentConceptId(code: string): string {
  return deterministicId(`geo:bo:department:${code}`);
}

/** Id determinista de la membresía `(conjunto, departamento)`. */
export function boDepartmentMemberId(code: string): string {
  return valueSetMemberId(BO_DEPARTMENT_VALUE_SET, boDepartmentConceptId(code));
}

/** Id determinista de la designación preferida (ES) de un departamento. */
export function boDepartmentDesignationId(code: string): string {
  return deterministicId(`geo:bo:department:designation:${code}`);
}

/** Id determinista de la propiedad que guarda el ISO 3166-2 del departamento. */
export function boDepartmentIsoPropertyId(code: string): string {
  return deterministicId(`geo:bo:department:property:iso:${code}`);
}

/**
 * El código FHIR del concepto, con el prefijo del dominio.
 *
 * Va prefijado porque `catalog_concepts.code` es único **por versión del
 * sistema de códigos**, y todo el catálogo interno comparte una sola versión:
 * un `SC` a secas chocaría con cualquier otro catálogo que use siglas.
 */
export function boDepartmentConceptCode(code: string): string {
  return `geo:bo:department:${code}`;
}
