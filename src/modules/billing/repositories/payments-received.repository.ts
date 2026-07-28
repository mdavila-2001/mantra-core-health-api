import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PaymentsReceived, ReceivablePaymentAllocations } from '../entities';
import { createdBy } from '../../../common';

/** Cabecera de pago recibido a crear. */
export interface CreatePaymentReceivedData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a invoice.
   */
  invoiceId?: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Identificador asociado a method concept.
   */
  methodConceptId: string;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt?: Date;
  /**
   * Valor de reference mantenido por la instancia.
   */
  reference?: string;
  /**
   * Identificador asociado a company bank account.
   */
  companyBankAccountId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Asignación de un pago recibido a una factura. */
export interface CreateReceivableAllocationData {
  /**
   * Identificador asociado a payment received.
   */
  paymentReceivedId: string;
  /**
   * Identificador asociado a invoice.
   */
  invoiceId: string;
  /**
   * Identificador asociado a open item.
   */
  openItemId?: string;
  /**
   * Valor de allocated amount mantenido por la instancia.
   */
  allocatedAmount: string;
  /**
   * Valor de discount amount mantenido por la instancia.
   */
  discountAmount?: string;
  /**
   * Valor de write off amount mantenido por la instancia.
   */
  writeOffAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `billing.payments_received` y sus asignaciones (CxC). */
@Injectable()
export class PaymentsReceivedRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PaymentsReceived | null>`.
   */
  findById(em: EntityManager, id: string): Promise<PaymentsReceived | null> {
    return em.findOne(PaymentsReceived, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PaymentsReceived`.
   */
  create(em: EntityManager, data: CreatePaymentReceivedData): PaymentsReceived {
    return em.create(
      PaymentsReceived,
      {
        practiceId: data.practiceId,
        patientProfileId: data.patientProfileId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        methodConceptId: data.methodConceptId,
        receivedAt: data.receivedAt,
        reference: data.reference,
        companyBankAccountId: data.companyBankAccountId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create allocation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create allocation conforme al contrato `ReceivablePaymentAllocations`.
   */
  createAllocation(
    em: EntityManager,
    data: CreateReceivableAllocationData,
  ): ReceivablePaymentAllocations {
    return em.create(
      ReceivablePaymentAllocations,
      {
        paymentReceivedId: data.paymentReceivedId,
        invoiceId: data.invoiceId,
        openItemId: data.openItemId,
        allocatedAmount: data.allocatedAmount,
        discountAmount: data.discountAmount,
        writeOffAmount: data.writeOffAmount,
        currencyConceptId: data.currencyConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
