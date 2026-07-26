import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ReferralsController } from './referrals.controller';

const actor = { id: 'md-1', roles: ['USER'] } as any;

function build() {
  const referralsService = { create: mockFn(), respond: mockFn() };
  const controller = new ReferralsController(referralsService as any);
  return { controller, referralsService };
}

describe('ReferralsController', () => {
  it('delegates create (UC-18-07)', async () => {
    const d = build();
    const dto = { patientProfileId: 'p1' };
    await d.controller.create(dto as any, actor);
    expect(d.referralsService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates respond (UC-18-08)', async () => {
    const d = build();
    const dto = { decision: 'ACCEPT' };
    await d.controller.respond('ref1', dto as any, actor);
    expect(d.referralsService.respond).toHaveBeenCalledWith('ref1', dto, actor);
  });
});
