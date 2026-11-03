import { describe, expect, it } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { runWithTenant } from '../../../../../common';
import { BookingAccess } from './booking-access';

const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';

/** `assertResourceInActiveTenant` no usa dependencias: bastan dobles vacíos. */
const access = new BookingAccess(
  {} as never,
  {} as never,
  {} as never,
  {} as never,
);

const scopedTo = (tenantId: string) =>
  ({
    id: 'admin-a',
    roles: ['SUPERADMIN'],
    scopedRoles: { [tenantId]: ['SUPERADMIN'] },
    tenantIds: [],
  }) as never;
const globalAdmin = {
  id: 'root',
  roles: ['SUPERADMIN'],
  tenantIds: [],
} as never;

/**
 * `SUPERADMIN` acotado a un tenant (`scopedRoles`, MCH-001): no es plataforma
 * fuera de él, así que un recurso de otra organización sigue respondiendo 403.
 */
describe('BookingAccess.assertResourceInActiveTenant · SUPERADMIN acotado (#1241)', () => {
  it('acotado a A no usa el recurso de B, ni con A activo ni sin tenant activo', () => {
    expect(() =>
      runWithTenant(TENANT_A, () =>
        access.assertResourceInActiveTenant(TENANT_B, scopedTo(TENANT_A)),
      ),
    ).toThrow(ForbiddenException);
    expect(() =>
      access.assertResourceInActiveTenant(TENANT_B, scopedTo(TENANT_A)),
    ).toThrow(ForbiddenException);
  });

  it('acotado a A usa el recurso de A, aun sin tenant activo ni membresías', () => {
    expect(() =>
      access.assertResourceInActiveTenant(TENANT_A, scopedTo(TENANT_A)),
    ).not.toThrow();
  });

  it('global usa recursos de A y de B con cualquier tenant activo', () => {
    for (const resourceTenant of [TENANT_A, TENANT_B]) {
      expect(() =>
        runWithTenant(TENANT_A, () =>
          access.assertResourceInActiveTenant(resourceTenant, globalAdmin),
        ),
      ).not.toThrow();
    }
  });
});
