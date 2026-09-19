import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PaymentTransactions,
  PaymentWebhookEvents,
  Refunds,
  PaymentCancellationRequests,
} from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create transaction data.
 */
export interface CreateTransactionData {
  /**
   * Identificador asociado a payment intent.
   */
  paymentIntentId: string;
  /**
   * Identificador asociado a gateway.
   */
  gatewayId: string;
  /**
   * Identificador asociado a transaction type concept.
   */
  transactionTypeConceptId: string;
  /**
   * Valor de gateway transaction ref mantenido por la instancia.
   */
  gatewayTransactionRef?: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de authorization code mantenido por la instancia.
   */
  authorizationCode?: string;
  /**
   * Valor de processed at mantenido por la instancia.
   */
  processedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create refund data.
 */
export interface CreateRefundData {
  /**
   * Identificador asociado a payment transaction.
   */
  paymentTransactionId: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId: string;
  /**
   * Valor de gateway refund ref mantenido por la instancia.
   */
  gatewayRefundRef?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de processed at mantenido por la instancia.
   */
  processedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create cancellation data.
 */
export interface CreateCancellationData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a gateway connection.
   */
  gatewayConnectionId: string;
  /**
   * Identificador asociado a payment transaction.
   */
  paymentTransactionId?: string;
  /**
   * Identificador asociado a payment debt.
   */
  paymentDebtId?: string;
  /**
   * Valor de request number mantenido por la instancia.
   */
  requestNumber: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId: string;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText?: string;
  /**
   * Identificador asociado a requested by user.
   */
  requestedByUserId: string;
  /**
   * Valor de requested at mantenido por la instancia.
   */
  requestedAt: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural del evento de webhook que se archiva
 * (bandeja de entrada de callbacks, MCH-011).
 */
export interface RecordWebhookEventData {
  /**
   * Identificador asociado a gateway.
   */
  gatewayId: string;
  /**
   * Tipo de evento informado por el proveedor.
   */
  eventType: string;
  /**
   * Referencia determinista del hecho; su índice único reconoce la reentrega.
   */
  gatewayEventRef: string;
  /**
   * Cuerpo verificable tal como llegó.
   */
  payloadJson: unknown;
  /**
   * Firma presentada por el proveedor.
   */
  signature?: string;
  /**
   * Si la firma se verificó antes de archivar el evento.
   */
  isVerified: boolean;
  /**
   * Si el evento se aplicó al estado local o quedó para conciliación.
   */
  processed: boolean;
  /**
   * Identificador asociado a related intent.
   */
  relatedIntentId?: string;
}

/** Acceso a datos de transacciones de gateway, reembolsos y cancelaciones. */
@Injectable()
export class PaymentTransactionsRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PaymentTransactions`.
   */
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

  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PaymentTransactions | null>`.
   */
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

  /**
   * Obtiene find by intent.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param paymentIntentId - Identificador de payment intent.
   * @returns Resultado de find by intent conforme al contrato `Promise<PaymentTransactions[]>`.
   */
  findByIntent(
    em: EntityManager,
    paymentIntentId: string,
  ): Promise<PaymentTransactions[]> {
    return em.find(PaymentTransactions, { paymentIntentId });
  }

  /**
   * Crea create refund.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create refund conforme al contrato `Refunds`.
   */
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

  /**
   * Operación abierta de la intención: sin resultado del gateway (PROCESSING) o
   * autorizada y todavía sin capturar (AUTHORIZED). Si hay de ambas, devuelve
   * la que está en PROCESSING, que es la más restrictiva.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param paymentIntentId - Intención de pago.
   * @returns La transacción abierta, o `null`.
   */
  async findPendingByIntent(
    em: EntityManager,
    paymentIntentId: string,
  ): Promise<PaymentTransactions | null> {
    const open = await em.find(PaymentTransactions, {
      paymentIntentId,
      statusConceptId: {
        $in: [CONCEPTS.TXN_PROCESSING, CONCEPTS.TXN_AUTHORIZED],
      },
    });
    return (
      open.find((t) => t.statusConceptId === CONCEPTS.TXN_PROCESSING) ??
      open[0] ??
      null
    );
  }

  /**
   * Evento ya archivado con esa referencia, si lo hay. Es la deduplicación
   * persistente de la bandeja de callbacks (MCH-011): permite distinguir una
   * reentrega del proveedor de un hecho nuevo aunque el estado local ya haya
   * avanzado por otra vía.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param gatewayEventRef - Referencia determinista del evento.
   * @returns El evento archivado, o `null`.
   */
  findWebhookEventByRef(
    em: EntityManager,
    gatewayEventRef: string,
  ): Promise<PaymentWebhookEvents | null> {
    return em.findOne(PaymentWebhookEvents, { gatewayEventRef });
  }

  /**
   * Archiva el callback verificado con su firma, su cuerpo y si se aplicó.
   * Un evento con `processed = false` es exactamente la cola de conciliación:
   * la contradicción queda visible en vez de taparse con un overwrite.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns El evento archivado.
   */
  recordWebhookEvent(
    em: EntityManager,
    data: RecordWebhookEventData,
  ): PaymentWebhookEvents {
    const now = new Date();
    return em.create(
      PaymentWebhookEvents,
      {
        gatewayId: data.gatewayId,
        eventType: data.eventType,
        gatewayEventRef: data.gatewayEventRef,
        payloadJson: data.payloadJson,
        signature: data.signature,
        isVerified: data.isVerified,
        processed: data.processed,
        relatedIntentId: data.relatedIntentId,
        receivedAt: now,
        recordedAt: now,
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

  /**
   * Crea create cancellation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cancellation conforme al contrato `PaymentCancellationRequests`.
   */
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
