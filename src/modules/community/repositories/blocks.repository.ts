import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserBlocks } from '../entities';
import { createdBy } from '../../../common';

export interface CreateBlockData {
  blockerProfileId: string;
  blockedProfileId: string;
  reasonConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `community.user_blocks`. */
@Injectable()
export class BlocksRepository {
  findByPair(
    em: EntityManager,
    blockerProfileId: string,
    blockedProfileId: string,
  ): Promise<UserBlocks | null> {
    return em.findOne(UserBlocks, { blockerProfileId, blockedProfileId });
  }

  /** ¿Existe un bloqueo activo en cualquier sentido entre dos perfiles? */
  existsBetween(
    em: EntityManager,
    profileA: string,
    profileB: string,
    activeStatusConceptId: string,
  ): Promise<UserBlocks | null> {
    return em.findOne(UserBlocks, {
      statusConceptId: activeStatusConceptId,
      $or: [
        { blockerProfileId: profileA, blockedProfileId: profileB },
        { blockerProfileId: profileB, blockedProfileId: profileA },
      ],
    });
  }

  create(em: EntityManager, data: CreateBlockData): UserBlocks {
    return em.create(
      UserBlocks,
      {
        blockerProfileId: data.blockerProfileId,
        blockedProfileId: data.blockedProfileId,
        reasonConceptId: data.reasonConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
