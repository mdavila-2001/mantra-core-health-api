import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationAuthProfilesService } from './integration-auth-profiles.service';
import { ICON } from '../integration_contracts.concepts';
import { ResourceNotFoundException, runWithTenant } from '../../../common';
import { IntegrationContractsErrorReason } from '../integration_contracts.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT = 'tenant-a';

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
  const contractsRepo = { findByIdInTenant: mockFn() };
  const authProfilesRepo = { findById: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationAuthProfilesService(
    em as any,
    contractsRepo as any,
    authProfilesRepo,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT),
    raw: service,
    tx,
    contractsRepo,
    authProfilesRepo,
  };
}

describe('IntegrationAuthProfilesService', () => {
  describe('configure (UC-31-03)', () => {
    it('creates an ACTIVE auth profile without leaking secrets', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.authProfilesRepo.create.mockReturnValue({
        id: 'ap1',
        statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
      });

      const res = await d.service.configure(
        'c1',
        {
          credentialSecretReference: 'secret://ref',
          clientIdentifier: 'cid',
        },
        actor,
      );

      expect(res).toEqual({
        id: 'ap1',
        integrationContractId: 'c1',
        status: ICON.AUTH_PROFILE_ACTIVE,
      });
      expect(d.authProfilesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
          authProfileConceptId: ICON.AUTH_OAUTH2_CONFIDENTIAL,
        }),
      );
    });

    it('throws not found when the contract is absent (404)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);
      await expect(
        d.service.configure(
          'c1',
          { credentialSecretReference: 'x' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('rotate (UC-31-11)', () => {
    it('rotates the secret reference and marks the profile ROTATED', async () => {
      const d = build();
      const profile = {
        id: 'ap1',
        integrationContractId: 'c1',
        credentialSecretReference: 'old',
        statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
        updatedAt: new Date(),
      };
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.authProfilesRepo.findById.mockResolvedValue(profile);

      const res = await d.service.rotate(
        'c1',
        'ap1',
        { credentialSecretReference: 'new' },
        actor,
      );

      expect(res).toEqual({ ok: true });
      expect(profile.credentialSecretReference).toBe('new');
      expect(profile.statusConceptId).toBe(ICON.AUTH_PROFILE_ROTATED);
    });

    it('supports REVOKED as the target status', async () => {
      const d = build();
      const profile = {
        id: 'ap1',
        integrationContractId: 'c1',
        statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
        updatedAt: new Date(),
      };
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.authProfilesRepo.findById.mockResolvedValue(profile);
      await d.service.rotate(
        'c1',
        'ap1',
        { credentialSecretReference: 'n', targetStatus: 'REVOKED' } as any,
        actor,
      );
      expect(profile.statusConceptId).toBe(ICON.AUTH_PROFILE_REVOKED);
    });

    it('throws not found when the profile does not belong to the contract (404)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      d.authProfilesRepo.findById.mockResolvedValue({
        id: 'ap1',
        integrationContractId: 'other',
      });
      await expect(
        d.service.rotate(
          'c1',
          'ap1',
          { credentialSecretReference: 'n' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
  describe('aislamiento por tenant (ICON-01)', () => {
    it('configurar un perfil sobre el contrato de otro tenant responde 404 uniforme y no crea nada', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);
      const foreign = await d.service
        .configure('c-b', { credentialSecretReference: 'x' } as any, actor)
        .catch((e: any) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.reason).toBe(
        IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
      );
      expect(foreign.details).toBeUndefined();
      expect(d.authProfilesRepo.create).not.toHaveBeenCalled();
      expect(d.contractsRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        'c-b',
      );
    });

    it('sin tenant activo no se configura nada (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(
        d.raw.configure('c1', {} as any, actor),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
    });

    it('rotar el perfil de un contrato de otro tenant no cambia secreto ni estado', async () => {
      const d = build();
      const profile = {
        id: 'ap-b',
        integrationContractId: 'c-b',
        credentialSecretReference: 'secreto-de-b',
        statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
        updatedAt: new Date(),
      };
      d.authProfilesRepo.findById.mockResolvedValue(profile);
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);

      const foreign = await d.service
        .rotate(
          'c-b',
          'ap-b',
          {
            credentialSecretReference: 'robado',
            targetStatus: 'REVOKED',
          } as any,
          actor,
        )
        .catch((e: any) => e);
      d.authProfilesRepo.findById.mockResolvedValue(null);
      const missing = await d.service
        .rotate(
          'c-b',
          'ap-b',
          { credentialSecretReference: 'robado' } as any,
          actor,
        )
        .catch((e: any) => e);

      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(profile.credentialSecretReference).toBe('secreto-de-b');
      expect(profile.statusConceptId).toBe(ICON.AUTH_PROFILE_ACTIVE);
    });

    it('el perfil ajeno bajo un contrato propio también responde igual que uno inexistente', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
      });
      const profile = {
        id: 'ap-b',
        integrationContractId: 'c-b',
        credentialSecretReference: 'secreto-de-b',
        statusConceptId: ICON.AUTH_PROFILE_ACTIVE,
      };
      d.authProfilesRepo.findById.mockResolvedValue(profile);
      const foreign = await d.service
        .rotate('c1', 'ap-b', { credentialSecretReference: 'x' } as any, actor)
        .catch((e: any) => e);
      d.authProfilesRepo.findById.mockResolvedValue(null);
      const missing = await d.service
        .rotate('c1', 'ap-b', { credentialSecretReference: 'x' } as any, actor)
        .catch((e: any) => e);

      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(profile.credentialSecretReference).toBe('secreto-de-b');
    });
  });
});
