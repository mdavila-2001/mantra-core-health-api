import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CatalogConcepts } from '../entities';
import { createdBy } from '../../../common';

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
    filters: { query?: string; codeSystemVersionId?: string },
    limit: number,
  ): Promise<CatalogConcepts[]> {
    const where: Record<string, unknown> = {};
    if (filters.codeSystemVersionId) {
      where.codeSystemVersionId = filters.codeSystemVersionId;
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
}
