import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserBlocks } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create block data.
 */
export interface CreateBlockData {
  /**
   * Identificador asociado a blocker profile.
   */
  blockerProfileId: string;
  /**
   * Identificador asociado a blocked profile.
   */
  blockedProfileId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `community.user_blocks`. */
@Injectable()
export class BlocksRepository {
  /**
   * Obtiene find by pair.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param blockerProfileId - Identificador de blocker profile.
   * @param blockedProfileId - Identificador de blocked profile.
   * @returns Resultado de find by pair conforme al contrato `Promise<UserBlocks | null>`.
   */
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

  /**
   * De un conjunto de perfiles, cuáles tienen un bloqueo activo con el actor.
   *
   * Resuelve en una consulta lo que si no serían dos por cada autor de la
   * página; el sentido del bloqueo no importa, porque bloquear corta la
   * visibilidad en ambas direcciones.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileId - Perfil del lector.
   * @param peerProfileIds - Perfiles a contrastar.
   * @param activeStatusConceptId - Estado que cuenta como bloqueo vigente.
   * @returns Los perfiles de `peerProfileIds` bloqueados en algún sentido.
   */
  async listBlockedPeers(
    em: EntityManager,
    profileId: string,
    peerProfileIds: string[],
    activeStatusConceptId: string,
  ): Promise<string[]> {
    if (peerProfileIds.length === 0) return [];
    const rows = await em.find(UserBlocks, {
      statusConceptId: activeStatusConceptId,
      $or: [
        {
          blockerProfileId: profileId,
          blockedProfileId: { $in: peerProfileIds },
        },
        {
          blockerProfileId: { $in: peerProfileIds },
          blockedProfileId: profileId,
        },
      ],
    });
    return rows.map((row) =>
      row.blockerProfileId === profileId
        ? row.blockedProfileId
        : row.blockerProfileId,
    );
  }

  /**
   * Bloqueos emitidos por un perfil (UC-19-07, cara de lectura).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param blockerProfileId - Perfil que bloqueó.
   * @param after - Clave de continuación `(createdAt, id)` de la página anterior.
   * @param limit - Tope de filas.
   * @returns Página de bloqueos, del más reciente al más antiguo.
   */
  listByBlocker(
    em: EntityManager,
    blockerProfileId: string,
    after: { createdAt: string; id: string } | undefined,
    limit: number,
  ): Promise<UserBlocks[]> {
    return em.find(
      UserBlocks,
      {
        blockerProfileId,
        ...(after
          ? {
              $or: [
                { createdAt: { $lt: new Date(after.createdAt) } },
                {
                  createdAt: new Date(after.createdAt),
                  id: { $lt: after.id },
                },
              ],
            }
          : {}),
      },
      { orderBy: { createdAt: 'DESC', id: 'DESC' }, limit },
    );
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `UserBlocks`.
   */
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
