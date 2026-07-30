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
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Liabilities | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Liabilities | null> {
    return em.findOne(Liabilities, { id });
  }

  /**
   * Obtiene find schedule by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find schedule by id conforme al contrato `Promise<LiabilitySchedules | null>`.
   */
  findScheduleById(
    em: EntityManager,
    id: string,
  ): Promise<LiabilitySchedules | null> {
    return em.findOne(LiabilitySchedules, { id });
  }

  /**
   * Crea create payment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create payment conforme al contrato `LiabilityPayments`.
   */
  createPayment(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a liability.
       */
      liabilityId: string;
      /**
       * Identificador asociado a transaction.
       */
      transactionId?: string;
      /**
       * Valor de amount mantenido por la instancia.
       */
      amount: string;
      /**
       * Valor de principal component mantenido por la instancia.
       */
      principalComponent?: string;
      /**
       * Valor de interest component mantenido por la instancia.
       */
      interestComponent?: string;
      /**
       * Valor de paid at mantenido por la instancia.
       */
      paidAt?: Date;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create posting.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create posting conforme al contrato `LiabilityPostings`.
   */
  createPosting(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a liability.
       */
      liabilityId: string;
      /**
       * Identificador asociado a ledger entry.
       */
      ledgerEntryId: string;
      /**
       * Identificador asociado a component concept.
       */
      componentConceptId: string;
      /**
       * Identificador asociado a liability schedule.
       */
      liabilityScheduleId?: string;
      /**
       * Valor de amount mantenido por la instancia.
       */
      amount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a actor user.
       */
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
