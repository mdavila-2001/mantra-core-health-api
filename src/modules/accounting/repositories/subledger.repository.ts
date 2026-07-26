import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  SubledgerAccounts,
  OpenItems,
  ClearingDocuments,
  ClearingItems,
} from '../entities';
import { createdBy } from '../../../common';

/** Acceso a subledgers, partidas abiertas y documentos de compensación. */
@Injectable()
export class SubledgerRepository {
  findSubledgerById(em: EntityManager, id: string): Promise<SubledgerAccounts | null> {
    return em.findOne(SubledgerAccounts, { id });
  }

  findOpenItemById(em: EntityManager, id: string): Promise<OpenItems | null> {
    return em.findOne(OpenItems, { id });
  }

  createOpenItem(
    em: EntityManager,
    data: {
      tenantId: string;
      subledgerAccountId: string;
      ledgerEntryId: string;
      documentTypeConceptId: string;
      statusConceptId: string;
      documentNumber?: string;
      invoiceId?: string;
      billId?: string;
      contractId?: string;
      baselineDate?: Date;
      dueDate?: Date;
      originalAmount?: string;
      outstandingAmount?: string;
      currencyConceptId?: string;
      actorUserId?: string;
    },
  ): OpenItems {
    return em.create(
      OpenItems,
      {
        tenantId: data.tenantId,
        subledgerAccountId: data.subledgerAccountId,
        ledgerEntryId: data.ledgerEntryId,
        documentTypeConceptId: data.documentTypeConceptId,
        statusConceptId: data.statusConceptId,
        documentNumber: data.documentNumber,
        invoiceId: data.invoiceId,
        billId: data.billId,
        contractId: data.contractId,
        baselineDate: data.baselineDate,
        dueDate: data.dueDate,
        originalAmount: data.originalAmount,
        outstandingAmount: data.outstandingAmount,
        currencyConceptId: data.currencyConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findClearingByNumber(
    em: EntityManager,
    tenantId: string,
    clearingNumber: string,
  ): Promise<ClearingDocuments | null> {
    return em.findOne(ClearingDocuments, { tenantId, clearingNumber });
  }

  createClearingDocument(
    em: EntityManager,
    data: {
      tenantId: string;
      clearingNumber: string;
      transactionId: string;
      statusConceptId: string;
      clearingDate?: Date;
      companyBankAccountId?: string;
      paymentTransactionId?: string;
      actorUserId?: string;
    },
  ): ClearingDocuments {
    return em.create(
      ClearingDocuments,
      {
        tenantId: data.tenantId,
        clearingNumber: data.clearingNumber,
        transactionId: data.transactionId,
        statusConceptId: data.statusConceptId,
        clearingDate: data.clearingDate ?? new Date(),
        companyBankAccountId: data.companyBankAccountId,
        paymentTransactionId: data.paymentTransactionId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  createClearingItem(
    em: EntityManager,
    data: {
      clearingDocumentId: string;
      openItemId: string;
      clearedAmount: string;
      currencyConceptId?: string;
      residualOpenItemId?: string;
      discountAmount?: string;
      exchangeDifferenceAmount?: string;
      actorUserId?: string;
    },
  ): ClearingItems {
    return em.create(
      ClearingItems,
      {
        clearingDocumentId: data.clearingDocumentId,
        openItemId: data.openItemId,
        clearedAmount: data.clearedAmount,
        currencyConceptId: data.currencyConceptId,
        residualOpenItemId: data.residualOpenItemId,
        discountAmount: data.discountAmount,
        exchangeDifferenceAmount: data.exchangeDifferenceAmount,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
