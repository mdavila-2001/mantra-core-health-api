import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClaimDisputes, ClaimAppealDecisions } from '../entities';

/**
 * Acceso a datos de disputas y decisiones de apelación. Las decisiones son
 * append-only: cada nueva `decision_version` supersede la anterior sin mutarla.
 */
@Injectable()
export class DisputeRepository {
  /**
   * Obtiene find dispute.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find dispute conforme al contrato `Promise<ClaimDisputes | null>`.
   */
  findDispute(em: EntityManager, id: string): Promise<ClaimDisputes | null> {
    return em.findOne(ClaimDisputes, { id });
  }

  /** Última decisión de la disputa (para supersede y siguiente versión). */
  latestDecision(
    em: EntityManager,
    disputeId: string,
  ): Promise<ClaimAppealDecisions | null> {
    return em.findOne(
      ClaimAppealDecisions,
      { claimDisputeId: disputeId },
      { orderBy: { decisionVersion: 'DESC' } },
    );
  }

  /**
   * Crea create appeal decision.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create appeal decision conforme al contrato `ClaimAppealDecisions`.
   */
  createAppealDecision(
    em: EntityManager,
    data: Record<string, unknown>,
  ): ClaimAppealDecisions {
    return em.create(
      ClaimAppealDecisions,
      {
        ...data,
        createdAt: new Date(),
        decidedAt: new Date(),
        decidedByReviewerUserId: data.actorUserId as string | undefined,
      },
      { partial: true },
    );
  }
}
