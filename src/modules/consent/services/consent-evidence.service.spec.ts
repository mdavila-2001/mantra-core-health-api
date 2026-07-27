import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ConsentEvidenceService } from './consent-evidence.service';
import { CONS } from '../consent.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const evidenceRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new ConsentEvidenceService(
    em as any,
    evidenceRepo,
    logger as any,
  );
  return { service, tx, evidenceRepo };
}

describe('ConsentEvidenceService', () => {
  it('record (UC-07-10) inserts append-only evidence mapping the subject type', async () => {
    const d = build();
    const created = { id: 'ev1', subjectId: 's1', recordedAt: new Date() };
    d.evidenceRepo.create.mockReturnValue(created);

    const res = await d.service.record(
      { subjectType: 'CONSENT', subjectId: 's1' } as any,
      actor,
    );

    expect(res).toEqual({
      id: 'ev1',
      subjectId: 's1',
      recordedAt: created.recordedAt,
    });
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.evidenceRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        subjectTypeConceptId: CONS.SUBJECT_CONSENT,
        evidenceTypeConceptId: CONS.EVIDENCE_TYPE_SIGNATURE,
        recordedByUserId: 'admin-1',
      }),
    );
  });
});
