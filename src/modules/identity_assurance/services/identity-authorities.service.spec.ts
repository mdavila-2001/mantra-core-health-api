import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' sin las tipificaciones estrictas de @jest/globals.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IdentityAuthoritiesService } from './identity-authorities.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { IntegrationEndpoints } from '../../integrations/entities/integration_endpoints.entity';
import { ProviderConnections } from '../../integrations/entities/provider_connections.entity';
import { IDA } from '../identity_assurance.concepts';
import { IdentityAssuranceErrorReason } from '../identity_assurance.error-reasons';

const T1 = '11111111-1111-4111-8111-111111111111';
const T2 = '22222222-2222-4222-8222-222222222222';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant, como lo hace
 * `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant activo del contexto.
 * @returns Proxy que fija el tenant en cada llamada.
 */
function scoped<S extends object>(service: S, tenantId: string): S {
  return new Proxy(service, {
    get(target, key) {
      const value = (target as any)[key];
      return typeof value === 'function'
        ? (...args: unknown[]) =>
            runWithTenant(tenantId, () => value.apply(target, args))
        : value;
    },
  });
}

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  // Filas que ve la comprobación del endpoint de integración.
  const db: { endpoint: any; connection: any } = {
    endpoint: { id: 'e1', providerId: 'prov-1' },
    connection: { providerId: 'prov-1', tenantId: T1 },
  };
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    findOne: mockFn(async (entity: unknown) =>
      entity === IntegrationEndpoints
        ? db.endpoint
        : entity === ProviderConnections
          ? db.connection
          : null,
    ),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const authoritiesRepo = { create: mockFn(), findById: mockFn() };
  const endpointsRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new IdentityAuthoritiesService(
    em as any,
    authoritiesRepo,
    endpointsRepo as any,
    logger as any,
  );
  return {
    service: scoped(raw, T1),
    rawService: raw,
    db,
    tx,
    authoritiesRepo,
    endpointsRepo,
  };
}

describe('IdentityAuthoritiesService', () => {
  it('registers an authority in active state (UC-27-01)', async () => {
    const d = build();
    d.authoritiesRepo.create.mockReturnValue({
      id: 'a1',
      authorityCode: 'REG',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      createdAt: new Date('2026-01-01'),
    });
    const res = await d.service.registerAuthority(
      {
        tenantId: 't1',
        authorityCode: 'REG',
        name: 'Registro',
        authorityTypeConceptId: 'c1',
      },
      actor,
    );
    expect(res.id).toBe('a1');
    expect(res.status).toBe(CONCEPTS.STATE_ACTIVE);
    expect(d.authoritiesRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        verificationStatusConceptId: IDA.AUTHORITY_VERIFIED,
      }),
    );
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('rejects adding an endpoint to a missing authority (UC-27-01)', async () => {
    const d = build();
    d.authoritiesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.addEndpoint(
        'missing',
        { integrationEndpointId: 'e1', capabilityConceptId: 'c1' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.endpointsRepo.create).not.toHaveBeenCalled();
  });

  describe('alcance por tenant (IDA-02)', () => {
    const endpointDto: any = {
      integrationEndpointId: 'e1',
      capabilityConceptId: 'c1',
    };

    it('registerAuthority toma el tenant del contexto e ignora el del cuerpo', async () => {
      const d = build();
      d.authoritiesRepo.create.mockReturnValue({
        id: 'a1',
        authorityCode: 'REG',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: new Date(),
      });
      await d.service.registerAuthority(
        {
          tenantId: T2,
          authorityCode: 'REG',
          name: 'Registro',
          authorityTypeConceptId: 'c1',
        },
        actor,
      );
      expect(d.authoritiesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: T1 }),
      );
    });

    it('registerAuthority sin tenant en el contexto se rechaza (412) y no persiste', async () => {
      const d = build();
      await expect(
        d.rawService.registerAuthority(
          { authorityCode: 'REG', name: 'x', authorityTypeConceptId: 'c' },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.authoritiesRepo.create).not.toHaveBeenCalled();
    });

    it('addEndpoint agrega un endpoint válido a una autoridad del tenant', async () => {
      const d = build();
      const authority = { id: 'a1', tenantId: T1, updatedAt: new Date() };
      d.authoritiesRepo.findById.mockResolvedValue(authority);
      d.endpointsRepo.create.mockReturnValue({
        id: 'ep1',
        identityAuthorityId: 'a1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: new Date(),
      });
      const res = await d.service.addEndpoint('a1', endpointDto, actor);
      expect(res.id).toBe('ep1');
      expect(d.tx.findOne).toHaveBeenCalledWith(ProviderConnections, {
        providerId: 'prov-1',
        tenantId: T1,
      });
    });

    it('addEndpoint a una autoridad de T2 responde 404 uniforme y no crea el endpoint', async () => {
      const d = build();
      d.authoritiesRepo.findById.mockResolvedValue({ id: 'a2', tenantId: T2 });
      const error: any = await d.service
        .addEndpoint('a2', endpointDto, actor)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(
        IdentityAssuranceErrorReason.AUTHORITY_NOT_AVAILABLE,
      );
      expect(error.details).toBeUndefined();
      expect(d.endpointsRepo.create).not.toHaveBeenCalled();
    });

    it('una autoridad ajena y una inexistente responden idéntico', async () => {
      const foreign = build();
      foreign.authoritiesRepo.findById.mockResolvedValue({
        id: 'a2',
        tenantId: T2,
      });
      const missing = build();
      missing.authoritiesRepo.findById.mockResolvedValue(null);
      const a: any = await foreign.service
        .addEndpoint('a2', endpointDto, actor)
        .catch((e: unknown) => e);
      const b: any = await missing.service
        .addEndpoint('a2', endpointDto, actor)
        .catch((e: unknown) => e);
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('un endpoint de integración cuyo proveedor el tenant no conecta responde 404 y no se crea', async () => {
      const d = build();
      d.authoritiesRepo.findById.mockResolvedValue({ id: 'a1', tenantId: T1 });
      d.db.connection = null;
      await expect(
        d.service.addEndpoint('a1', endpointDto, actor),
      ).rejects.toMatchObject({
        reason: IdentityAssuranceErrorReason.ENDPOINT_NOT_AVAILABLE,
      });
      expect(d.endpointsRepo.create).not.toHaveBeenCalled();
    });

    it('un endpoint de integración inexistente responde 404 y no se crea', async () => {
      const d = build();
      d.authoritiesRepo.findById.mockResolvedValue({ id: 'a1', tenantId: T1 });
      d.db.endpoint = null;
      await expect(
        d.service.addEndpoint('a1', endpointDto, actor),
      ).rejects.toMatchObject({
        reason: IdentityAssuranceErrorReason.ENDPOINT_NOT_AVAILABLE,
      });
      expect(d.endpointsRepo.create).not.toHaveBeenCalled();
    });
  });
});
