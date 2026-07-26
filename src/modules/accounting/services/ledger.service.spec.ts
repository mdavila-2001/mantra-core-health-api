import { jest } from '@jest/globals';

// Loose-typed mock factory (evita los typings Mock<never> de @jest/globals bajo el tsconfig raíz).
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LedgerService } from './ledger.service';
import { ACCT } from '../accounting.concepts';
import { ConflictException, PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const journalRepo = {
    findByTransactionNumber: mockFn().mockResolvedValue(null),
    createTransaction: mockFn((_em: any, d: any) => ({
      id: 't1',
      transactionNumber: d.transactionNumber,
      statusConceptId: d.statusConceptId,
      postedAt: d.postedAt ?? null,
      totalAmount: d.totalAmount,
      practiceId: d.practiceId,
    })),
    createLedgerEntry: mockFn(() => ({ id: `e${Math.random()}` })),
    createAssignment: mockFn(),
    ledgerEntriesForTransaction: mockFn().mockResolvedValue([]),
    findTransactionById: mockFn(),
    findLink: mockFn().mockResolvedValue(null),
    assignmentForEntry: mockFn().mockResolvedValue(null),
    createLink: mockFn(),
    createFile: mockFn(() => ({ id: 'f1' })),
  };
  const accountsRepo = {
    findByCode: mockFn().mockResolvedValue(null),
    create: mockFn(() => ({ id: 'a1', code: 'C', name: 'N', statusConceptId: 's', isPostable: true })),
    findActiveRule: mockFn(),
  };
  const fiscalRepo = {
    findPeriodById: mockFn().mockResolvedValue({ id: 'fp1', statusConceptId: ACCT.PERIOD_OPEN }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new LedgerService(
    em as any,
    journalRepo as any,
    accountsRepo as any,
    fiscalRepo as any,
    logger as any,
  );
  return { service, tx, em, journalRepo, accountsRepo, fiscalRepo };
}

describe('LedgerService', () => {
  describe('postJournal (UC-16-01)', () => {
    const balanced = {
      practiceId: 'p1',
      transactionDate: '2026-01-31',
      lines: [
        { accountId: 'acc-d', direction: 'DEBIT', amount: '100.00' },
        { accountId: 'acc-c', direction: 'CREDIT', amount: '100.00' },
      ],
    };

    it('postea un asiento balanceado y devuelve el total', async () => {
      const d = build();
      const res = await d.service.postJournal(balanced as any, actor);
      expect(res.status).toBe(ACCT.TXN_POSTED);
      expect(res.totalAmount).toBe('100.00');
      expect(res.lineCount).toBe(2);
      expect(d.journalRepo.createLedgerEntry).toHaveBeenCalledTimes(2);
      expect(d.journalRepo.createAssignment).toHaveBeenCalledTimes(2);
    });

    it('rechaza (422) un asiento que no balancea', async () => {
      const d = build();
      const unbalanced = {
        practiceId: 'p1',
        transactionDate: '2026-01-31',
        lines: [
          { accountId: 'acc-d', direction: 'DEBIT', amount: '100.00' },
          { accountId: 'acc-c', direction: 'CREDIT', amount: '90.00' },
        ],
      };
      await expect(d.service.postJournal(unbalanced as any, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.journalRepo.createTransaction).not.toHaveBeenCalled();
    });

    it('rechaza (409) un número de asiento duplicado', async () => {
      const d = build();
      d.journalRepo.findByTransactionNumber.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.postJournal({ ...balanced, transactionNumber: 'JT-1' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza (422) postear en un periodo BLOQUEADO', async () => {
      const d = build();
      d.fiscalRepo.findPeriodById.mockResolvedValue({ id: 'fp1', statusConceptId: ACCT.PERIOD_LOCKED });
      await expect(
        d.service.postJournal({ ...balanced, fiscalPeriodId: 'fp1' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('reverseJournal (UC-16-03)', () => {
    it('lanza 404 si el asiento no existe', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue(null);
      await expect(d.service.reverseJournal('x', {}, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rechaza reversar un asiento no POSTEADO', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({ id: 't1', statusConceptId: ACCT.TXN_DRAFT });
      await expect(d.service.reverseJournal('t1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('rechaza (409) si ya fue reversado', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({ id: 't1', statusConceptId: ACCT.TXN_POSTED });
      d.journalRepo.findLink.mockResolvedValue({ id: 'link' });
      await expect(d.service.reverseJournal('t1', {}, actor)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createAccount (soporte)', () => {
    it('rechaza (409) un código duplicado', async () => {
      const d = build();
      d.accountsRepo.findByCode.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.createAccount(
          { practiceId: 'p1', code: 'C', name: 'N', accountType: 'ASSET', normalBalance: 'DEBIT' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('crea la cuenta cuando el código es único', async () => {
      const d = build();
      const res = await d.service.createAccount(
        { practiceId: 'p1', code: 'C', name: 'N', accountType: 'ASSET', normalBalance: 'DEBIT' } as any,
        actor,
      );
      expect(res.id).toBe('a1');
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('determineAccounts (UC-16-02)', () => {
    it('lanza 404 si no hay regla vigente', async () => {
      const d = build();
      d.accountsRepo.findActiveRule.mockResolvedValue(null);
      await expect(
        d.service.determineAccounts({ tenantId: 't', postingScenarioConceptId: 's' } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('devuelve la cuenta objetivo de la regla', async () => {
      const d = build();
      d.accountsRepo.findActiveRule.mockResolvedValue({ id: 'r1', targetAccountId: 'acc9', priority: 10 });
      const res = await d.service.determineAccounts({ tenantId: 't', postingScenarioConceptId: 's' } as any);
      expect(res).toEqual({ ruleId: 'r1', targetAccountId: 'acc9', priority: 10 });
    });
  });
});
