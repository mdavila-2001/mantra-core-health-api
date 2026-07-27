import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { TenantsController } from './tenants.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const tenantsService = { createChild: mockFn() };
  const branchesService = { create: mockFn() };
  const membershipsService = {
    invite: mockFn(),
    assignBranch: mockFn(),
    transfer: mockFn(),
    changeRole: mockFn(),
    offboard: mockFn(),
  };
  const controller = new TenantsController(
    tenantsService as any,
    branchesService as any,
    membershipsService as any,
  );
  return { controller, tenantsService, branchesService, membershipsService };
}

describe('TenantsController', () => {
  it('delegates createChild (UC-04-03)', async () => {
    const d = build();
    const dto = { code: 'C', legalName: 'C', adminUserId: 'u1' };
    await d.controller.createChild('t1', dto, actor);
    expect(d.tenantsService.createChild).toHaveBeenCalledWith('t1', dto, actor);
  });

  it('delegates createBranch (UC-04-04)', async () => {
    const d = build();
    const dto = { code: 'B', name: 'Main' };
    await d.controller.createBranch('t1', dto, actor);
    expect(d.branchesService.create).toHaveBeenCalledWith('t1', dto, actor);
  });

  it('delegates invite (UC-04-05)', async () => {
    const d = build();
    const dto = { userId: 'u1' };
    await d.controller.invite('t1', dto, actor);
    expect(d.membershipsService.invite).toHaveBeenCalledWith('t1', dto, actor);
  });

  it('delegates assignBranch (UC-04-06)', async () => {
    const d = build();
    const dto = { branchId: 'b1' };
    await d.controller.assignBranch('t1', 'm1', dto, actor);
    expect(d.membershipsService.assignBranch).toHaveBeenCalledWith(
      't1',
      'm1',
      dto,
      actor,
    );
  });

  it('delegates transfer (UC-04-07)', async () => {
    const d = build();
    const dto = { fromBranchId: 'b1', toBranchId: 'b2' };
    await d.controller.transfer('t1', 'm1', dto, actor);
    expect(d.membershipsService.transfer).toHaveBeenCalledWith(
      't1',
      'm1',
      dto,
      actor,
    );
  });

  it('delegates changeRole (UC-04-08)', async () => {
    const d = build();
    const dto = { role: 'ADMIN' };
    await d.controller.changeRole('t1', 'm1', dto as any, actor);
    expect(d.membershipsService.changeRole).toHaveBeenCalledWith(
      't1',
      'm1',
      dto,
      actor,
    );
  });

  it('delegates offboard (UC-04-09)', async () => {
    const d = build();
    await d.controller.offboard('t1', 'm1', actor);
    expect(d.membershipsService.offboard).toHaveBeenCalledWith(
      't1',
      'm1',
      actor,
    );
  });
});
