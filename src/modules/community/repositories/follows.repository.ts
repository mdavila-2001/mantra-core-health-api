import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SocialFollows } from '../entities';
import { createdBy } from '../../../common';

export interface CreateFollowData {
  followerProfileId: string;
  followableTypeConceptId: string;
  followableRefId: string;
  statusConceptId: string;
  notificationLevelConceptId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `community.social_follows` (grafo social). */
@Injectable()
export class FollowsRepository {
  findByFollowerTarget(
    em: EntityManager,
    followerProfileId: string,
    followableTypeConceptId: string,
    followableRefId: string,
  ): Promise<SocialFollows | null> {
    return em.findOne(SocialFollows, {
      followerProfileId,
      followableTypeConceptId,
      followableRefId,
    });
  }

  /** Follows activos entre dos perfiles (en ambos sentidos), para poda al bloquear. */
  findMutualBetween(
    em: EntityManager,
    profileA: string,
    profileB: string,
    followableProfileTypeConceptId: string,
  ): Promise<SocialFollows[]> {
    return em.find(SocialFollows, {
      followableTypeConceptId: followableProfileTypeConceptId,
      $or: [
        { followerProfileId: profileA, followableRefId: profileB },
        { followerProfileId: profileB, followableRefId: profileA },
      ],
    });
  }

  create(em: EntityManager, data: CreateFollowData): SocialFollows {
    return em.create(
      SocialFollows,
      {
        followerProfileId: data.followerProfileId,
        followableTypeConceptId: data.followableTypeConceptId,
        followableRefId: data.followableRefId,
        statusConceptId: data.statusConceptId,
        notificationLevelConceptId: data.notificationLevelConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
