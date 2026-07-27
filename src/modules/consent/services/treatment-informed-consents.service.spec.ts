import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { TreatmentInformedConsentsService } from './treatment-informed-consents.service';
import { CONS } from '../consent.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const treatmentRepo = { create: mockFn() };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new TreatmentInformedConsentsService(
    em as any,
    treatmentRepo as any,
    eventsRepo,
    logger as any,
  );
  return { service, tx, treatmentRepo, eventsRepo };
}

describe('TreatmentInformedConsentsService', () => {
  it('sign (UC-07-08) creates a signed consent and records the signed event', async () => {
    const d = build();
    const created = {
      id: 't1',
      patientProfileId: 'p1',
      statusConceptId: CONS.TREATMENT_SIGNED,
      decisionConceptId: CONS.DECISION_ACCEPTED,
      createdAt: new Date(),
    };
    d.treatmentRepo.create.mockReturnValue(created);

    const res = await d.service.sign(
      {
        patientProfileId: 'p1',
        encounterId: 'e1',
        decision: 'ACCEPTED',
      } as any,
      actor,
    );

    expect(res).toEqual({
      id: 't1',
      patientProfileId: 'p1',
      status: CONS.TREATMENT_SIGNED,
      decision: CONS.DECISION_ACCEPTED,
      createdAt: created.createdAt,
    });
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.eventsRepo.record).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ eventTypeConceptId: CONS.EVENT_SIGNED }),
    );
  });
});
