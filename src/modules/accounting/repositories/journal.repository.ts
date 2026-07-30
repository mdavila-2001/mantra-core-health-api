import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  JournalTransactions,
  LedgerEntries,
  JournalEntryAssignments,
  AccountingDocumentLinks,
  TransactionFiles,
} from '../entities';
import { createdBy } from '../../../common';

/** Cabecera del asiento a insertar. */
export interface CreateTransactionData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Valor de transaction number mantenido por la instancia.
   */
  transactionNumber: string;
  /**
   * Identificador asociado a transaction type concept.
   */
  transactionTypeConceptId: string;
  /**
   * Valor de transaction date mantenido por la instancia.
   */
  transactionDate: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a fiscal period.
   */
  fiscalPeriodId?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de total amount mantenido por la instancia.
   */
  totalAmount?: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Valor de reference mantenido por la instancia.
   */
  reference?: string;
  /**
   * Valor de source document type mantenido por la instancia.
   */
  sourceDocumentType?: string;
  /**
   * Identificador asociado a source document.
   */
  sourceDocumentId?: string;
  /**
   * Valor de posted at mantenido por la instancia.
   */
  postedAt?: Date;
  /**
   * Identificador asociado a posted by user.
   */
  postedByUserId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Línea del mayor (partida) a insertar. */
export interface CreateLedgerEntryData {
  /**
   * Identificador asociado a transaction.
   */
  transactionId: string;
  /**
   * Identificador asociado a account.
   */
  accountId: string;
  /**
   * Identificador asociado a direction concept.
   */
  directionConceptId: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Valor de line no mantenido por la instancia.
   */
  lineNo: number;
  /**
   * Identificador asociado a cost center.
   */
  costCenterId?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de fx rate mantenido por la instancia.
   */
  fxRate?: string;
  /**
   * Valor de amount base mantenido por la instancia.
   */
  amountBase?: string;
  /**
   * Valor de memo mantenido por la instancia.
   */
  memo?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Dimensiones analíticas 1:1 por línea (GOD NODE). */
export interface CreateAssignmentData {
  /**
   * Identificador asociado a ledger entry.
   */
  ledgerEntryId: string;
  /**
   * Identificador asociado a cost center.
   */
  costCenterId?: string;
  /**
   * Identificador asociado a profit center.
   */
  profitCenterId?: string;
  /**
   * Identificador asociado a segment.
   */
  segmentId?: string;
  /**
   * Identificador asociado a functional area.
   */
  functionalAreaId?: string;
  /**
   * Identificador asociado a internal order.
   */
  internalOrderId?: string;
  /**
   * Identificador asociado a subledger account.
   */
  subledgerAccountId?: string;
  /**
   * Identificador asociado a business partner.
   */
  businessPartnerId?: string;
  /**
   * Identificador asociado a asset.
   */
  assetId?: string;
  /**
   * Identificador asociado a liability.
   */
  liabilityId?: string;
  /**
   * Identificador asociado a company bank account.
   */
  companyBankAccountId?: string;
  /**
   * Identificador asociado a branch.
   */
  branchId?: string;
  /**
   * Identificador asociado a department.
   */
  departmentId?: string;
  /**
   * Identificador asociado a employee.
   */
  employeeId?: string;
  /**
   * Identificador asociado a assignment source concept.
   */
  assignmentSourceConceptId?: string;
  /**
   * Identificador asociado a derived by rule.
   */
  derivedByRuleId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos del asiento y sus dependientes (líneas del mayor, asignaciones
 * analíticas, vínculos entre documentos y adjuntos). Stateless: cada método recibe
 * el `EntityManager` activo para que el servicio controle la transacción y el orden
 * de `flush` padre→hijo (las FK son columnas uuid, MikroORM no ordena inserts).
 */
@Injectable()
export class JournalRepository {
  /**
   * Obtiene find transaction by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find transaction by id conforme al contrato `Promise<JournalTransactions | null>`.
   */
  findTransactionById(
    em: EntityManager,
    id: string,
  ): Promise<JournalTransactions | null> {
    return em.findOne(JournalTransactions, { id });
  }

  /**
   * Obtiene find by transaction number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param transactionNumber - Valor de transaction number requerido por la operación.
   * @returns Resultado de find by transaction number conforme al contrato `Promise<JournalTransactions | null>`.
   */
  findByTransactionNumber(
    em: EntityManager,
    practiceId: string,
    transactionNumber: string,
  ): Promise<JournalTransactions | null> {
    return em.findOne(JournalTransactions, { practiceId, transactionNumber });
  }

