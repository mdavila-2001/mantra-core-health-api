import { jest } from '@jest/globals';

// Loose-typed mock factory (evita los typings Mock<never> de @jest/globals bajo el tsconfig raíz).
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ACCT } from '../accounting.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { AccountingErrorReason } from '../accounting.error-reasons';
import { LedgerService } from './ledger.service';
import {
  TENANT_A,
  PRACTICE_TENANTS,
  TENANT_B,
  buildScope,
  expectScopeNotFound,
  inTenant,
} from './accounting-scope.testing';

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
      fiscalYearId: 'fy1',
      statusConceptId: ACCT.PERIOD_OPEN,
    }),
    findYearById: mockFn().mockResolvedValue({ id: 'fy1', practiceId: 'p1' }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  // Carril 18: por defecto, sin prácticas activas — los tests con actor
  // SECURITY_ADMIN/ACCOUNTING_APPROVER nunca la consultan (short-circuit en
  // `assertPractitionerOwnsPractice`); los tests de PRACTITIONER la fijan.
  const practiceTenantLookup = {
    findActivePracticeIdsForPractitioner: mockFn().mockResolvedValue([]),
    // El tenant de cada práctica, como lo ve la política de alcance.
    findTenantOfPractice: mockFn((id: string) =>
      Promise.resolve(PRACTICE_TENANTS[id] ?? null),
    ),
  };
  // La política de alcance real sobre los mismos dobles de asientos y periodos
  // que ve el servicio; cuentas, centros y prácticas son de `p1` (tenant A).
  const { scope, doubles } = buildScope({ journalRepo, fiscalRepo });
  const service = inTenant(
    new LedgerService(
      em as any,
      journalRepo as any,
      accountsRepo as any,
      auditTrail as any,
      practiceTenantLookup as any,
      scope,
      logger as any,
    ),
  );
  return {
    scope,
    doubles,
    logger,
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
        fiscalYearId: 'fy1',
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
        practiceId: 'p1',
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
        practiceId: 'p1',
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
        practiceId: 'p1',
        transactionNumber: 'JT-1',
        statusConceptId: ACCT.TXN_DRAFT,
        // MCH-018: la auto-clasificación exige una regla aplicable; el camino
        // canónico lo es porque el borrador declara su documento origen.
        sourceDocumentType: 'INVOICE',
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

    // MCH-018: `classify` sólo cambiaba el estado, así que el asiento quedaba
    // marcado como auto-clasificado sin que ninguna regla se hubiera evaluado.
    describe('MCH-018 · la auto-clasificación exige reglas', () => {
      function draft(d: ReturnType<typeof build>, origin?: string) {
        const txn: any = {
          id: 't1',
          practiceId: 'p1',
          transactionNumber: 'JT-1',
          statusConceptId: ACCT.TXN_DRAFT,
          sourceDocumentType: origin,
        };
        d.journalRepo.findTransactionById.mockResolvedValue(txn);
        return txn;
      }

      it('AC01 · sin regla aplicable no se marca auto-clasificado', async () => {
        const d = build();
        const txn = draft(d, 'ALGO_QUE_NINGUNA_REGLA_CUBRE');

        const res = await d.service.classify('t1', {}, actor);

        expect(res.status).toBe(ACCT.TXN_PENDING_REVIEW);
        expect(txn.statusConceptId).toBe(ACCT.TXN_PENDING_REVIEW);
        expect(res.classification?.decision).toBe('SIN_REGLA');
        expect(res.classification?.ruleId).toBeUndefined();
      });

      it('AC02 · un borrador sin documento origen va a revisión sin inventar tipo', async () => {
        const d = build();
        const txn = draft(d);

        const res = await d.service.classify('t1', {}, actor);

        expect(res.status).toBe(ACCT.TXN_PENDING_REVIEW);
        expect(txn.transactionTypeConceptId).toBeUndefined();
        expect(res.classification?.transactionTypeConceptId).toBeUndefined();
      });

      it('con regla aplicable clasifica, imputa el tipo y deja la evidencia', async () => {
        const d = build();
        const txn = draft(d, 'GATEWAY_SETTLEMENT');

        const res = await d.service.classify('t1', {}, actor);

        expect(res.status).toBe(ACCT.TXN_AUTO_CLASSIFIED);
        expect(txn.transactionTypeConceptId).toBe(ACCT.TXN_TYPE_CLEARING);
        expect(res.classification).toMatchObject({
          decision: 'CLASIFICADA',
          ruleId: 'GATEWAY_SETTLEMENT',
          rulesetVersion: 'acct-classif-v1',
        });
      });

      it('sella en la cadena WORM qué autoridad clasificó', async () => {
        const classified = build();
        draft(classified, 'INVOICE');
        await classified.service.classify('t1', {}, actor);
        expect(classified.auditTrail.record).toHaveBeenCalledWith(
          expect.anything(),
          actor,
          expect.objectContaining({ action: 'JOURNAL_AUTO_CLASSIFIED' }),
        );

        const toRevision = build();
        draft(toRevision, undefined);
        await toRevision.service.classify('t1', {}, actor);
        expect(toRevision.auditTrail.record).toHaveBeenCalledWith(
          expect.anything(),
          actor,
          expect.objectContaining({ action: 'JOURNAL_CLASSIFICATION_REVIEW' }),
        );
      });

      it('no se puede saltar la clasificación enviando el borrador a revisión', async () => {
        const d = build();
        draft(d, 'INVOICE');

        await expect(
          d.service.submitForReview('t1', {}, actor),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
      });
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
        practiceId: 'p1',
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
        practiceId: 'p1',
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
        practiceId: 'p1',
        statusConceptId: ACCT.TXN_APPROVED,
        fiscalPeriodId: 'fp1',
      });
      d.journalRepo.ledgerEntriesForTransaction.mockResolvedValue(
        balancedEntries,
      );
      d.fiscalRepo.findPeriodById.mockResolvedValue({
        id: 'fp1',
        fiscalYearId: 'fy1',
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
        practiceId: 'p1',
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

    /**
     * `SECURITY_ADMIN`/`ACCOUNTING_APPROVER` acotado a otro tenant en
     * `scopedRoles` no salta la vinculación: el rol se mide en el tenant de
     * la práctica (#1241).
     */
    it.each(['SECURITY_ADMIN', 'ACCOUNTING_APPROVER'])(
      'createDraft: %s acotado a otro tenant no salta la vinculación (422); en el de la práctica o global, sí',
      async (role) => {
        const acotado = (tenant: string) =>
          ({
            ...practitioner,
            roles: ['PRACTITIONER', role],
            scopedRoles: { [tenant]: [role] },
          }) as any;

        const foreign = build();
        await expect(
          foreign.service.createDraft(balanced as any, acotado(TENANT_B)),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(foreign.journalRepo.createTransaction).not.toHaveBeenCalled();

        const own = build();
        await expect(
          own.service.createDraft(balanced as any, acotado(TENANT_A)),
        ).resolves.toMatchObject({ status: ACCT.TXN_DRAFT });

        const global = build();
        await expect(
          global.service.createDraft(balanced as any, {
            ...practitioner,
            roles: ['PRACTITIONER', role],
          }),
        ).resolves.toMatchObject({ status: ACCT.TXN_DRAFT });
      },
    );

    it('classify rechaza (422) si el asiento es de una práctica ajena al profesional', async () => {
      const d = build();
      d.journalRepo.findTransactionById.mockResolvedValue({
        id: 't1',
        statusConceptId: ACCT.TXN_DRAFT,
        practiceId: 'p2',
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
        practiceId: 'p2',
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

  describe('alcance de tenant (ACC-01)', () => {
    const lines = [
      { accountId: 'acc-d', direction: 'DEBIT', amount: '100.00' },
      { accountId: 'acc-c', direction: 'CREDIT', amount: '100.00' },
    ];
    const entry = {
      practiceId: 'p1',
      transactionDate: '2026-01-31',
      lines,
    } as any;

    /** Ningún asiento, línea ni cuenta se escribe. */
    function expectNothingWritten(d: ReturnType<typeof build>) {
      expect(d.journalRepo.findByTransactionNumber).not.toHaveBeenCalled();
      expect(d.journalRepo.createTransaction).not.toHaveBeenCalled();
      expect(d.journalRepo.createLedgerEntry).not.toHaveBeenCalled();
      expect(d.journalRepo.createAssignment).not.toHaveBeenCalled();
      expect(d.auditTrail.record).not.toHaveBeenCalled();
    }

    /** Hace que esas cuentas sean del plan de la práctica `practiceId`. */
    function accountsOf(
      d: ReturnType<typeof build>,
      owners: Record<string, string>,
    ) {
      d.doubles.accountsRepo.findByIds.mockImplementation(
        async (_em: any, ids: string[]) =>
          ids
            .filter((id) => owners[id] !== undefined)
            .map((id) => ({ id, practiceId: owners[id] })),
      );
    }

    describe.each([
      ['postJournal', 'postJournal'],
      ['createDraft', 'createDraft'],
    ] as const)('%s', (_label, method) => {
      it('una práctica de otra organización responde como inexistente', async () => {
        const foreign = build();
        const absent = build();

        const a = await expectScopeNotFound(
          foreign.service[method]({ ...entry, practiceId: 'p-b' }, actor),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );
        const b = await expectScopeNotFound(
          absent.service[method]({ ...entry, practiceId: 'no-existe' }, actor),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );

        expect(a.getResponse()).toEqual(b.getResponse());
        expectNothingWritten(foreign);
      });

      it.each([
        ['de otra organización', 'p-b'],
        ['de otra práctica de la misma organización', 'p2'],
      ])('una cuenta %s responde como inexistente', async (_c, owner) => {
        const d = build();
        accountsOf(d, { 'acc-d': 'p1', 'acc-c': owner });

        await expectScopeNotFound(
          d.service[method](entry, actor),
          AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
        );
        expectNothingWritten(d);
      });

      it('una cuenta inexistente responde exactamente igual que una ajena', async () => {
        const foreign = build();
        accountsOf(foreign, { 'acc-d': 'p1', 'acc-c': 'p-b' });
        const absent = build();
        accountsOf(absent, { 'acc-d': 'p1' });

        const a = await expectScopeNotFound(
          foreign.service[method](entry, actor),
          AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
        );
        const b = await expectScopeNotFound(
          absent.service[method](entry, actor),
          AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
        );
        expect(a.getResponse()).toEqual(b.getResponse());
      });

      it.each([
        ['otra organización', 'p-b'],
        ['otra práctica de la misma organización', 'p2'],
      ])('un periodo de %s responde como inexistente', async (_c, owner) => {
        const d = build();
        d.fiscalRepo.findYearById.mockResolvedValue({
          id: 'fy1',
          practiceId: owner,
        });

        await expectScopeNotFound(
          d.service[method]({ ...entry, fiscalPeriodId: 'fp1' }, actor),
          AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
        );
        expectNothingWritten(d);
      });

      it('un centro de costo de otra práctica responde como inexistente', async () => {
        const d = build();
        d.doubles.controllingRepo.findCostCentersByIds.mockResolvedValue([
          { id: 'cc1', practiceId: 'p2' },
        ]);

        await expectScopeNotFound(
          d.service[method](
            {
              ...entry,
              lines: [{ ...lines[0], costCenterId: 'cc1' }, lines[1]],
            },
            actor,
          ),
          AccountingErrorReason.COST_CENTER_NOT_FOUND,
        );
        expectNothingWritten(d);
      });

      it('un centro de beneficio de otra organización responde como inexistente', async () => {
        const d = build();
        d.doubles.controllingRepo.findProfitCentersByIds.mockResolvedValue([
          { id: 'pc1', tenantId: TENANT_B },
        ]);

        await expectScopeNotFound(
          d.service[method](
            {
              ...entry,
              lines: [{ ...lines[0], profitCenterId: 'pc1' }, lines[1]],
            },
            actor,
          ),
          AccountingErrorReason.PROFIT_CENTER_NOT_FOUND,
        );
        expectNothingWritten(d);
      });

      it('con todo propio escribe, y las cuentas se contrastan contra la práctica del asiento', async () => {
        const d = build();
        accountsOf(d, { 'acc-d': 'p1', 'acc-c': 'p1' });

        await d.service[method](entry, actor);

        expect(d.doubles.accountsRepo.findByIds).toHaveBeenCalledWith(d.tx, [
          'acc-d',
          'acc-c',
        ]);
        expect(d.journalRepo.createLedgerEntry).toHaveBeenCalledTimes(2);
      });

      it('sin tenant en el contexto no escribe (412)', async () => {
        const d = build();
        const outside = new LedgerService(
          d.em as any,
          d.journalRepo as any,
          {} as any,
          d.auditTrail as any,
          d.practiceTenantLookup as any,
          d.scope,
          d.logger as any,
        );

        await expect(outside[method](entry, actor)).rejects.toBeInstanceOf(
          PreconditionFailedException,
        );
        expectNothingWritten(d);
      });
    });

    describe('transiciones y adjuntos sobre un asiento ajeno', () => {
      const foreignTxn = (extra: object = {}) => ({
        id: 't1',
        practiceId: 'p-b',
        transactionNumber: 'JT-9',
        statusConceptId: ACCT.TXN_DRAFT,
        sourceDocumentType: 'INVOICE',
        ...extra,
      });

      const commands: [
        string,
        string,
        (d: ReturnType<typeof build>) => Promise<unknown>,
      ][] = [
        [
          'classify',
          ACCT.TXN_DRAFT,
          (d) => d.service.classify('t1', {}, actor),
        ],
        [
          'submitForReview',
          ACCT.TXN_AUTO_CLASSIFIED,
          (d) => d.service.submitForReview('t1', {}, actor),
        ],
        [
          'approve',
          ACCT.TXN_PENDING_REVIEW,
          (d) => d.service.approve('t1', {}, actor),
        ],
        ['post', ACCT.TXN_APPROVED, (d) => d.service.post('t1', {}, actor)],
        [
          'reverseJournal',
          ACCT.TXN_POSTED,
          (d) => d.service.reverseJournal('t1', {}, actor),
        ],
        [
          'attachFile',
          ACCT.TXN_DRAFT,
          (d) => d.service.attachFile('t1', { fileId: 'f1' } as any, actor),
        ],
      ];

      it.each(commands)(
        '%s: un asiento de otra organización responde como inexistente y no se toca',
        async (_name, status, run) => {
          const foreign = build();
          const txn = foreignTxn({ statusConceptId: status });
          foreign.journalRepo.findTransactionById.mockResolvedValue(txn);
          const absent = build();
          absent.journalRepo.findTransactionById.mockResolvedValue(null);

          const a = await expectScopeNotFound(
            run(foreign),
            AccountingErrorReason.LEDGER_TRANSACTION_NOT_FOUND,
          );
          const b = await expectScopeNotFound(
            run(absent),
            AccountingErrorReason.LEDGER_TRANSACTION_NOT_FOUND,
          );

          expect(a.getResponse()).toEqual(b.getResponse());
          expect(txn.statusConceptId).toBe(status);
          expect(foreign.journalRepo.createTransaction).not.toHaveBeenCalled();
          expect(foreign.journalRepo.createFile).not.toHaveBeenCalled();
          expect(foreign.journalRepo.createLink).not.toHaveBeenCalled();
          expect(foreign.auditTrail.record).not.toHaveBeenCalled();
        },
      );

      it('un asiento ajeno ya reversado no delata su estado (404, no 409)', async () => {
        const d = build();
        d.journalRepo.findTransactionById.mockResolvedValue(
          foreignTxn({ statusConceptId: ACCT.TXN_POSTED }),
        );
        d.journalRepo.findLink.mockResolvedValue({ id: 'link' });

        await expectScopeNotFound(
          d.service.reverseJournal('t1', {}, actor),
          AccountingErrorReason.LEDGER_TRANSACTION_NOT_FOUND,
        );
      });

      it('para un profesional, el asiento ajeno responde 404 antes del chequeo de vinculación (que nombraría la práctica)', async () => {
        const d = build();
        d.journalRepo.findTransactionById.mockResolvedValue(foreignTxn());
        const practitioner = {
          id: 'doc-1',
          roles: ['PRACTITIONER'],
          practitionerProfileId: 'hpp-1',
        } as any;

        await expectScopeNotFound(
          d.service.classify('t1', {}, practitioner),
          AccountingErrorReason.LEDGER_TRANSACTION_NOT_FOUND,
        );
        expect(
          d.practiceTenantLookup.findActivePracticeIdsForPractitioner,
        ).not.toHaveBeenCalled();
      });

      it.each(['p-b', 'p2'])(
        'post: el periodo del cuerpo de la práctica %s no es del asiento y responde como inexistente',
        async (owner) => {
          const d = build();
          const txn = {
            id: 't1',
            practiceId: 'p1',
            statusConceptId: ACCT.TXN_APPROVED,
          };
          d.journalRepo.findTransactionById.mockResolvedValue(txn);
          d.fiscalRepo.findYearById.mockResolvedValue({
            id: 'fy1',
            practiceId: owner,
          });

          await expectScopeNotFound(
            d.service.post('t1', { fiscalPeriodId: 'fp-x' }, actor),
            AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
          );
          expect(txn.statusConceptId).toBe(ACCT.TXN_APPROVED);
          expect((txn as any).fiscalPeriodId).toBeUndefined();
        },
      );

      it('post: el periodo propio del cuerpo se enlaza al asiento', async () => {
        const d = build();
        const txn: any = {
          id: 't1',
          practiceId: 'p1',
          statusConceptId: ACCT.TXN_APPROVED,
        };
        d.journalRepo.findTransactionById.mockResolvedValue(txn);
        d.journalRepo.ledgerEntriesForTransaction.mockResolvedValue([
          { directionConceptId: ACCT.DIRECTION_DEBIT, amount: '100.00' },
          { directionConceptId: ACCT.DIRECTION_CREDIT, amount: '100.00' },
        ]);

        await d.service.post('t1', { fiscalPeriodId: 'fp1' }, actor);

        expect(txn.fiscalPeriodId).toBe('fp1');
        expect(txn.statusConceptId).toBe(ACCT.TXN_POSTED);
      });

      it('reverseJournal: el periodo del cuerpo de otra práctica responde como inexistente y no reversa', async () => {
        const d = build();
        const original = {
          id: 't1',
          practiceId: 'p1',
          statusConceptId: ACCT.TXN_POSTED,
        };
        d.journalRepo.findTransactionById.mockResolvedValue(original);
        d.fiscalRepo.findYearById.mockResolvedValue({
          id: 'fy1',
          practiceId: 'p-b',
        });

        await expectScopeNotFound(
          d.service.reverseJournal('t1', { fiscalPeriodId: 'fp-x' }, actor),
          AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
        );
        expect(original.statusConceptId).toBe(ACCT.TXN_POSTED);
        expect(d.journalRepo.createTransaction).not.toHaveBeenCalled();
      });
    });

    describe('createAccount', () => {
      const dto = {
        code: 'C',
        name: 'N',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
      } as any;

      it('una práctica de otra organización responde como inexistente y no crea la cuenta', async () => {
        const foreign = build();
        const absent = build();

        const a = await expectScopeNotFound(
          foreign.service.createAccount({ ...dto, practiceId: 'p-b' }, actor),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );
        const b = await expectScopeNotFound(
          absent.service.createAccount(
            { ...dto, practiceId: 'no-existe' },
            actor,
          ),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );

        expect(a.getResponse()).toEqual(b.getResponse());
        expect(foreign.accountsRepo.findByCode).not.toHaveBeenCalled();
        expect(foreign.accountsRepo.create).not.toHaveBeenCalled();
      });

      it('el 409 de código duplicado no se puede usar para sondear otra organización', async () => {
        const d = build();
        d.accountsRepo.findByCode.mockResolvedValue({ id: 'dup' });

        await expectScopeNotFound(
          d.service.createAccount({ ...dto, practiceId: 'p-b' }, actor),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );
      });
    });

    describe('determineAccounts', () => {
      it('lee las reglas del tenant de la sesión, no del que diga el cuerpo', async () => {
        const d = build();
        d.accountsRepo.findActiveRule.mockResolvedValue({
          id: 'r1',
          targetAccountId: 'acc9',
        });

        await d.service.determineAccounts({
          tenantId: TENANT_B,
          postingScenarioConceptId: 's',
        } as any);

        expect(d.accountsRepo.findActiveRule).toHaveBeenCalledWith(
          expect.anything(),
          TENANT_A,
          's',
          ACCT.RULE_ACTIVE,
        );
      });
    });
  });
});
