import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AccrualService } from './accrual.service';
import { ACCT } from '../accounting.concepts';
import {
  ConflictException,
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
  const accrualRepo = {
    findObjectByNumber: mockFn().mockResolvedValue(null),
    createObject: mockFn((_em: any, d: any) => ({
      id: 'ao1',
      objectNumber: d.objectNumber,
      statusConceptId: d.statusConceptId,
    })),
    createScheduleLine: mockFn(() => ({ id: `sl-${Math.random()}` })),
    findObjectById: mockFn(),
    pendingLinesForPeriod: mockFn().mockResolvedValue([]),
    createPosting: mockFn(),
    findObjectsByPractice: mockFn().mockResolvedValue([]),
    findScheduleLinesByObjectIds: mockFn().mockResolvedValue([]),
  };
  const posting = {
    post: mockFn().mockResolvedValue({
      transactionId: 'tx1',
      entryIds: ['e1', 'e2'],
    }),
    generateNumber: mockFn(() => 'ACR-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const { scope, doubles } = buildScope({ accrualRepo });
  const service = inTenant(
    new AccrualService(
      em as any,
      accrualRepo,
      posting as any,
      scope,
      logger as any,
    ),
  );
  return { service, tx, accrualRepo, posting, doubles };
}

const createDto = {
  tenantId: TENANT_A,
  objectNumber: 'ACR-001',
  expenseAccountId: 'exp',
  accrualAccountId: 'acr',
  totalAmount: '200.00',
  schedule: [
    { fiscalPeriodId: 'fp1', plannedAmount: '100.00' },
    { fiscalPeriodId: 'fp2', plannedAmount: '100.00' },
  ],
};

describe('AccrualService', () => {
  describe('createAccrualObject (UC-16-06)', () => {
    it('crea objeto y cronograma cuando sum(planned)=total', async () => {
      const d = build();
      const res = await d.service.createAccrualObject(createDto, actor);
      expect(res.status).toBe(ACCT.ACCRUAL_ACTIVE);
      expect(res.scheduleLineIds).toHaveLength(2);
    });

    it('rechaza (422) si el cronograma no suma el total', async () => {
      const d = build();
      const bad = { ...createDto, totalAmount: '999.00' };
      await expect(
        d.service.createAccrualObject(bad as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza (409) número de objeto duplicado', async () => {
      const d = build();
      d.accrualRepo.findObjectByNumber.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.createAccrualObject(createDto as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('runAccruals (UC-16-07)', () => {
    const runDto = {
      accrualObjectId: 'ao1',
      fiscalPeriodId: 'fp1',
      practiceId: 'p1',
      postingDate: '2026-01-31',
    };

    it('lanza 404 si el objeto no existe', async () => {
      const d = build();
      d.accrualRepo.findObjectById.mockResolvedValue(null);
      await expect(
        d.service.runAccruals(runDto as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza si no hay líneas pendientes', async () => {
      const d = build();
      d.accrualRepo.findObjectById.mockResolvedValue({
        id: 'ao1',
        tenantId: TENANT_A,
        expenseAccountId: 'e',
        accrualAccountId: 'a',
      });
      d.accrualRepo.pendingLinesForPeriod.mockResolvedValue([]);
      await expect(
        d.service.runAccruals(runDto as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('postea un asiento balanceado por línea pendiente', async () => {
      const d = build();
      d.accrualRepo.findObjectById.mockResolvedValue({
        id: 'ao1',
        tenantId: TENANT_A,
        objectNumber: 'ACR-001',
        expenseAccountId: 'exp',
        accrualAccountId: 'acr',
      });
      const line = {
        id: 'sl1',
        plannedAmount: '100.00',
        updatedAt: new Date(),
      };
      d.accrualRepo.pendingLinesForPeriod.mockResolvedValue([line]);
      const res = await d.service.runAccruals(runDto, actor);
      expect(res.postedLines).toBe(1);
      expect(d.posting.post).toHaveBeenCalledTimes(1);
      expect((line as any).statusConceptId).toBe(ACCT.SCHEDULE_POSTED);
    });
  });

  describe('alcance de tenant (ACC-01)', () => {
    describe('createAccrualObject', () => {
      /** Nada se crea: ni el objeto ni su cronograma. */
      function expectNothingCreated(d: ReturnType<typeof build>) {
        expect(d.accrualRepo.createObject).not.toHaveBeenCalled();
        expect(d.accrualRepo.createScheduleLine).not.toHaveBeenCalled();
      }

      it('el objeto se estampa con el tenant de la sesión', async () => {
        const d = build();
        await d.service.createAccrualObject(createDto, actor);
        expect(d.accrualRepo.findObjectByNumber).toHaveBeenCalledWith(
          d.tx,
          TENANT_A,
          'ACR-001',
        );
        expect(d.accrualRepo.createObject).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ tenantId: TENANT_A }),
        );
      });

      it('un tenant del cuerpo distinto del de la sesión no se estampa: 404', async () => {
        const d = build();
        await expectScopeNotFound(
          d.service.createAccrualObject(
            { ...createDto, tenantId: TENANT_B },
            actor,
          ),
          AccountingErrorReason.ACCRUAL_OBJECT_NOT_FOUND,
        );
        expectNothingCreated(d);
      });

      it.each([
        ['expenseAccountId', 'exp-b'],
        ['accrualAccountId', 'acr-b'],
      ])(
        'la cuenta %s de una práctica de otra organización responde como inexistente',
        async (field, foreignId) => {
          const d = build();
          d.doubles.accountsRepo.findByIds.mockImplementation(
            async (_em: any, ids: string[]) =>
              ids.map((id) => ({
                id,
                practiceId: id === foreignId ? 'p-b' : 'p1',
              })),
          );

          await expectScopeNotFound(
            d.service.createAccrualObject(
              { ...createDto, [field]: foreignId } as any,
              actor,
            ),
            AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
          );
          expectNothingCreated(d);
        },
      );

      it('una cuenta inexistente responde igual que una ajena', async () => {
        const foreign = build();
        foreign.doubles.accountsRepo.findByIds.mockResolvedValue([
          { id: 'exp', practiceId: 'p-b' },
          { id: 'acr', practiceId: 'p1' },
        ]);
        const absent = build();
        absent.doubles.accountsRepo.findByIds.mockResolvedValue([
          { id: 'acr', practiceId: 'p1' },
        ]);

        const a = await expectScopeNotFound(
          foreign.service.createAccrualObject(createDto, actor),
          AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
        );
        const b = await expectScopeNotFound(
          absent.service.createAccrualObject(createDto, actor),
          AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
        );
        expect(a.getResponse()).toEqual(b.getResponse());
      });

      it('un periodo del cronograma de otra organización responde como inexistente', async () => {
        const d = build();
        d.doubles.fiscalRepo.findYearById.mockImplementation(
          async (_em: any, id: string) => ({ id, practiceId: 'p-b' }),
        );

        await expectScopeNotFound(
          d.service.createAccrualObject(createDto, actor),
          AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
        );
        expectNothingCreated(d);
      });

      it('un centro de costo de otra organización responde como inexistente', async () => {
        const d = build();
        d.doubles.controllingRepo.findCostCentersByIds.mockResolvedValue([
          { id: 'cc-b', practiceId: 'p-b' },
        ]);

        await expectScopeNotFound(
          d.service.createAccrualObject(
            { ...createDto, costCenterId: 'cc-b' },
            actor,
          ),
          AccountingErrorReason.COST_CENTER_NOT_FOUND,
        );
        expectNothingCreated(d);
      });

      it('un centro de beneficio de otra organización responde como inexistente', async () => {
        const d = build();
        d.doubles.controllingRepo.findProfitCentersByIds.mockResolvedValue([
          { id: 'pc-b', tenantId: TENANT_B },
        ]);

        await expectScopeNotFound(
          d.service.createAccrualObject(
            { ...createDto, profitCenterId: 'pc-b' },
            actor,
          ),
          AccountingErrorReason.PROFIT_CENTER_NOT_FOUND,
        );
        expectNothingCreated(d);
      });
    });

    describe('runAccruals', () => {
      const runDto = {
        accrualObjectId: 'ao1',
        fiscalPeriodId: 'fp1',
        practiceId: 'p1',
        postingDate: '2026-01-31',
      };
      const objectOf = (tenantId: string) => ({
        id: 'ao1',
        tenantId,
        objectNumber: 'ACR-001',
        expenseAccountId: 'exp',
        accrualAccountId: 'acr',
      });

      it('un objeto de devengo de otra organización responde como inexistente y no postea', async () => {
        const foreign = build();
        foreign.accrualRepo.findObjectById.mockResolvedValue(
          objectOf(TENANT_B),
        );
        foreign.accrualRepo.pendingLinesForPeriod.mockResolvedValue([
          { id: 'sl1', plannedAmount: '100.00' },
        ]);
        const absent = build();
        absent.accrualRepo.findObjectById.mockResolvedValue(null);

        const a = await expectScopeNotFound(
          foreign.service.runAccruals(runDto, actor),
          AccountingErrorReason.ACCRUAL_OBJECT_NOT_FOUND,
        );
        const b = await expectScopeNotFound(
          absent.service.runAccruals(runDto, actor),
          AccountingErrorReason.ACCRUAL_OBJECT_NOT_FOUND,
        );

        expect(a.getResponse()).toEqual(b.getResponse());
        expect(foreign.posting.post).not.toHaveBeenCalled();
        expect(
          foreign.accrualRepo.pendingLinesForPeriod,
        ).not.toHaveBeenCalled();
      });

      it('una práctica de otra organización responde como inexistente y no postea', async () => {
        const d = build();
        d.accrualRepo.findObjectById.mockResolvedValue(objectOf(TENANT_A));

        await expectScopeNotFound(
          d.service.runAccruals({ ...runDto, practiceId: 'p-b' }, actor),
          AccountingErrorReason.PRACTICE_NOT_FOUND,
        );
        expect(d.posting.post).not.toHaveBeenCalled();
      });

      it('un periodo de otra práctica responde como inexistente y no postea', async () => {
        const d = build();
        d.accrualRepo.findObjectById.mockResolvedValue(objectOf(TENANT_A));
        d.doubles.fiscalRepo.findYearById.mockResolvedValue({
          id: 'fy1',
          practiceId: 'p2',
        });

        await expectScopeNotFound(
          d.service.runAccruals(runDto, actor),
          AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
        );
        expect(d.posting.post).not.toHaveBeenCalled();
      });
    });
  });
});
