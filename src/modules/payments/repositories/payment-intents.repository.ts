import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PaymentIntents } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una intención de pago (UC-42-01). */
export interface CreateIntentData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a gateway.
   */
  gatewayId: string;
  /**
   * Identificador asociado a gateway connection.
   */
  gatewayConnectionId?: string;
  /**
   * Identificador asociado a purpose concept.
   */
  purposeConceptId: string;
  /**
   * Identificador asociado a invoice.
   */
  invoiceId?: string;
  /**
   * Valor de source ref type mantenido por la instancia.
   */
  sourceRefType?: string;
  /**
   * Identificador asociado a source ref.
   */
  sourceRefId?: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `payments.payment_intents`. */
@Injectable()
export class PaymentIntentsRepository {
  /** Crea la intención sin flush; el caller controla la transacción. */
  create(em: EntityManager, data: CreateIntentData): PaymentIntents {
    return em.create(
      PaymentIntents,
      {
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        gatewayId: data.gatewayId,
        gatewayConnectionId: data.gatewayConnectionId,
        purposeConceptId: data.purposeConceptId,
        invoiceId: data.invoiceId,
        sourceRefType: data.sourceRefType,
        sourceRefId: data.sourceRefId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        idempotencyKey: data.idempotencyKey,
        statusConceptId: data.statusConceptId,
        expiresAt: data.expiresAt,
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
   * @returns Resultado de find by id conforme al contrato `Promise<PaymentIntents | null>`.
   */
  findById(em: EntityManager, id: string): Promise<PaymentIntents | null> {
    return em.findOne(PaymentIntents, { id });
  }

  /**
   * Reintento idempotente: la UNIQUE sobre `idempotency_key` es la garantía real
   * contra el doble cobro; esta lectura permite devolver el intent existente con
   * un 200 en vez de dejar que la constraint reviente con un 409.
   */
  findByIdempotencyKey(
    em: EntityManager,
    tenantId: string,
    idempotencyKey: string,
  ): Promise<PaymentIntents | null> {
    return em.findOne(PaymentIntents, { tenantId, idempotencyKey });
  }

  /**
   * `SELECT ... FOR UPDATE` sobre el intent. El caso de uso lo exige antes de
   * mutarlo (fx-lock, riesgo, transacción) porque el bloqueo optimista de
   * `row_version` detecta el conflicto pero no lo evita: aquí se serializan los
   * escritores concurrentes en vez de dejar que uno falle al hacer flush.
   */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PaymentIntents | null> {
    return em.findOne(
      PaymentIntents,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
