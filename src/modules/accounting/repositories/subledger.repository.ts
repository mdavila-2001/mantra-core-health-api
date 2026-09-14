import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  SubledgerAccounts,
  OpenItems,
  ClearingDocuments,
  ClearingItems,
} from '../entities';
import { createdBy } from '../../../common';

/** Una partida abierta con su subledger, para resolverla contra la práctica. */
export interface OpenItemWithSubledger {
  /** La partida abierta. */
  openItem: OpenItems;
  /** El subledger sobre el que reconcilia. */
  subledger: SubledgerAccounts;
}

/** Acceso a subledgers, partidas abiertas y documentos de compensación. */
@Injectable()
export class SubledgerRepository {
  /**
   * Obtiene find subledger by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find subledger by id conforme al contrato `Promise<SubledgerAccounts | null>`.
   */
  findSubledgerById(
    em: EntityManager,
    id: string,
  ): Promise<SubledgerAccounts | null> {
    return em.findOne(SubledgerAccounts, { id });
  }

  /**
   * Obtiene find open item by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find open item by id conforme al contrato `Promise<OpenItems | null>`.
   */
  findOpenItemById(em: EntityManager, id: string): Promise<OpenItems | null> {
    return em.findOne(OpenItems, { id });
  }

  /**
   * Crea create open item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create open item conforme al contrato `OpenItems`.
   */
  createOpenItem(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a subledger account.
       */
      subledgerAccountId: string;
      /**
       * Identificador asociado a ledger entry.
       */
      ledgerEntryId: string;
      /**
       * Identificador asociado a document type concept.
       */
      documentTypeConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de document number mantenido por la instancia.
       */
      documentNumber?: string;
      /**
       * Identificador asociado a invoice.
       */
      invoiceId?: string;
      /**
       * Identificador asociado a bill.
       */
      billId?: string;
      /**
       * Identificador asociado a contract.
       */
      contractId?: string;
      /**
       * Valor de baseline date mantenido por la instancia.
       */
      baselineDate?: Date;
      /**
       * Valor de due date mantenido por la instancia.
       */
      dueDate?: Date;
      /**
       * Valor de original amount mantenido por la instancia.
       */
      originalAmount?: string;
      /**
       * Valor de outstanding amount mantenido por la instancia.
       */
      outstandingAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Las partidas abiertas cuyo subledger reconcilia contra una de las cuentas
   * dadas (el puente por práctica de D-1: `subledger_accounts` y `open_items`
   * son por tenant, no por práctica).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant dueño de los subledgers.
   * @param reconciliationAccountIds - Cuentas de la práctica consultada.
   * @param excludedStatusConceptId - Estado a excluir (partida saldada).
   * @param limit - Tope de filas.
   * @returns Cada partida abierta junto con su subledger.
   */
  async findOpenItemsByReconciliationAccounts(
    em: EntityManager,
    tenantId: string,
    reconciliationAccountIds: readonly string[],
    excludedStatusConceptId: string,
    limit: number,
  ): Promise<OpenItemWithSubledger[]> {
    if (reconciliationAccountIds.length === 0) return [];

    const subledgers = await em.find(SubledgerAccounts, {
      tenantId,
      reconciliationAccountId: { $in: [...reconciliationAccountIds] },
    });
    if (subledgers.length === 0) return [];

    const porId = new Map(subledgers.map((s) => [s.id, s]));
    const items = await em.find(
      OpenItems,
      {
        subledgerAccountId: { $in: subledgers.map((s) => s.id) },
        statusConceptId: { $ne: excludedStatusConceptId },
      },
      { limit },
    );

    return items
      .map((openItem) => {
        const subledger = porId.get(openItem.subledgerAccountId);
        return subledger ? { openItem, subledger } : null;
      })
      .filter((x): x is OpenItemWithSubledger => x !== null);
  }

  /**
   * Obtiene find clearing by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param clearingNumber - Valor de clearing number requerido por la operación.
   * @returns Resultado de find clearing by number conforme al contrato `Promise<ClearingDocuments | null>`.
   */
  findClearingByNumber(
    em: EntityManager,
    tenantId: string,
    clearingNumber: string,
  ): Promise<ClearingDocuments | null> {
    return em.findOne(ClearingDocuments, { tenantId, clearingNumber });
  }

  /**
   * Crea create clearing document.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create clearing document conforme al contrato `ClearingDocuments`.
   */
  createClearingDocument(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de clearing number mantenido por la instancia.
       */
      clearingNumber: string;
      /**
       * Identificador asociado a transaction.
       */
      transactionId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de clearing date mantenido por la instancia.
       */
      clearingDate?: Date;
      /**
       * Identificador asociado a company bank account.
       */
      companyBankAccountId?: string;
      /**
       * Identificador asociado a payment transaction.
       */
      paymentTransactionId?: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create clearing item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create clearing item conforme al contrato `ClearingItems`.
   */
  createClearingItem(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a clearing document.
       */
      clearingDocumentId: string;
      /**
       * Identificador asociado a open item.
       */
      openItemId: string;
      /**
       * Valor de cleared amount mantenido por la instancia.
       */
      clearedAmount: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a residual open item.
       */
      residualOpenItemId?: string;
      /**
       * Valor de discount amount mantenido por la instancia.
       */
      discountAmount?: string;
      /**
       * Valor de exchange difference amount mantenido por la instancia.
       */
      exchangeDifferenceAmount?: string;
      /**
       * Identificador asociado a actor user.
       */
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
