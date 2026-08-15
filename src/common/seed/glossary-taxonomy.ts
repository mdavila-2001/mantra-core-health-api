import { deterministicId } from '../constants/concepts';
import { GLOSSARY_ALL_TERMS_CODE } from '../../modules/terminology/glossary.constants';
import {
  valueSetCanonicalUrl,
  valueSetId,
  valueSetMemberId,
  valueSetVersionId,
} from './dynamic-enum-catalog';

/**
 * La taxonomía del glosario médico: 11 categorías (pertenencia exclusiva, una
 * por término), 15 etiquetas (N:N) y el value set paraguas que marca «esto es
 * un término del glosario» dentro de la tabla compartida de conceptos.
 *
 * ## Por qué no es una enumeración dinámica más
 *
 * `DYNAMIC_ENUM_CATALOG` (`dynamic-enum-catalog.ts`) resuelve un problema
 * distinto: un value set cuyos **miembros son las opciones** de un campo
 * `*_concept_id` (género, severidad...), materializado con su
 * `DynamicEnumDefinition`/`DynamicEnumVersion`/`DynamicEnumBinding` porque
 * existe una columna concreta que ese value set gobierna. Una categoría del
 * glosario no gobierna ninguna columna: sus miembros no son "las opciones de
 * un campo", son "los términos que caen bajo esta categoría" — el mismo
 * value set pero leído al revés. Forzarlo por `DynamicEnumSeedService`
 * exigiría inventar un `target` `esquema.tabla.columna` que no existe, sólo
 * para poder reutilizar el resto del pipeline. Por eso este archivo reutiliza
 * únicamente las piezas que sí son un ajuste honesto —los cuatro derivadores
 * deterministas de id, que son funciones puras `código -> uuid` sin ninguna
 * atadura a la mecánica de enumeraciones— y el `GlossarySeedService` (en
 * `glossary-seed.service.ts`) materializa `ValueSets`/`ValueSetVersions`/
 * `ValueSetMembers` directamente.
 *
 * Los códigos de esta taxonomía (`glossary-*`) no colisionan con ninguno de
 * los 52 códigos de `DYNAMIC_ENUM_CATALOG`, así que reutilizar el mismo
 * espacio de derivación (`seed:value-set:<code>`) es seguro.
 */

/** Una categoría o etiqueta del glosario: clave corta, código interno y nombre en castellano. */
export interface GlossaryTaxonomyEntry {
  /** Clave corta usada por el catálogo de términos (`categoryKey`/`tagKeys`). */
  readonly key: string;
  /** `internal_code` del value set (`glossary-category-<key>` / `glossary-tag-<key>`). */
  readonly internalCode: string;
  /**
   * Nombre en castellano, que es lo que `ValueSets.name` guarda —una sola
   * columna sin idioma declarado, igual que en `DYNAMIC_ENUM_CATALOG`—: el
   * frontend del glosario es ES-only (spec), así que no hay consumidor para
   * un nombre en inglés persistido; el mapeo a icono y el nombre EN, si hacen
   * falta, quedan del lado del frontend (`GLOSSARY_CATEGORIES`).
   */
  readonly name: string;
}

/** Las 11 categorías del grid del glosario. Pertenencia exclusiva: un término, una categoría. */
export const GLOSSARY_CATEGORIES: readonly GlossaryTaxonomyEntry[] = [
  {
    key: 'anatomy',
    internalCode: 'glossary-category-anatomy',
    name: 'Anatomía',
  },
  {
    key: 'signs-symptoms',
    internalCode: 'glossary-category-signs-symptoms',
    name: 'Signos y síntomas',
  },
  {
    key: 'disease',
    internalCode: 'glossary-category-disease',
    name: 'Enfermedades',
  },
  {
    key: 'specialty',
    internalCode: 'glossary-category-specialty',
    name: 'Especialidades médicas',
  },
  {
    key: 'diagnostic-test',
    internalCode: 'glossary-category-diagnostic-test',
    name: 'Pruebas diagnósticas',
  },
  {
    key: 'procedure',
    internalCode: 'glossary-category-procedure',
    name: 'Procedimientos',
  },
  {
    key: 'treatment',
    internalCode: 'glossary-category-treatment',
    name: 'Tratamientos',
  },
  {
    key: 'pharmacology',
    internalCode: 'glossary-category-pharmacology',
    name: 'Farmacología clínica',
  },
  { key: 'lab', internalCode: 'glossary-category-lab', name: 'Laboratorio' },
  {
    key: 'imaging',
    internalCode: 'glossary-category-imaging',
    name: 'Imagenología',
  },
  {
    key: 'care',
    internalCode: 'glossary-category-care',
    name: 'Cuidados de enfermería',
  },
];

