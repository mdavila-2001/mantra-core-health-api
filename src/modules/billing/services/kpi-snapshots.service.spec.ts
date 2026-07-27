import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { KpiSnapshotsService } from './kpi-snapshots.service';
import { ConflictException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const kpiRepo = { findExisting: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new KpiSnapshotsService(em as any, kpiRepo, logger as any);
  return { service, kpiRepo };
}

describe('KpiSnapshotsService (UC-17-12)', () => {
  it('records the snapshot when none exists for the key', async () => {
    const d = build();
    d.kpiRepo.findExisting.mockResolvedValue(null);
    d.kpiRepo.create.mockReturnValue({
      id: 'k1',
      kpiCode: 'DSO',
      valueNumeric: '42.50',
      recordedAt: new Date('2026-01-01'),
    });

    const res = await d.service.compute(
      { practiceId: 'pr1', kpiCode: 'DSO', valueNumeric: '42.50' },
      actor,
    );

    expect(res.id).toBe('k1');
    expect(res.kpiCode).toBe('DSO');
  });

  it('rejects a duplicate snapshot for the same key (conflict / idempotency)', async () => {
    const d = build();
    d.kpiRepo.findExisting.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.compute(
        {
          practiceId: 'pr1',
          kpiCode: 'DSO',
          valueNumeric: '42.50',
          computedAt: '2026-01-01T00:00:00.000Z',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