  /**
   * Crea create transaction.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create transaction conforme al contrato `JournalTransactions`.
   */
  createTransaction(
    em: EntityManager,
    data: CreateTransactionData,
  ): JournalTransactions {
    return em.create(
      JournalTransactions,
      {
        practiceId: data.practiceId,
        transactionNumber: data.transactionNumber,
        transactionTypeConceptId: data.transactionTypeConceptId,
        transactionDate: data.transactionDate,
        statusConceptId: data.statusConceptId,
        fiscalPeriodId: data.fiscalPeriodId,
        currencyConceptId: data.currencyConceptId,
        totalAmount: data.totalAmount,
        description: data.description,
        reference: data.reference,
        sourceDocumentType: data.sourceDocumentType,
        sourceDocumentId: data.sourceDocumentId,
        postedAt: data.postedAt,
        postedByUserId: data.postedByUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create ledger entry.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create ledger entry conforme al contrato `LedgerEntries`.
   */
  createLedgerEntry(
    em: EntityManager,
    data: CreateLedgerEntryData,
  ): LedgerEntries {
    return em.create(
      LedgerEntries,
      {
        transactionId: data.transactionId,
        accountId: data.accountId,
        directionConceptId: data.directionConceptId,
        amount: data.amount,
        lineNo: data.lineNo,
        costCenterId: data.costCenterId,
        currencyConceptId: data.currencyConceptId,
        fxRate: data.fxRate,
        amountBase: data.amountBase,
        memo: data.memo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create assignment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create assignment conforme al contrato `JournalEntryAssignments`.
   */
  createAssignment(
    em: EntityManager,
    data: CreateAssignmentData,
  ): JournalEntryAssignments {
    return em.create(
      JournalEntryAssignments,
      {
        ledgerEntryId: data.ledgerEntryId,
        costCenterId: data.costCenterId,
        profitCenterId: data.profitCenterId,
        segmentId: data.segmentId,
        functionalAreaId: data.functionalAreaId,
        internalOrderId: data.internalOrderId,
        subledgerAccountId: data.subledgerAccountId,
        businessPartnerId: data.businessPartnerId,
        assetId: data.assetId,
        liabilityId: data.liabilityId,
        companyBankAccountId: data.companyBankAccountId,
        branchId: data.branchId,
        departmentId: data.departmentId,
        employeeId: data.employeeId,
        assignmentSourceConceptId: data.assignmentSourceConceptId,
        derivedByRuleId: data.derivedByRuleId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find link.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param sourceTransactionId - Identificador de source transaction.
   * @param relationTypeConceptId - Identificador de relation type concept.
   * @returns Resultado de find link conforme al contrato `Promise<AccountingDocumentLinks | null>`.
   */
  findLink(
    em: EntityManager,
    sourceTransactionId: string,
    relationTypeConceptId: string,
  ): Promise<AccountingDocumentLinks | null> {
    return em.findOne(AccountingDocumentLinks, {
      sourceTransactionId,
      relationTypeConceptId,
    });
  }

  /**
   * Crea create link.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create link conforme al contrato `AccountingDocumentLinks`.
   */
  createLink(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a source transaction.
       */
      sourceTransactionId: string;
      /**
       * Identificador asociado a target transaction.
       */
      targetTransactionId: string;
      /**
       * Identificador asociado a relation type concept.
       */
      relationTypeConceptId: string;
      /**
       * Valor de reason text mantenido por la instancia.
       */
      reasonText?: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): AccountingDocumentLinks {
    return em.create(
      AccountingDocumentLinks,
      {
        sourceTransactionId: data.sourceTransactionId,
        targetTransactionId: data.targetTransactionId,
        relationTypeConceptId: data.relationTypeConceptId,
        reasonText: data.reasonText,
        effectiveAt: new Date(),
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  /**
   * Ejecuta la operación ledger entries for transaction.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param transactionId - Identificador de transaction.
   * @returns Resultado de ledger entries for transaction conforme al contrato `Promise<LedgerEntries[]>`.
   */
  ledgerEntriesForTransaction(
    em: EntityManager,
    transactionId: string,
  ): Promise<LedgerEntries[]> {
    return em.find(
      LedgerEntries,
      { transactionId },
      { orderBy: { lineNo: 'asc' } },
    );
  }

  /**
   * Actualiza assignment for entry.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ledgerEntryId - Identificador de ledger entry.
   * @returns Resultado de assignment for entry conforme al contrato `Promise<JournalEntryAssignments | null>`.
   */
  assignmentForEntry(
    em: EntityManager,
    ledgerEntryId: string,
  ): Promise<JournalEntryAssignments | null> {
    return em.findOne(JournalEntryAssignments, { ledgerEntryId });
  }

  /**
   * Crea create file.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create file conforme al contrato `TransactionFiles`.
   */
  createFile(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a transaction.
       */
      transactionId: string;
      /**
       * Identificador asociado a file.
       */
      fileId: string;
      /**
       * Identificador asociado a category concept.
       */
      categoryConceptId?: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): TransactionFiles {
    return em.create(
      TransactionFiles,
      {
        transactionId: data.transactionId,
        fileId: data.fileId,
        categoryConceptId: data.categoryConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
