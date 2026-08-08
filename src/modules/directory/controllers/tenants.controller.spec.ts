import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { TenantsController } from './tenants.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
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
  const readService = {
    getTenantById: mockFn(),
    listChildTenants: mockFn(),
    listBranches: mockFn(),
    listMemberships: mockFn(),
    listBranchAssignments: mockFn(),
  };
  const controller = new TenantsController(
    tenantsService as any,
    branchesService as any,
    membershipsService as any,
    readService as any,
  );
  return {
    controller,
    tenantsService,
    branchesService,
    membershipsService,
    readService,
  };
}

describe('TenantsController', () => {
  it('delegates createChild (UC-04-03)', async () => {
    const d = build();
    const dto = {
      tenantType: 'PROVIDER' as const,
      countryConceptId: 'c1',
      jurisdictionConceptId: 'j1',
      code: 'C',
      legalName: 'C',
      adminUserId: 'u1',
    };
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

describe('TenantsController — lecturas con alcance de organización', () => {
  it('getTenant pasa el actor, que es lo que decide el alcance', async () => {
    const d = build();
    d.readService.getTenantById.mockResolvedValue({ id: 't1' });

    await d.controller.getTenant('t1', actor);

    expect(d.readService.getTenantById).toHaveBeenCalledWith('t1', actor);
  });

  it('listBranches pasa el actor', async () => {
    const d = build();
    d.readService.listBranches.mockResolvedValue({ items: [] });

    await d.controller.listBranches('t1', actor);

    expect(d.readService.listBranches).toHaveBeenCalledWith('t1', actor);
  });

  it('listMemberships aplica el tope por defecto y propaga el estado', async () => {
    const d = build();
    d.readService.listMemberships.mockResolvedValue({ items: [] });

    await d.controller.listMemberships('t1', actor, 'status-1');

    expect(d.readService.listMemberships).toHaveBeenCalledWith(
      't1',
      { statusConceptId: 'status-1', cursor: undefined, limit: 50 },
      actor,
    );
  });

  it('listChildTenants propaga cursor y tope', async () => {
    const d = build();
    d.readService.listChildTenants.mockResolvedValue({ items: [] });

    await d.controller.listChildTenants('t1', actor, 'cursor-opaco', 10);

    expect(d.readService.listChildTenants).toHaveBeenCalledWith(
      't1',
      { cursor: 'cursor-opaco', limit: 10 },
      actor,
    );
  });

  it('listBranchAssignments acota la membresía a su organización', async () => {
    const d = build();
    d.readService.listBranchAssignments.mockResolvedValue({ items: [] });

    await d.controller.listBranchAssignments('t1', 'm1', actor);

    expect(d.readService.listBranchAssignments).toHaveBeenCalledWith(
      't1',
      'm1',
      actor,
    );
  });
});
