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
   * Los pasivos de una práctica (FT-26: auto-servicio del doctor), del más
   * reciente al más antiguo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @returns Resultado de list by practice conforme al contrato `Promise<Liabilities[]>`.
   */
  listByPractice(
    em: EntityManager,
    practiceId: string,
  ): Promise<Liabilities[]> {
    return em.find(
      Liabilities,
      { practiceId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /**
   * Enciende o apaga la automatización de un pasivo (FT-26).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del pasivo.
   * @param automated - El nuevo valor del interruptor.
   */
  async setAutomated(
    em: EntityManager,
    id: string,
    automated: boolean,
  ): Promise<Liabilities | null> {
    const liability = await em.findOne(Liabilities, { id });
    if (!liability) return null;
    liability.automated = automated;
    liability.updatedAt = new Date();
    await em.flush();
    return liability;
  }

  /**
   * Crea el pasivo (FT-26: alta desde el auto-servicio del doctor).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create liability conforme al contrato `Liabilities`.
   */
  createLiability(
    em: EntityManager,
    data: {
      practiceId: string;
      code: string;
      name: string;
      liabilityTypeConceptId?: string;
      accountId?: string;
      principalAmount: string;
      outstandingAmount: string;
      interestRate?: string;
      startDate: Date;
      dueDate?: Date;
      creditorName?: string;
      statusConceptId: string;
      automated: boolean;
      actorUserId?: string;
    },
  ): Liabilities {
    return em.create(
      Liabilities,
      {
        practiceId: data.practiceId,
        code: data.code,
        name: data.name,
        liabilityTypeConceptId: data.liabilityTypeConceptId,
        accountId: data.accountId,
        principalAmount: data.principalAmount,
        outstandingAmount: data.outstandingAmount,
        interestRate: data.interestRate,
        startDate: data.startDate,
        dueDate: data.dueDate,
        creditorName: data.creditorName,
        statusConceptId: data.statusConceptId,
        automated: data.automated,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea una cuota del cronograma de amortización (FT-26).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create schedule conforme al contrato `LiabilitySchedules`.
   */
  createSchedule(
    em: EntityManager,
    data: {
      liabilityId: string;
      installmentNumber: number;
      dueDate: Date;
      principalDue: string;
      interestDue: string;
      currencyConceptId?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): LiabilitySchedules {
    return em.create(
      LiabilitySchedules,
      {
        liabilityId: data.liabilityId,
        installmentNumber: data.installmentNumber,
        dueDate: data.dueDate,
        principalDue: data.principalDue,
        interestDue: data.interestDue,
        currencyConceptId: data.currencyConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Las cuotas de un pasivo, en orden de vencimiento (FT-26).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param liabilityId - Identificador del pasivo.
   * @returns Resultado de list schedules conforme al contrato `Promise<LiabilitySchedules[]>`.
   */
  listSchedules(
    em: EntityManager,
    liabilityId: string,
  ): Promise<LiabilitySchedules[]> {
    return em.find(
      LiabilitySchedules,
      { liabilityId },
      { orderBy: { installmentNumber: 'ASC' } },
    );
  }

  /**
   * La próxima cuota pendiente de un pasivo, la de menor número (FT-26:
   * "registrar avance" paga siempre la que sigue, nunca una fuera de orden).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param liabilityId - Identificador del pasivo.
   * @param pendingStatusConceptId - El concepto de estado "pendiente".
   * @returns Resultado de find next due schedule conforme al contrato `Promise<LiabilitySchedules | null>`.
   */
  findNextDueSchedule(
    em: EntityManager,
    liabilityId: string,
    pendingStatusConceptId: string,
  ): Promise<LiabilitySchedules | null> {
    return em.findOne(
      LiabilitySchedules,
      { liabilityId, statusConceptId: pendingStatusConceptId },
      { orderBy: { installmentNumber: 'ASC' } },
    );
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
