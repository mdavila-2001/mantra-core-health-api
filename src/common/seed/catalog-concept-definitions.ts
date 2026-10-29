import { CONCEPT_DEFS, CONCEPTS, deterministicId } from '../constants/concepts';
import { MODULE_CONCEPT_SEEDS } from './module-concepts';

/** Código y texto con que el seed inserta un concepto del catálogo interno. */
export interface CatalogConceptDefinition {
  /** Código almacenado; la clave del concepto, única en todo el catálogo. */
  readonly code: string;
  /** Texto legible del concepto. */
  readonly display: string;
}

/**
 * Los conceptos que el seed del catálogo materializa, por id.
 *
 * Une el catálogo base (transversal) con los conceptos que declara cada módulo
 * de dominio (`MODULE_CONCEPT_SEEDS`). La comparten `TerminologySeedService`,
 * que inserta lo que falta, y la sonda de `/readiness` con `SEED_ON_BOOT=false`,
 * que comprueba que ya estén: las dos tienen que coincidir siempre, así que
 * salen de la misma función.
 *
 * El `code` almacenado es la CLAVE del concepto (única globalmente), no el
 * `seed.code` humano: `catalog_concepts` tiene UNIQUE(code_system_version_id,
 * code) y varios módulos declaran códigos genéricos coincidentes (p. ej.
 * "ACTIVE"). Los servicios referencian los conceptos por id, no por este
 * código, así que usar la clave garantiza unicidad sin efectos.
 */
export function catalogConceptDefinitions(): Map<
  string,
  CatalogConceptDefinition
> {
  const catalog = new Map<string, CatalogConceptDefinition>();
  for (const name of Object.keys(CONCEPT_DEFS)) {
    catalog.set(CONCEPTS[name], {
      code: CONCEPT_DEFS[name].code,
      display: CONCEPT_DEFS[name].display,
    });
  }
  for (const seed of MODULE_CONCEPT_SEEDS) {
    catalog.set(deterministicId(seed.key), {
      code: seed.key,
      display: seed.display,
    });
  }
  return catalog;
}
