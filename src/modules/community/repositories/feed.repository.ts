import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FeedItems } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create feed item data.
 */
export interface CreateFeedItemData {
  /**
   * Identificador asociado a owner profile.
   */
  ownerProfileId: string;
  /**
   * Identificador asociado a item type concept.
   */
  itemTypeConceptId: string;
  /**
   * Identificador asociado a source type concept.
   */
  sourceTypeConceptId: string;
  /**
   * Identificador asociado a source ref.
   */
  sourceRefId: string;
  /**
   * Identificador asociado a origin concept.
   */
  originConceptId: string;
  /**
   * Valor de rank score mantenido por la instancia.
   */
  rankScore?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos del timeline materializado por fan-out (`community.feed_items`). */
@Injectable()
export class FeedRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `FeedItems`.
   */
  create(em: EntityManager, data: CreateFeedItemData): FeedItems {
    return em.create(
      FeedItems,
      {
        ownerProfileId: data.ownerProfileId,
        itemTypeConceptId: data.itemTypeConceptId,
        sourceTypeConceptId: data.sourceTypeConceptId,
        sourceRefId: data.sourceRefId,
        originConceptId: data.originConceptId,
        rankScore: data.rankScore ?? '0',
        isSeen: false,
        isHidden: false,
        surfacedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** ¿Ya existe el item para este dueño y fuente? (idempotencia del fan-out). */
  findByOwnerSource(
    em: EntityManager,
    ownerProfileId: string,
    sourceRefId: string,
  ): Promise<FeedItems | null> {
    return em.findOne(FeedItems, { ownerProfileId, sourceRefId });
  }

  /**
   * Timeline de un perfil (UC-19-13, cara de lectura).
   *
   * Ordena por `rank_score` y desempata por antigüedad. `rank_score` es
   * `numeric` y el ORM lo mapea a **string**, así que la clave del cursor
   * viaja como texto: convertirla a número acá redondearía el puntaje y dos
   * páginas consecutivas podrían repetir o saltear filas en el borde.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ownerProfileId - Perfil dueño del timeline.
   * @param after - Clave de continuación `(rankScore, createdAt, id)`.
   * @param limit - Tope de filas.
   * @returns Página del feed, de mayor a menor puntaje.
   */
  listPageByOwner(
    em: EntityManager,
    ownerProfileId: string,
    after: { rankScore: string; createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<FeedItems[]> {
    return em.find(
      FeedItems,
      {
        ownerProfileId,
        isHidden: { $ne: true },
        ...(after
          ? {
              $or: [
                { rankScore: { $lt: after.rankScore } },
                {
                  rankScore: after.rankScore,
                  createdAt: { $lt: new Date(after.createdAt) },
                },
                {
                  rankScore: after.rankScore,
                  createdAt: new Date(after.createdAt),
                  id: { $lt: after.id },
                },
              ],
            }
          : {}),
      },
      {
        orderBy: { rankScore: 'DESC', createdAt: 'DESC', id: 'DESC' },
        limit,
      },
    );
  }

  /**
   * De un conjunto de fuentes, cuáles ya tienen algún item de feed.
   *
   * Es lo que evita que el fan-out reprocese en cada tick los mismos posts:
   * un post ya repartido no vuelve al lote.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param sourceRefIds - Fuentes a contrastar.
   * @returns Las fuentes que ya fueron repartidas.
   */
  async listFannedOutSourceRefs(
    em: EntityManager,
    sourceRefIds: string[],
  ): Promise<string[]> {
    if (sourceRefIds.length === 0) return [];
    const rows = await em.find(
      FeedItems,
      { sourceRefId: { $in: sourceRefIds } },
      { fields: ['sourceRefId'] },
    );
    return [...new Set(rows.map((row) => row.sourceRefId))];
  }
}
