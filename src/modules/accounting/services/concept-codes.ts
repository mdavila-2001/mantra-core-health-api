import type { EntityManager } from '@mikro-orm/postgresql';
import { CatalogConcepts } from '../../terminology/entities';

/**
 * Resuelve conceptos por id contra `terminology.catalog_concepts` (molde
 * `pharmacy-read.repository.ts:221-227`).
 *
 * El módulo compara siempre contra `ACCT.*` (uuid5 deterministas): esta clase
 * sólo resuelve el camino inverso, uuid → `{ code, display }`, para las
 * lecturas del cockpit que exponen el rótulo de un concepto en vez de su id.
 */
export class ConceptCodeResolver {
  private readonly porId = new Map<string, CatalogConcepts>();

  private constructor(conceptos: CatalogConcepts[]) {
    for (const concepto of conceptos) {
      this.porId.set(concepto.id, concepto);
    }
  }

  /**
   * Carga en lote los conceptos que va a necesitar resolver.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Los uuid a resolver (duplicados y `undefined` se ignoran).
   * @returns El resolutor, ya cargado.
   */
  static async load(
    em: EntityManager,
    ids: ReadonlyArray<string | null | undefined>,
  ): Promise<ConceptCodeResolver> {
    const unicos = [...new Set(ids.filter((id): id is string => !!id))];
    if (unicos.length === 0) return new ConceptCodeResolver([]);
    const conceptos = await em.find(CatalogConcepts, {
      id: { $in: unicos },
    });
    return new ConceptCodeResolver(conceptos);
  }

  /** El `code` del concepto, o `null` si no se cargó o no existe. */
  code(id: string | null | undefined): string | null {
    if (!id) return null;
    return this.porId.get(id)?.code ?? null;
  }

  /** El `display` del concepto, o `null` si no se cargó o no existe. */
  display(id: string | null | undefined): string | null {
    if (!id) return null;
    return this.porId.get(id)?.display ?? null;
  }
}
