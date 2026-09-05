import { jest } from '@jest/globals';

/** Ver `asset.service.spec.ts`: mismo envoltorio de `jest.fn` sin tipar. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PractitionerAccountingService } from './practitioner-accounting.service';
import { ACCT } from '../accounting.concepts';
import { PreconditionFailedException, ResourceNotFoundException } from '../../../common';

const actor = {
  id: 'user-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'prof-1',
} as any;

/**
 * FT-26 no toca el auto-servicio de Carril 18 (consultas pagadas): esos
 * colaboradores se pasan vacíos/no usados a propósito, y `em.fork`/
 * `em.transactional` devuelven un objeto opaco — los repositorios están
 * mockeados directo, así que a `em` nunca le preguntan nada de verdad.
 */
function build() {
  const tx = { findOne: mockFn().mockResolvedValue(null), flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    fork: mockFn(() => ({})),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const practiceTenantLookup = {
    findActivePracticeIdsForPractitioner: mockFn().mockResolvedValue(['p1']),
  };
  const assetService = {
    capitalize: mockFn().mockResolvedValue({ id: 'as1', code: 'AST-1', status: ACCT.ASSET_ACTIVE, bookValue: '100.00', transactionId: 'tx1' }),
    runDepreciation: mockFn().mockResolvedValue({ depreciatedAssets: 1, transactionIds: ['tx-dep-1'] }),
  };
  const liabilityService = {
    payLiability: mockFn().mockResolvedValue({ id: 'pay1', transactionId: 'tx-pay-1', liabilityStatus: ACCT.LIABILITY_ACTIVE, outstandingAmount: '583.33' }),
  };
  const assetRepo = {
    findById: mockFn().mockResolvedValue({ id: 'as1', practiceId: 'p1' }),
    listByPractice: mockFn().mockResolvedValue([
      { id: 'as1', code: 'AST-1', name: 'Silla', statusConceptId: ACCT.ASSET_ACTIVE, bookValue: '900.00', acquisitionCost: '1000.00', automated: true },
    ]),
    setAutomated: mockFn().mockResolvedValue({ id: 'as1', automated: false }),
    findDepreciation: mockFn().mockResolvedValue({ amount: '16.67' }),
  };
  const liabilityRepo = {
    findById: mockFn().mockResolvedValue({ id: 'liab1', practiceId: 'p1', code: 'LIAB-1' }),
    listByPractice: mockFn().mockResolvedValue([
      { id: 'liab1', code: 'LIAB-1', name: 'Préstamo equipo', creditorName: 'Banco X', principalAmount: '1200.00', outstandingAmount: '1200.00', statusConceptId: ACCT.LIABILITY_ACTIVE, automated: true },
    ]),
    setAutomated: mockFn().mockResolvedValue({ id: 'liab1', automated: false }),
    createLiability: mockFn((_tx: any, d: any) => ({ id: 'liab1', code: d.code })),
    createSchedule: mockFn((_tx: any, d: any) => ({
      id: `sched-${d.installmentNumber}`,
      installmentNumber: d.installmentNumber,
      dueDate: d.dueDate,
      principalDue: d.principalDue,
      interestDue: d.interestDue,
      paidAmount: '0.00',
      statusConceptId: d.statusConceptId,
    })),
    findNextDueSchedule: mockFn().mockResolvedValue({
      id: 'sched-1',
      installmentNumber: 1,
      principalDue: '100.00',
      interestDue: '12.00',
    }),
  };
  const fiscalRepo = {
    findOpenPeriodForPractice: mockFn().mockResolvedValue({ id: 'period-1' }),
  };
  const logger = { setContext: mockFn(), info: mockFn() };

  const service = new PractitionerAccountingService(
    em as any,
    {} as any, // ledgerService — no lo usa ningún método de FT-26
    practiceTenantLookup as any,
    {} as any, // billingLedgerService
    {} as any, // notificationsService
    assetService as any,
    liabilityService as any,
    assetRepo as any,
    liabilityRepo as any,
    fiscalRepo as any,
    logger as any,
  );

  return { service, em, tx, assetService, liabilityService, assetRepo, liabilityRepo, fiscalRepo, practiceTenantLookup };
}

describe('PractitionerAccountingService — FT-26 (activos y pasivos)', () => {
  describe('listAssets / listLiabilities', () => {
    it('rechaza si el profesional no tiene vinculación activa con la práctica', async () => {
      const d = build();
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue([]);
      await expect(d.service.listAssets('p1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('lista los activos de la práctica, ya mapeados a resumen', async () => {
      const d = build();
      const items = await d.service.listAssets('p1', actor);
      expect(items).toEqual([
        { id: 'as1', code: 'AST-1', name: 'Silla', statusConceptId: ACCT.ASSET_ACTIVE, bookValue: '900.00', acquisitionCost: '1000.00', automated: true },
      ]);
    });

    it('lista los pasivos de la práctica, ya mapeados a resumen', async () => {
      const d = build();
      const items = await d.service.listLiabilities('p1', actor);
      expect(items[0]).toMatchObject({ id: 'liab1', code: 'LIAB-1', automated: true });
    });
  });

  describe('capitalizeOwnAsset', () => {
    it('exige la práctica y delega en AssetService.capitalize', async () => {
      const d = build();
      const dto = { practiceId: 'p1', code: 'AST-2', name: 'Monitor' } as any;
      const res = await d.service.capitalizeOwnAsset(dto, actor);
      expect(d.assetService.capitalize).toHaveBeenCalledWith(dto, actor);
      expect(res.id).toBe('as1');
    });
  });

  describe('setAssetAutomation / setLiabilityAutomation', () => {
    it('rechaza (404) un activo que no existe', async () => {
      const d = build();
      d.assetRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.setAssetAutomation('nope', { automated: false }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza un activo de una práctica ajena', async () => {
      const d = build();
      d.assetRepo.findById.mockResolvedValue({ id: 'as1', practiceId: 'otra-practica' });
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(['p1']);
      await expect(
        d.service.setAssetAutomation('as1', { automated: false }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('apaga la automatización de un pasivo propio', async () => {
      const d = build();
      await d.service.setLiabilityAutomation('liab1', { automated: false }, actor);
      expect(d.liabilityRepo.setAutomated).toHaveBeenCalledWith(expect.anything(), 'liab1', false);
    });
  });

  describe('registerAssetProgress', () => {
    it('corre la depreciación de este activo sobre el período fiscal abierto', async () => {
      const d = build();
      const res = await d.service.registerAssetProgress(
        'as1',
        { depreciationExpenseAccountId: 'acc-exp', accumulatedDepreciationAccountId: 'acc-dep' },
        actor,
      );
      expect(d.assetService.runDepreciation).toHaveBeenCalledWith(
        expect.objectContaining({ assetId: 'as1', fiscalPeriodId: 'period-1' }),
        actor,
      );
      expect(res).toEqual({ transactionId: 'tx-dep-1', amount: '16.67' });
    });

    it('rechaza si no hay período fiscal abierto para la fecha', async () => {
      const d = build();
      d.fiscalRepo.findOpenPeriodForPractice.mockResolvedValue(null);
      await expect(
        d.service.registerAssetProgress(
          'as1',
          { depreciationExpenseAccountId: 'acc-exp', accumulatedDepreciationAccountId: 'acc-dep' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rechaza si el activo no tenía depreciación pendiente en el período', async () => {
      const d = build();
      d.assetService.runDepreciation.mockResolvedValue({ depreciatedAssets: 0, transactionIds: [] });
      await expect(
        d.service.registerAssetProgress(
          'as1',
          { depreciationExpenseAccountId: 'acc-exp', accumulatedDepreciationAccountId: 'acc-dep' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('createOwnLiability', () => {
    it('rechaza un código de pasivo duplicado en la práctica', async () => {
      const d = build();
      d.tx.findOne.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.createOwnLiability(
          {
            practiceId: 'p1',
            code: 'LIAB-1',
            name: 'Préstamo',
            accountId: 'acc-liab',
            principalAmount: '1200.00',
            installments: 3,
            startDate: '2026-01-01',
          } as any,
          actor,
        ),
      ).rejects.toThrow();
    });

    it('crea el pasivo y su cronograma con tantas cuotas como se pidieron', async () => {
      const d = build();
      const res = await d.service.createOwnLiability(
        {
          practiceId: 'p1',
          code: 'LIAB-2',
          name: 'Préstamo equipo',
          accountId: 'acc-liab',
          principalAmount: '1200.00',
          interestRate: '12.00',
          installments: 3,
          startDate: '2026-01-01',
        } as any,
        actor,
      );

      expect(d.liabilityRepo.createLiability).toHaveBeenCalledTimes(1);
      expect(d.liabilityRepo.createSchedule).toHaveBeenCalledTimes(3);
      expect(res.schedule).toHaveLength(3);
      expect(res.schedule[0]?.installmentNumber).toBe(1);
    });

    it('por omisión, el pasivo nace automatizado', async () => {
      const d = build();
      await d.service.createOwnLiability(
        {
          practiceId: 'p1',
          code: 'LIAB-3',
          name: 'Préstamo',
          accountId: 'acc-liab',
          principalAmount: '300.00',
          installments: 1,
          startDate: '2026-01-01',
        } as any,
        actor,
      );
      expect(d.liabilityRepo.createLiability).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ automated: true }),
      );
    });
  });

  describe('registerLiabilityProgress', () => {
    it('paga la próxima cuota pendiente, sumando principal e interés', async () => {
      const d = build();
      const res = await d.service.registerLiabilityProgress(
        'liab1',
        { bankAccountId: 'acc-bank', interestExpenseAccountId: 'acc-int' },
        actor,
      );

      expect(d.liabilityService.payLiability).toHaveBeenCalledWith(
        'liab1',
        expect.objectContaining({
          practiceId: 'p1',
          amount: '112.00',
          principalComponent: '100.00',
          interestComponent: '12.00',
          liabilityScheduleId: 'sched-1',
        }),
        actor,
      );
      expect(res).toEqual({ transactionId: 'tx-pay-1', installmentNumber: 1, amount: '112.00' });
    });

    it('rechaza si el pasivo no tiene cuotas pendientes', async () => {
      const d = build();
      d.liabilityRepo.findNextDueSchedule.mockResolvedValue(null);
      await expect(
        d.service.registerLiabilityProgress(
          'liab1',
          { bankAccountId: 'acc-bank', interestExpenseAccountId: 'acc-int' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
});
