import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AdminTenantsController } from './admin-tenants.controller';

const actor = { id: 'admin-1', roles: ['SUPERADMIN'] } as any;

function build() {
  const tenantsService = { provision: mockFn(), verify: mockFn(), suspend: mockFn() };
  const controller = new AdminTenantsController(tenantsService as any);
  return { controller, tenantsService };
}

describe('AdminTenantsController', () => {
  it('delegates provision (UC-04-01)', async () => {
    const d = build();
    const dto = { code: 'ACME', legalName: 'Acme', ownerUserId: 'u1' };
    d.tenantsService.provision.mockResolvedValue({ id: 't1' });
    await expect(d.controller.provision(dto as any, actor)).resolves.toEqual({ id: 't1' });
    expect(d.tenantsService.provision).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates verify (UC-04-02)', async () => {
    const d = build();
    await d.controller.verify('t1', {} as any, actor);
    expect(d.tenantsService.verify).toHaveBeenCalledWith('t1', {}, actor);
  });

  it('delegates suspend (UC-04-10)', async () => {
    const d = build();
    const dto = { reason: 'fraud' };
    await d.controller.suspend('t1', dto as any, actor);
    expect(d.tenantsService.suspend).toHaveBeenCalledWith('t1', dto, actor);
  });
});
