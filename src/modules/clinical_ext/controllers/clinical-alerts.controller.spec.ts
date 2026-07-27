import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalAlertsController } from './clinical-alerts.controller';

const actor = { id: 'md-1', roles: ['USER'] } as any;

function build() {
  const alertsService = { acknowledge: mockFn(), override: mockFn() };
  const controller = new ClinicalAlertsController(alertsService as any);
  return { controller, alertsService };
}

describe('ClinicalAlertsController (UC-18-05)', () => {
  it('delegates acknowledge', async () => {
    const d = build();
    await d.controller.acknowledge('a1', actor);
    expect(d.alertsService.acknowledge).toHaveBeenCalledWith('a1', actor);
  });

  it('delegates override', async () => {
    const d = build();
    const dto = { reason: 'x' };
    await d.controller.override('a1', dto, actor);
    expect(d.alertsService.override).toHaveBeenCalledWith('a1', dto, actor);
  });
});
