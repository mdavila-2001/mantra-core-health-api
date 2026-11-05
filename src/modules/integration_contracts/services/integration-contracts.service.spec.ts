import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationContractsService } from './integration-contracts.service';
import { ICON } from '../integration_contracts.concepts';
import { UniqueConstraintViolationException } from '@mikro-orm/core';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { IntegrationContractsErrorReason } from '../integration_contracts.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT = 'tenant-a';
const OTHER_TENANT = 'tenant-b';

/**
 * Ejecuta cada método del servicio con `tenant` como tenant activo del
 * contexto, igual que lo deja el interceptor en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenant - Tenant activo.
 * @returns Proxy que fija el contexto en cada llamada.
 */
function inTenant<T extends object>(service: T, tenant: string): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenant, () => value.apply(target, args));
    },
  });
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const findContract = mockFn();
  const contractsRepo = {
    findByIdInTenant: findContract,
    findByIdInTenantForUpdate: findContract,
    findByCodeAndProvider: mockFn(),
    create: mockFn(),
  };
  const versionsRepo = {
    findById: mockFn(),
    maxVersionNumber: mockFn().mockResolvedValue(0),
    findActiveByContract: mockFn().mockResolvedValue(null),
    findActiveVersions: mockFn().mockResolvedValue([]),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationContractsService(
    em as any,
    contractsRepo,
    versionsRepo,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT),
    raw: service,
    tx,
    em,
    contractsRepo,
    versionsRepo,
  };
}

