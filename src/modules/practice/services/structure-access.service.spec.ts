import { ForbiddenException } from '@nestjs/common';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import {
  StructureAccessService,
  type StructureAccess,
} from './structure-access.service';
import { StructureContextService } from './structure-context.service';
import {
  TENANT_A,
  TENANT_B,
  makeSite,
  makeSpace,
  mockFn,
} from './infrastructure.testing';

function build(membership: any, branches: string[] = []) {
  const tenantMemberships = {
    findActiveByUserTenant: mockFn().mockResolvedValue(membership),
  };
  const branchMemberships = {
    findByMembershipAndStatus: mockFn().mockResolvedValue(
      branches.map((branchId) => ({ branchId })),
    ),
  };
  const access = new StructureAccessService(
    tenantMemberships as any,
    branchMemberships as any,
  );
  return { access, tenantMemberships, branchMemberships };
}
const membership = (role: string, scope: string, primaryBranchId?: string) => ({
  id: 'm1',
  tenantRoleConceptId: role,
  accessScopeConceptId: scope,
  primaryBranchId,
});
const user = { id: 'u1', roles: ['USER'] } as any;
const em = {} as any;

describe('StructureAccessService.resolve', () => {
  it('un rol de plataforma entra sin mirar membresías', async () => {
    const { access, tenantMemberships } = build(null);
    for (const role of ['SECURITY_ADMIN', 'SUPERADMIN']) {
      const level = await access.resolve(em, TENANT_A, {
        id: 'p',
        roles: [role],
      } as any);
      expect(level.level).toBe('PLATFORM');
    }
    expect(tenantMemberships.findActiveByUserTenant).not.toHaveBeenCalled();
  });

  it('un rol de plataforma acotado a otro tenant (scopedRoles) no entra a éste', async () => {
    const { access } = build(null);
    const acotado = {
      id: 'p',
      roles: ['SECURITY_ADMIN'],
      scopedRoles: { [TENANT_B]: ['SECURITY_ADMIN'] },
    } as any;
    expect((await access.resolve(em, TENANT_A, acotado)).level).toBe('NONE');
    expect((await access.resolve(em, TENANT_B, acotado)).level).toBe(
      'PLATFORM',
    );
  });

  it('sin membresía activa: NONE (fail-closed)', async () => {
    expect((await build(null).access.resolve(em, TENANT_A, user)).level).toBe(
      'NONE',
    );
  });

  it('OWNER es ORG aunque su alcance sea de sucursal; ADMIN de todo el tenant es ORG; STAFF es MEMBER', async () => {
    expect(
      (
        await build(
          membership(DIR.ROLE_OWNER, DIR.SCOPE_BRANCH, 'b1'),
        ).access.resolve(em, TENANT_A, user)
      ).level,
    ).toBe('ORG');
    expect(
      (
        await build(
          membership(DIR.ROLE_ADMIN, DIR.SCOPE_ALL_TENANT),
        ).access.resolve(em, TENANT_A, user)
      ).level,
    ).toBe('ORG');
    expect(
      (
        await build(
          membership(DIR.ROLE_STAFF, DIR.SCOPE_ALL_TENANT),
        ).access.resolve(em, TENANT_A, user)
      ).level,
    ).toBe('MEMBER');
  });

  it('ADMIN con alcance BRANCH es BRANCH_ADMIN con su sucursal primaria y las asignadas; STAFF BRANCH es BRANCH_MEMBER', async () => {
    const admin = await build(
      membership(DIR.ROLE_ADMIN, DIR.SCOPE_BRANCH, 'b1'),
      ['b2'],
    ).access.resolve(em, TENANT_A, user);
    expect(admin.level).toBe('BRANCH_ADMIN');
    expect([...admin.branchIds].sort()).toEqual(['b1', 'b2']);
    const staff = await build(membership(DIR.ROLE_STAFF, DIR.SCOPE_BRANCH), [
      'b3',
    ]).access.resolve(em, TENANT_A, user);
    expect(staff).toMatchObject({ level: 'BRANCH_MEMBER' });
  });
});

