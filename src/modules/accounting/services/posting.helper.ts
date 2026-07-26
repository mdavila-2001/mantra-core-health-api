import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { ACCT } from '../accounting.concepts';
import { JournalRepository } from '../repositories';
import { sumCents, fromCents } from './money';

/** Una línea de un asiento generado por un flujo automático (devengo, activo, ...). */
export interface PostingLine {
  accountId: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: string;
  costCenterId?: string;
  profitCenterId?: string;
  assetId?: string;
  liabilityId?: string;
  subledgerAccountId?: string;
  memo?: string;
}

/** Parámetros de un asiento posteado por un flujo automático. */
export interface PostingRequest {
  practiceId: string;
  transactionTypeConceptId: string;
  transactionNumber: string;
  transactionDate: Date;
  fiscalPeriodId?: string;
  currencyConceptId?: string;
  description?: string;
  reference?: string;
  lines: PostingLine[];
  actorUserId: string;
}

/** Resultado del posteo: id de la transacción y de sus líneas (en orden). */
export interface PostingResult {
  transactionId: string;
  entryIds: string[];
}

/**
 * Ayudante interno para postear un asiento balanceado dentro de la transacción del
 * llamador. Lo reutilizan los flujos que "incluyen UC-16-01" (devengo, activos,
 * pasivos, clearing). Garantiza la partida doble (débito=crédito) antes de escribir.
 */
@Injectable()
export class PostingHelper {
  constructor(private readonly journalRepo: JournalRepository) {}

  async post(tx: EntityManager, req: PostingRequest): Promise<PostingResult> {
    const debit = sumCents(req.lines.filter((l) => l.direction === 'DEBIT').map((l) => l.amount));
    const credit = sumCents(req.lines.filter((l) => l.direction === 'CREDIT').map((l) => l.amount));
    if (debit <= 0 || debit !== credit) {
      throw new PreconditionFailedException('El asiento generado no balancea (debe != haber)', {
        debit: fromCents(debit),
        credit: fromCents(credit),
      });
    }

    const now = new Date();
    const transaction = this.journalRepo.createTransaction(tx, {
      practiceId: req.practiceId,
      transactionNumber: req.transactionNumber,
      transactionTypeConceptId: req.transactionTypeConceptId,
      transactionDate: req.transactionDate,
      statusConceptId: ACCT.TXN_POSTED,
      fiscalPeriodId: req.fiscalPeriodId,
      currencyConceptId: req.currencyConceptId,
      totalAmount: fromCents(debit),
      description: req.description,
      reference: req.reference,
      postedAt: now,
      postedByUserId: req.actorUserId,
      actorUserId: req.actorUserId,
    });
    await tx.flush();

    const entryIds: string[] = [];
    let lineNo = 1;
    for (const line of req.lines) {
      const entry = this.journalRepo.createLedgerEntry(tx, {
        transactionId: transaction.id,
        accountId: line.accountId,
        directionConceptId:
          line.direction === 'DEBIT' ? ACCT.DIRECTION_DEBIT : ACCT.DIRECTION_CREDIT,
        amount: line.amount,
        lineNo: lineNo++,
        costCenterId: line.costCenterId,
        currencyConceptId: req.currencyConceptId,
        memo: line.memo,
        actorUserId: req.actorUserId,
      });
      await tx.flush();
      this.journalRepo.createAssignment(tx, {
        ledgerEntryId: entry.id,
        costCenterId: line.costCenterId,
        profitCenterId: line.profitCenterId,
        assetId: line.assetId,
        liabilityId: line.liabilityId,
        subledgerAccountId: line.subledgerAccountId,
        assignmentSourceConceptId: req.transactionTypeConceptId,
        actorUserId: req.actorUserId,
      });
      entryIds.push(entry.id);
    }
    return { transactionId: transaction.id, entryIds };
  }

  generateNumber(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }
}
