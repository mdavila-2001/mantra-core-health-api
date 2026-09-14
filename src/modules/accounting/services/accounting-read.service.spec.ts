import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ForbiddenException } from '@nestjs/common';
import { AccountingReadService } from './accounting-read.service';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { ACCT } from '../accounting.concepts';

/**
 * Las seis lecturas del cockpit contable. Lo que estas pruebas fijan:
 *
 * 1. El ejercicio elegido es el que cubre hoy, no cualquiera de la práctica.
 * 2. Una práctica sin ejercicios, sin cartera vencida real o sin devengos
 *    responde con datos vacíos coherentes, no con un error disfrazado.
 * 3. El flujo del documento sólo muestra reversiones, en el orden fijo
 *    ORIGEN → ACTUAL → REVERSIÓN.
 * 4. Las fórmulas de activos y devengos son las de sus corridas, no una
 *    aproximación nueva.
 */

const PRACTICE = 'prac-1';
const TENANT = 'tenant-1';

function build(
  overrides: {
    practica?: { id: string; tenantId: string } | null;
  } = {},
) {
  const tx: any = {
    findOne: mockFn(() =>
      Promise.resolve(
        overrides.practica === undefined
          ? { id: PRACTICE, tenantId: TENANT }
          : overrides.practica,
      ),
    ),
    find: mockFn(() => Promise.resolve([])),
  };
  const em = { fork: mockFn(() => tx) };

  const fiscalRepo = {
    findYearById: mockFn(),
    findOpenPeriodForPractice: mockFn(),
    findYearByCode: mockFn(),
    createYear: mockFn(),
    createPeriod: mockFn(),
    findPeriodById: mockFn(),
    findYearsByPractice: mockFn(() => Promise.resolve([])),
    findPeriodsByYear: mockFn(() => Promise.resolve([])),
    findPeriodsByIds: mockFn(() => Promise.resolve([])),
  };
  const subledgerRepo = {
    findSubledgerById: mockFn(),
    findOpenItemById: mockFn(),
    createOpenItem: mockFn(),
    findOpenItemsByReconciliationAccounts: mockFn(() => Promise.resolve([])),
    findClearingByNumber: mockFn(),
    createClearingDocument: mockFn(),
    createClearingItem: mockFn(),
  };
  const journalRepo = {
    findTransactionById: mockFn(() => Promise.resolve(null)),
    findByTransactionNumber: mockFn(),
    findTransactions: mockFn(() => Promise.resolve([])),
    findEntriesByTransaction: mockFn(() => Promise.resolve([])),
    findEntriesByTransactions: mockFn(() => Promise.resolve([])),
    createTransaction: mockFn(),
    createLedgerEntry: mockFn(),
    createAssignment: mockFn(),
    findLink: mockFn(),
    createLink: mockFn(),
    findTransactionsByIds: mockFn(() => Promise.resolve([])),
    findReversalLinksForTransaction: mockFn(() => Promise.resolve([])),
    findPostedEntriesWithAssignments: mockFn(() => Promise.resolve([])),
    ledgerEntriesForTransaction: mockFn(),
    assignmentForEntry: mockFn(),
    createFile: mockFn(),
  };
  const accountsRepo = {
    findById: mockFn(),
    findByCode: mockFn(),
    findByPractice: mockFn(() => Promise.resolve([])),
    create: mockFn(),
    findByIds: mockFn(() => Promise.resolve([])),
    findActiveRule: mockFn(),
  };
  const accrualRepo = {
    findObjectById: mockFn(),
    findObjectByNumber: mockFn(),
    createObject: mockFn(),
    createScheduleLine: mockFn(),
    findObjectsByPractice: mockFn(() => Promise.resolve([])),
    findScheduleLinesByObjectIds: mockFn(() => Promise.resolve([])),
    pendingLinesForPeriod: mockFn(),
    createPosting: mockFn(),
  };
  const controllingRepo = {
    findById: mockFn(),
    findByCode: mockFn(),
    listByTenant: mockFn(),
    listCostCentersByPractice: mockFn(() => Promise.resolve([])),
    listProfitCentersByTenant: mockFn(() => Promise.resolve([])),
    listSegmentsByTenant: mockFn(() => Promise.resolve([])),
  };
  const assetRepo = {
    findById: mockFn(),
    findByCode: mockFn(),
    activeAssets: mockFn(),
    listByPractice: mockFn(() => Promise.resolve([])),
    setAutomated: mockFn(),
    createAsset: mockFn(),
    createComponent: mockFn(),
    createValuation: mockFn(),
    createAssignment: mockFn(),
    createPosting: mockFn(),
    findDepreciation: mockFn(),
    createDepreciation: mockFn(),
  };

  const service = new AccountingReadService(
    em as any,
    fiscalRepo,
    subledgerRepo,
    journalRepo,
    accountsRepo,
    accrualRepo,
    controllingRepo,
    assetRepo,
  );

  return {
    service,
    tx,
    fiscalRepo,
    subledgerRepo,
    journalRepo,
    accountsRepo,
    accrualRepo,
    controllingRepo,
    assetRepo,
  };
}

