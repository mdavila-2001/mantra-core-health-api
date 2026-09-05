import { CONCEPTS } from '../../common';

/**
 * Convenciones del glosario médico (Carril 03), compartidas por el seed y la
 * lectura (`ConceptsService`).
 *
 * El glosario no es una tabla nueva: es una forma de leer el mismo motor de
 * terminología (`CatalogConcepts`/`ConceptDesignations`/`ConceptProperties`/
 * `ConceptRelationships`/`ValueSets`) que ya sirve a los ~1.310 conceptos de
 * enumeración de la plataforma. Este archivo fija el vocabulario —códigos de
 * propiedad, prefijos de value set, tipos de relación— con el que el seed
 * escribe y el servicio lee, para que no puedan divergir.
 */

/**
 * Código interno del value set «paraguas»: todo término del glosario es
 * miembro de él, y sólo los miembros de él son «un término del glosario».
 *
 * Es el único criterio de pertenencia (spec: «no usar heurísticas de nombre»):
 * un `CatalogConcepts` no es un término del glosario porque su código empiece
 * con algo reconocible, sino porque hay una fila real de `ValueSetMembers`
 * que lo liga a este conjunto.
 */
export const GLOSSARY_ALL_TERMS_CODE = 'glossary-all-terms';

/** Prefijo de los 12 value sets de categoría (`glossary-category-<key>`). */
export const GLOSSARY_CATEGORY_PREFIX = 'glossary-category-';

/** Prefijo de los 15 value sets de etiqueta (`glossary-tag-<key>`). */
export const GLOSSARY_TAG_PREFIX = 'glossary-tag-';

/**
 * Si un `internalCode` de value set pertenece a la familia del glosario
 * (paraguas, categoría o etiqueta).
 *
 * Es la señal que activa, en `ConceptsService`, el filtro de estado
 * (excluir `TERM_DRAFT`) y los campos adicionales de la búsqueda/ficha
 * (slug, categoría, etiquetas, resumen corto, relaciones). Fuera de esta
 * familia el comportamiento es exactamente el histórico: ninguna de las
 * otras ~52 enumeraciones dinámicas paga el costo de estas consultas extra.
 */
export function isGlossaryValueSetCode(internalCode: string): boolean {
  return (
    internalCode === GLOSSARY_ALL_TERMS_CODE ||
    internalCode.startsWith(GLOSSARY_CATEGORY_PREFIX) ||
    internalCode.startsWith(GLOSSARY_TAG_PREFIX)
  );
}

// --- Propiedades del término (`concept_properties.property_code`) ----------

/** Slug kebab-case, único entre los términos del glosario. */
export const GLOSSARY_SLUG_PROPERTY_CODE = 'glossary-slug';

/** Definición clínica: jsonb `{ es: string, en?: string }`. */
export const GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE =
  'glossary-clinical-definition';

/** Resumen en lenguaje llano: jsonb `{ es: string, en?: string }`. */
export const GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE = 'glossary-plain-summary';

/**
 * Imagen del término: jsonb `{ source, license, attribution, alt, status }`.
 *
 * Declarada para que el tipo/contrato pueda cargarla, pero **deliberadamente
 * no se siembra para ningún término en esta pasada**: no se encontró en el
 * repositorio una política de licencia/origen que permita usar imágenes
 * médicas externas (ver la sección «Images» del spec de reconstrucción), y no
 * hay activos curados con licencia verificada para subir a `Files`. Todos los
 * términos usan iconografía de categoría en el frontend en su lugar.
 */
export const GLOSSARY_IMAGE_PROPERTY_CODE = 'glossary-image';

// --- Ficha de medicamento (FND-25-02) ---------------------------------------
//
// Los cuatro códigos de acá abajo son EXACTAMENTE los que ya escribe
// `tools/terminology-import/import-ndc.mjs` sobre los conceptos reales del
// FDA National Drug Code (NDC) Directory (`code_system=ndc`) — no una
// convención nueva del glosario. Reusarlos para los términos curados que
// declaran `drugFacts` (`glossary-terms.catalog.ts`) es lo que hace que
// `GlossaryDrugFacts.drugFactsFrom()` (frontend) los lea sin ningún cambio: ya
// sabe leer `active_ingredients`/`dosage_form`/`route`/`manufacturer` de
// `properties`, sea el concepto un producto NDC crudo o un término curado con
// estos cuatro datos copiados verbatim de un producto NDC real que lo
// representa (ver la nota de selección determinista en
// `glossary-terms.catalog.ts`).

/** Principios activos: jsonb `string[]` (p. ej. `["ACETAMINOPHEN 500 mg/1"]`). */
export const GLOSSARY_DRUG_ACTIVE_INGREDIENTS_PROPERTY_CODE =
  'active_ingredients';

/** Forma farmacéutica: jsonb `string` (p. ej. `"TABLET"`), verbatim de NDC. */
export const GLOSSARY_DRUG_DOSAGE_FORM_PROPERTY_CODE = 'dosage_form';

