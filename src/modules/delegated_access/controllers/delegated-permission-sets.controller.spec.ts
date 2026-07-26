import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DelegatedPermissionSetsController } from './delegated-permission-sets.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const service = { createSet: mockFn(), publishVersion: mockFn() };
  const controller = new DelegatedPermissionSetsController(service as any);
  return { controller, service };
}

describe('DelegatedPermissionSetsController', () => {
  it('delegates createSet (UC-29-02)', async () => {
    const d = build();
    const dto = { tenantId: 't1', code: 'A', name: 'N', items: [{ permissionId: 'p1' }] };
    await d.controller.createSet(dto as any, actor);
    expect(d.service.createSet).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates publishVersion (UC-29-02)', async () => {
    const d = build();
    const dto = { items: [{ permissionId: 'p1' }] };
    await d.controller.publishVersion('s1', dto as any, actor);
    expect(d.service.publishVersion).toHaveBeenCalledWith('s1', dto, actor);
  });
});
