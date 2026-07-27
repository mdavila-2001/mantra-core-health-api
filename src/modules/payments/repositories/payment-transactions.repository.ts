import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PaymentTransactions,
  Refunds,
  PaymentCancellationRequests,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateTransactionData {
  paymentIntentId: string;
  gatewayId: string;
  transactionTypeConceptId: string;
  gatewayTransactionRef?: string;
  amount: string;
  currencyConceptId: string;
  statusConceptId: string;
  authorizationCode?: string;
  processedAt?: Date;
  actorUserId?: string;
}

export interface CreateRefundData {
  paymentTransactionId: string;
  amount: string;
  currencyConceptId: string;
  reasonConceptId: string;
  gatewayRefundRef?: string;
  statusConceptId: string;
  processedAt?: Date;
  actorUserId?: string;
}

export interface CreateCancellationData {
  tenantId: string;
  gatewayConnectionId: string;
  paymentTransactionId?: string;
  paymentDebtId?: string;
  requestNumber: string;
  reasonConceptId: string;
  reasonText?: string;
  requestedByUserId: string;
  requestedAt: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de transacciones de gateway, reembolsos y cancelaciones. */
@Injectable()
export class PaymentTransactionsRepository {
  create(em: EntityManager, data: CreateTransactionData): PaymentTransactions {
    return em.create(
      PaymentTransactions,
      {
        paymentIntentId: data.paymentIntentId,
        gatewayId: data.gatewayId,
        transactionTypeConceptId: data.transactionTypeConceptId,
        gatewayTransactionRef: data.gatewayTransactionRef,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        statusConceptId: data.statusConceptId,
        authorizationCode: data.authorizationCode,
        processedAt: data.processedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findById(em: EntityManager, id: string): Promise<PaymentTransactions | null> {
    return em.findOne(PaymentTransactions, { id });
  }

  /** Bloqueo previo a mutar estado (captura, reembolso, anulación). */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PaymentTransactions | null> {
    return em.findOne(
      PaymentTransactions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Referencia externa del gateway. El callback llega sin contexto de sesión, así
   * que esta es la única vía para correlacionarlo con la transacción local; la
   * UNIQUE sobre la referencia es lo que hace idempotente el reintento del webhook.
   */
  findByGatewayRef(
    em: EntityManager,
    gatewayTransactionRef: string,
  ): Promise<PaymentTransactions | null> {
    return em.findOne(PaymentTransactions, { gatewayTransactionRef });
  }

  findByIntent(
    em: EntityManager,
    paymentIntentId: string,
  ): Promise<PaymentTransactions[]> {
    return em.find(PaymentTransactions, { paymentIntentId });
  }

  createRefund(em: EntityManager, data: CreateRefundData): Refunds {
    return em.create(
      Refunds,
      {
        paymentTransactionId: data.paymentTransactionId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        reasonConceptId: data.reasonConceptId,
        gatewayRefundRef: data.gatewayRefundRef,
        statusConceptId: data.statusConceptId,
        processedAt: data.processedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Reembolsos ya emitidos: su suma limita cuánto se puede devolver todavía. */
  findRefundsByTransaction(
    em: EntityManager,
    paymentTransactionId: string,
  ): Promise<Refunds[]> {
    return em.find(Refunds, { paymentTransactionId });
  }

  createCancellation(
    em: EntityManager,
    data: CreateCancellationData,
  ): PaymentCancellationRequests {
    return em.create(
      PaymentCancellationRequests,
      {
        tenantId: data.tenantId,
        gatewayConnectionId: data.gatewayConnectionId,
        paymentTransactionId: data.paymentTransactionId,
        paymentDebtId: data.paymentDebtId,
        requestNumber: data.requestNumber,
        reasonConceptId: data.reasonConceptId,
        reasonText: data.reasonText,
        requestedByUserId: data.requestedByUserId,
        requestedAt: data.requestedAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
