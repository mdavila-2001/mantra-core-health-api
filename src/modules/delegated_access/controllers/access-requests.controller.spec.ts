import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AccessRequestsController } from './access-requests.controller';

const actor = { id: 'approver-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const service = { decide: mockFn() };
  const controller = new AccessRequestsController(service as any);
  return { controller, service };
}

describe('AccessRequestsController', () => {
  it('delegates decide (UC-29-05)', async () => {
    const d = build();
    const dto = { decision: 'APPROVED' };
    await d.controller.decide('r1', dto as any, actor);
    expect(d.service.decide).toHaveBeenCalledWith('r1', dto, actor);
  });
});
