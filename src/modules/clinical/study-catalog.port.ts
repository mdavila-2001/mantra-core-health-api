import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Puerto de lectura del catálogo de estudios pedibles (H2.S2).
 *
 * El módulo `study_catalog` (otro dueño) publica los datos —value sets,
 * relaciones `part-of` y `has-modality` en `terminology.concept_relationships`,
 * propiedades de concepto— y puede reemplazar el adaptador por defecto
 * (`TerminologyStudyCatalogAdapter`) proveyendo `STUDY_CATALOG_PORT`. La
 * validación de la orden sólo conoce esta interfaz.
 */
export const STUDY_CATALOG_PORT = Symbol('STUDY_CATALOG_PORT');

/** Los value sets que consulta la validación de la orden. */
export type StudyValueSetCode =
  | 'service-request-code'
  | 'service-request-imaging-modality'
  | 'imaging-body-structure'
  | 'imaging-contrast'
  | 'specimen-type'
  | 'condition-laterality';

/** Familia de un estudio según el catálogo (no según el prefijo de su código). */
export type StudyFamily = 'LAB' | 'IMAGING' | 'OTHER';

/** Lo que el catálogo sabe de un estudio pedible. */
export interface StudyCatalogEntry {
  readonly conceptId: string;
  /** `null` = el catálogo no declara familia (estudio heredado): V2 no se aplica. */
  readonly family: StudyFamily | null;
  /** El estudio es un panel con componentes `part-of` (desplegable). */
  readonly componentsSelectable: boolean;
  /** Modalidad `has-modality` con evidencia, o `null` si el catálogo no la declara. */
  readonly modalityConceptId: string | null;
}

/** Lo que el catálogo sabe de una región corporal. */
export interface BodySiteEntry {
  readonly conceptId: string;
  /** `null` = el catálogo no lo declara: V8 (`LATERALITY_NOT_APPLICABLE`) no se aplica. */
  readonly lateralizable: boolean | null;
}

export interface StudyCatalogPort {
  /** El estudio si es miembro vigente de `service-request-code`; si no, `null`. */
  findStudy(
    em: EntityManager,
    conceptId: string,
  ): Promise<StudyCatalogEntry | null>;

  /** Ids de todos los componentes del panel, a cualquier profundidad. */
  panelComponentIds(
    em: EntityManager,
    panelConceptId: string,
  ): Promise<ReadonlySet<string>>;

  /** Si el concepto es miembro vigente del value set. */
  isInValueSet(
    em: EntityManager,
    valueSet: StudyValueSetCode,
    conceptId: string,
  ): Promise<boolean>;

  /** La región si es miembro de `imaging-body-structure`; si no, `null`. */
  findBodySite(
    em: EntityManager,
    conceptId: string,
  ): Promise<BodySiteEntry | null>;
}
