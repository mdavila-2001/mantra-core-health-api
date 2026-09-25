import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LiabilityService } from './liability.service';
import { ACCT } from '../accounting.concepts';
import {
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
  const liabilityRepo = {
    findById: mockFn(),
    findScheduleById: mockFn(),
    createPayment: mockFn(() => ({ id: 'lp1' })),
    createPosting: mockFn(),
  };
  const posting = {
    post: mockFn().mockResolvedValue({
      transactionId: 'tx1',
      entryIds: ['e-principal', 'e-interest', 'e-bank'],
    }),
    generateNumber: mockFn(() => 'LIABP-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new LiabilityService(
    em as any,
    liabilityRepo as any,
    posting as any,
    logger as any,
  );
  return { service, tx, liabilityRepo, posting };
}

const payDto = {
  practiceId: 'p1',
  amount: '1200.00',
  principalComponent: '1000.00',
  interestComponent: '200.00',
  bankAccountId: 'bank',
  interestExpenseAccountId: 'int-exp',
};

describe('LiabilityService', () => {
  describe('payLiability (UC-16-12)', () => {
    it('rechaza (422) si principal + interés no iguala el importe', async () => {
      const d = build();
      const bad = { ...payDto, interestComponent: '999.00' };
      await expect(
        d.service.payLiability('l1', bad as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('lanza 404 si el pasivo no existe', async () => {
      const d = build();
      d.liabilityRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.payLiability('l1', payDto as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza si el pasivo no está ACTIVO', async () => {
      const d = build();
      d.liabilityRepo.findById.mockResolvedValue({
        id: 'l1',
        statusConceptId: ACCT.LIABILITY_SETTLED,
        accountId: 'liab-acc',
      });
      await expect(
        d.service.payLiability('l1', payDto as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('registra el pago, saldando el pasivo y posteando el asiento', async () => {
      const d = build();
      const liability = {
        id: 'l1',
        code: 'LIAB-1',
        statusConceptId: ACCT.LIABILITY_ACTIVE,
        accountId: 'liab-acc',
        outstandingAmount: '1000.00',
        updatedAt: new Date(),
      };
      d.liabilityRepo.findById.mockResolvedValue(liability);
      const res = await d.service.payLiability('l1', payDto, actor);
      expect(res.transactionId).toBe('tx1');
      expect(res.liabilityStatus).toBe(ACCT.LIABILITY_SETTLED);
      expect(res.outstandingAmount).toBe('0.00');
      // 1 posteo principal + 1 posteo interés
      expect(d.liabilityRepo.createPosting).toHaveBeenCalledTimes(2);
    });

    it('el pago de una cuota reduce el saldo exactamente en su componente de capital (AC-26-12)', async () => {
      const d = build();
      const liability = {
        id: 'l1',
        code: 'LIAB-1',
        statusConceptId: ACCT.LIABILITY_ACTIVE,
        accountId: 'liab-acc',
        outstandingAmount: '1200.00',
        updatedAt: new Date(),
      };
      d.liabilityRepo.findById.mockResolvedValue(liability);
      const schedule = {
        id: 's1',
        liabilityId: 'l1',
        installmentNumber: 1,
        paidAmount: undefined,
        statusConceptId: ACCT.LIAB_SCHEDULE_PENDING,
        updatedAt: new Date(),
      };
      d.liabilityRepo.findScheduleById.mockResolvedValue(schedule);

      const dto = {
        practiceId: 'p1',
        amount: '412.00',
        principalComponent: '400.00',
        interestComponent: '12.00',
        bankAccountId: 'bank',
        interestExpenseAccountId: 'int-exp',
        liabilityScheduleId: 's1',
      };
      const res = await d.service.payLiability('l1', dto as any, actor);

      // 1200.00 - 400.00 (capital), no - 412.00 (importe total).
      expect(res.outstandingAmount).toBe('800.00');
      expect(res.liabilityStatus).toBe(ACCT.LIABILITY_ACTIVE);
      expect(schedule.paidAmount).toBe('412.00');
      expect(schedule.statusConceptId).toBe(ACCT.LIAB_SCHEDULE_PAID);
      // La cuota se lee bloqueada (FOR UPDATE) dentro de la transacción.
      expect(d.liabilityRepo.findScheduleById).toHaveBeenCalledWith(
        d.tx,
        's1',
        { forUpdate: true },
      );
    });

    it('no paga dos veces la misma cuota: la segunda vez responde 422 y no crea pago ni asiento (AC-26-13)', async () => {
      const d = build();
      d.liabilityRepo.findById.mockResolvedValue({
        id: 'l1',
        code: 'LIAB-1',
        statusConceptId: ACCT.LIABILITY_ACTIVE,
        accountId: 'liab-acc',
        outstandingAmount: '800.00',
        updatedAt: new Date(),
      });
      d.liabilityRepo.findScheduleById.mockResolvedValue({
        id: 's1',
        liabilityId: 'l1',
        installmentNumber: 1,
        paidAmount: '412.00',
        statusConceptId: ACCT.LIAB_SCHEDULE_PAID,
      });
      await expect(
        d.service.payLiability(
          'l1',
          {
            ...payDto,
            amount: '412.00',
            principalComponent: '400.00',
            interestComponent: '12.00',
            liabilityScheduleId: 's1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.posting.post).not.toHaveBeenCalled();
      expect(d.liabilityRepo.createPayment).not.toHaveBeenCalled();
    });

    it('rechaza (404) una cuota que pertenece a otro pasivo', async () => {
      const d = build();
      d.liabilityRepo.findById.mockResolvedValue({
        id: 'l1',
        code: 'LIAB-1',
        statusConceptId: ACCT.LIABILITY_ACTIVE,
        accountId: 'liab-acc',
        outstandingAmount: '800.00',
      });
      d.liabilityRepo.findScheduleById.mockResolvedValue({
        id: 's9',
        liabilityId: 'otro',
        statusConceptId: ACCT.LIAB_SCHEDULE_PENDING,
      });
      await expect(
        d.service.payLiability(
          'l1',
          { ...payDto, liabilityScheduleId: 's9' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.posting.post).not.toHaveBeenCalled();
    });
  });
});
