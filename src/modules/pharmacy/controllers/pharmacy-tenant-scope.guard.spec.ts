import { describe, expect, it } from '@jest/globals';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { PharmacyTenantScopeGuard } from './pharmacy-tenant-scope.guard';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const PHARMACIES: Record<string, { id: string; tenantId: string }> = {
  'ph-a': { id: 'ph-a', tenantId: TENANT_A },
  'ph-b': { id: 'ph-b', tenantId: TENANT_B },
};

/** Guard con una base de dos farmacias, una por tenant. */
const guard = new PharmacyTenantScopeGuard({
  fork: () => ({
    findOne: async (_entity: unknown, where: { id: string }) =>
      PHARMACIES[where.id] ?? null,
  }),
} as never);

const contextFor = (user: unknown, pharmacyId?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        params: pharmacyId ? { pharmacyId } : {},
        headers: {},
      }),
    }),
  }) as never;

const PLATFORM = ['SECURITY_ADMIN', 'SUPERADMIN'];
const scopedTo = (role: string, tenantId: string) => ({
  id: 'admin-a',
  roles: [role],
  scopedRoles: { [tenantId]: [role] },
  tenantIds: [],
});

/**
 * Rol de plataforma acotado a un tenant (`scopedRoles`, MCH-001): figura en
 * `roles`, pero sólo vale sobre las farmacias de su tenant (#1241).
 */
describe('PharmacyTenantScopeGuard · plataforma acotada a un tenant', () => {
  it('acotado a A no opera la farmacia de B ni las operaciones sin farmacia', async () => {
    for (const role of PLATFORM) {
      const actor = scopedTo(role, TENANT_A);
      await expect(
        guard.canActivate(contextFor(actor, 'ph-b')),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(guard.canActivate(contextFor(actor))).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    }
  });

  it('acotado a A opera la farmacia de A aunque no figure su membresía', async () => {
    for (const role of PLATFORM) {
      await expect(
        guard.canActivate(contextFor(scopedTo(role, TENANT_A), 'ph-a')),
      ).resolves.toBe(true);
    }
  });

  it('global opera las farmacias de A y de B y las operaciones sin farmacia', async () => {
    for (const role of PLATFORM) {
      const actor = { id: 'root', roles: [role], tenantIds: [] };
      for (const pharmacyId of ['ph-a', 'ph-b', undefined]) {
        await expect(
          guard.canActivate(contextFor(actor, pharmacyId)),
        ).resolves.toBe(true);
      }
    }
  });

  it('el personal sigue acotado a su farmacia', async () => {
    const staff = { id: 'u', roles: ['PHARMACY_STAFF'], tenantIds: [TENANT_A] };
    await expect(guard.canActivate(contextFor(staff, 'ph-a'))).resolves.toBe(
      true,
    );
    await expect(
      guard.canActivate(contextFor(staff, 'ph-b')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
