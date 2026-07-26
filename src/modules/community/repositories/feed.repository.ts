import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FeedItems } from '../entities';
import { createdBy } from '../../../common';

export interface CreateFeedItemData {
  ownerProfileId: string;
  itemTypeConceptId: string;
  sourceTypeConceptId: string;
  sourceRefId: string;
  originConceptId: string;
  rankScore?: string;
  actorUserId?: string;
}

/** Acceso a datos del timeline materializado por fan-out (`community.feed_items`). */
@Injectable()
export class FeedRepository {
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
