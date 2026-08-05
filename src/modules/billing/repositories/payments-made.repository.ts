import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PaymentsMade, PayablePaymentAllocations } from '../entities';
import { createdBy } from '../../../common';

/** Cabecera de pago emitido a proveedor. */
export interface CreatePaymentMadeData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a bill.
   */
  billId?: string;
  /**
   * Identificador asociado a vendor.
   */
  vendorId?: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Identificador asociado a method concept.
   */
  methodConceptId: string;
  /**
   * Valor de paid at mantenido por la instancia.
   */
  paidAt?: Date;
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

/** Asignación de un pago emitido a una factura de proveedor. */
export interface CreatePayableAllocationData {
  /**
   * Identificador asociado a payment made.
   */
  paymentMadeId: string;
  /**
   * Identificador asociado a bill.
   */
  billId: string;
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
   * Valor de withholding amount mantenido por la instancia.
   */
  withholdingAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `billing.payments_made` y sus asignaciones (CxP). */
@Injectable()
export class PaymentsMadeRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PaymentsMade | null>`.
   */
  findById(em: EntityManager, id: string): Promise<PaymentsMade | null> {
    return em.findOne(PaymentsMade, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PaymentsMade`.
   */
  create(em: EntityManager, data: CreatePaymentMadeData): PaymentsMade {
    return em.create(
      PaymentsMade,
      {
        practiceId: data.practiceId,
        billId: data.billId,
        vendorId: data.vendorId,
        amount: data.amount,
        methodConceptId: data.methodConceptId,
        paidAt: data.paidAt,
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
   * @returns Resultado de create allocation conforme al contrato `PayablePaymentAllocations`.
   */
  createAllocation(
    em: EntityManager,
    data: CreatePayableAllocationData,
  ): PayablePaymentAllocations {
    return em.create(
      PayablePaymentAllocations,
      {
        paymentMadeId: data.paymentMadeId,
        billId: data.billId,
        openItemId: data.openItemId,
        allocatedAmount: data.allocatedAmount,
        discountAmount: data.discountAmount,
        withholdingAmount: data.withholdingAmount,
        currencyConceptId: data.currencyConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
