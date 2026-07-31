import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PrestigeAwards, PrestigeScores } from '../entities';

/**
 * Acceso a datos del sistema de prestigio de `community`: los movimientos de
 * puntos (`prestige_awards`) y el saldo/estado agregado por sujeto
 * (`prestige_scores`).
 */
@Injectable()
export class CommunityPrestigeRepository {
  /**
   * Lista los movimientos de prestigio de un perfil público, del más reciente
   * al más antiguo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param publicProfileId - Identificador de public profile.
   * @returns Resultado de list awards by profile conforme al contrato `Promise<PrestigeAwards[]>`.
   */
  listAwardsByProfile(
    em: EntityManager,
    tenantId: string,
    publicProfileId: string,
  ): Promise<PrestigeAwards[]> {
    return em.find(
      PrestigeAwards,
      { tenantId, publicProfileId },
      { orderBy: { recordedAt: 'desc' } },
    );
  }

  /**
   * Obtiene el saldo de prestigio vigente de un perfil público.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param publicProfileId - Identificador de public profile.
   * @returns Resultado de find score by profile conforme al contrato `Promise<PrestigeScores | null>`.
   */
  findScoreByProfile(
    em: EntityManager,
    tenantId: string,
    publicProfileId: string,
  ): Promise<PrestigeScores | null> {
    return em.findOne(PrestigeScores, { tenantId, publicProfileId });
  }
}
