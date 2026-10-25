import { ACCT } from '../accounting.concepts';
import { AccountingErrorReason } from '../accounting.error-reasons';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import {
  TENANT_A,
  TENANT_B,
  buildScope,
  expectScopeNotFound,
} from './accounting-scope.testing';

const em = {} as any;

/** Ejecuta la consulta dentro del tenant A. */
function inA<T>(fn: () => T): T {
  return runWithTenant(TENANT_A, fn);
}

describe('AccountingScopeService (ACC-01)', () => {
  describe('contexto', () => {
    it('sin tenant en el contexto toda resolución falla con 412, no con una lista vacía', async () => {
      const { scope } = buildScope();

      await expect(scope.practice('p1')).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      await expect(scope.subledger(em, 's')).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(() => scope.activeTenantFor(undefined, 'practice')).toThrow(
        PreconditionFailedException,
      );
    });

    it('activeTenantFor devuelve el de la sesión y rechaza un cuerpo que declare otro', () => {
      const { scope } = buildScope();

      expect(inA(() => scope.activeTenantFor(undefined, 'practice'))).toBe(
        TENANT_A,
      );
      expect(inA(() => scope.activeTenantFor(TENANT_A, 'practice'))).toBe(
        TENANT_A,
      );
      expect(() =>
        inA(() => scope.activeTenantFor(TENANT_B, 'practice')),
      ).toThrow(ResourceNotFoundException);
    });
  });

  describe('practice', () => {
    it('devuelve el tenant activo si la práctica es suya', async () => {
      const { scope } = buildScope();
      await expect(inA(() => scope.practice('p1'))).resolves.toBe(TENANT_A);
    });

    it('lo ajeno y lo inexistente responden idéntico', async () => {
      const { scope } = buildScope();
      const foreign = await expectScopeNotFound(
        inA(() => scope.practice('p-b')),
        AccountingErrorReason.PRACTICE_NOT_FOUND,
      );
      const absent = await expectScopeNotFound(
        inA(() => scope.practice('no-existe')),
        AccountingErrorReason.PRACTICE_NOT_FOUND,
      );
      expect(foreign.getResponse()).toEqual(absent.getResponse());
    });
  });

  describe('transaction y ledgerEntry', () => {
    it('un asiento de una práctica del tenant activo se devuelve', async () => {
      const txn = { id: 't1', practiceId: 'p1' };
      const { scope } = buildScope({
        journalRepo: { findTransactionById: async () => txn },
      });
      await expect(inA(() => scope.transaction(em, 't1'))).resolves.toBe(txn);
    });

    it('un asiento sin práctica conocida cuenta como ajeno', async () => {
      const { scope } = buildScope({
        journalRepo: {
          findTransactionById: async () => ({ id: 't1', practiceId: 'otra' }),
        },
      });
      await expectScopeNotFound(
        inA(() => scope.transaction(em, 't1')),
        AccountingErrorReason.LEDGER_TRANSACTION_NOT_FOUND,
      );
    });

    it('una línea hereda el tenant de su asiento', async () => {
      const entry = { id: 'e1', transactionId: 't1' };
      const own = buildScope({
        journalRepo: {
          findLedgerEntryById: async () => entry,
          findTransactionById: async () => ({ id: 't1', practiceId: 'p1' }),
        },
      });
      await expect(inA(() => own.scope.ledgerEntry(em, 'e1'))).resolves.toBe(
        entry,
      );

      const foreign = buildScope({
        journalRepo: {
          findLedgerEntryById: async () => entry,
          findTransactionById: async () => ({ id: 't1', practiceId: 'p-b' }),
        },
      });
      await expectScopeNotFound(
        inA(() => foreign.scope.ledgerEntry(em, 'e1')),
        AccountingErrorReason.LEDGER_ENTRY_NOT_FOUND,
      );
    });

    it('una línea cuyo asiento no existe responde como inexistente', async () => {
      const { scope } = buildScope({
        journalRepo: {
          findLedgerEntryById: async () => ({ id: 'e1', transactionId: 'x' }),
          findTransactionById: async () => null,
        },
      });
      await expectScopeNotFound(
        inA(() => scope.ledgerEntry(em, 'e1')),
        AccountingErrorReason.LEDGER_ENTRY_NOT_FOUND,
      );
    });
  });

  describe('cuentas', () => {
    it('accountsInPractice devuelve las cuentas por id cuando todas son de la práctica', async () => {
      const { scope } = buildScope();
      const found = await inA(() =>
        scope.accountsInPractice(em, ['a', 'b', 'a', undefined], 'p1'),
      );
      expect([...found.keys()]).toEqual(['a', 'b']);
    });

    it('accountsInTenant acepta cuentas de cualquier práctica del tenant y rechaza las de otro', async () => {
      const own = buildScope({
        accountsRepo: {
          findByIds: async () => [
            { id: 'a', practiceId: 'p1' },
            { id: 'b', practiceId: 'p2' },
          ],
        },
      });
      await expect(
        inA(() => own.scope.accountsInTenant(em, ['a', 'b'])),
      ).resolves.toBeUndefined();

      const foreign = buildScope({
        accountsRepo: {
          findByIds: async () => [
            { id: 'a', practiceId: 'p1' },
            { id: 'b', practiceId: 'p-b' },
          ],
        },
      });
      await expectScopeNotFound(
        inA(() => foreign.scope.accountsInTenant(em, ['a', 'b'])),
        AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
      );
    });

    it('sin ids no hay nada que acotar y no falla', async () => {
      const { scope, doubles } = buildScope();
      await inA(() => scope.accountsInTenant(em, [undefined]));
      await inA(() => scope.accountsInPractice(em, [], 'p1'));
      expect(doubles.accountsRepo.findByIds).toHaveBeenCalledTimes(2);
      expect(doubles.accountsRepo.findByIds).toHaveBeenCalledWith(em, []);
    });
  });

  describe('periodos', () => {
    it('periodInTenant acepta un periodo de un ejercicio de práctica propia', async () => {
      const { scope } = buildScope();
      const period = await inA(() => scope.periodInTenant(em, 'fp1'));
      expect(period.statusConceptId).toBe(ACCT.PERIOD_OPEN);
    });

    it('un periodo cuyo ejercicio no existe responde como inexistente', async () => {
      const { scope } = buildScope({
        fiscalRepo: {
          findPeriodById: async () => ({ id: 'fp1', fiscalYearId: 'zz' }),
          findYearById: async () => null,
        },
      });
      await expectScopeNotFound(
        inA(() => scope.periodInTenant(em, 'fp1')),
        AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
      );
      await expectScopeNotFound(
        inA(() => scope.periodInPractice(em, 'fp1', 'p1')),
        AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
      );
    });

    it('periodInTenant rechaza un periodo de una práctica de otro tenant', async () => {
      const { scope } = buildScope({
        fiscalRepo: {
          findPeriodById: async () => ({ id: 'fp1', fiscalYearId: 'fy' }),
          findYearById: async () => ({ id: 'fy', practiceId: 'p-b' }),
        },
      });
      await expectScopeNotFound(
        inA(() => scope.periodInTenant(em, 'fp1')),
        AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
      );
    });
  });

  describe('dimensiones', () => {
    it('costCentersInTenant acepta los de prácticas propias y rechaza los de otro tenant', async () => {
      const own = buildScope();
      await expect(
        inA(() => own.scope.costCentersInTenant(em, ['cc1'])),
      ).resolves.toBeUndefined();

      const foreign = buildScope({
        controllingRepo: {
          findCostCentersByIds: async () => [{ id: 'cc1', practiceId: 'p-b' }],
          findProfitCentersByIds: async () => [],
        },
      });
      await expectScopeNotFound(
        inA(() => foreign.scope.costCentersInTenant(em, ['cc1'])),
        AccountingErrorReason.COST_CENTER_NOT_FOUND,
      );
    });

    it('un centro de costo o de beneficio inexistente responde como inexistente', async () => {
      const { scope } = buildScope({
        controllingRepo: {
          findCostCentersByIds: async () => [],
          findProfitCentersByIds: async () => [],
        },
      });
      await expectScopeNotFound(
        inA(() => scope.costCentersInPractice(em, ['cc1'], 'p1')),
        AccountingErrorReason.COST_CENTER_NOT_FOUND,
      );
      await expectScopeNotFound(
        inA(() => scope.profitCentersInTenant(em, ['pc1'])),
        AccountingErrorReason.PROFIT_CENTER_NOT_FOUND,
      );
    });
  });

  describe('recursos con tenant propio', () => {
    it.each([
      [
        'subledger',
        'subledgerRepo',
        'findSubledgerById',
        AccountingErrorReason.SUBLEDGER_ACCOUNT_NOT_FOUND,
        (s: any) => s.subledger(em, 'x'),
      ],
      [
        'partida abierta',
        'subledgerRepo',
        'findOpenItemById',
        AccountingErrorReason.OPEN_ITEM_NOT_FOUND,
        (s: any) => s.openItem(em, 'x'),
      ],
      [
        'cuenta bancaria de la empresa',
        'subledgerRepo',
        'findCompanyBankAccountById',
        AccountingErrorReason.COMPANY_BANK_ACCOUNT_NOT_FOUND,
        (s: any) => s.companyBankAccount(em, 'x'),
      ],
      [
        'objeto de devengo',
        'accrualRepo',
        'findObjectById',
        AccountingErrorReason.ACCRUAL_OBJECT_NOT_FOUND,
        (s: any) => s.accrualObject(em, 'x'),
      ],
      [
        'área de depreciación',
        'assetRepo',
        'findDepreciationAreaById',
        AccountingErrorReason.DEPRECIATION_AREA_NOT_FOUND,
        (s: any) => s.depreciationArea(em, 'x'),
      ],
    ])(
      '%s: el propio se devuelve; el ajeno y el inexistente responden idéntico',
      async (_name, repoKey, method, reason, run) => {
        const row = { id: 'x', tenantId: TENANT_A };
        const own = buildScope({ [repoKey]: { [method]: async () => row } });
        await expect(inA(() => run(own.scope))).resolves.toBe(row);

        const foreign = buildScope({
          [repoKey]: {
            [method]: async () => ({ id: 'x', tenantId: TENANT_B }),
          },
        });
        const absent = buildScope({
          [repoKey]: { [method]: async () => null },
        });
        const a = await expectScopeNotFound(
          inA(() => run(foreign.scope)),
          reason,
        );
        const b = await expectScopeNotFound(
          inA(() => run(absent.scope)),
          reason,
        );
        expect(a.getResponse()).toEqual(b.getResponse());
      },
    );
  });

  describe('activos, pasivos y facturas por práctica', () => {
    it.each([
      [
        'activo',
        AccountingErrorReason.ASSET_NOT_FOUND,
        (s: any, r: any) => s.asset(r),
      ],
      [
        'pasivo',
        AccountingErrorReason.LIABILITY_NOT_FOUND,
        (s: any, r: any) => s.liability(r),
      ],
      [
        'factura',
        AccountingErrorReason.INVOICE_NOT_FOUND,
        (s: any, r: any) => s.invoice(r),
      ],
    ])('%s: hereda el tenant de su práctica', async (_n, reason, run) => {
      const { scope } = buildScope();
      const own = { id: 'x', practiceId: 'p1' };
      await expect(inA(() => run(scope, own))).resolves.toBe(own);

      const foreign = await expectScopeNotFound(
        inA(() => run(scope, { id: 'x', practiceId: 'p-b' })),
        reason,
      );
      const absent = await expectScopeNotFound(
        inA(() => run(scope, null)),
        reason,
      );
      expect(foreign.getResponse()).toEqual(absent.getResponse());
    });

    it('liabilityInPractice exige la práctica exacta, no sólo el tenant', async () => {
      const { scope } = buildScope({
        liabilityRepo: {
          findById: async () => ({ id: 'l1', practiceId: 'p2' }),
        },
      });
      await expectScopeNotFound(
        inA(() => scope.liabilityInPractice(em, 'l1', 'p1')),
        AccountingErrorReason.LIABILITY_NOT_FOUND,
      );
    });
  });
});
