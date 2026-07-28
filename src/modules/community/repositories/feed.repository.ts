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
}
