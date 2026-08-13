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

  /**
   * De un conjunto de perfiles, cuáles sigue el actor con follow activo.
   *
   * En lote y no uno por uno: es lo que resuelve el nivel `FOLLOWERS` de una
   * página entera de posts sin una consulta por autor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param followerProfileId - Perfil que sigue.
   * @param candidateProfileIds - Perfiles a contrastar.
   * @param followableProfileTypeConceptId - Tipo `PROFILE` de seguible.
   * @param activeStatusConceptId - Estado que cuenta como follow vigente.
   * @returns Los perfiles seguidos, de entre los candidatos.
   */
  async listFollowedProfileIds(
    em: EntityManager,
    followerProfileId: string,
    candidateProfileIds: string[],
    followableProfileTypeConceptId: string,
    activeStatusConceptId: string,
  ): Promise<string[]> {
    if (candidateProfileIds.length === 0) return [];
    const rows = await em.find(SocialFollows, {
      followerProfileId,
      followableTypeConceptId: followableProfileTypeConceptId,
      followableRefId: { $in: candidateProfileIds },
      statusConceptId: activeStatusConceptId,
    });
    return rows.map((row) => row.followableRefId);
  }

  /**
   * Seguidores activos de un perfil (fan-out del feed, UC-19-15).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param followedProfileId - Perfil seguido.
   * @param followableProfileTypeConceptId - Tipo `PROFILE` de seguible.
   * @param activeStatusConceptId - Estado que cuenta como follow vigente.
   * @param limit - Tope de seguidores a devolver.
   * @returns Ids de los perfiles que lo siguen.
   */
  async listFollowerIdsOf(
    em: EntityManager,
    followedProfileId: string,
    followableProfileTypeConceptId: string,
    activeStatusConceptId: string,
    limit: number,
  ): Promise<string[]> {
    const rows = await em.find(
      SocialFollows,
      {
        followableTypeConceptId: followableProfileTypeConceptId,
        followableRefId: followedProfileId,
        statusConceptId: activeStatusConceptId,
      },
      { orderBy: { createdAt: 'ASC', id: 'ASC' }, limit },
    );
    return rows.map((row) => row.followerProfileId);
  }

  /**
   * Follows emitidos por un perfil (UC-19-05, cara de lectura).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param followerProfileId - Perfil que sigue.
   * @param after - Clave de continuación `(createdAt, id)` de la página anterior.
   * @param limit - Tope de filas.
   * @returns Página de follows activos, del más reciente al más antiguo.
   */
  listByFollowerPage(
    em: EntityManager,
    followerProfileId: string,
    activeStatusConceptId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<SocialFollows[]> {
    return em.find(
      SocialFollows,
      {
        followerProfileId,
        statusConceptId: activeStatusConceptId,
        ...(after
          ? {
              $or: [
                { createdAt: { $lt: new Date(after.createdAt) } },
                { createdAt: new Date(after.createdAt), id: { $lt: after.id } },
              ],
            }
          : {}),
      },
      { orderBy: { createdAt: 'DESC', id: 'DESC' }, limit },
    );
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
