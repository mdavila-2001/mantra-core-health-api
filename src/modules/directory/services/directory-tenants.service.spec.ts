import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DirectoryTenantsService } from './directory-tenants.service';
import { DIR } from '../directory.concepts';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SUPERADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const tenantsRepo = {
    findById: mockFn(),
    searchPage: mockFn(() => Promise.resolve([])),
    findByCode: mockFn(),
    create: mockFn(),
  };
  const membershipsRepo = {
    create: mockFn(),
    findByTenantAndStatus: mockFn().mockResolvedValue([]),
  };
  const branchesRepo = {
    findByTenantAndStatus: mockFn().mockResolvedValue([]),
  };
  const typeProfile = {
    assertProfileMatchesType: mockFn(),
    declaredConcepts: mockFn(() => ({})),
    assertConceptsExist: mockFn().mockResolvedValue(undefined),
    materializeProfile: mockFn(() => undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DirectoryTenantsService(
    em as any,
    tenantsRepo,
    membershipsRepo as any,
    branchesRepo as any,
    typeProfile as any,
    logger as any,
  );
  return { service, tx, tenantsRepo, membershipsRepo, branchesRepo };
}

describe('DirectoryTenantsService', () => {
  describe('provision (UC-04-01)', () => {
    it('creates tenant, flushes parent before the owner membership', async () => {
      const d = build();
      d.tenantsRepo.findByCode.mockResolvedValue(null);
      const tenant = {
        id: 't1',
        code: 'ACME',
        legalName: 'Acme',
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        createdAt: new Date('2026-01-01'),
      };
      d.tenantsRepo.create.mockReturnValue(tenant);

      const res = await d.service.provision(
        {
          tenantType: 'PROVIDER' as const,
          countryConceptId: 'c1',
          jurisdictionConceptId: 'j1',
          code: 'ACME',
          legalName: 'Acme',
          ownerUserId: 'u1',
        },
        actor,
      );

      expect(res.id).toBe('t1');
      expect(res.status).toBe(DIR.TENANT_PENDING);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.membershipsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: 't1',
          tenantRoleConceptId: DIR.ROLE_OWNER,
        }),
      );
    });

    it('rejects when the code already exists (conflict)', async () => {
      const d = build();
      d.tenantsRepo.findByCode.mockResolvedValue({ id: 'x' });
      await expect(
        d.service.provision(
          {
            tenantType: 'PROVIDER' as const,
            countryConceptId: 'c1',
            jurisdictionConceptId: 'j1',
            code: 'ACME',
            legalName: 'Acme',
            ownerUserId: 'u1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.tenantsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verify (UC-04-02)', () => {
    it('throws when tenant is missing', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue(null);
      await expect(d.service.verify('t1', {}, actor)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('rejects when the tenant is not pending (precondition)', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
      });
      await expect(d.service.verify('t1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('activates and verifies a pending tenant', async () => {
      const d = build();
      const tenant = {
        id: 't1',
        code: 'ACME',
        legalName: 'Acme',
        statusConceptId: DIR.TENANT_PENDING,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      d.tenantsRepo.findById.mockResolvedValue(tenant);

      const res = await d.service.verify('t1', {}, actor);

      expect(tenant.statusConceptId).toBe(CONCEPTS.TENANT_ACTIVE);
      expect(tenant.verificationStatusConceptId).toBe(CONCEPTS.TENANT_VERIFIED);
      expect(res.status).toBe(CONCEPTS.TENANT_ACTIVE);
    });
  });

  describe('createChild (UC-04-03)', () => {
    it('rejects when the parent is not active', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: DIR.TENANT_PENDING,
      });
      await expect(
        d.service.createChild(
          'p1',
          {
            tenantType: 'PROVIDER' as const,
            countryConceptId: 'c1',
            jurisdictionConceptId: 'j1',
            code: 'C',
            legalName: 'C',
            adminUserId: 'u1',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates a child tenant linked to the parent with an admin membership', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
        tenantTypeConceptId: 'tt',
        legalEntityTypeConceptId: 'le',
        dataResidencyRegionConceptId: 'dr',
      });
      d.tenantsRepo.findByCode.mockResolvedValue(null);
      const child = {
        id: 'c1',
        code: 'C',
        legalName: 'C',
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
        verificationStatusConceptId: DIR.TENANT_UNVERIFIED,
        parentTenantId: 'p1',
        createdAt: new Date(),
      };
      d.tenantsRepo.create.mockReturnValue(child);

      const res = await d.service.createChild(
        'p1',
        {
          tenantType: 'PROVIDER' as const,
          countryConceptId: 'c1',
          jurisdictionConceptId: 'j1',
          code: 'C',
          legalName: 'C',
          adminUserId: 'u1',
        },
        actor,
      );

      expect(res.parentTenantId).toBe('p1');
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.membershipsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantRoleConceptId: DIR.ROLE_ADMIN }),
      );
    });
  });

  describe('suspend (UC-04-10)', () => {
    it('rejects when tenant is not active', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: DIR.TENANT_SUSPENDED,
      });
      await expect(
        d.service.suspend('t1', { reason: 'x' }, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('suspends the tenant and cascades to active branches and memberships', async () => {
      const d = build();
      const tenant = {
        id: 't1',
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
        updatedAt: new Date(),
      };
      d.tenantsRepo.findById.mockResolvedValue(tenant);
      const branch = {
        statusConceptId: DIR.BRANCH_ACTIVE,
        updatedAt: new Date(),
      };
      const membership = {
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        updatedAt: new Date(),
      };
      d.branchesRepo.findByTenantAndStatus.mockResolvedValue([branch]);
      d.membershipsRepo.findByTenantAndStatus.mockResolvedValue([membership]);

      const res = await d.service.suspend('t1', { reason: 'fraud' }, actor);

      expect(res).toEqual({ ok: true });
      expect(tenant.statusConceptId).toBe(DIR.TENANT_SUSPENDED);
      expect(branch.statusConceptId).toBe(DIR.BRANCH_SUSPENDED);
      expect(membership.statusConceptId).toBe(DIR.MEMBERSHIP_SUSPENDED);
    });
  });
});
