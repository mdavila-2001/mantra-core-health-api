import { jest } from '@jest/globals';

/** Ver `asset.service.spec.ts`: mismo envoltorio de `jest.fn` sin tipar. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PostingHelper } from './posting.helper';
import { ACCT } from '../accounting.concepts';
import { AccountingErrorReason } from '../accounting.error-reasons';
import { PreconditionFailedException, runWithTenant } from '../../../common';
import {
  PRACTICE_TENANTS,
  TENANT_A,
  TENANT_B,
  buildScope,
  expectScopeNotFound,
} from './accounting-scope.testing';

/**
 * Construye el ayudante real sobre la política de alcance real.
 *
 * @returns El ayudante, el repositorio de asientos y los dobles del alcance.
 */
function build() {
  const journalRepo = {
    createTransaction: mockFn((_em: any, d: any) => ({
      id: 'txn-1',
      practiceId: d.practiceId,
    })),
    createLedgerEntry: mockFn(() => ({ id: `e-${Math.random()}` })),
    createAssignment: mockFn(),
  };
  const { scope, doubles } = buildScope();
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const helper = new PostingHelper(journalRepo as any, scope);
  return { helper, tx, journalRepo, doubles };
}

const request = {
  practiceId: 'p1',
  transactionTypeConceptId: ACCT.TXN_TYPE_CLEARING,
  transactionNumber: 'CLRJ-1',
  transactionDate: new Date('2026-01-31'),
  lines: [
    { accountId: 'bank', direction: 'DEBIT' as const, amount: '100.00' },
    { accountId: 'rec', direction: 'CREDIT' as const, amount: '100.00' },
  ],
  actorUserId: 'admin-1',
};

/** Ejecuta el posteo dentro del tenant A, como lo haría una petición real. */
function postAs(d: ReturnType<typeof build>, req: object, tenant = TENANT_A) {
  return runWithTenant(tenant, () => d.helper.post(d.tx as any, req as any));
}

describe('PostingHelper · alcance de tenant (ACC-01)', () => {
  /** Ni cabecera, ni líneas, ni asignaciones. */
  function expectNothingWritten(d: ReturnType<typeof build>) {
    expect(d.journalRepo.createTransaction).not.toHaveBeenCalled();
    expect(d.journalRepo.createLedgerEntry).not.toHaveBeenCalled();
    expect(d.journalRepo.createAssignment).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  }

  it('con todo propio postea cabecera, líneas y asignaciones', async () => {
    const d = build();

    const res = await postAs(d, request);

    expect(res.transactionId).toBe('txn-1');
    expect(res.entryIds).toHaveLength(2);
    expect(d.journalRepo.createLedgerEntry).toHaveBeenCalledTimes(2);
    expect(d.journalRepo.createAssignment).toHaveBeenCalledTimes(2);
  });

  it('una práctica de otra organización responde como inexistente', async () => {
    const d = build();

    await expectScopeNotFound(
      postAs(d, { ...request, practiceId: 'p-b' }),
      AccountingErrorReason.PRACTICE_NOT_FOUND,
    );
    expectNothingWritten(d);
  });

  it('cada cuenta debe ser del plan de la práctica del asiento', async () => {
    const d = build();
    d.doubles.accountsRepo.findByIds.mockResolvedValue([
      { id: 'bank', practiceId: 'p1' },
      { id: 'rec', practiceId: 'p-b' },
    ]);

    await expectScopeNotFound(
      postAs(d, request),
      AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
    );
    expectNothingWritten(d);
  });

  it('una cuenta de otra práctica de la misma organización tampoco se contamina', async () => {
    const d = build();
    d.doubles.accountsRepo.findByIds.mockResolvedValue([
      { id: 'bank', practiceId: 'p2' },
      { id: 'rec', practiceId: 'p1' },
    ]);

    await expectScopeNotFound(
      postAs(d, request),
      AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
    );
    expectNothingWritten(d);
  });

  it('el periodo debe ser de un ejercicio de la práctica del asiento', async () => {
    const d = build();
    d.doubles.fiscalRepo.findYearById.mockResolvedValue({
      id: 'fy1',
      practiceId: 'p-b',
    });

    await expectScopeNotFound(
      postAs(d, { ...request, fiscalPeriodId: 'fp1' }),
      AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
    );
    expectNothingWritten(d);
  });

  it('los centros de costo y de beneficio de las líneas se acotan igual', async () => {
    const costCenter = build();
    costCenter.doubles.controllingRepo.findCostCentersByIds.mockResolvedValue([
      { id: 'cc1', practiceId: 'p-b' },
    ]);
    await expectScopeNotFound(
      postAs(costCenter, {
        ...request,
        lines: [{ ...request.lines[0], costCenterId: 'cc1' }, request.lines[1]],
      }),
      AccountingErrorReason.COST_CENTER_NOT_FOUND,
    );
    expectNothingWritten(costCenter);

    const profitCenter = build();
    profitCenter.doubles.controllingRepo.findProfitCentersByIds.mockResolvedValue(
      [{ id: 'pc1', tenantId: TENANT_B }],
    );
    await expectScopeNotFound(
      postAs(profitCenter, {
        ...request,
        lines: [
          { ...request.lines[0], profitCenterId: 'pc1' },
          request.lines[1],
        ],
      }),
      AccountingErrorReason.PROFIT_CENTER_NOT_FOUND,
    );
    expectNothingWritten(profitCenter);
  });

  it('el alcance de la sesión manda: la práctica del tenant A no se postea desde el tenant B', async () => {
    const d = build();
    expect(PRACTICE_TENANTS['p1']).toBe(TENANT_A);

    await expectScopeNotFound(
      postAs(d, request, TENANT_B),
      AccountingErrorReason.PRACTICE_NOT_FOUND,
    );
    expectNothingWritten(d);
  });

  it('sin tenant en el contexto no postea (412)', async () => {
    const d = build();

    await expect(d.helper.post(d.tx as any, request)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expectNothingWritten(d);
  });

  it('un asiento que no balancea sigue respondiendo 422 sin escribir', async () => {
    const d = build();

    await expect(
      postAs(d, {
        ...request,
        lines: [request.lines[0], { ...request.lines[1], amount: '90.00' }],
      }),
    ).rejects.toMatchObject({
      reason: AccountingErrorReason.JOURNAL_ENTRY_UNBALANCED,
    });
    expectNothingWritten(d);
  });
});
