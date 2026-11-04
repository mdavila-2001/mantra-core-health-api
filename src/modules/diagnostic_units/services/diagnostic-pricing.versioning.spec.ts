import { describe, expect, it, jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import { DiagnosticStudyPricesRepository } from '../repositories';
import { DiagnosticPricingService } from './diagnostic-pricing.service';
import { DUNIT } from '../diagnostic_units.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'admin-1' } as any;

/** Prices of one schedule, by offering, as the unique index sees them. */
const rows = [
  { priceScheduleId: 'ps1', diagnosticStudyOfferingId: 'oA', versionNumber: 1 },
  { priceScheduleId: 'ps1', diagnosticStudyOfferingId: 'oA', versionNumber: 2 },
];

function build() {
  const tx: any = {
    getReference: mockFn((_cls: unknown, id: string) => ({ id })),
    lock: mockFn(async () => undefined),
    find: mockFn(async (_cls: unknown, where: any) =>
      rows
        .filter((r) =>
          Object.entries(where).every(([k, v]) => (r as any)[k] === v),
        )
        .sort((a, b) => b.versionNumber - a.versionNumber)
        .slice(0, 1),
    ),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const scope = {
    schedule: mockFn(async () => ({
      id: 'ps1',
      diagnosticUnitId: 'u1',
      statusConceptId: DUNIT.SCHEDULE_ACTIVE,
    })),
    offering: mockFn(async () => ({ id: 'oB', diagnosticUnitId: 'u1' })),
  };
  const pricesRepo = new DiagnosticStudyPricesRepository();
  const created: any[] = [];
  jest.spyOn(pricesRepo, 'findActive').mockResolvedValue(null);
  jest.spyOn(pricesRepo, 'create').mockImplementation(((_em: any, d: any) => {
    created.push(d);
    return { id: 'pr', statusConceptId: DUNIT.PRICE_ACTIVE, ...d };
  }) as any);
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new DiagnosticPricingService(
    em as any,
    scope as any,
    {} as any,
    pricesRepo,
    logger as any,
  );
  return { service, tx, pricesRepo, created };
}

describe('DiagnosticPricingService.addStudyPrice numbering', () => {
  it("the first price of another offering takes the schedule's next number, not 1", async () => {
    const t = build();
    const res = await t.service.addStudyPrice(
      'ps1',
      { diagnosticStudyOfferingId: 'oB', baseAmount: '10' } as any,
      actor,
    );
    // Offering oB has no prices yet, but (ps1, 1) and (ps1, 2) are taken by oA.
    expect(res.versionNumber).toBe(3);
    expect(t.created[0]).toMatchObject({
      priceScheduleId: 'ps1',
      diagnosticStudyOfferingId: 'oB',
      versionNumber: 3,
    });
  });

  it('locks the schedule row FOR UPDATE before it reads the numbers', async () => {
    const t = build();
    jest.spyOn(t.pricesRepo, 'maxVersion');
    await t.service.addStudyPrice(
      'ps1',
      { diagnosticStudyOfferingId: 'oB', baseAmount: '10' } as any,
      actor,
    );
    expect(t.tx.lock).toHaveBeenCalledWith(
      { id: 'ps1' },
      LockMode.PESSIMISTIC_WRITE,
    );
    expect(t.tx.lock.mock.invocationCallOrder[0]).toBeLessThan(
      t.tx.find.mock.invocationCallOrder[0],
    );
  });
});
