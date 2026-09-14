import { jest } from '@jest/globals';

// Loose-typed mock factory (evita los typings Mock<never> de @jest/globals bajo el tsconfig raíz).
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LedgerService } from './ledger.service';
import { ACCT } from '../accounting.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
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
    findTransactions: mockFn(() => Promise.resolve([])),
    findEntriesByTransaction: mockFn(() => Promise.resolve([])),
    findEntriesByTransactions: mockFn(() => Promise.resolve([])),
    ledgerEntriesForTransaction: mockFn().mockResolvedValue([]),
    findTransactionById: mockFn(),
    findLink: mockFn().mockResolvedValue(null),
    assignmentForEntry: mockFn().mockResolvedValue(null),
    createLink: mockFn(),
    createFile: mockFn(() => ({ id: 'f1' })),
    findTransactionsByIds: mockFn().mockResolvedValue([]),
    findReversalLinksForTransaction: mockFn().mockResolvedValue([]),
    findPostedEntriesWithAssignments: mockFn().mockResolvedValue([]),
  };
  const accountsRepo = {
    findByCode: mockFn().mockResolvedValue(null),
    create: mockFn(() => ({
      id: 'a1',
      code: 'C',
      name: 'N',
      statusConceptId: 's',
      isPostable: true,
    })),
    findActiveRule: mockFn(),
  };
  const fiscalRepo = {
    findPeriodById: mockFn().mockResolvedValue({
      id: 'fp1',
      statusConceptId: ACCT.PERIOD_OPEN,
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  // Carril 18: por defecto, sin prácticas activas — los tests con actor
  // SECURITY_ADMIN/ACCOUNTING_APPROVER nunca la consultan (short-circuit en
  // `assertPractitionerOwnsPractice`); los tests de PRACTITIONER la fijan.
  const practiceTenantLookup = {
    findActivePracticeIdsForPractitioner: mockFn().mockResolvedValue([]),
  };
  const service = new LedgerService(
    em as any,
    journalRepo,
    accountsRepo as any,
    fiscalRepo as any,
    auditTrail as any,
    practiceTenantLookup as any,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    journalRepo,
    accountsRepo,
    fiscalRepo,
    auditTrail,
    practiceTenantLookup,
  };
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
      await expect(
        d.service.postJournal(unbalanced as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.journalRepo.createTransaction).not.toHaveBeenCalled();
    });

    it('rechaza (409) un número de asiento duplicado', async () => {
      const d = build();
      d.journalRepo.findByTransactionNumber.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.postJournal(
          { ...balanced, transactionNumber: 'JT-1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza (422) postear en un periodo BLOQUEADO', async () => {
      const d = build();
      d.fiscalRepo.findPeriodById.mockResolvedValue({
        id: 'fp1',
        statusConceptId: ACCT.PERIOD_LOCKED,
      });
      await expect(
        d.service.postJournal(
          { ...balanced, fiscalPeriodId: 'fp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('reverseJournal (UC-16-03)', () => {
    it('lanza 404 si el asiento no existe', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue(null);
      await expect(
        d.service.reverseJournal('x', {}, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza reversar un asiento no POSTEADO', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't1',
        statusConceptId: ACCT.TXN_DRAFT,
      });
      await expect(
        d.service.reverseJournal('t1', {}, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza (409) si ya fue reversado', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't1',
        statusConceptId: ACCT.TXN_POSTED,
      });
      d.journalRepo.findLink.mockResolvedValue({ id: 'link' });
      await expect(
        d.service.reverseJournal('t1', {}, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('createAccount (soporte)', () => {
    it('rechaza (409) un código duplicado', async () => {
      const d = build();
      d.accountsRepo.findByCode.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.createAccount(
          {
            practiceId: 'p1',
            code: 'C',
            name: 'N',
            accountType: 'ASSET',
            normalBalance: 'DEBIT',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('crea la cuenta cuando el código es único', async () => {
      const d = build();
      const res = await d.service.createAccount(
        {
          practiceId: 'p1',
          code: 'C',
          name: 'N',
          accountType: 'ASSET',
          normalBalance: 'DEBIT',
        } as any,
        actor,
      );
      expect(res.id).toBe('a1');
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('máquina de estados del asiento (ALOVIDA C-17)', () => {
    const balanced = {
      practiceId: 'p1',
      transactionDate: '2026-01-31',
      lines: [
        { accountId: 'acc-d', direction: 'DEBIT', amount: '100.00' },
        { accountId: 'acc-c', direction: 'CREDIT', amount: '100.00' },
      ],
    };
    const balancedEntries = [
      { directionConceptId: ACCT.DIRECTION_DEBIT, amount: '100.00' },
      { directionConceptId: ACCT.DIRECTION_CREDIT, amount: '100.00' },
    ];

    it('createDraft crea el asiento en DRAFT sin postear (postedAt nulo)', async () => {
      const d = build();
      const res = await d.service.createDraft(balanced as any, actor);
      expect(res.status).toBe(ACCT.TXN_DRAFT);
      expect(res.postedAt).toBeNull();
      expect(d.journalRepo.createLedgerEntry).toHaveBeenCalledTimes(2);
    });

    it('recorre DRAFT→AUTO_CLASSIFIED→PENDING_REVIEW→APPROVED→POSTED→REVERSED', async () => {
      const d = build();
      const draft = await d.service.createDraft(balanced as any, actor);
      expect(draft.status).toBe(ACCT.TXN_DRAFT);

      const txn: any = {
        id: 't1',
        transactionNumber: 'JT-1',
        statusConceptId: ACCT.TXN_DRAFT,
      };
      d.journalRepo.findTransactionById.mockResolvedValue(txn);

      expect((await d.service.classify('t1', {}, actor)).status).toBe(
        ACCT.TXN_AUTO_CLASSIFIED,
      );
      expect((await d.service.submitForReview('t1', {}, actor)).status).toBe(
        ACCT.TXN_PENDING_REVIEW,
      );
      const approved = await d.service.approve('t1', {}, actor);
      expect(approved.status).toBe(ACCT.TXN_APPROVED);
      expect(txn.approvedByUserId).toBe('admin-1');
      expect(txn.approvedAt).toBeInstanceOf(Date);

      d.journalRepo.ledgerEntriesForTransaction.mockResolvedValue(
        balancedEntries,
      );
      const posted = await d.service.post('t1', {}, actor);
      expect(posted.status).toBe(ACCT.TXN_POSTED);
      expect(txn.postedAt).toBeInstanceOf(Date);
      expect(txn.postedByUserId).toBe('admin-1');

      // reversa desde POSTED
      d.journalRepo.ledgerEntriesForTransaction.mockResolvedValue([]);
      await d.service.reverseJournal('t1', {}, actor);
      expect(txn.statusConceptId).toBe(ACCT.TXN_REVERSED);
    });

    it('assertTransition rechaza saltos inválidos y acepta los válidos', () => {
      const d = build();
      expect(() =>
        d.service.assertTransition(ACCT.TXN_DRAFT, ACCT.TXN_POSTED),
      ).toThrow(PreconditionFailedException);
      expect(() =>
        d.service.assertTransition(ACCT.TXN_DRAFT, ACCT.TXN_AUTO_CLASSIFIED),
      ).not.toThrow();
    });

    it('post solo transita desde APPROVED (rechaza otros estados)', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't1',
        statusConceptId: ACCT.TXN_PENDING_REVIEW,
      });
      await expect(d.service.post('t1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('post rechaza (422) si las líneas persistidas no balancean', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't1',
        statusConceptId: ACCT.TXN_APPROVED,
      });
      d.journalRepo.ledgerEntriesForTransaction.mockResolvedValue([
        { directionConceptId: ACCT.DIRECTION_DEBIT, amount: '100.00' },
        { directionConceptId: ACCT.DIRECTION_CREDIT, amount: '90.00' },
      ]);
      await expect(d.service.post('t1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('post rechaza (422) en un periodo BLOQUEADO', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't1',
        statusConceptId: ACCT.TXN_APPROVED,
        fiscalPeriodId: 'fp1',
      });
      d.journalRepo.ledgerEntriesForTransaction.mockResolvedValue(
        balancedEntries,
      );
      d.fiscalRepo.findPeriodById.mockResolvedValue({
        id: 'fp1',
        statusConceptId: ACCT.PERIOD_LOCKED,
      });
      await expect(d.service.post('t1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('approve exige un rol con autoridad de aprobación', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't1',
        statusConceptId: ACCT.TXN_PENDING_REVIEW,
      });
      const noRole = { id: 'u2', roles: [] } as any;
      await expect(d.service.approve('t1', {}, noRole)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('lanza 404 al transicionar un asiento inexistente', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue(null);
      await expect(
        d.service.classify('nope', {}, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('Carril 18 — auto-servicio del PRACTITIONER en el asiento', () => {
    const practitioner = {
      id: 'doc-1',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'hpp-1',
    } as any;
    const balanced = {
      practiceId: 'p1',
      transactionDate: '2026-01-31',
      lines: [
        { accountId: 'acc-d', direction: 'DEBIT', amount: '100.00' },
        { accountId: 'acc-c', direction: 'CREDIT', amount: '100.00' },
      ],
    };

    it('createDraft rechaza (422) a un profesional sin vinculación activa con esa práctica', async () => {
      const d = build();
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['other-practice'],
      );
      await expect(
        d.service.createDraft(balanced as any, practitioner),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(
        d.practiceTenantLookup.findActivePracticeIdsForPractitioner,
      ).toHaveBeenCalledWith('hpp-1');
    });

    it('createDraft acepta a un profesional vinculado a la práctica, y persiste sourceDocumentType/Id', async () => {
      const d = build();
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['p1'],
      );
      const res = await d.service.createDraft(
        {
          ...balanced,
          sourceDocumentType: 'INVOICE',
          sourceDocumentId: 'inv-1',
        } as any,
        practitioner,
      );
      expect(res.status).toBe(ACCT.TXN_DRAFT);
      expect(d.journalRepo.createTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sourceDocumentType: 'INVOICE',
          sourceDocumentId: 'inv-1',
        }),
      );
    });

    it('createDraft rechaza (422) a un PRACTITIONER sin perfil profesional en el JWT', async () => {
      const d = build();
      const noProfile = { id: 'doc-2', roles: ['PRACTITIONER'] } as any;
      await expect(
        d.service.createDraft(balanced as any, noProfile),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(
        d.practiceTenantLookup.findActivePracticeIdsForPractitioner,
      ).not.toHaveBeenCalled();
    });

    it('SECURITY_ADMIN nunca consulta la pertenencia del profesional (no-op)', async () => {
      const d = build();
      await d.service.createDraft(balanced as any, actor);
      expect(
        d.practiceTenantLookup.findActivePracticeIdsForPractitioner,
      ).not.toHaveBeenCalled();
    });

    it('classify rechaza (422) si el asiento es de una práctica ajena al profesional', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't1',
        statusConceptId: ACCT.TXN_DRAFT,
        practiceId: 'other-practice',
      });
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['p1'],
      );
      await expect(
        d.service.classify('t1', {}, practitioner),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('attachFile rechaza (422) si el asiento es de una práctica ajena al profesional', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't1',
        practiceId: 'other-practice',
      });
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['p1'],
      );
      await expect(
        d.service.attachFile('t1', { fileId: 'f1' } as any, practitioner),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('determineAccounts (UC-16-02)', () => {
    it('lanza 404 si no hay regla vigente', async () => {
      const d = build();
      d.accountsRepo.findActiveRule.mockResolvedValue(null);
      await expect(
        d.service.determineAccounts({
          tenantId: 't',
          postingScenarioConceptId: 's',
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('devuelve la cuenta objetivo de la regla', async () => {
      const d = build();
      d.accountsRepo.findActiveRule.mockResolvedValue({
        id: 'r1',
        targetAccountId: 'acc9',
        priority: 10,
      });
      const res = await d.service.determineAccounts({
        tenantId: 't',
        postingScenarioConceptId: 's',
      });
      expect(res).toEqual({
        ruleId: 'r1',
        targetAccountId: 'acc9',
        priority: 10,
      });
    });
  });
});
