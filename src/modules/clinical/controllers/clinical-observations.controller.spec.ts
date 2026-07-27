import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalObservationsController } from './clinical-observations.controller';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const observationsService = { record: mockFn(), amend: mockFn() };
  const controller = new ClinicalObservationsController(
    observationsService as any,
  );
  return { controller, observationsService };
}

describe('ClinicalObservationsController', () => {
  it('delegates record (UC-08-03)', async () => {
    const d = build();
    const dto = {
      custodianTenantId: 't1',
      patientProfileId: 'p1',
      codeConceptId: 'c1',
    };
    d.observationsService.record.mockResolvedValue({ id: 'obs1' });
    await expect(d.controller.record(dto as any, actor)).resolves.toEqual({
      id: 'obs1',
    });
    expect(d.observationsService.record).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates amend (UC-08-04)', async () => {
    const d = build();
    const dto = { note: 'fix' };
    await d.controller.amend('obs1', dto, actor);
    expect(d.observationsService.amend).toHaveBeenCalledWith(
      'obs1',
      dto,
      actor,
    );
  });
});
