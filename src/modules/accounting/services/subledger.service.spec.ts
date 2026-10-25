import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SubledgerService } from './subledger.service';
import { ACCT } from '../accounting.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { AccountingErrorReason } from '../accounting.error-reasons';
import {
  TENANT_A,
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
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const subledgerRepo = {
    findSubledgerById: mockFn(),
    findOpenItemById: mockFn(),
    createOpenItem: mockFn((_em: any, d: any) => ({
      id: 'oi1',
      statusConceptId: d.statusConceptId,
      outstandingAmount: d.outstandingAmount,
    })),
    findClearingByNumber: mockFn().mockResolvedValue(null),
    createClearingDocument: mockFn((_em: any, d: any) => ({
      id: 'cd1',
      clearingNumber: d.clearingNumber,
    })),
    createClearingItem: mockFn(),
    findOpenItemsByReconciliationAccounts: mockFn().mockResolvedValue([]),
    findCompanyBankAccountById: mockFn(async (_em: any, id: string) => ({
      id,
      tenantId: TENANT_A,
    })),
  };
  const journalRepo = {
    findLedgerEntryById: mockFn(async (_em: any, id: string) => ({
      id,
      transactionId: 't1',
    })),
    findTransactionById: mockFn().mockResolvedValue({
      id: 't1',
      practiceId: 'p1',
    }),
  };
  const posting = {
    post: mockFn().mockResolvedValue({
      transactionId: 'tx1',
      entryIds: ['e1', 'e2'],
    }),
    generateNumber: mockFn(() => 'CLR-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const { scope } = buildScope({ subledgerRepo, journalRepo });
  const service = inTenant(
    new SubledgerService(
      em as any,
      subledgerRepo,
      posting as any,
      scope,
      logger as any,
    ),
  );
  return { service, tx, subledgerRepo, journalRepo, posting };
}

describe('SubledgerService', () => {
  const openItemDto = {
    tenantId: TENANT_A,
    subledgerAccountId: 's',
    ledgerEntryId: 'e',
    documentType: 'INVOICE',
    originalAmount: '100.00',
  } as any;

  /** Subledger de la organización dada, con su cuenta de reconciliación. */
  const subledgerOf = (tenantId: string) => ({
    id: 's',
    tenantId,
    reconciliationAccountId: 'rec',
  });

  /** Partida abierta de la organización dada, lista para compensar. */
  const openItemOf = (tenantId: string, extra: object = {}) => ({
    id: 'oi1',
    tenantId,
    statusConceptId: ACCT.OPEN_ITEM_OPEN,
    subledgerAccountId: 's',
    outstandingAmount: '100.00',
    updatedAt: new Date(),
    ...extra,
  });

  describe('createOpenItem (UC-16-08)', () => {
    it('lanza 404 si el subledger no existe', async () => {
      const d = build();
      d.subledgerRepo.findSubledgerById.mockResolvedValue(null);
      await expect(
        d.service.createOpenItem(openItemDto, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('crea la partida abierta con estado ABIERTO', async () => {
      const d = build();
      d.subledgerRepo.findSubledgerById.mockResolvedValue(
        subledgerOf(TENANT_A),
      );
      const res = await d.service.createOpenItem(openItemDto, actor);
      expect(res.status).toBe(ACCT.OPEN_ITEM_OPEN);
      expect(res.outstandingAmount).toBe('100.00');
      expect(d.subledgerRepo.createOpenItem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT_A }),
      );
    });

    describe('alcance de tenant (ACC-01)', () => {
      it('un subledger de otra organización responde como inexistente y no crea la partida', async () => {
        const foreign = build();
        foreign.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_B),
        );
        const absent = build();
        absent.subledgerRepo.findSubledgerById.mockResolvedValue(null);

        const a = await expectScopeNotFound(
          foreign.service.createOpenItem(openItemDto, actor),
          AccountingErrorReason.SUBLEDGER_ACCOUNT_NOT_FOUND,
        );
        const b = await expectScopeNotFound(
          absent.service.createOpenItem(openItemDto, actor),
          AccountingErrorReason.SUBLEDGER_ACCOUNT_NOT_FOUND,
        );

        expect(a.getResponse()).toEqual(b.getResponse());
        expect(foreign.subledgerRepo.createOpenItem).not.toHaveBeenCalled();
      });

      it('la línea del mayor de un asiento de otra organización responde como inexistente', async () => {
        const d = build();
        d.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_A),
        );
        d.journalRepo.findTransactionById.mockResolvedValue({
          id: 't9',
          practiceId: 'p-b',
        });

        await expectScopeNotFound(
          d.service.createOpenItem(openItemDto, actor),
          AccountingErrorReason.LEDGER_ENTRY_NOT_FOUND,
        );
        expect(d.subledgerRepo.createOpenItem).not.toHaveBeenCalled();
      });

      it('una línea del mayor inexistente responde igual que una ajena', async () => {
        const d = build();
        d.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_A),
        );
        d.journalRepo.findLedgerEntryById.mockResolvedValue(null);

        await expectScopeNotFound(
          d.service.createOpenItem(openItemDto, actor),
          AccountingErrorReason.LEDGER_ENTRY_NOT_FOUND,
        );
      });

      it('el tenant del cuerpo no se estampa: uno distinto del de la sesión responde 404', async () => {
        const d = build();
        d.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_A),
        );

        await expectScopeNotFound(
          d.service.createOpenItem(
            { ...openItemDto, tenantId: TENANT_B },
            actor,
          ),
          AccountingErrorReason.SUBLEDGER_ACCOUNT_NOT_FOUND,
        );
        expect(d.subledgerRepo.createOpenItem).not.toHaveBeenCalled();
      });

      it('sin tenant en el contexto no escribe (412)', async () => {
        const d = build();
        d.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_A),
        );
        const outside = new SubledgerService(
          { transactional: (cb: any) => cb(d.tx) } as any,
          d.subledgerRepo,
          d.posting as any,
          buildScope({
            subledgerRepo: d.subledgerRepo,
            journalRepo: d.journalRepo,
          }).scope,
          { setContext: mockFn(), info: mockFn() } as any,
        );

        await expect(
          outside.createOpenItem(openItemDto, actor),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.subledgerRepo.createOpenItem).not.toHaveBeenCalled();
      });
    });
  });

  describe('clearOpenItems (UC-16-09)', () => {
    const dto = {
      tenantId: TENANT_A,
      practiceId: 'p1',
      bankAccountId: 'bank',
      clearingDate: '2026-02-01',
      items: [{ openItemId: 'oi1', clearedAmount: '100.00' }],
    };

    it('lanza 404 si la partida no existe', async () => {
      const d = build();
      d.subledgerRepo.findOpenItemById.mockResolvedValue(null);
      await expect(
        d.service.clearOpenItems(dto as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza si el importe compensado excede lo pendiente', async () => {
      const d = build();
      d.subledgerRepo.findOpenItemById.mockResolvedValue(
        openItemOf(TENANT_A, { outstandingAmount: '50.00' }),
      );
      await expect(
        d.service.clearOpenItems(dto as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('compensa la partida y postea el asiento de banco', async () => {
      const d = build();
      const openItem = openItemOf(TENANT_A);
      d.subledgerRepo.findOpenItemById.mockResolvedValue(openItem);
      d.subledgerRepo.findSubledgerById.mockResolvedValue(
        subledgerOf(TENANT_A),
      );
      const res = await d.service.clearOpenItems(dto, actor);
      expect(res.clearedItems).toBe(1);
      expect(res.transactionId).toBe('tx1');
      expect(openItem.statusConceptId).toBe(ACCT.OPEN_ITEM_CLEARED);
    });

    describe('organización del documento (informe B, C9)', () => {
      const { tenantId: _skipped, ...withoutTenant } = dto;

      /** Deja una partida y su subledger listos para compensar. */
      function ready(d: ReturnType<typeof build>) {
        d.subledgerRepo.findOpenItemById.mockResolvedValue(
          openItemOf(TENANT_A),
        );
        d.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_A),
        );
      }

      it('sin tenantId en el cuerpo, la organización es la de la sesión', async () => {
        const d = build();
        ready(d);

        await d.service.clearOpenItems(withoutTenant, actor);

        expect(d.subledgerRepo.findClearingByNumber).toHaveBeenCalledWith(
          d.tx,
          TENANT_A,
          'CLR-1',
        );
        expect(d.subledgerRepo.createClearingDocument).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ tenantId: TENANT_A }),
        );
      });

      it('un tenantId declarado distinto del de la sesión responde 404 y no asienta', async () => {
        const d = build();
        ready(d);

        await expectScopeNotFound(
          d.service.clearOpenItems({ ...dto, tenantId: TENANT_B }, actor),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );
        expect(d.posting.post).not.toHaveBeenCalled();
      });

      it('una práctica inexistente es 404 y no asienta', async () => {
        const d = build();
        ready(d);

        await expectScopeNotFound(
          d.service.clearOpenItems(
            { ...withoutTenant, practiceId: 'no-existe' },
            actor,
          ),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );
        expect(d.posting.post).not.toHaveBeenCalled();
      });
    });

    describe('alcance de tenant (ACC-01)', () => {
      /** Todo lo que el flujo toca está en el tenant A. */
      function ready(d: ReturnType<typeof build>) {
        d.subledgerRepo.findOpenItemById.mockResolvedValue(
          openItemOf(TENANT_A),
        );
        d.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_A),
        );
      }

      /** Ni asienta, ni compensa, ni toca la partida. */
      function expectNothingWritten(d: ReturnType<typeof build>) {
        expect(d.posting.post).not.toHaveBeenCalled();
        expect(d.subledgerRepo.createClearingDocument).not.toHaveBeenCalled();
        expect(d.subledgerRepo.createClearingItem).not.toHaveBeenCalled();
      }

      it('una práctica de otra organización responde como inexistente', async () => {
        const foreign = build();
        ready(foreign);
        const absent = build();
        ready(absent);

        const a = await expectScopeNotFound(
          foreign.service.clearOpenItems(
            { ...dto, practiceId: 'p-b', tenantId: undefined } as any,
            actor,
          ),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );
        const b = await expectScopeNotFound(
          absent.service.clearOpenItems(
            { ...dto, practiceId: 'no-existe', tenantId: undefined } as any,
            actor,
          ),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );

        expect(a.getResponse()).toEqual(b.getResponse());
        expectNothingWritten(foreign);
      });

      it('una partida de otra organización responde como inexistente y queda intacta', async () => {
        const d = build();
        const foreignItem = openItemOf(TENANT_B);
        d.subledgerRepo.findOpenItemById.mockResolvedValue(foreignItem);
        d.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_A),
        );

        await expectScopeNotFound(
          d.service.clearOpenItems(dto, actor),
          AccountingErrorReason.OPEN_ITEM_NOT_FOUND,
        );

        expect(foreignItem.outstandingAmount).toBe('100.00');
        expect(foreignItem.statusConceptId).toBe(ACCT.OPEN_ITEM_OPEN);
        expectNothingWritten(d);
      });

      it('una partida ajena ya compensada no delata su estado (404, no 409)', async () => {
        const d = build();
        d.subledgerRepo.findOpenItemById.mockResolvedValue(
          openItemOf(TENANT_B, { statusConceptId: ACCT.OPEN_ITEM_CLEARED }),
        );

        await expectScopeNotFound(
          d.service.clearOpenItems(dto, actor),
          AccountingErrorReason.OPEN_ITEM_NOT_FOUND,
        );
      });

      it('una partida ajena entre varias propias aborta todo el clearing', async () => {
        const d = build();
        d.subledgerRepo.findOpenItemById.mockImplementation(
          async (_em: any, id: string) =>
            openItemOf(id === 'oi-b' ? TENANT_B : TENANT_A, { id }),
        );
        d.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_A),
        );

        await expectScopeNotFound(
          d.service.clearOpenItems(
            {
              ...dto,
              items: [
                { openItemId: 'oi-a', clearedAmount: '10.00' },
                { openItemId: 'oi-b', clearedAmount: '10.00' },
              ],
            },
            actor,
          ),
          AccountingErrorReason.OPEN_ITEM_NOT_FOUND,
        );
        expectNothingWritten(d);
      });

      it('un subledger de otra organización responde como inexistente', async () => {
        const d = build();
        d.subledgerRepo.findOpenItemById.mockResolvedValue(
          openItemOf(TENANT_A),
        );
        d.subledgerRepo.findSubledgerById.mockResolvedValue(
          subledgerOf(TENANT_B),
        );

        await expectScopeNotFound(
          d.service.clearOpenItems(dto, actor),
          AccountingErrorReason.SUBLEDGER_ACCOUNT_NOT_FOUND,
        );
        expectNothingWritten(d);
      });

      it('una cuenta bancaria de la empresa de otra organización responde como inexistente', async () => {
        const d = build();
        ready(d);
        d.subledgerRepo.findCompanyBankAccountById.mockResolvedValue({
          id: 'cba',
          tenantId: TENANT_B,
        });

        await expectScopeNotFound(
          d.service.clearOpenItems(
            { ...dto, companyBankAccountId: 'cba' },
            actor,
          ),
          AccountingErrorReason.COMPANY_BANK_ACCOUNT_NOT_FOUND,
        );
        expectNothingWritten(d);
      });

      it('la cuenta bancaria propia de la empresa se acepta y se enlaza al documento', async () => {
        const d = build();
        ready(d);

        await d.service.clearOpenItems(
          { ...dto, companyBankAccountId: 'cba' },
          actor,
        );

        expect(d.subledgerRepo.createClearingDocument).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ companyBankAccountId: 'cba' }),
        );
      });

      it('la cuenta contable de banco y la práctica se entregan al posteo, que las acota', async () => {
        const d = build();
        ready(d);

        await d.service.clearOpenItems(dto, actor);

        expect(d.posting.post).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({
            practiceId: 'p1',
            lines: expect.arrayContaining([
              expect.objectContaining({ accountId: 'bank' }),
              expect.objectContaining({ accountId: 'rec' }),
            ]),
          }),
        );
      });
    });
  });
});
