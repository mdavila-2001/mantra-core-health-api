import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ConditionsService } from './conditions.service';
import { ConflictException } from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const conditionsRepo = { findActiveByCode: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ConditionsService(
    em as any,
    conditionsRepo as any,
    logger as any,
  );
  return { service, conditionsRepo };
}

describe('ConditionsService (UC-08-08)', () => {
  it('records a condition as active and confirmed', async () => {
    const d = build();
    d.conditionsRepo.findActiveByCode.mockResolvedValue(null);
    d.conditionsRepo.create.mockReturnValue({
      id: 'cond1',
      patientProfileId: 'p1',
      clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
      verificationStatusConceptId: CLIN.CONDITION_CONFIRMED,
      createdAt: new Date(),
    });
    const res = await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        codeConceptId: 'code1',
      },
      actor,
    );
    expect(res.clinicalStatus).toBe(CLIN.CONDITION_ACTIVE);
    expect(res.verificationStatus).toBe(CLIN.CONDITION_CONFIRMED);
  });

  it('rejects a duplicate active condition', async () => {
    const d = build();
    d.conditionsRepo.findActiveByCode.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          codeConceptId: 'code1',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
