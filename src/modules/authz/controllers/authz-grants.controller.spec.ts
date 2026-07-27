import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzGrantsController } from './authz-grants.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const grantsService = {
    assignRole: mockFn(),
    grantPermission: mockFn(),
    grantResourceScope: mockFn(),
  };
  const controller = new AuthzGrantsController(grantsService as any);
  return { controller, grantsService };
}

describe('AuthzGrantsController', () => {
  it('delegates assignRole (UC-06-04)', async () => {
    const d = build();
    const dto = { roleId: 'r1' };
    await d.controller.assignRole('u1', dto, actor);
    expect(d.grantsService.assignRole).toHaveBeenCalledWith('u1', dto, actor);
  });

  it('delegates grantPermission (UC-06-05)', async () => {
    const d = build();
    const dto = { permissionId: 'p1', effect: 'ALLOW', reason: 'x' };
    await d.controller.grantPermission('u1', dto as any, actor);
    expect(d.grantsService.grantPermission).toHaveBeenCalledWith(
      'u1',
      dto,
      actor,
    );
  });

  it('delegates grantResourceScope (UC-06-09)', async () => {
    const d = build();
    const dto = {
      subjectType: 'USER',
      subjectId: 'u1',
      permissionId: 'p1',
      resourceType: 'PATIENT',
      resourceId: 'x1',
      effect: 'ALLOW',
    };
    await d.controller.grantResourceScope(dto as any, actor);
    expect(d.grantsService.grantResourceScope).toHaveBeenCalledWith(dto, actor);
  });
});
