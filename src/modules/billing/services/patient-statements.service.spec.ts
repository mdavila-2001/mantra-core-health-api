import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PatientStatementsService } from './patient-statements.service';
import { ConflictException, ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);
  const statementsRepo = {
    findByPeriod: mockFn(),
    create: mockFn(),
    findByPracticePage: mockFn().mockResolvedValue([]),
  };
  const invoicesRepo = { findByPatientInRange: mockFn() };
  const linksRepo = { create: mockFn() };
  const practiceTenantLookup = {
    findTenantOfPractice: mockFn().mockResolvedValue('tenant-1'),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PatientStatementsService(
    em as any,
    statementsRepo,
    invoicesRepo as any,
    linksRepo,
    practiceTenantLookup as any,
    logger as any,
  );
  return {
    service,
    em,
    statementsRepo,
    invoicesRepo,
    linksRepo,
    practiceTenantLookup,
  };
}

describe('PatientStatementsService (UC-17-09)', () => {
  it('aggregates charges/payments and computes the closing balance', async () => {
    const d = build();
    d.statementsRepo.findByPeriod.mockResolvedValue(null);
    d.invoicesRepo.findByPatientInRange.mockResolvedValue([
      { id: 'i1', total: '100.00', paidTotal: '20.00' },
      { id: 'i2', total: '50.00', paidTotal: '0.00' },
    ]);
    d.statementsRepo.create.mockImplementation((_tx: any, data: any) => ({
      id: 's1',
      patientProfileId: data.patientProfileId,
      ...data,
    }));

    const res = await d.service.generate(
      {
        practiceId: 'pr1',
        patientProfileId: 'p1',
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
        openingBalance: '10.00',
        tenantId: 't1',
      },
      actor,
    );

    expect(res.charges).toBe('150.00');
    expect(res.payments).toBe('20.00');
    expect(res.closingBalance).toBe('140.00');
    expect(d.linksRepo.create).toHaveBeenCalledTimes(2);
  });

  it('rejects a duplicate statement for the same period (conflict)', async () => {
    const d = build();
    d.statementsRepo.findByPeriod.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.generate(
        {
          practiceId: 'pr1',
          patientProfileId: 'p1',
          periodStart: '2026-01-01',
          periodEnd: '2026-01-31',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  describe('listByPractice (CV-12)', () => {
    it('pages by id, scoped to the given practice', async () => {
      const d = build();
      d.statementsRepo.findByPracticePage.mockResolvedValue([
        {
          id: 's1',
          patientProfileId: 'p1',
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-01-31'),
          openingBalance: '0.00',
          charges: '10.00',
          payments: '0.00',
          closingBalance: '10.00',
        },
      ]);

      const res = await d.service.listByPractice('pr1', 'tenant-1', {
        limit: 10,
      });

      expect(d.practiceTenantLookup.findTenantOfPractice).toHaveBeenCalledWith(
        'pr1',
      );
      expect(d.statementsRepo.findByPracticePage).toHaveBeenCalledWith(
        d.em,
        'pr1',
        undefined,
        11,
      );
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).toBeNull();
    });

    it('throws 404 without a query when the practice belongs to another tenant (isolation)', async () => {
      const d = build();
      d.practiceTenantLookup.findTenantOfPractice.mockResolvedValue('tenant-b');
      await expect(
        d.service.listByPractice('pr1', 'tenant-a', {}),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.statementsRepo.findByPracticePage).not.toHaveBeenCalled();
    });
  });
});
