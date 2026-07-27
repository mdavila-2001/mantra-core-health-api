import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PaymentsMade, PayablePaymentAllocations } from '../entities';
import { createdBy } from '../../../common';

/** Cabecera de pago emitido a proveedor. */
export interface CreatePaymentMadeData {
  practiceId: string;
  billId?: string;
  vendorId?: string;
  amount: string;
  methodConceptId: string;
  paidAt?: Date;
  companyBankAccountId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Asignación de un pago emitido a una factura de proveedor. */
export interface CreatePayableAllocationData {
  paymentMadeId: string;
  billId: string;
  openItemId?: string;
  allocatedAmount: string;
  discountAmount?: string;
  withholdingAmount?: string;
  currencyConceptId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `billing.payments_made` y sus asignaciones (CxP). */
@Injectable()
export class PaymentsMadeRepository {
  findById(em: EntityManager, id: string): Promise<PaymentsMade | null> {
    return em.findOne(PaymentsMade, { id });
  }

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
