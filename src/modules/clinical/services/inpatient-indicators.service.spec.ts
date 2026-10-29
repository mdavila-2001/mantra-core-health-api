import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common/tenant/tenant-context';
import {
  InpatientIndicatorsService,
  MAX_INDICATOR_DAYS,
  daysBetween,
} from './inpatient-indicators.service';

const fn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function build() {
  const tx = { execute: fn().mockResolvedValue([]) };
  const em = { transactional: fn((cb: any) => cb(tx)) };
  const access = {
    forSite: fn().mockResolvedValue({ tenantId: TENANT }),
    assertCan: fn(),
  };
  const census = {
    adjustmentsOf: fn().mockResolvedValue([]),
    snapshotOf: fn(),
  };
  return {
    service: new InpatientIndicatorsService(
      em as any,
      access as any,
      census as any,
    ),
    tx,
    access,
  };
}
const run = <T>(f: () => Promise<T>) => runWithTenant(TENANT, f);

describe('InpatientIndicatorsService · rango', () => {
  it('daysBetween cuenta días calendario', () => {
    expect(daysBetween('2026-03-01', '2026-03-07')).toBe(6);
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(daysBetween('2026-03-07', '2026-03-01')).toBe(-6);
  });

  it('más de 366 días ⇒ 422 INDICATOR_RANGE_TOO_LONG y no consulta nada', async () => {
    const b = build();
    await expect(
      run(() =>
        b.service.indicators(
          's',
          { from: '2025-01-01', to: '2026-01-02' } as any,
          { id: 'u' } as any,
        ),
      ),
    ).rejects.toMatchObject({
      status: 422,
      reason: 'INDICATOR_RANGE_TOO_LONG',
      details: { maxDays: MAX_INDICATOR_DAYS, requestedDays: 367 },
    });
    expect(b.tx.execute).not.toHaveBeenCalled();
  });

  it('exactamente 366 días se acepta; invertido ⇒ INDICATOR_RANGE_INVALID', async () => {
    const b = build();
    const ok = await run(() =>
      b.service.indicators(
        's',
        { from: '2025-01-01', to: '2025-12-31' } as any,
        { id: 'u' } as any,
      ),
    );
    expect(ok.days).toBe(365);
    expect(ok.coverage.daysClosed).toBe(0);
    expect(ok.coverage.daysMissing).toHaveLength(365);
    await expect(
      run(() =>
        b.service.indicators(
          's',
          { from: '2025-02-01', to: '2025-01-01' } as any,
          { id: 'u' } as any,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'INDICATOR_RANGE_INVALID' });
  });

  it('autoriza antes de calcular', async () => {
    const b = build();
    b.access.assertCan.mockImplementation(() => {
      throw Object.assign(new Error('403'), { status: 403 });
    });
    await expect(
      run(() =>
        b.service.indicators(
          's',
          { from: '2025-01-01', to: '2025-01-02' } as any,
          { id: 'u' } as any,
        ),
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(b.tx.execute).not.toHaveBeenCalled();
  });
});
