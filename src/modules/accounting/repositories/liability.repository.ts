import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Liabilities,
  LiabilitySchedules,
  LiabilityPayments,
  LiabilityPostings,
} from '../entities';
import { createdBy } from '../../../common';

/** Acceso a pasivos, cuotas, pagos y sus posteos (UC-16-12). */
@Injectable()
export class LiabilityRepository {
  findById(em: EntityManager, id: string): Promise<Liabilities | null> {
    return em.findOne(Liabilities, { id });
  }

  findScheduleById(
    em: EntityManager,
    id: string,
  ): Promise<LiabilitySchedules | null> {
    return em.findOne(LiabilitySchedules, { id });
  }

  createPayment(
    em: EntityManager,
    data: {
      liabilityId: string;
      transactionId?: string;
      amount: string;
      principalComponent?: string;
      interestComponent?: string;
      paidAt?: Date;
      actorUserId?: string;
    },
  ): LiabilityPayments {
    return em.create(
      LiabilityPayments,
      {
        liabilityId: data.liabilityId,
        transactionId: data.transactionId,
        amount: data.amount,
        principalComponent: data.principalComponent,
        interestComponent: data.interestComponent,
        paidAt: data.paidAt ?? new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createPosting(
    em: EntityManager,
    data: {
      liabilityId: string;
      ledgerEntryId: string;
      componentConceptId: string;
      liabilityScheduleId?: string;
      amount?: string;
      currencyConceptId?: string;
      actorUserId?: string;
    },
  ): LiabilityPostings {
    return em.create(
      LiabilityPostings,
      {
        liabilityId: data.liabilityId,
        ledgerEntryId: data.ledgerEntryId,
        componentConceptId: data.componentConceptId,
        liabilityScheduleId: data.liabilityScheduleId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        effectiveDate: new Date(),
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
