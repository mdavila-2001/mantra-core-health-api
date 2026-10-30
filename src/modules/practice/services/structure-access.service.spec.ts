import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { StructureAccessService } from './structure-access.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-a';

/**
 * Arma el servicio con la regla real de membresía resumida en dobles:
 * `canAdminister` deja pasar plataforma, OWNER y ADMIN (como el servicio de
 * directorio), y esta clase es la que distingue el alcance BRANCH.
 */
function build(membership: Record<string, unknown> | null, branchLink = false) {
  const tenantAdmin = {
    canAdminister: mockFn(async (_em: any, _t: string, actor: any) => {
      if ((actor.roles ?? []).includes('SECURITY_ADMIN')) return true;
      return Boolean(
        membership &&
        [DIR.ROLE_OWNER, DIR.ROLE_ADMIN].includes(
          membership.tenantRoleConceptId as string,
        ),
      );
    }),
    assertCanRead: mockFn().mockResolvedValue(undefined),
  };
  const membershipsRepo = {
    findActiveByUserTenant: mockFn().mockResolvedValue(membership),
  };
  const site = { id: 's1', tenantId: TENANT, branchId: 'br-1' };
  const sitesRepo = { findById: mockFn().mockResolvedValue(site) };
  const unitsRepo = { findById: mockFn().mockResolvedValue(null) };
  const spacesRepo = {
    findById: mockFn().mockResolvedValue({ id: 'c1', tenantId: 'tenant-b' }),
  };
  const em: any = {
    findOne: mockFn().mockResolvedValue(branchLink ? { id: 'bm1' } : null),
  };
  const service = new StructureAccessService(
    tenantAdmin as any,
    membershipsRepo as any,
    sitesRepo as any,
    unitsRepo as any,
    spacesRepo as any,
  );
  return { service, site, em, tenantAdmin };
}

const user = { id: 'u1', roles: ['USER'] } as any;
const m = (role: string, scope: string, primaryBranchId?: string) => ({
  id: 'mem-1',
  tenantRoleConceptId: role,
  accessScopeConceptId: scope,
  primaryBranchId,
});

describe('StructureAccessService (F1, contrato §3 «Autorización»)', () => {
  it('fila de otro tenant: 404, igual que inexistente', async () => {
    const d = build(null);
    await expect(
      d.service.requireSpace(d.em, 'c1', TENANT),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(
      d.service.requireUnit(d.em, 'u0', TENANT),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    await expect(
      d.service.requireSite(d.em, 's1', 'tenant-b'),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('OWNER y ADMIN de toda la org administran la organización y escriben la sede', async () => {
    for (const role of [DIR.ROLE_OWNER, DIR.ROLE_ADMIN]) {
      const d = build(m(role, DIR.SCOPE_ALL_TENANT));
      await expect(
        d.service.assertCanAdministerOrganization(d.em, TENANT, user),
      ).resolves.toBeUndefined();
      await expect(
        d.service.assertCanWriteSite(d.em, d.site as any, user),
      ).resolves.toBeUndefined();
    }
  });

  it('plataforma pasa sin membresía', async () => {
    const d = build(null);
    const admin = { id: 'p', roles: ['SECURITY_ADMIN'] } as any;
    await expect(
      d.service.assertCanAdministerOrganization(d.em, TENANT, admin),
    ).resolves.toBeUndefined();
  });

  it('ADMIN de sucursal: escribe la sede de su sucursal, no administra la organización', async () => {
    const d = build(m(DIR.ROLE_ADMIN, DIR.SCOPE_BRANCH, 'br-1'));
    await expect(
      d.service.assertCanWriteSite(d.em, d.site as any, user),
    ).resolves.toBeUndefined();
    await expect(
      d.service.assertCanAdministerOrganization(d.em, TENANT, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ADMIN de sucursal por branch_membership activa (no primaria)', async () => {
    const d = build(m(DIR.ROLE_ADMIN, DIR.SCOPE_BRANCH, 'br-otra'), true);
    await expect(
      d.service.assertCanWriteSite(d.em, d.site as any, user),
    ).resolves.toBeUndefined();
  });

  it('ADMIN de otra sucursal: 403 (fail-closed)', async () => {
    const d = build(m(DIR.ROLE_ADMIN, DIR.SCOPE_BRANCH, 'br-otra'), false);
    await expect(
      d.service.assertCanWriteSite(d.em, d.site as any, user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('sede sin sucursal: no hay admin de sucursal que la escriba', async () => {
    const d = build(m(DIR.ROLE_ADMIN, DIR.SCOPE_BRANCH, 'br-1'), true);
    await expect(
      d.service.assertCanWriteSite(
        d.em,
        { ...d.site, branchId: undefined } as any,
        user,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('STAFF del tenant y sin membresía: 403', async () => {
    for (const mem of [m(DIR.ROLE_STAFF, DIR.SCOPE_ALL_TENANT), null]) {
      const d = build(mem);
      await expect(
        d.service.assertCanWriteSite(d.em, d.site as any, user),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('lectura: delega en la regla de miembro del tenant', async () => {
    const d = build(null);
    await d.service.assertCanRead(d.em, TENANT, user);
    expect(d.tenantAdmin.assertCanRead).toHaveBeenCalledWith(
      d.em,
      TENANT,
      user,
    );
  });
});
