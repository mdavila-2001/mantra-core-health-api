import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzRolesController } from './authz-roles.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const rolesService = { createRole: mockFn(), setPermissions: mockFn(), setFieldPermissions: mockFn() };
  const controller = new AuthzRolesController(rolesService as any);
  return { controller, rolesService };
}

describe('AuthzRolesController', () => {
  it('delegates createRole (UC-06-03)', async () => {
    const d = build();
    const dto = { code: 'NURSE', name: 'Nurse' };
    await d.controller.createRole(dto as any, actor);
    expect(d.rolesService.createRole).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates setPermissions (UC-06-03)', async () => {
    const d = build();
    const dto = { permissions: [] };
    await d.controller.setPermissions('r1', dto as any, actor);
    expect(d.rolesService.setPermissions).toHaveBeenCalledWith('r1', dto, actor);
  });

  it('delegates setFieldPermissions (UC-06-08)', async () => {
    const d = build();
    const dto = { fields: [] };
    await d.controller.setFieldPermissions('r1', dto as any, actor);
    expect(d.rolesService.setFieldPermissions).toHaveBeenCalledWith('r1', dto, actor);
  });
});