/** Vía de administración: jsonb `string[]` (p. ej. `["ORAL"]`), verbatim de NDC. */
export const GLOSSARY_DRUG_ROUTE_PROPERTY_CODE = 'route';

/** Fabricante: jsonb `string` (`labeler_name`), verbatim de NDC. */
export const GLOSSARY_DRUG_MANUFACTURER_PROPERTY_CODE = 'manufacturer';

/** Contenido bilingüe `{ es, en? }` tal como se guarda en `value_json`. */
export interface GlossaryBilingualText {
  readonly es: string;
  readonly en?: string;
}

// --- Relaciones tipadas -----------------------------------------------------

/**
 * Los seis tipos de relación del glosario, aditivos a `REL_IS_A`/`REL_PART_OF`
 * (que siguen sirviendo a la jerarquía genérica del catálogo).
 */
export type GlossaryRelationType =
  | 'RELATED_TERM'
  | 'DISEASE'
  | 'PROCEDURE'
  | 'TREATMENT'
  | 'ANATOMY'
  | 'DIAGNOSTIC_TEST';

/** Todos los tipos de relación del glosario, para `enum` de Swagger y validación. */
export const GLOSSARY_RELATION_TYPES: readonly GlossaryRelationType[] = [
  'RELATED_TERM',
  'DISEASE',
  'PROCEDURE',
  'TREATMENT',
  'ANATOMY',
  'DIAGNOSTIC_TEST',
];

/** Tipo de relación (API) -> concepto `terminology:relationship:*`. */
const GLOSSARY_RELATION_TYPE_CONCEPT_ID: Readonly<
  Record<GlossaryRelationType, string>
> = {
  RELATED_TERM: CONCEPTS.REL_RELATED_TERM,
  DISEASE: CONCEPTS.REL_DISEASE,
  PROCEDURE: CONCEPTS.REL_PROCEDURE,
  TREATMENT: CONCEPTS.REL_TREATMENT,
  ANATOMY: CONCEPTS.REL_ANATOMY,
  DIAGNOSTIC_TEST: CONCEPTS.REL_DIAGNOSTIC_TEST,
};

/** El concepto `relationship_type_concept_id` de un tipo de relación del glosario. */
export function glossaryRelationTypeConceptId(
  type: GlossaryRelationType,
): string {
  return GLOSSARY_RELATION_TYPE_CONCEPT_ID[type];
}

/** Todos los ids de concepto que representan un tipo de relación del glosario. */
export const GLOSSARY_RELATION_TYPE_CONCEPT_IDS: readonly string[] =
  GLOSSARY_RELATION_TYPES.map(glossaryRelationTypeConceptId);

/** Concepto -> tipo de relación (API); el camino inverso, para leer una arista. */
const GLOSSARY_RELATION_TYPE_BY_CONCEPT_ID: ReadonlyMap<
  string,
  GlossaryRelationType
> = new Map(
  GLOSSARY_RELATION_TYPES.map((type) => [
    glossaryRelationTypeConceptId(type),
    type,
  ]),
);

/**
 * El tipo de relación (API) de un `relationship_type_concept_id`, o
 * `undefined` si no es uno de los seis tipos del glosario (p. ej. `REL_IS_A`
 * de la jerarquía genérica). Las relaciones del glosario sólo muestran las
 * suyas: no le corresponde a esta ficha traducir una jerarquía ajena.
 */
export function glossaryRelationTypeFromConceptId(
  relationshipTypeConceptId: string,
): GlossaryRelationType | undefined {
  return GLOSSARY_RELATION_TYPE_BY_CONCEPT_ID.get(relationshipTypeConceptId);
}

// --- Estado publicado (`catalog_concepts.state_concept_id` -> `status`) ----

/** Los estados de `CatalogConcepts` que el glosario expone, traducidos a texto plano. */
const GLOSSARY_STATUS_BY_CONCEPT_ID: Readonly<Record<string, string>> = {
  [CONCEPTS.TERM_ACTIVE]: 'active',
  [CONCEPTS.TERM_DRAFT]: 'draft',
  [CONCEPTS.TERM_RETIRED]: 'retired',
  [CONCEPTS.TERM_DEPRECATED]: 'deprecated',
};

/**
 * El `status` publicado de un término a partir de su `stateConceptId`.
 *
 * Sólo `'active'` debería llegar nunca a un cliente del glosario público —el
 * filtro de estado ya excluye todo lo demás—, pero la función es total: un
 * estado desconocido o ausente se informa como `'unknown'` en vez de romper
 * la serialización.
 */
export function glossaryStatusOf(stateConceptId?: string): string {
  if (stateConceptId === undefined) return 'unknown';
  return GLOSSARY_STATUS_BY_CONCEPT_ID[stateConceptId] ?? 'unknown';
}
