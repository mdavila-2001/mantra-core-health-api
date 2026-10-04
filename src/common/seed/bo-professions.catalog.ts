import { deterministicId } from '../constants/concepts';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';
import { BO_PROFESSIONS } from './bo-professions.catalog.generated';

/**
 * Las profesiones que un título puede acreditar: la Clasificación de
 * Ocupaciones de Bolivia (COB-2023) del INE, grandes grupos 2 y 3.
 *
 * ## Qué columna gobierna
 *
 * `profiles.professional_credentials.profession_concept_id` (modelo v4.2.41).
 * El alta del médico la pide en «Otra profesión», que era texto escrito a mano
 * y no se guardaba; el propietario pidió lista normalizada el 2026-10-04.
 *
 * ## Por qué un conjunto aparte de `VS_BO_OCCUPATION`
 *
 * `VS_BO_OCCUPATION` son 64 ocupaciones provisionales escritas como la gente
 * las dice («¿en qué trabajás?» del paciente) y su propio catálogo declara que
 * NO es la COB. Reemplazarlo cambiaría los ids que ya guardan las personas
 * (`bo-occupations.catalog.ts` lo advierte). Esto siembra la COB **al lado**,
 * con otro prefijo de código, para otra pregunta: qué carrera acredita un
 * título. Por eso sólo los grandes grupos 2 y 3, los que corresponden a una
 * carrera; un «Peón de la construcción» no es un título.
 *
 * De dónde sale la lista: `scripts/gen-bo-professions-catalog.py`.
 */

/** Código interno del conjunto de valores, el que el cliente pide por `?code=`. */
export const BO_PROFESSION_VALUE_SET = 'VS_BO_PROFESSION';

/** Nombre del conjunto. */
export const BO_PROFESSION_VALUE_SET_NAME =
  'Profesiones de Bolivia (COB-2023, grandes grupos 2 y 3)';

/** Única versión del conjunto: la edición 2023 de la clasificación. */
export const BO_PROFESSION_VERSION = 'COB-2023';

/** Una ocupación de la COB-2023, tal como la publica el INE. */
export interface BoProfessionSeed {
  /** Código de 5 dígitos de la COB-2023 («22110»). */
  readonly code: string;
  /** Nombre publicado por el INE, sin corregir. */
  readonly name: string;
  /** Su gran grupo (1 dígito), en palabras. */
  readonly majorGroup: string;
  /** Su subgrupo principal (2 dígitos), en palabras. */
  readonly subMajorGroup: string;
}

export { BO_PROFESSIONS };

/** Id determinista del conjunto. */
export const boProfessionValueSetId = (): string =>
  valueSetId(BO_PROFESSION_VALUE_SET);

/** Id determinista de la versión única. */
export const boProfessionVersionId = (): string =>
  valueSetVersionId(BO_PROFESSION_VALUE_SET);

/** URL canónica FHIR del conjunto. */
export const boProfessionCanonicalUrl = (): string =>
  valueSetCanonicalUrl(BO_PROFESSION_VALUE_SET);

/**
 * El código del concepto, prefijado: `catalog_concepts.code` es único por
 * versión del sistema de códigos y el catálogo interno comparte una sola.
 */
export function boProfessionConceptCode(code: string): string {
  return `profession:bo:cob2023:${code}`;
}

/** Id determinista del concepto de una profesión. */
export function boProfessionConceptId(code: string): string {
  return deterministicId(boProfessionConceptCode(code));
}

/** Id determinista de la membresía `(conjunto, profesión)`. */
export function boProfessionMemberId(code: string): string {
  return valueSetMemberId(BO_PROFESSION_VALUE_SET, boProfessionConceptId(code));
}

/** Id determinista de la designación preferida (ES). */
export function boProfessionDesignationId(code: string): string {
  return deterministicId(`profession:bo:cob2023:designation:${code}`);
}

/** Los ids de concepto válidos, para validar en memoria sin ir a la base. */
export const BO_PROFESSION_CONCEPT_IDS: ReadonlySet<string> = new Set(
  BO_PROFESSIONS.map((profession) => boProfessionConceptId(profession.code)),
);
