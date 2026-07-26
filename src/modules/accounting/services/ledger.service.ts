import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  createdBy,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ACCT } from '../accounting.concepts';
import { JournalRepository, AccountsRepository, FiscalRepository } from '../repositories';
import {
  PostJournalDto,
  LedgerLineDto,
  ReverseJournalDto,
  DetermineAccountsDto,
  AttachFileDto,
  CreateAccountDto,
  JournalTransactionResponseDto,
  DeterminedAccountResponseDto,
  AccountResponseDto,
  AccountingStatusDto,
  AccountType,
  NormalBalance,
} from '../dto';
import { sumCents, fromCents } from './money';

const ACCOUNT_TYPE_CONCEPT: Record<AccountType, string> = {
  ASSET: ACCT.ACCOUNT_TYPE_ASSET,
  LIABILITY: ACCT.ACCOUNT_TYPE_LIABILITY,
  EQUITY: ACCT.ACCOUNT_TYPE_EQUITY,
  REVENUE: ACCT.ACCOUNT_TYPE_REVENUE,
  EXPENSE: ACCT.ACCOUNT_TYPE_EXPENSE,
};

const NORMAL_BALANCE_CONCEPT: Record<NormalBalance, string> = {
  DEBIT: ACCT.DIRECTION_DEBIT,
  CREDIT: ACCT.DIRECTION_CREDIT,
};

/**
 * Casos de uso del libro mayor: posteo de asientos por partida doble balanceada
 * (UC-16-01, incluye determinación UC-16-02), reversa espejo (UC-16-03), adjunto
 * de soporte (UC-16-13) y alta de cuenta del plan contable (soporte).
 *
 * Regla central del módulo: un asiento SOLO se postea si la suma de débitos iguala
 * la de créditos (`sum(DEBIT) == sum(CREDIT)`). Si no balancea, el servicio lanza
 * `PreconditionFailedException` → 422 y no persiste nada (todo dentro de una única
 * `em.transactional`).
 */
