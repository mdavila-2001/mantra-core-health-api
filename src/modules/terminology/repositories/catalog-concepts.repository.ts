import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CatalogConcepts } from '../entities';
import { createdBy } from '../../../common';
import {
  containsPattern,
  normalizeSearchText,
  sqlSearchKey,
  sqlSortKey,
} from './glossary-search.sql';

/** Filtros de la lectura paginada del glosario. */
export interface GlossaryPageFilters {
  /** Versión vigente del conjunto que acota (paraguas, categoría o etiqueta). */
  readonly valueSetVersionId: string;
  /** Versión vigente de una segunda etiqueta que también tiene que cumplirse. */
  readonly tagValueSetVersionId?: string;
  /** Texto buscado, tal como lo escribió la persona. */
  readonly query?: string;
  /** Estado publicado que tiene que tener el concepto (el glosario: `TERM_ACTIVE`). */
  readonly stateConceptId: string;
  /** Idioma cuyo nombre preferido ordena la lista (y se busca). */
  readonly languageConceptId: string;
  /** Acota además a estos ids (intersección), si vienen. */
  readonly ids?: readonly string[];
  /** Acota además a una versión de sistema de códigos, si viene. */
  readonly codeSystemVersionId?: string;
}

/** Una página del glosario: los ids en orden y cuántos coinciden en total. */
export interface GlossaryPage {
  readonly ids: string[];
  readonly total: number;
}