/** Las 15 etiquetas del glosario. Un término puede llevar 0..N. */
export const GLOSSARY_TAGS: readonly GlossaryTaxonomyEntry[] = [
  { key: 'urgency', internalCode: 'glossary-tag-urgency', name: 'Urgencia' },
  { key: 'chronic', internalCode: 'glossary-tag-chronic', name: 'Crónico' },
  {
    key: 'pediatric',
    internalCode: 'glossary-tag-pediatric',
    name: 'Pediatría',
  },
  {
    key: 'cardiovascular',
    internalCode: 'glossary-tag-cardiovascular',
    name: 'Cardiovascular',
  },
  {
    key: 'respiratory',
    internalCode: 'glossary-tag-respiratory',
    name: 'Respiratorio',
  },
  {
    key: 'endocrine',
    internalCode: 'glossary-tag-endocrine',
    name: 'Endocrino',
  },
  {
    key: 'infectious',
    internalCode: 'glossary-tag-infectious',
    name: 'Infeccioso',
  },
  {
    key: 'mental-health',
    internalCode: 'glossary-tag-mental-health',
    name: 'Salud mental',
  },
  {
    key: 'musculoskeletal',
    internalCode: 'glossary-tag-musculoskeletal',
    name: 'Musculoesquelético',
  },
  {
    key: 'digestive',
    internalCode: 'glossary-tag-digestive',
    name: 'Digestivo',
  },
  { key: 'renal', internalCode: 'glossary-tag-renal', name: 'Renal' },
  {
    key: 'dermatologic',
    internalCode: 'glossary-tag-dermatologic',
    name: 'Dermatológico',
  },
  {
    key: 'oncologic',
    internalCode: 'glossary-tag-oncologic',
    name: 'Oncológico',
  },
  {
    key: 'gyn-ob',
    internalCode: 'glossary-tag-gyn-ob',
    name: 'Ginecoobstétrico',
  },
  {
    key: 'neurologic',
    internalCode: 'glossary-tag-neurologic',
    name: 'Neurológico',
  },
];

/** El value set paraguas: todo término del glosario es miembro de éste. */
export const GLOSSARY_ALL_TERMS: GlossaryTaxonomyEntry = {
  key: 'all-terms',
  internalCode: GLOSSARY_ALL_TERMS_CODE,
  name: 'Glosario médico',
};

/** Todos los value sets estructurales de la taxonomía, en el orden en que se siembran. */
export const GLOSSARY_TAXONOMY: readonly GlossaryTaxonomyEntry[] = [
  GLOSSARY_ALL_TERMS,
  ...GLOSSARY_CATEGORIES,
  ...GLOSSARY_TAGS,
];

/** Categoría por clave corta; lanza si el catálogo de términos referencia una clave inexistente. */
export function glossaryCategoryByKey(key: string): GlossaryTaxonomyEntry {
  const found = GLOSSARY_CATEGORIES.find((category) => category.key === key);
  if (!found) {
    throw new Error(`Categoría de glosario desconocida: "${key}"`);
  }
  return found;
}

/** Etiqueta por clave corta; lanza si el catálogo de términos referencia una clave inexistente. */
export function glossaryTagByKey(key: string): GlossaryTaxonomyEntry {
  const found = GLOSSARY_TAGS.find((tag) => tag.key === key);
  if (!found) {
    throw new Error(`Etiqueta de glosario desconocida: "${key}"`);
  }
  return found;
}

// --- Identificadores deterministas ------------------------------------------
// Reutilizan los derivadores de `dynamic-enum-catalog.ts` (funciones puras
// `código -> uuid`, sin acoplarse al resto de su mecánica) para que dos value
// sets nunca colisionen en id por usar fórmulas distintas.

/** Id determinista del value set (categoría, etiqueta o paraguas). */
export const glossaryValueSetId = valueSetId;

/** Id determinista de la versión 1 (única) del value set. */
export const glossaryValueSetVersionId = valueSetVersionId;

/** Id determinista de la membresía `(value set, concepto)`. */
export const glossaryValueSetMemberId = valueSetMemberId;

/** URL canónica FHIR del value set. */
export const glossaryValueSetCanonicalUrl = valueSetCanonicalUrl;

/** Id determinista de un concepto de término, a partir de su slug. */
export function glossaryTermConceptId(slug: string): string {
  return deterministicId(`glossary:term:${slug}`);
}

/** Id determinista de la designación preferida (ES) de un término. */
export function glossaryPreferredDesignationId(slug: string): string {
  return deterministicId(`glossary:designation:preferred:${slug}`);
}

/** Id determinista de una designación sinónimo (ES) de un término, por índice. */
export function glossarySynonymDesignationId(
  slug: string,
  index: number,
): string {
  return deterministicId(`glossary:designation:synonym:${slug}:${index}`);
}

/** Id determinista de una propiedad de término (`glossary-slug`, definición, resumen). */
export function glossaryPropertyId(slug: string, propertyCode: string): string {
  return deterministicId(`glossary:property:${propertyCode}:${slug}`);
}

/** Id determinista de una relación tipada entre dos términos. */
export function glossaryRelationshipId(
  sourceSlug: string,
  type: string,
  targetSlug: string,
): string {
  return deterministicId(
    `glossary:relationship:${sourceSlug}:${type}:${targetSlug}`,
  );
}
