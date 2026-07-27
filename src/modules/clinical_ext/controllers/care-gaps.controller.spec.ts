import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CareGapsController } from './care-gaps.controller';

const actor = { id: 'gap-1', roles: ['USER'] } as any;

function build() {
  const careGapsService = {
    recompute: mockFn(),
    close: mockFn(),
    projectImmunizationPlan: mockFn(),
    createSchedule: mockFn(),
  };
  const controller = new CareGapsController(careGapsService as any);
  return { controller, careGapsService };
}

describe('CareGapsController', () => {
  it('delegates recompute (UC-18-09)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', gaps: [] };
    await d.controller.recompute(dto, actor);
    expect(d.careGapsService.recompute).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates close (UC-18-10)', async () => {
    const d = build();
    const dto = { closedByResourceType: 'immunization' };
    await d.controller.close('g1', dto, actor);
    expect(d.careGapsService.close).toHaveBeenCalledWith('g1', dto, actor);
  });

  it('delegates projectImmunizationPlan (UC-18-11)', async () => {
    const d = build();
    const dto = { birthDate: '2026-01-01' };
    await d.controller.projectImmunizationPlan('p1', dto, actor);
    expect(d.careGapsService.projectImmunizationPlan).toHaveBeenCalledWith(
      'p1',
      dto,
      actor,
    );
  });

  it('delegates createSchedule', async () => {
    const d = build();
    const dto = { vaccineConceptId: 'v1', name: 'BCG' };
    await d.controller.createSchedule(dto, actor);
    expect(d.careGapsService.createSchedule).toHaveBeenCalledWith(dto, actor);
  });
});
