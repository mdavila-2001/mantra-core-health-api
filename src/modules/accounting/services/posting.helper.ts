import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { ACCT } from '../accounting.concepts';
import { JournalRepository } from '../repositories';
import { sumCents, fromCents } from './money';

/** Una línea de un asiento generado por un flujo automático (devengo, activo, ...). */
export interface PostingLine {
  /**
   * Identificador asociado a account.
   */
  accountId: string;
  /**
   * Valor de direction mantenido por la instancia.
   */
  direction: 'DEBIT' | 'CREDIT';
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Identificador asociado a cost center.
   */
  costCenterId?: string;
  /**
   * Identificador asociado a profit center.
   */
  profitCenterId?: string;
  /**
   * Identificador asociado a asset.
   */
  assetId?: string;
  /**
   * Identificador asociado a liability.
   */
  liabilityId?: string;
  /**
   * Identificador asociado a subledger account.
   */
  subledgerAccountId?: string;
  /**
   * Valor de memo mantenido por la instancia.
   */
  memo?: string;
}

/** Parámetros de un asiento posteado por un flujo automático. */
export interface PostingRequest {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a transaction type concept.
   */
  transactionTypeConceptId: string;
  /**
   * Valor de transaction number mantenido por la instancia.
   */
  transactionNumber: string;
  /**
   * Valor de transaction date mantenido por la instancia.
   */
  transactionDate: Date;
  /**
   * Identificador asociado a fiscal period.
   */
  fiscalPeriodId?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Valor de reference mantenido por la instancia.
   */
  reference?: string;
  /**
   * Valor de lines mantenido por la instancia.
   */
  lines: PostingLine[];
  /**
   * Identificador asociado a actor user.
   */
  actorUserId: string;
}

/** Resultado del posteo: id de la transacción y de sus líneas (en orden). */
export interface PostingResult {
  /**
   * Identificador asociado a transaction.
   */
  transactionId: string;
  /**
   * Valor de entry ids mantenido por la instancia.
   */
  entryIds: string[];
}

/**
 * Ayudante interno para postear un asiento balanceado dentro de la transacción del
 * llamador. Lo reutilizan los flujos que "incluyen UC-16-01" (devengo, activos,
 * pasivos, clearing). Garantiza la partida doble (débito=crédito) antes de escribir.
 */
@Injectable()
export class PostingHelper {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param journalRepo - Valor de journal repo requerido por la operación.
   */
  constructor(private readonly journalRepo: JournalRepository) {}

  /**
   * Ejecuta la operación post.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param req - Valor de req requerido por la operación.
   * @returns Resultado de post conforme al contrato `Promise<PostingResult>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async post(tx: EntityManager, req: PostingRequest): Promise<PostingResult> {
    const debit = sumCents(
      req.lines.filter((l) => l.direction === 'DEBIT').map((l) => l.amount),
    );
    const credit = sumCents(
      req.lines.filter((l) => l.direction === 'CREDIT').map((l) => l.amount),
    );
    if (debit <= 0 || debit !== credit) {
      throw new PreconditionFailedException(
        'El asiento generado no balancea (debe != haber)',
        {
          debit: fromCents(debit),
          credit: fromCents(credit),
        },
      );
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
          line.direction === 'DEBIT'
            ? ACCT.DIRECTION_DEBIT
            : ACCT.DIRECTION_CREDIT,
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

  /**
   * Crea generate number.
   *
   * @param prefix - Valor de prefix requerido por la operación.
   * @returns Resultado de generate number conforme al contrato `string`.
   */
  generateNumber(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }
}
