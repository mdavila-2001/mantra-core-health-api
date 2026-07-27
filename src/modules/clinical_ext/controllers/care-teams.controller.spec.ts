import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CareTeamsController } from './care-teams.controller';

const actor = { id: 'cc-1', roles: ['USER'] } as any;

function build() {
  const careTeamsService = { create: mockFn(), setResponsible: mockFn() };
  const controller = new CareTeamsController(careTeamsService as any);
  return { controller, careTeamsService };
}

describe('CareTeamsController', () => {
  it('delegates create (UC-18-01)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', tenantId: 't1', members: [] };
    d.careTeamsService.create.mockResolvedValue({ id: 'ct1' });
    await expect(d.controller.create(dto as any, actor)).resolves.toEqual({
      id: 'ct1',
    });
    expect(d.careTeamsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates setResponsible (UC-18-02)', async () => {
    const d = build();
    await d.controller.setResponsible('ct1', 'm1', actor);
    expect(d.careTeamsService.setResponsible).toHaveBeenCalledWith(
      'ct1',
      'm1',
      actor,
    );
  });
});
