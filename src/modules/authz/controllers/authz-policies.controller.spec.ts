import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzPoliciesController } from './authz-policies.controller';

const actor = { id: 'priv-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const policiesService = { create: mockFn() };
  const controller = new AuthzPoliciesController(policiesService as any);
  return { controller, policiesService };
}

describe('AuthzPoliciesController', () => {
  it('delegates create (UC-06-02)', async () => {
    const d = build();
    const dto = { name: 'p', effect: 'DENY' };
    await d.controller.create('t1', dto as any, actor);
    expect(d.policiesService.create).toHaveBeenCalledWith('t1', dto, actor);
  });
});
