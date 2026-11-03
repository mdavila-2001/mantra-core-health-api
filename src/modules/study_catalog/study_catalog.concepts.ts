import { defineModuleConcepts } from '../../common/seed/concept-seed';
import imagingCatalog from './data/imagenologia.json';

/**
 * Conceptos que el módulo de catálogo de estudios siembra al arrancar.
 *
 * Son los vocabularios **cerrados y pequeños** del catálogo de imagen: las 14
 * modalidades (DICOM PS3.16 CID 29), las 156 regiones del cuerpo y los tres
 * valores de contraste. Se derivan de `data/imagenologia.json` (la misma copia
 * versionada, con SHA-256, que lee el cargador `tools/study-catalogs/`), de modo
 * que el código y el JSON no pueden divergir: lo comprueba `study_catalog.concepts.spec.ts`.
 *
 * Los estudios (≈1 000), sus componentes y las relaciones con evidencia NO se
 * siembran aquí sino con `tools/study-catalogs/load-study-catalogs.mjs`: son
 * cientos de filas con procedencia por relación, y un arranque no debe
 * escribirlas.
 *
 * Los códigos llevan prefijo (`IMG_MODALITY_`, `IMG_REGION_`, `IMG_CONTRAST_`)
 * porque son los que viajan en las opciones de la enumeración y hay códigos
 * internos genéricos (`US`, `ACTIVE`…). Ojo: en `catalog_concepts.code` el seed
 * guarda la CLAVE del concepto (`study_catalog:REGION_TORAX`), no este código
 * (ver `catalog-concept-definitions.ts`). El rótulo va en castellano, que es
 * como lo publica la fuente del catálogo.
 */

/** Código interno estable de una modalidad. */
export const modalityConceptCode = (code: string): string =>
  `IMG_MODALITY_${code}`;

/** Código interno estable de una región del cuerpo. */
export const bodySiteConceptCode = (code: string): string =>
  `IMG_REGION_${code}`;

const modalityDefs = Object.fromEntries(
  imagingCatalog.modalidades.map((m) => [
    `MODALITY_${m.codigo}`,
    { code: modalityConceptCode(m.codigo), display: m.nombre },
  ]),
);

const bodySiteDefs = Object.fromEntries(
  imagingCatalog.regiones.map((r) => [
    `REGION_${r.codigo}`,
    { code: bodySiteConceptCode(r.codigo), display: r.nombre },
  ]),
);

export const { seeds: STUDY_CATALOG_CONCEPT_SEEDS, ids: STUDY } =
  defineModuleConcepts('study_catalog', {
    // Tipos de relación entre conceptos (concept_relationships.relationship_type_concept_id).
    REL_HAS_MODALITY: {
      code: 'HAS_MODALITY',
      display: 'Has imaging modality',
    },
    REL_HAS_BODY_SITE: {
      code: 'HAS_BODY_SITE',
      display: 'Has default body site',
    },
    REL_SUGGESTED_SPECIMEN: {
      code: 'SUGGESTED_SPECIMEN',
      display: 'Has suggested specimen type',
    },
    // Contraste: sin / con / sin y con (valores de `imaging-contrast`).
    CONTRAST_NONE: { code: 'IMG_CONTRAST_NONE', display: 'Sin contraste' },
    CONTRAST_WITH: { code: 'IMG_CONTRAST_WITH', display: 'Con contraste' },
    CONTRAST_WITH_AND_WITHOUT: {
      code: 'IMG_CONTRAST_WITH_AND_WITHOUT',
      display: 'Sin y con contraste',
    },
    ...modalityDefs,
    ...bodySiteDefs,
  });

/** Concepto de una modalidad del catálogo por su código (`RX`, `TC`…). */
export function modalityConceptId(code: string): string {
  const id = (STUDY as Record<string, string>)[`MODALITY_${code}`];
  if (!id) throw new Error(`Modalidad desconocida en el catálogo: ${code}`);
  return id;
}

/** Concepto de una región del cuerpo por su código (`TORAX`, `MANO`…). */
export function bodySiteConceptId(code: string): string {
  const id = (STUDY as Record<string, string>)[`REGION_${code}`];
  if (!id) throw new Error(`Región desconocida en el catálogo: ${code}`);
  return id;
}

/** Concepto de contraste por el valor del catálogo (`sin`, `con`, `sin_y_con`). */
export function contrastConceptId(value: string): string {
  switch (value) {
    case 'sin':
      return STUDY.CONTRAST_NONE;
    case 'con':
      return STUDY.CONTRAST_WITH;
    case 'sin_y_con':
      return STUDY.CONTRAST_WITH_AND_WITHOUT;
    default:
      throw new Error(`Contraste desconocido en el catálogo: ${value}`);
  }
}

/** Modalidades en el orden del catálogo (para el value set). */
export const MODALITY_CONCEPT_IDS: readonly string[] =
  imagingCatalog.modalidades.map((m) => modalityConceptId(m.codigo));

/** Regiones en el orden del catálogo (para el value set). */
export const BODY_SITE_CONCEPT_IDS: readonly string[] =
  imagingCatalog.regiones.map((r) => bodySiteConceptId(r.codigo));

/** Valores de contraste en el orden en que se ofrecen. */
export const CONTRAST_CONCEPT_IDS: readonly string[] = [
  STUDY.CONTRAST_NONE,
  STUDY.CONTRAST_WITH,
  STUDY.CONTRAST_WITH_AND_WITHOUT,
];
