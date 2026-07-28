import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SocialFollows } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create follow data.
 */
export interface CreateFollowData {
  /**
   * Identificador asociado a follower profile.
   */
  followerProfileId: string;
  /**
   * Identificador asociado a followable type concept.
   */
  followableTypeConceptId: string;
  /**
   * Identificador asociado a followable ref.
   */
  followableRefId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a notification level concept.
   */
  notificationLevelConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `community.social_follows` (grafo social). */
@Injectable()
export class FollowsRepository {
  /**
   * Obtiene find by follower target.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param followerProfileId - Identificador de follower profile.
   * @param followableTypeConceptId - Identificador de followable type concept.
   * @param followableRefId - Identificador de followable ref.
   * @returns Resultado de find by follower target conforme al contrato `Promise<SocialFollows | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `SocialFollows`.
   */
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
