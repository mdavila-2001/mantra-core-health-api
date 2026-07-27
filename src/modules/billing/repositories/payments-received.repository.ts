import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PaymentsReceived, ReceivablePaymentAllocations } from '../entities';
import { createdBy } from '../../../common';

/** Cabecera de pago recibido a crear. */
export interface CreatePaymentReceivedData {
  practiceId: string;
  patientProfileId?: string;
  invoiceId?: string;
  amount: string;
  methodConceptId: string;
  receivedAt?: Date;
  reference?: string;
  companyBankAccountId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Asignación de un pago recibido a una factura. */
export interface CreateReceivableAllocationData {
  paymentReceivedId: string;
  invoiceId: string;
  openItemId?: string;
  allocatedAmount: string;
  discountAmount?: string;
  writeOffAmount?: string;
  currencyConceptId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `billing.payments_received` y sus asignaciones (CxC). */
@Injectable()
export class PaymentsReceivedRepository {
  findById(em: EntityManager, id: string): Promise<PaymentsReceived | null> {
    return em.findOne(PaymentsReceived, { id });
  }

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
