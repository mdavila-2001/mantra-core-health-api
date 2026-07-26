import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PrivacyRestrictionsService } from './privacy-restrictions.service';
import { CONS } from '../consent.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const restrictionsRepo = { create: mockFn() };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new PrivacyRestrictionsService(em as any, restrictionsRepo as any, eventsRepo as any, logger as any);
  return { service, tx, restrictionsRepo, eventsRepo };
}

describe('PrivacyRestrictionsService', () => {
  it('apply (UC-07-07) creates an active restriction and records the applied event', async () => {
    const d = build();
    const created = { id: 'r1', patientProfileId: 'p1', statusConceptId: CONS.RESTRICTION_ACTIVE, createdAt: new Date() };
    d.restrictionsRepo.create.mockReturnValue(created);

    const res = await d.service.apply({ patientProfileId: 'p1', dataClassConceptId: 'dc1' } as any, actor);

    expect(res).toEqual({ id: 'r1', patientProfileId: 'p1', status: CONS.RESTRICTION_ACTIVE, createdAt: created.createdAt });
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ eventTypeConceptId: CONS.EVENT_RESTRICTION_APPLIED }),
    );
  });
});
