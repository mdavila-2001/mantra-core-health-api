import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AllergyIntolerancesService } from './allergy-intolerances.service';
import { ConflictException } from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const allergyRepo = {
    findActiveBySubstance: mockFn(),
    create: mockFn(),
    createReaction: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AllergyIntolerancesService(
    em as any,
    allergyRepo as any,
    logger as any,
  );
  return { service, tx, allergyRepo };
}

describe('AllergyIntolerancesService (UC-08-09)', () => {
  it('records an allergy with reactions, flushing parent before children', async () => {
    const d = build();
    d.allergyRepo.findActiveBySubstance.mockResolvedValue(null);
    d.allergyRepo.create.mockReturnValue({
      id: 'alg1',
      patientProfileId: 'p1',
      clinicalStatusConceptId: CLIN.ALLERGY_ACTIVE,
      createdAt: new Date(),
    });
    d.allergyRepo.createReaction.mockReturnValue({ id: 'rx1' });

    const res = await d.service.create(
      {
        custodianTenantId: 't1',
        patientProfileId: 'p1',
        substanceConceptId: 's1',
        reactions: [{ manifestationConceptId: 'm1' }],
      },
      actor,
    );

    expect(res.reactionIds).toEqual(['rx1']);
    expect(d.tx.flush).toHaveBeenCalledTimes(2);
  });

  it('rejects a duplicate active allergy for the substance', async () => {
    const d = build();
    d.allergyRepo.findActiveBySubstance.mockResolvedValue({ id: 'existing' });
    await expect(
      d.service.create(
        {
          custodianTenantId: 't1',
          patientProfileId: 'p1',
          substanceConceptId: 's1',
        } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
