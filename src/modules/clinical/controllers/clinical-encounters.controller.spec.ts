import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalEncountersController } from './clinical-encounters.controller';

const actor = { id: 'user-1', roles: [] } as any;

function build() {
  const episodesService = { open: mockFn() };
  const encountersService = { checkIn: mockFn(), close: mockFn() };
  const controller = new ClinicalEncountersController(
    episodesService as any,
    encountersService as any,
  );
  return { controller, episodesService, encountersService };
}

describe('ClinicalEncountersController', () => {
  it('delegates openEpisode (UC-08-01)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', tenantId: 't1' };
    d.episodesService.open.mockResolvedValue({ id: 'ep1' });
    await expect(d.controller.openEpisode(dto as any, actor)).resolves.toEqual({ id: 'ep1' });
    expect(d.episodesService.open).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates checkIn (UC-08-02)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1', tenantId: 't1' };
    await d.controller.checkIn(dto as any, actor);
    expect(d.encountersService.checkIn).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates close (UC-08-14)', async () => {
    const d = build();
    await d.controller.close('enc1', { expectedRowVersion: 1 } as any, actor);
    expect(d.encountersService.close).toHaveBeenCalledWith('enc1', { expectedRowVersion: 1 }, actor);
  });
});
