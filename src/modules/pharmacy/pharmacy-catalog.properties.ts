/**
 * Catálogo universal de medicamentos · cómo se guarda en `terminology.*`.
 *
 * Cada registro sanitario oficial es un `catalog_concepts` de un code system
 * propio de su fuente, con sus datos en `concept_properties`. Quien escribe
 * esas filas es `tools/terminology-import/load-medicine-catalog.mjs`; los
 * códigos de propiedad de abajo son **los mismos** que define
 * `tools/terminology-import/lib/medicine-catalog/load-plan.mjs` (`PROPERTY`).
 * Si cambia uno, cambia el otro: no hay forma de compartirlos entre un `.mjs`
 * de herramientas y el código de la API sin acoplar los dos.
 */

/** Code systems de medicamentos, en el orden en que se ofrecen: la autoridad local primero. */
export const MEDICINE_CODE_SYSTEMS = [
  'agemed-medicamentos',
  'cima-medicamentos',
  'invima-medicamentos',
  'anvisa-medicamentos',
] as const;

/** De qué registro oficial viene un producto del catálogo. */
export type MedicineSource = 'agemed' | 'cima' | 'invima' | 'anvisa';

export const MEDICINE_SOURCES: readonly MedicineSource[] = [
  'agemed',
  'cima',
  'invima',
  'anvisa',
];

/** Códigos de `concept_properties` de un producto del catálogo. */
export const MEDICINE_PROPERTY = {
  SOURCE: 'medicine_source',
  HOLDER: 'medicine_holder',
  STRENGTH: 'medicine_strength_text',
  DOSAGE_FORM: 'medicine_dosage_form',
  ROUTES: 'medicine_routes',
  REQUIRES_PRESCRIPTION: 'medicine_requires_prescription',
  GENERIC: 'medicine_generic',
  INGREDIENTS: 'medicine_active_ingredients',
  ATC: 'medicine_atc',
  PRESENTATIONS: 'medicine_presentations',
  REGULATORY_STATUS: 'medicine_regulatory_status',
  SELECTABLE: 'medicine_selectable',
  PHOTOS: 'medicine_photos',
  SOURCE_URL: 'source_url',
  SOURCE_NAME: 'source_name',
} as const;

/** Code system `vademecum`: sus conceptos tienen el ATC nivel 5 por `code` y son los de la receta. */
export const VADEMECUM_CODE_SYSTEM = 'vademecum';

/** Tope de la búsqueda: una lista que se lee de un vistazo. */
export const CATALOG_SEARCH_MAX_LIMIT = 50;
export const CATALOG_SEARCH_DEFAULT_LIMIT = 20;
/** Mínimo de letras para buscar: con menos, la consulta recorre todo el catálogo para nada. */
export const CATALOG_SEARCH_MIN_LENGTH = 2;
