import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Reimbursements } from '../entities';
import { createdBy } from '../../../common';

/** Reembolso de reclamo de seguro a registrar. */
export interface CreateReimbursementData {
  claimId: string;
  amount: string;
  receivedAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `billing.reimbursements`. */
@Injectable()
export class ReimbursementsRepository {
  findByClaim(em: EntityManager, claimId: string): Promise<Reimbursements | null> {
    return em.findOne(Reimbursements, { claimId });
  }

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
