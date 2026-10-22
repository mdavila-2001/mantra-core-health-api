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
  const service = new AccrualService(
    em as any,
    accrualRepo,
    posting as any,
    logger as any,
  );
  return { service, tx, accrualRepo, posting };
}

const createDto = {
  tenantId: 't1',
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
});
