import { jest } from '@jest/globals';

/** Ver `asset.service.spec.ts`: mismo envoltorio de `jest.fn` sin tipar. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PractitionerAccountingService } from './practitioner-accounting.service';
import { ACCT } from '../accounting.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

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
  const tx = {
    findOne: mockFn().mockResolvedValue(null),
    flush: mockFn().mockResolvedValue(undefined),
  };
  const em = {
    fork: mockFn(() => ({})),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const practiceTenantLookup = {
    findActivePracticeIdsForPractitioner: mockFn().mockResolvedValue(['p1']),
  };
  const assetService = {
    capitalize: mockFn().mockResolvedValue({
      id: 'as1',
      code: 'AST-1',
      status: ACCT.ASSET_ACTIVE,
      bookValue: '100.00',
      transactionId: 'tx1',
    }),
    runDepreciation: mockFn().mockResolvedValue({
      depreciatedAssets: 1,
      transactionIds: ['tx-dep-1'],
    }),
  };
  const liabilityService = {
    payLiability: mockFn().mockResolvedValue({
      id: 'pay1',
      transactionId: 'tx-pay-1',
      liabilityStatus: ACCT.LIABILITY_ACTIVE,
      outstandingAmount: '583.33',
    }),
  };
  const assetRepo = {
    findById: mockFn().mockResolvedValue({ id: 'as1', practiceId: 'p1' }),
    listByPractice: mockFn().mockResolvedValue([
      {
        id: 'as1',
        code: 'AST-1',
        name: 'Silla',
        statusConceptId: ACCT.ASSET_ACTIVE,
        assetTypeConceptId: ACCT.ASSET_TYPE_EQUIPMENT,
        depreciationMethodConceptId: ACCT.DEPRECIATION_METHOD_STRAIGHT_LINE,
        accountId: 'acc-acq',
        acquisitionDate: new Date('2026-01-15T00:00:00Z'),
        acquisitionCost: '1000.00',
        usefulLifeMonths: 60,
        salvageValue: '0.00',
        accumulatedDepreciation: '100.00',
        bookValue: '900.00',
        automated: true,
      },
    ]),
    setAutomated: mockFn().mockResolvedValue({ id: 'as1', automated: false }),
    findDepreciation: mockFn().mockResolvedValue({ amount: '16.67' }),
  };
  const accountsRepo = {
    findByIds: mockFn().mockResolvedValue([
      { id: 'acc-acq', currencyConceptId: 'cur-bob' },
      { id: 'acc-liab', currencyConceptId: undefined },
    ]),
  };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const liabilityRepo = {
    findById: mockFn().mockResolvedValue({
      id: 'liab1',
      practiceId: 'p1',
      code: 'LIAB-1',
      accountId: 'acc-liab',
      principalAmount: '1200.00',
      outstandingAmount: '1200.00',
    }),
    listByPractice: mockFn().mockResolvedValue([
      {
        id: 'liab1',
        code: 'LIAB-1',
        name: 'Préstamo equipo',
        creditorName: 'Banco X',
        accountId: 'acc-liab',
        principalAmount: '1200.00',
        outstandingAmount: '1200.00',
        interestRate: '12.00',
        startDate: new Date('2026-01-01T00:00:00Z'),
        dueDate: new Date('2026-04-01T00:00:00Z'),
        statusConceptId: ACCT.LIABILITY_ACTIVE,
        automated: true,
      },
    ]),
    listSchedules: mockFn().mockResolvedValue([
      {
        id: 'sched-1',
        installmentNumber: 1,
        dueDate: new Date('2026-02-01T00:00:00Z'),
        principalDue: '400.00',
        interestDue: '12.00',
        paidAmount: '412.00',
        statusConceptId: ACCT.LIAB_SCHEDULE_PAID,
      },
      {
        id: 'sched-2',
        installmentNumber: 2,
        dueDate: new Date('2026-03-01T00:00:00Z'),
        principalDue: '400.00',
        interestDue: '8.00',
        paidAmount: undefined,
        statusConceptId: ACCT.LIAB_SCHEDULE_PENDING,
      },
      {
        id: 'sched-3',
        installmentNumber: 3,
        dueDate: new Date('2026-04-01T00:00:00Z'),
        principalDue: '400.00',
        interestDue: '4.00',
        paidAmount: undefined,
        statusConceptId: ACCT.LIAB_SCHEDULE_PENDING,
      },
    ]),
    setAutomated: mockFn().mockResolvedValue({ id: 'liab1', automated: false }),
    createLiability: mockFn((_tx: any, d: any) => ({
      id: 'liab1',
      code: d.code,
    })),
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
    accountsRepo as any,
    auditTrail as any,
    logger as any,
  );

  return {
    service,
    em,
    tx,
    assetService,
    liabilityService,
    assetRepo,
    liabilityRepo,
    fiscalRepo,
    accountsRepo,
    auditTrail,
    practiceTenantLookup,
  };
}

describe('PractitionerAccountingService — FT-26 (activos y pasivos)', () => {
  describe('listAssets / listLiabilities', () => {
    it('rechaza si el profesional no tiene vinculación activa con la práctica', async () => {
      const d = build();
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        [],
      );
      await expect(d.service.listAssets('p1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('lista los activos con lo que se guardó al dar de alta y su avance (AC-26-1, AC-26-14)', async () => {
      const d = build();
      const items = await d.service.listAssets('p1', actor);
      expect(items).toEqual([
        {
          id: 'as1',
          code: 'AST-1',
          name: 'Silla',
          statusConceptId: ACCT.ASSET_ACTIVE,
          assetTypeConceptId: ACCT.ASSET_TYPE_EQUIPMENT,
          depreciationMethodConceptId: ACCT.DEPRECIATION_METHOD_STRAIGHT_LINE,
          accountId: 'acc-acq',
          currencyConceptId: 'cur-bob',
          acquisitionDate: '2026-01-15',
          acquisitionCost: '1000.00',
          usefulLifeMonths: 60,
          salvageValue: '0.00',
          accumulatedDepreciation: '100.00',
          bookValue: '900.00',
          automated: true,
        },
      ]);
      // Los importes salen tal cual de la fila: cadenas, nunca números.
      expect(typeof items[0]?.bookValue).toBe('string');
    });

    it('la moneda del activo es la de su cuenta de adquisición, en una sola consulta (AC-26-18)', async () => {
      const d = build();
      await d.service.listAssets('p1', actor);
      expect(d.accountsRepo.findByIds).toHaveBeenCalledTimes(1);
      expect(d.accountsRepo.findByIds).toHaveBeenCalledWith(expect.anything(), [
        'acc-acq',
      ]);
    });

    it('lista los pasivos con capital, tasa, fechas, acreedor y avance (AC-26-10, AC-26-14)', async () => {
      const d = build();
      const items = await d.service.listLiabilities('p1', actor);
      expect(items[0]).toEqual({
        id: 'liab1',
        code: 'LIAB-1',
        name: 'Préstamo equipo',
        creditorName: 'Banco X',
        liabilityTypeConceptId: null,
        accountId: 'acc-liab',
        // La cuenta del pasivo no declara moneda: `null`, no un valor inventado.
        currencyConceptId: null,
        principalAmount: '1200.00',
        outstandingAmount: '1200.00',
        interestRate: '12.00',
        startDate: '2026-01-01',
        dueDate: '2026-04-01',
        statusConceptId: ACCT.LIABILITY_ACTIVE,
        automated: true,
      });
    });
  });

  describe('readLiabilitySchedule (AC-26-10, AC-26-11)', () => {
    it('devuelve el cronograma cuota por cuota, con capital e interés separados', async () => {
      const d = build();
      const res = await d.service.readLiabilitySchedule('liab1', actor);
      expect(res).toMatchObject({
        liabilityId: 'liab1',
        code: 'LIAB-1',
        principalAmount: '1200.00',
      });
      expect(res.schedule.map((c) => c.installmentNumber)).toEqual([1, 2, 3]);
      expect(res.schedule[0]).toEqual({
        id: 'sched-1',
        installmentNumber: 1,
        dueDate: '2026-02-01',
        principalDue: '400.00',
        interestDue: '12.00',
        paidAmount: '412.00',
        statusConceptId: ACCT.LIAB_SCHEDULE_PAID,
      });
      // Una cuota sin pago declara 0.00, no `undefined`.
      expect(res.schedule[1]?.paidAmount).toBe('0.00');
    });

    it('rechaza (422) el cronograma de un pasivo de una práctica ajena — no devuelve vacío (AC-26-15)', async () => {
      const d = build();
      d.liabilityRepo.findById.mockResolvedValue({
        id: 'liab1',
        practiceId: 'ajena',
        code: 'X',
      });
      await expect(
        d.service.readLiabilitySchedule('liab1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.liabilityRepo.listSchedules).not.toHaveBeenCalled();
    });

    it('rechaza (404) un pasivo inexistente', async () => {
      const d = build();
      d.liabilityRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.readLiabilitySchedule('nope', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
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
      d.assetRepo.findById.mockResolvedValue({
        id: 'as1',
        practiceId: 'otra-practica',
      });
      d.practiceTenantLookup.findActivePracticeIdsForPractitioner.mockResolvedValue(
        ['p1'],
      );
      await expect(
        d.service.setAssetAutomation('as1', { automated: false }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('apaga la automatización de un pasivo propio dejando quién lo hizo', async () => {
      const d = build();
      await d.service.setLiabilityAutomation(
        'liab1',
        { automated: false },
        actor,
      );
      expect(d.liabilityRepo.setAutomated).toHaveBeenCalledWith(
        expect.anything(),
        'liab1',
        false,
        'user-1',
      );
    });

    it('el cambio del interruptor queda en la cadena de auditoría, con el valor nuevo (AC-26-8)', async () => {
      const d = build();
      await d.service.setAssetAutomation('as1', { automated: false }, actor);
      expect(d.assetRepo.setAutomated).toHaveBeenCalledWith(
        expect.anything(),
        'as1',
        false,
        'user-1',
      );
      expect(d.auditTrail.record).toHaveBeenCalledWith(
        expect.anything(),
        actor,
        {
          action: 'ASSET_AUTOMATION_DISABLED',
          entity: 'asset',
          entityId: 'as1',
        },
      );

      await d.service.setLiabilityAutomation(
        'liab1',
        { automated: true },
        actor,
      );
      expect(d.auditTrail.record).toHaveBeenLastCalledWith(
        expect.anything(),
        actor,
        {
          action: 'LIABILITY_AUTOMATION_ENABLED',
          entity: 'liability',
          entityId: 'liab1',
        },
      );
      // Interruptor y sello de auditoría van en la misma transacción.
      expect(d.em.transactional).toHaveBeenCalledTimes(2);
    });

    it('un activo inexistente no deja rastro en la auditoría', async () => {
      const d = build();
      d.assetRepo.findById.mockResolvedValue({ id: 'as1', practiceId: 'p1' });
      d.assetRepo.setAutomated.mockResolvedValue(null);
      await expect(
        d.service.setAssetAutomation('as1', { automated: false }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.auditTrail.record).not.toHaveBeenCalled();
    });
  });

  describe('registerAssetProgress', () => {
    it('corre la depreciación de este activo sobre el período fiscal abierto', async () => {
      const d = build();
      const res = await d.service.registerAssetProgress(
        'as1',
        {
          depreciationExpenseAccountId: 'acc-exp',
          accumulatedDepreciationAccountId: 'acc-dep',
        },
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
          {
            depreciationExpenseAccountId: 'acc-exp',
            accumulatedDepreciationAccountId: 'acc-dep',
          },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('con la automatización apagada, el disparo manual sigue funcionando (AC-26-9)', async () => {
      const d = build();
      d.assetRepo.findById.mockResolvedValue({
        id: 'as1',
        practiceId: 'p1',
        automated: false,
      });
      const res = await d.service.registerAssetProgress(
        'as1',
        {
          depreciationExpenseAccountId: 'acc-exp',
          accumulatedDepreciationAccountId: 'acc-dep',
        },
        actor,
      );
      expect(d.assetService.runDepreciation).toHaveBeenCalledTimes(1);
      expect(res.transactionId).toBe('tx-dep-1');
    });

    it('rechaza si el activo no tenía depreciación pendiente en el período', async () => {
      const d = build();
      d.assetService.runDepreciation.mockResolvedValue({
        depreciatedAssets: 0,
        transactionIds: [],
      });
      await expect(
        d.service.registerAssetProgress(
          'as1',
          {
            depreciationExpenseAccountId: 'acc-exp',
            accumulatedDepreciationAccountId: 'acc-dep',
          },
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
      expect(res).toEqual({
        transactionId: 'tx-pay-1',
        installmentNumber: 1,
        amount: '112.00',
      });
    });

    it('suma capital e interés en centésimas enteras, sin ruido de coma flotante (AC-26-12)', async () => {
      const d = build();
      // 0.1 + 0.2 en float da 0.30000000000000004; en centésimas da 0.30 exacto.
      d.liabilityRepo.findNextDueSchedule.mockResolvedValue({
        id: 'sched-1',
        installmentNumber: 1,
        principalDue: '0.10',
        interestDue: '0.20',
      });
      const res = await d.service.registerLiabilityProgress(
        'liab1',
        { bankAccountId: 'acc-bank', interestExpenseAccountId: 'acc-int' },
        actor,
      );
      expect(res.amount).toBe('0.30');
      expect(d.liabilityService.payLiability).toHaveBeenCalledWith(
        'liab1',
        expect.objectContaining({
          amount: '0.30',
          principalComponent: '0.10',
          interestComponent: '0.20',
        }),
        actor,
      );
    });

    it('con la automatización apagada, el pago manual de la cuota sigue funcionando (AC-26-9)', async () => {
      const d = build();
      d.liabilityRepo.findById.mockResolvedValue({
        id: 'liab1',
        practiceId: 'p1',
        code: 'LIAB-1',
        automated: false,
      });
      const res = await d.service.registerLiabilityProgress(
        'liab1',
        { bankAccountId: 'acc-bank', interestExpenseAccountId: 'acc-int' },
        actor,
      );
      expect(res.installmentNumber).toBe(1);
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
