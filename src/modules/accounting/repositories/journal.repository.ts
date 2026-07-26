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
  practiceId: string;
  transactionNumber: string;
  transactionTypeConceptId: string;
  transactionDate: Date;
  statusConceptId: string;
  fiscalPeriodId?: string;
  currencyConceptId?: string;
  totalAmount?: string;
  description?: string;
  reference?: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  postedAt?: Date;
  postedByUserId?: string;
  actorUserId?: string;
}

/** Línea del mayor (partida) a insertar. */
export interface CreateLedgerEntryData {
  transactionId: string;
  accountId: string;
  directionConceptId: string;
  amount: string;
  lineNo: number;
  costCenterId?: string;
  currencyConceptId?: string;
  fxRate?: string;
  amountBase?: string;
  memo?: string;
  actorUserId?: string;
}

/** Dimensiones analíticas 1:1 por línea (GOD NODE). */
export interface CreateAssignmentData {
  ledgerEntryId: string;
  costCenterId?: string;
  profitCenterId?: string;
  segmentId?: string;
  functionalAreaId?: string;
  internalOrderId?: string;
  subledgerAccountId?: string;
  businessPartnerId?: string;
  assetId?: string;
  liabilityId?: string;
  companyBankAccountId?: string;
  branchId?: string;
  departmentId?: string;
  employeeId?: string;
  assignmentSourceConceptId?: string;
  derivedByRuleId?: string;
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
  findTransactionById(em: EntityManager, id: string): Promise<JournalTransactions | null> {
    return em.findOne(JournalTransactions, { id });
  }

  findByTransactionNumber(
    em: EntityManager,
    practiceId: string,
    transactionNumber: string,
  ): Promise<JournalTransactions | null> {
    return em.findOne(JournalTransactions, { practiceId, transactionNumber });
  }

  createTransaction(em: EntityManager, data: CreateTransactionData): JournalTransactions {
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

  createLedgerEntry(em: EntityManager, data: CreateLedgerEntryData): LedgerEntries {
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

  createAssignment(em: EntityManager, data: CreateAssignmentData): JournalEntryAssignments {
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

  findLink(
    em: EntityManager,
    sourceTransactionId: string,
    relationTypeConceptId: string,
  ): Promise<AccountingDocumentLinks | null> {
    return em.findOne(AccountingDocumentLinks, { sourceTransactionId, relationTypeConceptId });
  }

  createLink(
    em: EntityManager,
    data: {
      sourceTransactionId: string;
      targetTransactionId: string;
      relationTypeConceptId: string;
      reasonText?: string;
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

  ledgerEntriesForTransaction(em: EntityManager, transactionId: string): Promise<LedgerEntries[]> {
    return em.find(LedgerEntries, { transactionId }, { orderBy: { lineNo: 'asc' } });
  }

  assignmentForEntry(
    em: EntityManager,
    ledgerEntryId: string,
  ): Promise<JournalEntryAssignments | null> {
    return em.findOne(JournalEntryAssignments, { ledgerEntryId });
  }

  createFile(
    em: EntityManager,
    data: {
      transactionId: string;
      fileId: string;
      categoryConceptId?: string;
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
