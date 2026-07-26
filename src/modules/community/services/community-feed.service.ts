import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import { FeedRepository } from '../repositories';
import { COMM } from '../community.concepts';
import { RebuildFeedDto, FeedRebuildResponseDto } from '../dto';

const ORIGIN_BY_CODE: Record<string, string> = {
  FOLLOWING: COMM.FEED_ORIGIN_FOLLOWING,
  GROUP: COMM.FEED_ORIGIN_GROUP,
  TOPIC: COMM.FEED_ORIGIN_TOPIC,
  SUGGESTED: COMM.FEED_ORIGIN_SUGGESTED,
  PROMOTED: COMM.FEED_ORIGIN_PROMOTED,
};

/**
 * Worker de fan-out del feed (UC-19-15). Proyecta un post publicado al timeline de
 * cada seguidor de forma idempotente (no duplica el item por dueño/fuente).
 * Endpoint interno, no expuesto al usuario final; requiere rol de servicio.
 */
@Injectable()
export class CommunityFeedService {
  constructor(
    private readonly em: EntityManager,
    private readonly feedRepo: FeedRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CommunityFeedService.name);
  }

  /** UC-19-15: fan-out de un post a los feeds de sus seguidores. */
  async rebuild(dto: RebuildFeedDto, actor: AuthenticatedUser): Promise<FeedRebuildResponseDto> {
    this.logger.info(
      { operation: 'community.feed.rebuild', sourceRefId: dto.sourceRefId, fanout: dto.followerProfileIds.length },
      'Rebuilding feed fan-out',
    );
    return this.em.transactional(async (tx) => {
      const origin = ORIGIN_BY_CODE[dto.origin ?? 'FOLLOWING'];
      let itemsCreated = 0;
      for (const ownerProfileId of dto.followerProfileIds) {
        const existing = await this.feedRepo.findByOwnerSource(tx, ownerProfileId, dto.sourceRefId);
        if (existing) continue;
        this.feedRepo.create(tx, {
          ownerProfileId,
          itemTypeConceptId: COMM.FEED_ITEM_POST,
          sourceTypeConceptId: COMM.FEED_SOURCE_POST,
          sourceRefId: dto.sourceRefId,
          originConceptId: origin,
          actorUserId: actor.id,
        });
        itemsCreated++;
      }
      await tx.flush();
      return { itemsCreated };
    });
  }
}
