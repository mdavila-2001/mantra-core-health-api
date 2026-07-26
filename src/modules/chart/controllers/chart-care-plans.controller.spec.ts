import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartCarePlansController } from './chart-care-plans.controller';

const actor = { id: 'clin-1', roles: [] } as any;

function build() {
  const carePlansService = { createCarePlan: mockFn(), updateActivity: mockFn() };
  const controller = new ChartCarePlansController(carePlansService as any);
  return { controller, carePlansService };
}

describe('ChartCarePlansController', () => {
  it('delegates createCarePlan (UC-15-10)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1' };
    await d.controller.createCarePlan(dto as any, actor);
    expect(d.carePlansService.createCarePlan).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates updateActivity (UC-15-11)', async () => {
    const d = build();
    const dto = { status: 'COMPLETED' };
    await d.controller.updateActivity('cp1', 'a1', dto as any, actor);
    expect(d.carePlansService.updateActivity).toHaveBeenCalledWith('cp1', 'a1', dto, actor);
  });
});
