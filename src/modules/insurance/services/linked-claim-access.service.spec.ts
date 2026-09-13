import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { runWithTenant } from '../../../common';
import { TenantAdministrationService } from '../../directory/services/tenant-administration.service';
import { DIR } from '../../directory/directory.concepts';
import {
  InsurancePlans,
  InsuranceProducts,
  PatientCoverages,
} from '../entities';
import { INS } from '../insurance.concepts';
import {
  LinkedClaimAccessService,
  assertLegacyClaimRoles,
  authorizeClaimResource,
  claimAccessDenied,
} from './linked-claim-access.service';
import type { LinkedOrderSnapshot } from './linked-claim-validation';

const fn = (implementation?: any): any => (jest.fn as any)(implementation);
const actor = { id: 'user', roles: ['USER'] };
const snapshot: LinkedOrderSnapshot = {
  origin: 'PHARMACY',
  orderId: 'order',
  patientProfileId: 'patient',
  providerTenantId: 'provider',
  billingProviderEntityId: 'pharmacy',
  billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PHARMACY,
  currencyConceptId: 'bob',
  totalAmount: '100',
  validForSettlement: true,
  canSubmit: true,
  lines: [],
};

function fixture() {
  const membership = { tenantRoleConceptId: DIR.ROLE_OWNER };
  const memberships = {
    findActiveByUserTenant: fn().mockResolvedValue(membership),
  };
  const coverage = Object.assign(new PatientCoverages(), {
    id: 'coverage',
    patientProfileId: 'patient',
    insurancePlanId: 'plan',
    statusConceptId: INS.COVERAGE_ACTIVE,
    verificationStatusConceptId: INS.VERIFY_VERIFIED,
  });
  const plan = Object.assign(new InsurancePlans(), {
    id: 'plan',
    insuranceProductId: 'product',
    currencyConceptId: 'bob',
  });
  const product = Object.assign(new InsuranceProducts(), {
    id: 'product',
    insuranceCarrierId: 'carrier',
  });
  const catalog = {
    findPlan: fn().mockResolvedValue(plan),
    findProduct: fn().mockResolvedValue(product),
    findCarrierByTenantId: fn().mockResolvedValue({
      id: 'carrier',
      tenantId: 'insurer',
    }),
  };
  const service = new LinkedClaimAccessService(
    new TenantAdministrationService(memberships as never),
    catalog as never,
    { findCoverage: fn().mockResolvedValue(coverage) } as never,
  );
  return { service, memberships, membership, catalog, coverage, plan, product };
}

describe('LinkedClaimAccessService', () => {
  it.each(['staff', 'foreign-insurer'])(
    'uniforma el 403 del recurso para %s sin datos de membresía',
    async (variant) => {
      const f = fixture();
      if (variant === 'staff')
        f.membership.tenantRoleConceptId = DIR.ROLE_STAFF;
      const error = await runWithTenant('insurer', () =>
        authorizeClaimResource(() =>
          f.service.assertInsurer(
            {} as never,
            actor,
            variant === 'foreign-insurer' ? 'other-carrier' : 'carrier',
          ),
        ),
      ).catch((failure: unknown) => failure);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toEqual(
        claimAccessDenied().getResponse(),
      );
    },
  );
  it('propaga errores de infraestructura en vez de ocultarlos como permisos', async () => {
    const failure = new Error('database unavailable');
    await expect(
      authorizeClaimResource(() => {
        throw failure;
      }),
    ).rejects.toBe(failure);
  });
  it.each([DIR.ROLE_OWNER, DIR.ROLE_ADMIN])(
    'permite membresía administrativa activa %s del prestador',
    async (role) => {
      const f = fixture();
      f.membership.tenantRoleConceptId = role;
      await expect(
        runWithTenant('provider', () =>
          f.service.assertProvider({} as never, actor, snapshot),
        ),
      ).resolves.toBeUndefined();
      expect(f.memberships.findActiveByUserTenant).toHaveBeenCalledWith(
        {},
        'user',
        'provider',
        DIR.MEMBERSHIP_ACTIVE,
      );
    },
  );
  it('rechaza empleado sin membresía administrativa', async () => {
    const f = fixture();
    f.memberships.findActiveByUserTenant.mockResolvedValue(null);
    await expect(
      runWithTenant('provider', () =>
        f.service.assertProvider({} as never, actor, snapshot),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('rechaza pedido de otro tenant aunque el actor administre el tenant activo', async () => {
    const f = fixture();
    await expect(
      runWithTenant('other', () =>
        f.service.assertProvider({} as never, actor, snapshot),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('rechaza adjudicar para otra aseguradora', async () => {
    const f = fixture();
    await expect(
      runWithTenant('insurer', () =>
        f.service.assertInsurer({} as never, actor, 'other-carrier'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('preserva acceso de plataforma dentro del tenant del recurso', async () => {
    const f = fixture();
    f.memberships.findActiveByUserTenant.mockResolvedValue(null);
    await expect(
      runWithTenant('provider', () =>
        f.service.assertProvider(
          {} as never,
          { id: 'platform', roles: ['SECURITY_ADMIN'] },
          snapshot,
        ),
      ),
    ).resolves.toBeUndefined();
  });
  it('recorre la entidad real cobertura → plan → producto → aseguradora', async () => {
    const f = fixture();
    const result = await f.service.coverageForOrder(
      {} as never,
      'coverage',
      snapshot,
      'carrier',
      true,
    );
    expect(result.insuranceCarrierId).toBe('carrier');
    expect(f.coverage).not.toHaveProperty('insuranceCarrierId');
    expect(f.catalog.findProduct).toHaveBeenCalledWith({}, 'product');
  });
  it('rechaza cobertura de otro paciente', async () => {
    const f = fixture();
    f.coverage.patientProfileId = 'other';
    await expect(
      f.service.coverageForOrder({} as never, 'coverage', snapshot, 'carrier'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
  it.each([
    'other-carrier',
    'wrong-currency',
    'unverified',
    'expired',
    'future',
  ])('rechaza cobertura incoherente %s', async (reason) => {
    const f = fixture();
    if (reason === 'other-carrier') f.product.insuranceCarrierId = 'other';
    if (reason === 'wrong-currency') f.plan.currencyConceptId = 'usd';
    if (reason === 'unverified')
      f.coverage.verificationStatusConceptId = INS.VERIFY_PENDING;
    if (reason === 'expired')
      f.coverage.effectiveTo = new Date('2000-01-01T00:00:00Z');
    if (reason === 'future')
      f.plan.effectiveFrom = new Date('2099-01-01T00:00:00Z');
    await expect(
      f.service.coverageForOrder(
        {} as never,
        'coverage',
        snapshot,
        'carrier',
        true,
      ),
    ).rejects.toThrow();
  });
  it('no relaja los roles del flujo genérico', () => {
    expect(() => assertLegacyClaimRoles(actor)).toThrow(ForbiddenException);
    expect(() =>
      assertLegacyClaimRoles({ ...actor, roles: ['BILLING_OPERATOR'] }),
    ).toThrow(ForbiddenException);
    expect(() =>
      assertLegacyClaimRoles({ ...actor, roles: ['SUPERADMIN'] }),
    ).not.toThrow();
  });
});
