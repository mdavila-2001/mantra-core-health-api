import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Reimbursements } from '../entities';
import { createdBy } from '../../../common';

/** Reembolso de reclamo de seguro a registrar. */
export interface CreateReimbursementData {
  /**
   * Identificador asociado a claim.
   */
  claimId: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `billing.reimbursements`. */
@Injectable()
export class ReimbursementsRepository {
  /**
   * Obtiene find by claim.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param claimId - Identificador de claim.
   * @returns Resultado de find by claim conforme al contrato `Promise<Reimbursements | null>`.
   */
  findByClaim(
    em: EntityManager,
    claimId: string,
  ): Promise<Reimbursements | null> {
    return em.findOne(Reimbursements, { claimId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Reimbursements`.
   */
  create(em: EntityManager, data: CreateReimbursementData): Reimbursements {
    return em.create(
      Reimbursements,
      {
        claimId: data.claimId,
        amount: data.amount,
        receivedAt: data.receivedAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
