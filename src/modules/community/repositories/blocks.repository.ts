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
