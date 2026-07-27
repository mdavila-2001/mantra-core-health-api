import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PatientStatementsService } from './patient-statements.service';
import { ConflictException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const statementsRepo = { findByPeriod: mockFn(), create: mockFn() };
  const invoicesRepo = { findByPatientInRange: mockFn() };
  const linksRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PatientStatementsService(
    em as any,
    statementsRepo,
    invoicesRepo as any,
    linksRepo,
    logger as any,
  );
  return { service, statementsRepo, invoicesRepo, linksRepo };
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
});