/** Datos mínimos para materializar un concepto de catálogo. */
export interface CreateCatalogConceptData {
  /**
   * Identificador asociado a code system version.
   */
  codeSystemVersionId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de display mantenido por la instancia.
   */
  display: string;
  /**
   * Valor de definition mantenido por la instancia.
   */
  definition?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.catalog_concepts`.
 *
 * Métodos sin estado que reciben el `EntityManager` activo; la transacción y las
 * reglas de negocio viven en el servicio.
 */
@Injectable()
export class CatalogConceptsRepository {
  /** Busca un concepto por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<CatalogConcepts | null> {
    return em.findOne(CatalogConcepts, { id });
  }

  /**
   * Devuelve los códigos ya presentes en una versión, de entre los indicados. Se
   * consulta en bloque para no emitir una query por código (evita el patrón N+1).
   */
  async findExistingCodes(
    em: EntityManager,
    codeSystemVersionId: string,
    codes: string[],
  ): Promise<Set<string>> {
    if (codes.length === 0) return new Set();
    const rows = await em.find(
      CatalogConcepts,
      { codeSystemVersionId, code: { $in: codes } },
      { fields: ['code'] },
    );
    return new Set(rows.map((row) => row.code));
  }

  /** Crea el concepto en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateCatalogConceptData): CatalogConcepts {
    return em.create(
      CatalogConcepts,
      {
        codeSystemVersionId: data.codeSystemVersionId,
        code: data.code,
        display: data.display,
        definition: data.definition,
        abstract: false,
        selectable: true,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Busca el concepto bloqueando su fila. Retirar un concepto y reemplazarlo
   * compiten por ella, y sin bloqueo dos retiradas simultáneas dejarían un
   * `replaced_by_concept_id` que no corresponde a la que ganó (UC-03-10).
   */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CatalogConcepts | null> {
    return em.findOne(
      CatalogConcepts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Resuelve el concepto por su clave natural `(versión del code system, código)`
   * — la que usa `$lookup` (UC-03-11).
   */
  findByVersionAndCode(
    em: EntityManager,
    codeSystemVersionId: string,
    code: string,
  ): Promise<CatalogConcepts | null> {
    return em.findOne(CatalogConcepts, { codeSystemVersionId, code });
  }

  /**
   * Conceptos de una versión filtrados por estado. Es la base sobre la que la
   * expansión de un value set evalúa sus reglas (UC-03-08).
   */
  findByVersion(
    em: EntityManager,
    codeSystemVersionId: string,
    activeStateConceptId: string,
  ): Promise<CatalogConcepts[]> {
    return em.find(
      CatalogConcepts,
      { codeSystemVersionId, stateConceptId: activeStateConceptId },
      { orderBy: { code: 'ASC' } },
    );
  }

  /**
   * Conceptos de una versión que la publicación debe promover a activos: los que
   * están en borrador y los que quedaron sin estado.
   *
   * El `null` está incluido porque las importaciones anteriores a que
   * `importConcepts` fijara `TERM_DRAFT` dejaron la columna vacía, y esas filas
   * son tan publicables como las demás — el estado ausente era un olvido, no una
   * decisión sobre el concepto.
   *
   * Deliberadamente **no** toca los retirados ni los deprecados: publicar una
   * versión no debe resucitar un concepto que UC-03-10 sacó de circulación.
   *
   * @param em - Contexto de persistencia.
   * @param codeSystemVersionId - Versión que se está publicando.
   * @param draftStateConceptId - Estado de borrador del catálogo.
   * @returns Conceptos a promover, ya gestionados por la unidad de trabajo.
   */
  findPromotableByVersion(
    em: EntityManager,
    codeSystemVersionId: string,
    draftStateConceptId: string,
  ): Promise<CatalogConcepts[]> {
    return em.find(CatalogConcepts, {
      codeSystemVersionId,
      $or: [{ stateConceptId: draftStateConceptId }, { stateConceptId: null }],
    });
  }

  /**
   * Resuelve un lote de conceptos por id, indexados por id.
   *
   * Se consulta en bloque porque el llamador ya tiene la lista completa (los
   * miembros de una página de expansión): pedirlos de a uno sería el patrón N+1
   * sobre la tabla más consultada del catálogo.
   *
   * @param em - Contexto de persistencia.
   * @param ids - Ids de concepto a resolver.
   * @returns Mapa `id -> concepto`; los ids inexistentes simplemente no aparecen.
   */
  async findByIds(
    em: EntityManager,
    ids: string[],
  ): Promise<Map<string, CatalogConcepts>> {
    if (ids.length === 0) return new Map();
    const rows = await em.find(CatalogConcepts, { id: { $in: ids } });
    return new Map(rows.map((row) => [row.id, row]));
  }

  /**
   * Busca conceptos por texto libre sobre código y display, opcionalmente
   * acotado a una versión de sistema de códigos.
   *
   * Es la contrapartida de `$lookup`, que exige conocer sistema **y** código
   * exactos: sin una búsqueda, los ~280 campos `*ConceptId` del contrato son
   * irrellenables desde fuera, porque los códigos internos no están publicados
   * en ninguna parte.
   *
   * @param em - Contexto de persistencia.
   * @param filters - Texto a buscar y versión opcional.
   * @param limit - Tope de resultados.
   * @returns Conceptos que casan, ordenados por código.
   */
  search(
    em: EntityManager,
    filters: {
      query?: string;
      codeSystemVersionId?: string;
      ids?: string[];
      /**
       * Acota a conceptos con este `state_concept_id` exacto.
       *
       * Lo usa el glosario público para excluir borradores (`TERM_DRAFT`):
       * ver `ConceptsService.searchConcepts`. Ausente para cualquier otro
       * llamador, que sigue viendo el catálogo completo como siempre.
       */
      stateConceptId?: string;
    },
    limit: number,
  ): Promise<CatalogConcepts[]> {
    const where: Record<string, unknown> = {};
    if (filters.ids && filters.ids.length > 0) {
      where.id = { $in: filters.ids };
    }
    if (filters.codeSystemVersionId) {
      where.codeSystemVersionId = filters.codeSystemVersionId;
    }
    if (filters.stateConceptId) {
      where.stateConceptId = filters.stateConceptId;
    }
    if (filters.query) {
      // `$ilike` cubre los dos formatos de código que conviven en el catálogo:
      // los cortos del núcleo (`PHONE`) y los prefijados por módulo
      // (`profiles:GENDER_FEMALE`).
      const pattern = `%${filters.query}%`;
      where.$or = [
        { code: { $ilike: pattern } },
        { display: { $ilike: pattern } },
      ];
    }
    return em.find(CatalogConcepts, where, {
      orderBy: { code: 'ASC' },
      limit,
    });
  }

  /**
   * Una página del glosario, resuelta **entera en la base**: pertenencia,
   * estado, texto, orden alfabético, total y recorte.
   *
   * ## Por qué no alcanzaba {@link search}
   *
   * `search` recibe los miembros del conjunto como lista de ids y ordena por
   * código; el servicio reordenaba por nombre **después** del `LIMIT`. Con 69
   * términos daba igual. Con cientos de miles es un `IN` de cientos de miles
   * de uuid y una página que no es la página: el `LIMIT` cortaba por código y
   * el orden alfabético se aplicaba sólo a lo que quedaba. Acá el orden y el
   * corte salen de la misma consulta, así que la página 7 es de verdad lo que
   * sigue a la 6.
   *
   * ## Castellano primero
   *
   * Los términos con nombre en el idioma pedido van antes que los que sólo
   * tienen su nombre original (`es.value IS NULL`): «Enfermedades» suma las
   * categorías ICD-10-CM en inglés, y su primera página no puede ser de ellas.
   * Es el mismo criterio que el simulador (`justin/glosario-correcciones`).
   *
   * ## Qué usa de los índices que ya existen
   *
   * - `uq_value_set_members_version_concept` para acotar al conjunto (y a la
   *   etiqueta, con el `EXISTS`);
   * - la PK de `catalog_concepts` para el `JOIN`;
   * - `ix_concept_designations_concept_id` para el nombre en el idioma pedido
   *   y para los sinónimos.
   *
   * El filtro de texto es un «contiene» y ningún `btree` lo resuelve: recorre
   * los miembros del conjunto ya acotado. Un índice de trigramas lo haría
   * sublineal, pero exige la extensión `pg_trgm`, que el modelo no declara —
   * ver `glossary-search.sql.ts`—.
   *
   * @param em - Contexto de persistencia.
   * @param filters - Conjunto, etiqueta, texto, estado e idioma.
   * @param limit - Términos por página.
   * @param offset - Cuántos saltear desde el principio.
   * @returns Los ids de la página, en orden, y el total que coincide.
   */
  async searchGlossaryPage(
    em: EntityManager,
    filters: GlossaryPageFilters,
    limit: number,
    offset: number,
  ): Promise<GlossaryPage> {
    const conditions: string[] = [
      'm.value_set_version_id = ?',
      'm.included = true',
      'c.state_concept_id = ?',
    ];
    const params: unknown[] = [
      filters.languageConceptId,
      filters.valueSetVersionId,
      filters.stateConceptId,
    ];

    if (filters.tagValueSetVersionId !== undefined) {
      conditions.push(
        `EXISTS (SELECT 1 FROM terminology.value_set_members t
                  WHERE t.value_set_version_id = ? AND t.included = true
                    AND t.concept_id = c.id)`,
      );
      params.push(filters.tagValueSetVersionId);
    }
    if (filters.ids !== undefined) {
      if (filters.ids.length === 0) return { ids: [], total: 0 };
      conditions.push('c.id IN (?)');
      params.push([...filters.ids]);
    }
    if (filters.codeSystemVersionId !== undefined) {
      conditions.push('c.code_system_version_id = ?');
      params.push(filters.codeSystemVersionId);
    }

    const normalized =
      filters.query === undefined ? '' : normalizeSearchText(filters.query);
    if (normalized !== '') {
      const pattern = containsPattern(normalized);
      conditions.push(
        `(${sqlSearchKey('c.code')} LIKE ?
          OR ${sqlSearchKey('c.display')} LIKE ?
          OR EXISTS (SELECT 1 FROM terminology.concept_designations d2
                      WHERE d2.concept_id = c.id
                        AND ${sqlSearchKey('d2.value')} LIKE ?))`,
      );
      params.push(pattern, pattern, pattern);
    }

    const rows: { id: string; total: string | number }[] = await em
      .getConnection()
      .execute(
        `SELECT c.id, count(*) OVER () AS total
           FROM terminology.value_set_members m
           JOIN terminology.catalog_concepts c ON c.id = m.concept_id
      LEFT JOIN LATERAL (
                SELECT d.value
                  FROM terminology.concept_designations d
                 WHERE d.concept_id = c.id
                   AND d.language_concept_id = ?
                   AND d.preferred = true
                 ORDER BY d.value
                 LIMIT 1
              ) es ON true
          WHERE ${conditions.join('\n            AND ')}
          ORDER BY (es.value IS NULL),
                   ${sqlSortKey('coalesce(es.value, c.display)')},
                   coalesce(es.value, c.display),
                   c.id
          LIMIT ? OFFSET ?`,
        [...params, limit, offset],
      );

    // `count(*) OVER ()` viaja en cada fila; una página vacía no lo trae. Si
    // se pidió más allá del final, el total se vuelve a pedir sin recorte:
    // decir «0 en total» a quien saltó a la página 900 de 12 sería mentirle.
    if (rows.length === 0 && offset > 0) {
      const again = await this.searchGlossaryPage(em, filters, 1, 0);
      return { ids: [], total: again.total };
    }
    return {
      ids: rows.map((row) => row.id),
      total: rows.length === 0 ? 0 : Number(rows[0].total),
    };
  }
}