const ACTOR_ADMIN: any = { id: 'u1', roles: ['SECURITY_ADMIN'] };

function periodo(
  id: string,
  code: string,
  startDate: Date,
  endDate: Date,
  statusConceptId: string,
) {
  return { id, code, startDate, endDate, statusConceptId, fiscalYearId: 'fy1' };
}

describe('AccountingReadService', () => {
  describe('fiscalYear (D-3)', () => {
    it('404 si la práctica no tiene ejercicios', async () => {
      const { service } = build();
      await expect(service.fiscalYear(PRACTICE, ACTOR_ADMIN)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });

    it('elige el ejercicio que cubre hoy sobre uno más viejo', async () => {
      const { service, fiscalRepo } = build();
      const hoy = new Date();
      hoy.setUTCHours(0, 0, 0, 0);
      const viejo = {
        id: 'fy-viejo',
        code: '2020',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2020-12-31'),
      };
      const vigente = {
        id: 'fy-vigente',
        code: '2026',
        startDate: new Date(hoy.getFullYear(), 0, 1),
        endDate: new Date(hoy.getFullYear(), 11, 31),
      };
      fiscalRepo.findYearsByPractice.mockResolvedValue([vigente, viejo]);
      const abierto = periodo(
        'p1',
        '2026-01',
        new Date(hoy.getFullYear(), 0, 1),
        new Date(hoy.getFullYear(), 11, 31),
        ACCT.PERIOD_OPEN,
      );
      fiscalRepo.findPeriodsByYear.mockResolvedValue([abierto]);

      const result = await service.fiscalYear(PRACTICE, ACTOR_ADMIN);

      expect(result.fiscalYearId).toBe('fy-vigente');
      expect(result.currentPeriodId).toBe('p1');
      expect(result.periods[0].periodNumber).toBe(1);
      expect(result.periods[0].status).toBe('OPEN');
      expect('closedAt' in result.periods[0]).toBe(false);
    });

    it('sin período abierto, cae al último período por fecha', async () => {
      const { service, fiscalRepo } = build();
      const anio = {
        id: 'fy1',
        code: '2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      };
      fiscalRepo.findYearsByPractice.mockResolvedValue([anio]);
      fiscalRepo.findPeriodsByYear.mockResolvedValue([
        periodo(
          'p1',
          '2026-01',
          new Date('2026-01-01'),
          new Date('2026-01-31'),
          ACCT.PERIOD_LOCKED,
        ),
        periodo(
          'p2',
          '2026-02',
          new Date('2026-02-01'),
          new Date('2026-02-28'),
          ACCT.PERIOD_LOCKED,
        ),
      ]);

      const result = await service.fiscalYear(PRACTICE, ACTOR_ADMIN);

      expect(result.currentPeriodId).toBe('p2');
      expect(result.periods.every((p) => p.status === 'CLOSED')).toBe(true);
    });

    it('un concepto de estado desconocido mapea a PLANNED', async () => {
      const { service, fiscalRepo } = build();
      fiscalRepo.findYearsByPractice.mockResolvedValue([
        {
          id: 'fy1',
          code: '2026',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
        },
      ]);
      fiscalRepo.findPeriodsByYear.mockResolvedValue([
        periodo(
          'p1',
          '2026-01',
          new Date('2026-01-01'),
          new Date('2026-01-31'),
          'otro-concepto',
        ),
      ]);

      const result = await service.fiscalYear(PRACTICE, ACTOR_ADMIN);
      expect(result.periods[0].status).toBe('PLANNED');
    });
  });

  describe('guardas de práctica (D-1)', () => {
    it('403 si la práctica es de otro tenant', async () => {
      const { service } = build({
        practica: { id: PRACTICE, tenantId: 'otro-tenant' },
      });
      await expect(
        runWithTenant(TENANT, () => service.dimensions(PRACTICE, ACTOR_ADMIN)),
      ).rejects.toThrow(ForbiddenException);
    });

    it('404 si la práctica no existe', async () => {
      const { service } = build({ practica: null });
      await expect(service.dimensions(PRACTICE, ACTOR_ADMIN)).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('openItems (D-7)', () => {
    it('excluye partidas con saldo cero, filtra por lado, y arma los cinco tramos', async () => {
      const { service, accountsRepo, subledgerRepo } = build();
      const cuenta = {
        id: 'acc1',
        code: '1.1.01',
        name: 'Clientes',
        normalBalanceConceptId: ACCT.DIRECTION_DEBIT,
      };
      accountsRepo.findByPractice.mockResolvedValue([cuenta]);

      const hoy = new Date();
      const vencidaHace120 = new Date(hoy.getTime() - 120 * 86400000);

      subledgerRepo.findOpenItemsByReconciliationAccounts.mockResolvedValue([
        {
          openItem: {
            id: 'oi-cero',
            subledgerAccountId: 'sl1',
            documentTypeConceptId: ACCT.DOC_TYPE_INVOICE,
            originalAmount: '100.00',
            outstandingAmount: '0.00',
            createdAt: hoy,
          },
          subledger: {
            id: 'sl1',
            reconciliationAccountId: 'acc1',
            businessPartnerId: 'bp1',
            subledgerRoleConceptId: ACCT.SUBLEDGER_CUSTOMER,
          },
        },
        {
          openItem: {
            id: 'oi-vencida',
            subledgerAccountId: 'sl1',
            documentTypeConceptId: ACCT.DOC_TYPE_INVOICE,
            originalAmount: '500.00',
            outstandingAmount: '500.00',
            dueDate: vencidaHace120,
            createdAt: hoy,
          },
          subledger: {
            id: 'sl1',
            reconciliationAccountId: 'acc1',
            businessPartnerId: 'bp1',
            subledgerRoleConceptId: ACCT.SUBLEDGER_CUSTOMER,
          },
        },
      ]);

      const result = await service.openItems(
        { practiceId: PRACTICE },
        ACTOR_ADMIN,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('oi-vencida');
      expect(result.items[0].side).toBe('RECEIVABLE');
      expect(result.items[0].agingBucket).toBe('D90_MAS');
      expect(result.items[0].clearedAmount).toBe('0.00');
      expect(result.aging).toHaveLength(5);
      expect(result.aging.map((a) => a.bucket)).toEqual([
        'CORRIENTE',
        'D1_30',
        'D31_60',
        'D61_90',
        'D90_MAS',
      ]);
      expect(result.aging.find((a) => a.bucket === 'D90_MAS')?.receivable).toBe(
        '500.00',
      );
      expect(result.totalReceivable).toBe('500.00');
      expect(result.totalPayable).toBe('0.00');

      const soloPayable = await service.openItems(
        { practiceId: PRACTICE, side: 'PAYABLE' },
        ACTOR_ADMIN,
      );
      expect(soloPayable.items).toHaveLength(0);
    });
  });

  describe('dimensions (D-9)', () => {
    it('agrega debe/haber por dimensión y SEGMENT da cero sin imputación', async () => {
      const { service, journalRepo, controllingRepo } = build();
      controllingRepo.listCostCentersByPractice.mockResolvedValue([
        { id: 'cc1', code: 'CC-1', name: 'Consulta' },
      ]);
      controllingRepo.listProfitCentersByTenant.mockResolvedValue([]);
      controllingRepo.listSegmentsByTenant.mockResolvedValue([
        { id: 'seg1', code: 'SEG-1', name: 'Segmento 1' },
      ]);
      journalRepo.findPostedEntriesWithAssignments.mockResolvedValue([
        {
          directionConceptId: ACCT.DIRECTION_DEBIT,
          amount: '100.00',
          amountBase: null,
          costCenterId: 'cc1',
          profitCenterId: null,
          segmentId: null,
        },
        {
          directionConceptId: ACCT.DIRECTION_CREDIT,
          amount: '40.00',
          amountBase: null,
          costCenterId: 'cc1',
          profitCenterId: null,
          segmentId: null,
        },
      ]);

      const result = await service.dimensions(PRACTICE, ACTOR_ADMIN);

      const cc = result.items.find((i) => i.id === 'cc1');
      expect(cc?.debit).toBe('100.00');
      expect(cc?.credit).toBe('40.00');
      expect(cc?.result).toBe('-60.00');

      const seg = result.items.find((i) => i.id === 'seg1');
      expect(seg?.debit).toBe('0.00');
      expect(seg?.credit).toBe('0.00');
      expect(seg?.result).toBe('0.00');
    });
  });

  describe('documentFlow (D-5)', () => {
    it('sin links, sólo ACTUAL', async () => {
      const { service, journalRepo } = build();
      journalRepo.findTransactionById.mockResolvedValue({
        id: 'tx1',
        practiceId: PRACTICE,
        transactionNumber: 'J-1',
        transactionDate: new Date('2026-01-01'),
        totalAmount: '10.00',
        statusConceptId: ACCT.TXN_POSTED,
      });

      const result = await service.documentFlow('tx1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].role).toBe('ACTUAL');
      expect(result.items[0].status).toBe('POSTED');
    });

    it('el original muestra ACTUAL + REVERSION', async () => {
      const { service, journalRepo } = build();
      journalRepo.findTransactionById.mockResolvedValue({
        id: 'tx1',
        practiceId: PRACTICE,
        transactionNumber: 'J-1',
        transactionDate: new Date('2026-01-01'),
        totalAmount: '10.00',
        statusConceptId: ACCT.TXN_REVERSED,
      });
      journalRepo.findReversalLinksForTransaction.mockResolvedValue([
        {
          sourceTransactionId: 'tx1',
          targetTransactionId: 'tx2',
          relationTypeConceptId: ACCT.RELATION_REVERSES,
        },
      ]);
      journalRepo.findTransactionsByIds.mockResolvedValue([
        {
          id: 'tx2',
          transactionNumber: 'J-2',
          transactionDate: new Date('2026-01-02'),
          totalAmount: '10.00',
          statusConceptId: ACCT.TXN_POSTED,
        },
      ]);

      const result = await service.documentFlow('tx1');

      expect(result.items.map((i) => i.role)).toEqual(['ACTUAL', 'REVERSION']);
    });

    it('la reversa muestra ORIGEN + ACTUAL', async () => {
      const { service, journalRepo } = build();
      journalRepo.findTransactionById.mockResolvedValue({
        id: 'tx2',
        practiceId: PRACTICE,
        transactionNumber: 'J-2',
        transactionDate: new Date('2026-01-02'),
        totalAmount: '10.00',
        statusConceptId: ACCT.TXN_POSTED,
      });
      journalRepo.findReversalLinksForTransaction.mockResolvedValue([
        {
          sourceTransactionId: 'tx1',
          targetTransactionId: 'tx2',
          relationTypeConceptId: ACCT.RELATION_REVERSES,
        },
      ]);
      journalRepo.findTransactionsByIds.mockResolvedValue([
        {
          id: 'tx1',
          transactionNumber: 'J-1',
          transactionDate: new Date('2026-01-01'),
          totalAmount: '10.00',
          statusConceptId: ACCT.TXN_REVERSED,
        },
      ]);

      const result = await service.documentFlow('tx2');

      expect(result.items.map((i) => i.role)).toEqual(['ORIGEN', 'ACTUAL']);
    });

    it('404 si el asiento no existe', async () => {
      const { service } = build();
      await expect(service.documentFlow('inexistente')).rejects.toThrow(
        ResourceNotFoundException,
      );
    });
  });

  describe('fixedAssets (D-6)', () => {
    it('la cuota respeta el saldo depreciable y no es depreciable si está retirado', async () => {
      const { service, assetRepo } = build();
      assetRepo.listByPractice.mockResolvedValue([
        {
          id: 'a1',
          code: 'A-001',
          name: 'Equipo',
          assetTypeConceptId: null,
          acquisitionCost: '1200.00',
          salvageValue: '0.00',
          bookValue: '1200.00',
          accumulatedDepreciation: '0.00',
          usefulLifeMonths: 12,
          statusConceptId: ACCT.ASSET_ACTIVE,
        },
        {
          id: 'a2',
          code: 'A-002',
          name: 'Retirado',
          assetTypeConceptId: null,
          acquisitionCost: '600.00',
          salvageValue: '0.00',
          bookValue: '600.00',
          accumulatedDepreciation: '0.00',
          usefulLifeMonths: 12,
          statusConceptId: 'otro-estado',
        },
      ]);

      const result = await service.fixedAssets(PRACTICE, ACTOR_ADMIN);

      const activo = result.items.find((i) => i.id === 'a1');
      expect(activo?.monthlyDepreciation).toBe('100.00');
      expect(activo?.depreciable).toBe(true);

      const retirado = result.items.find((i) => i.id === 'a2');
      expect(retirado?.status).toBe('RETIRED');
      expect(retirado?.depreciable).toBe(false);
      expect(retirado?.monthlyDepreciation).toBe('0.00');

      expect(result.monthlyCharge).toBe('100.00');
    });
  });

  describe('accrualObjects (D-6)', () => {
    it('calcula avance del cronograma y el importe de la próxima línea pendiente', async () => {
      const { service, accrualRepo, accountsRepo, fiscalRepo } = build();
      accrualRepo.findObjectsByPractice.mockResolvedValue([
        {
          id: 'ao1',
          objectNumber: 'ACR-001',
          expenseAccountId: 'exp1',
          accrualAccountId: 'acr1',
          totalAmount: '300.00',
          startDate: new Date('2026-01-01'),
        },
      ]);
      accrualRepo.findScheduleLinesByObjectIds.mockResolvedValue([
        {
          id: 'sl1',
          accrualObjectId: 'ao1',
          fiscalPeriodId: 'p1',
          plannedAmount: '100.00',
          postedAmount: '100.00',
          statusConceptId: ACCT.SCHEDULE_POSTED,
        },
        {
          id: 'sl2',
          accrualObjectId: 'ao1',
          fiscalPeriodId: 'p2',
          plannedAmount: '100.00',
          postedAmount: '0.00',
          statusConceptId: ACCT.SCHEDULE_PENDING,
        },
        {
          id: 'sl3',
          accrualObjectId: 'ao1',
          fiscalPeriodId: 'p3',
          plannedAmount: '100.00',
          postedAmount: '0.00',
          statusConceptId: ACCT.SCHEDULE_PENDING,
        },
      ]);
      fiscalRepo.findPeriodsByIds.mockResolvedValue([
        { id: 'p1', startDate: new Date('2026-01-01') },
        { id: 'p2', startDate: new Date('2026-02-01') },
        { id: 'p3', startDate: new Date('2026-03-01') },
      ]);
      accountsRepo.findByIds.mockResolvedValue([
        { id: 'exp1', accountTypeConceptId: ACCT.ACCOUNT_TYPE_EXPENSE },
      ]);

      const result = await service.accrualObjects(PRACTICE, ACTOR_ADMIN);

      expect(result.items).toHaveLength(1);
      const objeto = result.items[0];
      expect(objeto.periods).toBe(3);
      expect(objeto.postedPeriods).toBe(1);
      expect(objeto.remainingPeriods).toBe(2);
      expect(objeto.periodAmount).toBe('100.00');
      expect(objeto.recognizedAmount).toBe('100.00');
      expect(objeto.pendingAmount).toBe('200.00');
      expect(objeto.completed).toBe(false);
      expect(objeto.kind).toBe('EXPENSE');
      expect(result.pendingTotal).toBe('200.00');
      expect(result.periodCharge).toBe('100.00');
    });

    it('kind es REVENUE cuando la cuenta que debita es de ingreso', async () => {
      const { service, accrualRepo, accountsRepo, fiscalRepo } = build();
      accrualRepo.findObjectsByPractice.mockResolvedValue([
        {
          id: 'ao1',
          objectNumber: 'ACR-002',
          expenseAccountId: 'exp1',
          accrualAccountId: 'acr1',
          totalAmount: '0.00',
          startDate: new Date('2026-01-01'),
        },
      ]);
      accrualRepo.findScheduleLinesByObjectIds.mockResolvedValue([]);
      fiscalRepo.findPeriodsByIds.mockResolvedValue([]);
      accountsRepo.findByIds.mockResolvedValue([
        { id: 'exp1', accountTypeConceptId: ACCT.ACCOUNT_TYPE_REVENUE },
      ]);

      const result = await service.accrualObjects(PRACTICE, ACTOR_ADMIN);
      expect(result.items[0].kind).toBe('REVENUE');
      expect(result.items[0].completed).toBe(true);
    });
  });
});