describe('StructureAccessService · decisiones', () => {
  const { access } = build(null);
  const at = (
    level: StructureAccess['level'],
    branchIds: string[] = [],
  ): StructureAccess => ({ level, branchIds: new Set(branchIds) });
  const enB1 = { branchId: 'b1' };
  const enB2 = { branchId: 'b2' };
  const sinSucursal = { branchId: undefined };

  it('lectura: ORG, plataforma y MEMBER ven todo; los de sucursal sólo la suya; NONE nada', () => {
    for (const level of ['PLATFORM', 'ORG', 'MEMBER'] as const) {
      for (const site of [enB1, enB2, sinSucursal])
        expect(access.canSee(at(level), site)).toBe(true);
    }
    for (const level of ['BRANCH_ADMIN', 'BRANCH_MEMBER'] as const) {
      expect(access.canSee(at(level, ['b1']), enB1)).toBe(true);
      expect(access.canSee(at(level, ['b1']), enB2)).toBe(false);
      expect(access.canSee(at(level, ['b1']), sinSucursal)).toBe(false);
    }
    expect(access.canSee(at('NONE'), enB1)).toBe(false);
  });

  it('escritura de estructura: ORG y plataforma siempre; BRANCH_ADMIN sólo en su sucursal; MEMBER y BRANCH_MEMBER nunca', () => {
    expect(access.canWriteStructure(at('ORG'), enB2)).toBe(true);
    expect(access.canWriteStructure(at('PLATFORM'), sinSucursal)).toBe(true);
    expect(access.canWriteStructure(at('BRANCH_ADMIN', ['b1']), enB1)).toBe(
      true,
    );
    expect(access.canWriteStructure(at('BRANCH_ADMIN', ['b1']), enB2)).toBe(
      false,
    );
    expect(access.canWriteStructure(at('MEMBER'), enB1)).toBe(false);
    expect(access.canWriteStructure(at('BRANCH_MEMBER', ['b1']), enB1)).toBe(
      false,
    );
  });

  it('S6: fuera de alcance es 404; S5: dentro del alcance sin permiso es 403', () => {
    expect(() =>
      access.assertCanWriteStructure(at('BRANCH_ADMIN', ['b1']), enB2),
    ).toThrow(ResourceNotFoundException);
    expect(() => access.assertCanWriteStructure(at('MEMBER'), enB1)).toThrow(
      ForbiddenException,
    );
    expect(() => access.assertCanWriteStructure(at('NONE'), enB1)).toThrow(
      ResourceNotFoundException,
    );
    expect(() =>
      access.assertCanRead(at('BRANCH_MEMBER', ['b1']), enB2),
    ).toThrow(ResourceNotFoundException);
  });

  it('lo regulatorio lo escriben sólo la organización y la plataforma: el admin de sucursal ve y recibe 403', () => {
    expect(() =>
      access.assertCanWriteRegulatory(at('ORG'), enB1),
    ).not.toThrow();
    expect(() =>
      access.assertCanWriteRegulatory(at('PLATFORM'), enB1),
    ).not.toThrow();
    expect(() =>
      access.assertCanWriteRegulatory(at('BRANCH_ADMIN', ['b1']), enB1),
    ).toThrow(ForbiddenException);
    expect(() =>
      access.assertCanWriteRegulatory(at('BRANCH_ADMIN', ['b1']), enB2),
    ).toThrow(ResourceNotFoundException);
    expect(() => access.assertCanWriteRegulatory(at('MEMBER'), enB1)).toThrow(
      ForbiddenException,
    );
  });
});

describe('StructureContextService', () => {
  function context(site: any, space?: any) {
    const sitesRepo = { findById: mockFn().mockResolvedValue(site) };
    const spacesRepo = {
      findByIdInTenant: mockFn().mockResolvedValue(space ?? null),
    };
    const unitsRepo = { findById: mockFn().mockResolvedValue(null) };
    const { access, tenantMemberships } = build(
      membership(DIR.ROLE_OWNER, DIR.SCOPE_ALL_TENANT),
    );
    return {
      service: new StructureContextService(
        sitesRepo as any,
        spacesRepo as any,
        unitsRepo as any,
        access,
      ),
      sitesRepo,
      spacesRepo,
      tenantMemberships,
    };
  }
  const withTenant = <T>(tenantId: string, fn: () => Promise<T>): Promise<T> =>
    runWithTenant(tenantId, fn);

  it('un establecimiento de otro tenant responde 404 sin consultar membresías', async () => {
    const c = context(makeSite({ tenantId: TENANT_B }));
    await expect(
      withTenant(TENANT_A, () => c.service.site(em, 's1', user, 'write')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(c.tenantMemberships.findActiveByUserTenant).not.toHaveBeenCalled();
  });

  it('inexistente y de otro tenant son indistinguibles', async () => {
    const ajeno = context(makeSite({ tenantId: TENANT_B }));
    const faltante = context(null);
    const a = await withTenant(TENANT_A, () =>
      ajeno.service.site(em, 's1', user, 'read'),
    ).catch((e: any) => e);
    const b = await withTenant(TENANT_A, () =>
      faltante.service.site(em, 's1', user, 'read'),
    ).catch((e: any) => e);
    expect(a.getResponse()).toEqual(b.getResponse());
  });

  it('un espacio se busca por id Y tenant, y su sede se autoriza', async () => {
    const c = context(makeSite(), makeSpace());
    const scope = await withTenant(TENANT_A, () =>
      c.service.space(em, 'sp-1', user, 'write'),
    );
    expect(c.spacesRepo.findByIdInTenant).toHaveBeenCalledWith(
      em,
      'sp-1',
      TENANT_A,
    );
    expect(scope.space.id).toBe('sp-1');
    expect(scope.access.level).toBe('ORG');
  });

  it('sin tenant en el contexto falla cerrado', async () => {
    const c = context(makeSite());
    await expect(c.service.site(em, 's1', user, 'read')).rejects.toThrow();
    expect(c.sitesRepo.findById).not.toHaveBeenCalled();
  });
});
