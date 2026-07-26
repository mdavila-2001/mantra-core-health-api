import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CareEpisodesService } from './care-episodes.service';
import { ConflictException } from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const episodesRepo = { findActiveByPatient: mockFn(), create: mockFn(), findById: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CareEpisodesService(em as any, episodesRepo as any, logger as any);
  return { service, tx, episodesRepo };
}

describe('CareEpisodesService (UC-08-01)', () => {
  it('opens a care episode and flushes', async () => {
    const d = build();
    d.episodesRepo.findActiveByPatient.mockResolvedValue(null);
    const created = {
      id: 'ep1',
      patientProfileId: 'p1',
      tenantId: 't1',
      statusConceptId: CLIN.EPISODE_ACTIVE,
      startAt: new Date('2026-01-01'),
      createdAt: new Date('2026-01-01'),
    };
    d.episodesRepo.create.mockReturnValue(created);

    const res = await d.service.open(
      { patientProfileId: 'p1', tenantId: 't1' } as any,
      actor,
    );

    expect(res.id).toBe('ep1');
    expect(res.status).toBe(CLIN.EPISODE_ACTIVE);
    expect(d.tx.flush).toHaveBeenCalledTimes(1);
  });

  it('rejects when an active episode already exists', async () => {
    const d = build();
    d.episodesRepo.findActiveByPatient.mockResolvedValue({ id: 'ep-existing' });
    await expect(
      d.service.open({ patientProfileId: 'p1', tenantId: 't1' } as any, actor),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(d.episodesRepo.create).not.toHaveBeenCalled();
  });
});