@Injectable()
export class LedgerService {
  constructor(
    private readonly em: EntityManager,
    private readonly journalRepo: JournalRepository,
    private readonly accountsRepo: AccountsRepository,
    private readonly fiscalRepo: FiscalRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LedgerService.name);
  }

  /** UC-16-01: registra y postea un asiento balanceado con sus líneas y dimensiones. */
  async postJournal(
    dto: PostJournalDto,
    actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    this.logger.info(
      { operation: 'accounting.journal.post', actorId: actor.id, lines: dto.lines.length },
      'Posting journal transaction',
    );

    const { debitCents, creditCents } = this.assertBalanced(dto.lines);

    return this.em.transactional(async (tx) => {
      // UC-16-05 (include): un asiento solo se postea en un periodo ABIERTO.
      if (dto.fiscalPeriodId) {
        const period = await this.fiscalRepo.findPeriodById(tx, dto.fiscalPeriodId);
        if (!period) {
          throw new ResourceNotFoundException('Periodo fiscal no encontrado', {
            fiscalPeriodId: dto.fiscalPeriodId,
          });
        }
        if (period.statusConceptId !== ACCT.PERIOD_OPEN) {
          throw new PreconditionFailedException('El periodo fiscal no está ABIERTO', {
            fiscalPeriodId: dto.fiscalPeriodId,
            status: period.statusConceptId,
          });
        }
      }

      const number = dto.transactionNumber ?? this.generateNumber('JT');
      const clash = await this.journalRepo.findByTransactionNumber(tx, dto.practiceId, number);
      if (clash) {
        throw new ConflictException('El número de asiento ya existe en la práctica', {
          transactionNumber: number,
        });
      }

      const now = new Date();
      const transaction = this.journalRepo.createTransaction(tx, {
        practiceId: dto.practiceId,
        transactionNumber: number,
        transactionTypeConceptId: ACCT.TXN_TYPE_STANDARD,
        transactionDate: new Date(dto.transactionDate),
        statusConceptId: ACCT.TXN_POSTED,
        fiscalPeriodId: dto.fiscalPeriodId,
        currencyConceptId: dto.currencyConceptId,
        totalAmount: fromCents(debitCents),
        description: dto.description,
        reference: dto.reference,
        postedAt: now,
        postedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.writeLines(tx, transaction.id, dto.lines, actor.id, dto.currencyConceptId);

      this.logger.info(
        { operation: 'accounting.journal.post', transactionId: transaction.id, total: fromCents(debitCents) },
        'Journal transaction posted',
      );

      return {
        id: transaction.id,
        transactionNumber: transaction.transactionNumber,
        status: transaction.statusConceptId,
        totalAmount: fromCents(debitCents),
        lineCount: dto.lines.length,
        postedAt: transaction.postedAt ?? null,
      };
    });
  }

  /** UC-16-03: crea una transacción de reversa con líneas espejo (débito<->crédito). */
  async reverseJournal(
    transactionId: string,
    dto: ReverseJournalDto,
    actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    this.logger.info(
      { operation: 'accounting.journal.reverse', transactionId, actorId: actor.id },
      'Reversing journal transaction',
    );

    return this.em.transactional(async (tx) => {
      const original = await this.journalRepo.findTransactionById(tx, transactionId);
      if (!original) {
        throw new ResourceNotFoundException('Asiento no encontrado', { transactionId });
      }
      if (original.statusConceptId !== ACCT.TXN_POSTED) {
        throw new PreconditionFailedException('Solo un asiento POSTEADO puede reversarse', {
          transactionId,
          status: original.statusConceptId,
        });
      }
      const existingLink = await this.journalRepo.findLink(tx, transactionId, ACCT.RELATION_REVERSES);
      if (existingLink) {
        throw new ConflictException('El asiento ya fue reversado', { transactionId });
      }

      const originalLines = await this.journalRepo.ledgerEntriesForTransaction(tx, transactionId);
      const now = new Date();
      const reversal = this.journalRepo.createTransaction(tx, {
        practiceId: original.practiceId,
        transactionNumber: this.generateNumber('REV'),
        transactionTypeConceptId: ACCT.TXN_TYPE_REVERSAL,
        transactionDate: now,
        statusConceptId: ACCT.TXN_POSTED,
        fiscalPeriodId: dto.fiscalPeriodId ?? original.fiscalPeriodId,
        currencyConceptId: original.currencyConceptId,
        totalAmount: original.totalAmount,
        description: `Reversa de ${original.transactionNumber}`,
        reference: original.transactionNumber,
        postedAt: now,
        postedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const line of originalLines) {
        const invertedDirection =
          line.directionConceptId === ACCT.DIRECTION_DEBIT
            ? ACCT.DIRECTION_CREDIT
            : ACCT.DIRECTION_DEBIT;
        const mirror = this.journalRepo.createLedgerEntry(tx, {
          transactionId: reversal.id,
          accountId: line.accountId,
          directionConceptId: invertedDirection,
          amount: line.amount,
          lineNo: line.lineNo,
          costCenterId: line.costCenterId,
          currencyConceptId: line.currencyConceptId,
          fxRate: line.fxRate,
          amountBase: line.amountBase,
          memo: line.memo,
          actorUserId: actor.id,
        });
        await tx.flush();

        const originalAssignment = await this.journalRepo.assignmentForEntry(tx, line.id);
        this.journalRepo.createAssignment(tx, {
          ledgerEntryId: mirror.id,
          costCenterId: originalAssignment?.costCenterId ?? line.costCenterId,
          profitCenterId: originalAssignment?.profitCenterId,
          segmentId: originalAssignment?.segmentId,
          assetId: originalAssignment?.assetId,
          liabilityId: originalAssignment?.liabilityId,
          subledgerAccountId: originalAssignment?.subledgerAccountId,
          assignmentSourceConceptId: ACCT.TXN_TYPE_REVERSAL,
          actorUserId: actor.id,
        });
      }

      this.journalRepo.createLink(tx, {
        sourceTransactionId: transactionId,
        targetTransactionId: reversal.id,
        relationTypeConceptId: ACCT.RELATION_REVERSES,
        reasonText: dto.reason,
        actorUserId: actor.id,
      });

      original.statusConceptId = ACCT.TXN_REVERSED;
      touch(original, actor.id);

      return {
        id: reversal.id,
        transactionNumber: reversal.transactionNumber,
        status: reversal.statusConceptId,
        totalAmount: reversal.totalAmount ?? '0.00',
        lineCount: originalLines.length,
        postedAt: reversal.postedAt ?? null,
      };
    });
  }

  /** UC-16-13: adjunta un documento soporte (ya en object storage) al asiento. */
  async attachFile(
    transactionId: string,
    dto: AttachFileDto,
    actor: AuthenticatedUser,
  ): Promise<AccountingStatusDto> {
    return this.em.transactional(async (tx) => {
      const transaction = await this.journalRepo.findTransactionById(tx, transactionId);
      if (!transaction) {
        throw new ResourceNotFoundException('Asiento no encontrado', { transactionId });
      }
      const file = this.journalRepo.createFile(tx, {
        transactionId,
        fileId: dto.fileId,
        categoryConceptId: dto.categoryConceptId ?? CONCEPTS.FILE_CATEGORY_DOCUMENT,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        { operation: 'accounting.journal.attach', transactionId, fileLinkId: file.id },
        'Document attached to transaction',
      );
      return { ok: true, id: file.id };
    });
  }

  /** UC-16-02: resuelve la cuenta objetivo por regla de determinación vigente. */
  async determineAccounts(dto: DetermineAccountsDto): Promise<DeterminedAccountResponseDto> {
    const em = this.em.fork();
    const rule = await this.accountsRepo.findActiveRule(
      em,
      dto.tenantId,
      dto.postingScenarioConceptId,
      ACCT.RULE_ACTIVE,
    );
    if (!rule) {
      throw new ResourceNotFoundException('No hay regla de determinación vigente para el escenario', {
        tenantId: dto.tenantId,
        postingScenarioConceptId: dto.postingScenarioConceptId,
      });
    }
    return {
      ruleId: rule.id,
      targetAccountId: rule.targetAccountId,
      priority: rule.priority ?? null,
    };
  }

  /** Soporte: da de alta una cuenta del plan contable (necesaria para postear). */
  async createAccount(dto: CreateAccountDto, actor: AuthenticatedUser): Promise<AccountResponseDto> {
    return this.em.transactional(async (tx) => {
      const clash = await this.accountsRepo.findByCode(tx, dto.practiceId, dto.code);
      if (clash) {
        throw new ConflictException('Ya existe una cuenta con ese código en la práctica', {
          code: dto.code,
        });
      }
      const account = this.accountsRepo.create(tx, {
        practiceId: dto.practiceId,
        code: dto.code,
        name: dto.name,
        accountTypeConceptId: ACCOUNT_TYPE_CONCEPT[dto.accountType],
        normalBalanceConceptId: NORMAL_BALANCE_CONCEPT[dto.normalBalance],
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        isConfigurable: true,
        isPostable: dto.isPostable ?? true,
        currencyConceptId: dto.currencyConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: account.id,
        code: account.code,
        name: account.name,
        status: account.statusConceptId,
        isPostable: account.isPostable,
      };
    });
  }

  /**
   * Inserta las N líneas del mayor y su asignación 1:1. Reutilizado por otros
   * servicios (devengo, activos, pasivos, clearing) que producen un asiento.
   */
  async writeLines(
    tx: EntityManager,
    transactionId: string,
    lines: LedgerLineDto[],
    actorUserId: string,
    defaultCurrencyConceptId?: string,
  ): Promise<string[]> {
    const entryIds: string[] = [];
    let lineNo = 1;
    for (const line of lines) {
      const entry = this.journalRepo.createLedgerEntry(tx, {
        transactionId,
        accountId: line.accountId,
        directionConceptId:
          line.direction === 'DEBIT' ? ACCT.DIRECTION_DEBIT : ACCT.DIRECTION_CREDIT,
        amount: line.amount,
        lineNo: lineNo++,
        costCenterId: line.costCenterId,
        currencyConceptId: line.currencyConceptId ?? defaultCurrencyConceptId,
        fxRate: line.fxRate,
        amountBase: line.amountBase,
        memo: line.memo,
        actorUserId,
      });
      await tx.flush();
      this.journalRepo.createAssignment(tx, {
        ledgerEntryId: entry.id,
        costCenterId: line.costCenterId,
        profitCenterId: line.profitCenterId,
        assignmentSourceConceptId: ACCT.TXN_TYPE_STANDARD,
        actorUserId,
      });
      entryIds.push(entry.id);
    }
    return entryIds;
  }

  /** Valida partida doble: suma de débitos == suma de créditos. Lanza 422 si no. */
  private assertBalanced(lines: LedgerLineDto[]): { debitCents: number; creditCents: number } {
    const debitCents = sumCents(lines.filter((l) => l.direction === 'DEBIT').map((l) => l.amount));
    const creditCents = sumCents(lines.filter((l) => l.direction === 'CREDIT').map((l) => l.amount));
    if (debitCents <= 0) {
      throw new PreconditionFailedException('El asiento no tiene importe', {});
    }
    if (debitCents !== creditCents) {
      throw new PreconditionFailedException('El asiento no balancea (debe != haber)', {
        debit: fromCents(debitCents),
        credit: fromCents(creditCents),
      });
    }
    return { debitCents, creditCents };
  }

  private generateNumber(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  }
}