describe('IntegrationContractsService', () => {
  describe('createContract (UC-31-01)', () => {
    it('creates a DRAFT contract and flushes the parent', async () => {
      const d = build();
      d.contractsRepo.findByCodeAndProvider.mockResolvedValue(null);
      const created = {
        id: 'c1',
        contractCode: 'C1',
        externalProviderId: 'p1',
        statusConceptId: ICON.CONTRACT_DRAFT,
        createdAt: new Date('2026-01-01'),
      };
      d.contractsRepo.create.mockReturnValue(created);

      const res = await d.service.createContract(
        { externalProviderId: 'p1', contractCode: 'C1' },
        actor,
      );

      expect(res).toEqual({
        id: 'c1',
        contractCode: 'C1',
        externalProviderId: 'p1',
        status: ICON.CONTRACT_DRAFT,
        createdAt: created.createdAt,
      });
      expect(d.contractsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          tenantId: TENANT,
          statusConceptId: ICON.CONTRACT_DRAFT,
          capabilityConceptId: ICON.CAPABILITY_GENERIC,
          actorUserId: 'admin-1',
        }),
      );
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects a duplicate code for the provider (409)', async () => {
      const d = build();
      d.contractsRepo.findByCodeAndProvider.mockResolvedValue({
        id: 'existing',
      });
      await expect(
        d.service.createContract(
          { externalProviderId: 'p1', contractCode: 'C1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.contractsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('publishVersion (UC-31-02)', () => {
    it('publishes version max+1 in DRAFT and touches the contract', async () => {
      const d = build();
      const contract = {
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_ACTIVE,
        updatedAt: new Date(),
      };
      d.contractsRepo.findByIdInTenant.mockResolvedValue(contract);
      d.versionsRepo.maxVersionNumber.mockResolvedValue(2);
      const version = {
        id: 'v3',
        integrationContractId: 'c1',
        versionNumber: 3,
        statusConceptId: ICON.VERSION_DRAFT,
      };
      d.versionsRepo.create.mockReturnValue(version);

      const res = await d.service.publishVersion('c1', {}, actor);

      expect(res).toMatchObject({
        id: 'v3',
        versionNumber: 3,
        status: ICON.VERSION_DRAFT,
      });
      expect(d.versionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          versionNumber: 3,
          statusConceptId: ICON.VERSION_DRAFT,
        }),
      );
    });

    it('throws not found when the contract is absent (404)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        d.service.publishVersion('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects publishing when the contract is RETIRED (422)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_RETIRED,
      });
      await expect(
        d.service.publishVersion('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('activateVersion (UC-31-10)', () => {
    it('activates a DRAFT version, supersedes the prior active and promotes the contract', async () => {
      const d = build();
      const contract = {
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_DRAFT,
        updatedAt: new Date(),
      };
      const version = {
        id: 'v2',
        integrationContractId: 'c1',
        statusConceptId: ICON.VERSION_DRAFT,
      };
      const prior = { id: 'v1', statusConceptId: ICON.VERSION_ACTIVE };
      d.contractsRepo.findByIdInTenant.mockResolvedValue(contract);
      d.versionsRepo.findById.mockResolvedValue(version);
      d.versionsRepo.findActiveByContract.mockResolvedValue(prior);

      const res = await d.service.activateVersion('c1', 'v2', {}, actor);

      expect(res).toEqual({ ok: true });
      expect(version.statusConceptId).toBe(ICON.VERSION_ACTIVE);
      expect(prior.statusConceptId).toBe(ICON.VERSION_SUPERSEDED);
      expect(contract.statusConceptId).toBe(ICON.CONTRACT_ACTIVE);
    });

    it('rejects activating a non-DRAFT version (422)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_ACTIVE,
      });
      d.versionsRepo.findById.mockResolvedValue({
        id: 'v2',
        integrationContractId: 'c1',
        statusConceptId: ICON.VERSION_ACTIVE,
      });
      await expect(
        d.service.activateVersion('c1', 'v2', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('retireContract (UC-31-11)', () => {
    it('retires the contract and supersedes its active versions', async () => {
      const d = build();
      const contract = {
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_ACTIVE,
        updatedAt: new Date(),
      };
      const av = { id: 'v1', statusConceptId: ICON.VERSION_ACTIVE };
      d.contractsRepo.findByIdInTenant.mockResolvedValue(contract);
      d.versionsRepo.findActiveVersions.mockResolvedValue([av]);

      const res = await d.service.retireContract('c1', {}, actor);

      expect(res).toEqual({ ok: true });
      expect(contract.statusConceptId).toBe(ICON.CONTRACT_RETIRED);
      expect(av.statusConceptId).toBe(ICON.VERSION_SUPERSEDED);
    });

    it('rejects retiring an already retired contract (422)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_RETIRED,
      });
      await expect(
        d.service.retireContract('c1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });
  describe('aislamiento por tenant (ICON-01)', () => {
    const foreignContract = {
      id: 'c-b',
      tenantId: OTHER_TENANT,
      statusConceptId: ICON.CONTRACT_ACTIVE,
      updatedAt: new Date(),
    };

    it('el alta toma el tenant del contexto y busca el duplicado dentro de ese tenant', async () => {
      const d = build();
      d.contractsRepo.findByCodeAndProvider.mockResolvedValue(null);
      d.contractsRepo.create.mockReturnValue({
        id: 'c1',
        contractCode: 'C1',
        externalProviderId: 'p1',
        statusConceptId: ICON.CONTRACT_DRAFT,
        createdAt: new Date(),
      });

      await d.service.createContract(
        { externalProviderId: 'p1', contractCode: 'C1' },
        actor,
      );

      expect(d.contractsRepo.findByCodeAndProvider).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        'C1',
        'p1',
      );
    });

    it('sin tenant activo no se define ningún contrato (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(
        d.raw.createContract(
          { externalProviderId: 'p1', contractCode: 'C1' },
          actor,
        ),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
      expect(d.contractsRepo.create).not.toHaveBeenCalled();
    });

    it('traduce la violación de unicidad de la base a un 409 catalogado', async () => {
      const d = build();
      d.contractsRepo.findByCodeAndProvider.mockResolvedValue(null);
      d.em.transactional.mockRejectedValue(
        new UniqueConstraintViolationException(new Error('duplicate key')),
      );
      const attempt = d.service.createContract(
        { externalProviderId: 'p1', contractCode: 'C1' },
        actor,
      );
      await expect(attempt).rejects.toBeInstanceOf(ConflictException);
      await expect(attempt).rejects.toMatchObject({
        reason:
          IntegrationContractsErrorReason.INTEGRATION_CONTRACT_CODE_ALREADY_EXISTS,
      });
    });

    it.each([
      [
        'publicar versión',
        (d: ReturnType<typeof build>) =>
          d.service.publishVersion('c-b', {} as any, actor),
      ],
      [
        'activar versión',
        (d: ReturnType<typeof build>) =>
          d.service.activateVersion('c-b', 'v-b', {} as any, actor),
      ],
      [
        'retirar contrato',
        (d: ReturnType<typeof build>) =>
          d.service.retireContract('c-b', {} as any, actor),
      ],
    ])(
      '%s sobre un contrato de otro tenant responde 404 uniforme y no cambia estado',
      async (_name, op) => {
        const d = build();
        d.contractsRepo.findByIdInTenant.mockResolvedValue(foreignContract);
        d.versionsRepo.findById.mockResolvedValue({
          id: 'v-b',
          integrationContractId: 'c-b',
          statusConceptId: ICON.VERSION_DRAFT,
        });
        const foreign = await op(d).catch((e: any) => e);
        d.contractsRepo.findByIdInTenant.mockResolvedValue(null);
        const missing = await op(d).catch((e: any) => e);

        expect(foreign).toBeInstanceOf(ResourceNotFoundException);
        expect(foreign.getStatus()).toBe(404);
        expect(foreign.getResponse()).toEqual(missing.getResponse());
        expect(foreign.reason).toBe(
          IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
        );
        expect(foreign.details).toBeUndefined();
        expect(foreignContract.statusConceptId).toBe(ICON.CONTRACT_ACTIVE);
        expect(d.versionsRepo.create).not.toHaveBeenCalled();
        expect(d.versionsRepo.findActiveVersions).not.toHaveBeenCalled();
        expect(d.contractsRepo.findByIdInTenant).toHaveBeenCalledWith(
          d.tx,
          TENANT,
          'c-b',
        );
      },
    );

    it('defensa en profundidad: un contrato ajeno devuelto por el repositorio también se rechaza', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        ...foreignContract,
        tenantId: null,
      });
      await expect(
        d.service.retireContract('c-b', {} as any, actor),
      ).rejects.toMatchObject({
        reason:
          IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
      });
    });

    it('una versión que cuelga de otro contrato no se activa por la ruta de un contrato propio', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_DRAFT,
        updatedAt: new Date(),
      });
      const version = {
        id: 'v-b',
        integrationContractId: 'c-b',
        statusConceptId: ICON.VERSION_DRAFT,
      };
      d.versionsRepo.findById.mockResolvedValue(version);

      await expect(
        d.service.activateVersion('c1', 'v-b', {} as any, actor),
      ).rejects.toMatchObject({
        reason:
          IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
      });
      expect(version.statusConceptId).toBe(ICON.VERSION_DRAFT);
    });
  });
});
