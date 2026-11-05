import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsConnectionsService } from './integrations-connections.service';
import { INTEG } from '../integrations.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { IntegrationsErrorReason } from '../integrations.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT = 't1';
const OTHER_TENANT = 't2';

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
  const providersRepo = { findById: mockFn() };
  const connectionsRepo = { findByIdInScope: mockFn(), create: mockFn() };
  const credentialsRepo = {
    findActiveByConnection: mockFn(),
    create: mockFn(),
  };
  const outboundRepo = {
    holdQueuedForConnection: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationsConnectionsService(
    em as any,
    providersRepo as any,
    connectionsRepo as any,
    credentialsRepo,
    outboundRepo as any,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT),
    raw: service,
    tx,
    providersRepo,
    connectionsRepo,
    credentialsRepo,
    outboundRepo,
  };
}

describe('IntegrationsConnectionsService', () => {
  describe('provisionConnection (UC-12-02)', () => {
    it('throws when the provider is missing', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.provisionConnection(
          'p1',
          { tenantId: TENANT, secretType: 'API_KEY', secretRef: 'r' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects an inactive provider (precondition)', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        stateConceptId: INTEG.PROVIDER_INACTIVE,
      });
      await expect(
        d.service.provisionConnection(
          'p1',
          { tenantId: TENANT, secretType: 'API_KEY', secretRef: 'r' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates connection (flush) then credential, and links it back', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        stateConceptId: INTEG.PROVIDER_ACTIVE,
      });
      const conn: any = {
        id: 'c1',
        tenantId: TENANT,
        stateConceptId: INTEG.CONN_ACTIVE,
        updatedAt: new Date(),
      };
      d.connectionsRepo.create.mockReturnValue(conn);
      d.credentialsRepo.create.mockReturnValue({ id: 'cred1' });

      const res = await d.service.provisionConnection(
        'p1',
        { tenantId: TENANT, secretType: 'API_KEY', secretRef: 'r' } as any,
        actor,
      );

      expect(res.credentialId).toBe('cred1');
      expect(conn.credentialId).toBe('cred1');
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });
  });

  describe('rotateCredential (UC-12-03)', () => {
    it('rejects when connection is not active (precondition)', async () => {
      const d = build();
      d.connectionsRepo.findByIdInScope.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
        stateConceptId: INTEG.CONN_PAUSED,
      });
      await expect(
        d.service.rotateCredential('c1', { secretRef: 'new' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('retires the previous credential and links the new one', async () => {
      const d = build();
      const conn: any = {
        id: 'c1',
        tenantId: TENANT,
        stateConceptId: INTEG.CONN_ACTIVE,
        updatedAt: new Date(),
      };
      d.connectionsRepo.findByIdInScope.mockResolvedValue(conn);
      const prev: any = {
        id: 'old',
        stateConceptId: INTEG.CRED_ACTIVE,
        secretTypeConceptId: INTEG.SECRET_API_KEY,
        updatedAt: new Date(),
      };
      d.credentialsRepo.findActiveByConnection.mockResolvedValue(prev);
      d.credentialsRepo.create.mockReturnValue({ id: 'new1' });

      const res = await d.service.rotateCredential(
        'c1',
        { secretRef: 'new' },
        actor,
      );

      expect(res.credentialId).toBe('new1');
      expect(prev.stateConceptId).toBe(INTEG.CRED_RETIRED);
      expect(conn.credentialId).toBe('new1');
    });
  });

  describe('pauseConnection (UC-12-12)', () => {
    it('is a no-op when already paused (idempotent)', async () => {
      const d = build();
      d.connectionsRepo.findByIdInScope.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
        stateConceptId: INTEG.CONN_PAUSED,
      });
      const res = await d.service.pauseConnection('c1', actor);
      expect(res.state).toBe(INTEG.CONN_PAUSED);
      expect(d.outboundRepo.holdQueuedForConnection).not.toHaveBeenCalled();
    });

    it('pauses an active connection and holds its queued messages', async () => {
      const d = build();
      const conn: any = {
        id: 'c1',
        tenantId: TENANT,
        stateConceptId: INTEG.CONN_ACTIVE,
        updatedAt: new Date(),
      };
      d.connectionsRepo.findByIdInScope.mockResolvedValue(conn);
      d.outboundRepo.holdQueuedForConnection.mockResolvedValue(3);

      const res = await d.service.pauseConnection('c1', actor);

      expect(conn.stateConceptId).toBe(INTEG.CONN_PAUSED);
      expect(res.heldMessages).toBe(3);
    });
  });
  describe('aislamiento por tenant (INT-01)', () => {
    const foreignConnection = () => ({
      id: 'c-b',
      tenantId: OTHER_TENANT,
      stateConceptId: INTEG.CONN_ACTIVE,
      updatedAt: new Date(),
    });

    it('la conexión se crea en el tenant del contexto aunque el cuerpo no lo declare', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        stateConceptId: INTEG.PROVIDER_ACTIVE,
      });
      d.connectionsRepo.create.mockReturnValue({
        id: 'c1',
        tenantId: TENANT,
        stateConceptId: INTEG.CONN_ACTIVE,
        updatedAt: new Date(),
      });
      d.credentialsRepo.create.mockReturnValue({ id: 'cred1' });

      await d.service.provisionConnection(
        'p1',
        { secretType: 'API_KEY', secretRef: 'r' } as any,
        actor,
      );

      expect(d.connectionsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('rechaza un tenantId del cuerpo distinto del activo, sin crear nada', async () => {
      const d = build();
      const attempt = d.service.provisionConnection(
        'p1',
        {
          tenantId: OTHER_TENANT,
          secretType: 'API_KEY',
          secretRef: 'r',
        } as any,
        actor,
      );
      await expect(attempt).rejects.toBeInstanceOf(PreconditionFailedException);
      await expect(attempt).rejects.toMatchObject({
        reason: IntegrationsErrorReason.INTEGRATIONS_TENANT_MISMATCH,
      });
      expect(d.connectionsRepo.create).not.toHaveBeenCalled();
      expect(d.credentialsRepo.create).not.toHaveBeenCalled();
    });

    it('sin tenant activo no se aprovisiona ni se opera (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(
        d.raw.provisionConnection('p1', { secretRef: 'r' } as any, actor),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
      await expect(
        d.raw.rotateCredential('c1', { secretRef: 'n' } as any, actor),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
      await expect(d.raw.pauseConnection('c1', actor)).rejects.toMatchObject({
        details: { reason: 'TENANT_REQUIRED' },
      });
      expect(d.connectionsRepo.findByIdInScope).not.toHaveBeenCalled();
    });

    it('rotar la credencial de una conexión de otro tenant responde 404 uniforme y no cambia el secreto', async () => {
      const d = build();
      const foreign = foreignConnection();
      d.connectionsRepo.findByIdInScope.mockResolvedValue(null);
      const attempt = await d.service
        .rotateCredential('c-b', { secretRef: 'robado' } as any, actor)
        .catch((e: any) => e);
      d.connectionsRepo.findByIdInScope.mockResolvedValue(foreign);
      const defensive = await d.service
        .rotateCredential('c-b', { secretRef: 'robado' } as any, actor)
        .catch((e: any) => e);

      for (const error of [attempt, defensive]) {
        expect(error).toBeInstanceOf(ResourceNotFoundException);
        expect(error.getStatus()).toBe(404);
        expect(error.reason).toBe(
          IntegrationsErrorReason.INTEGRATIONS_RESOURCE_NOT_AVAILABLE,
        );
        expect(error.details).toBeUndefined();
      }
      expect(attempt.getResponse()).toEqual(defensive.getResponse());
      expect(d.credentialsRepo.create).not.toHaveBeenCalled();
      expect(d.credentialsRepo.findActiveByConnection).not.toHaveBeenCalled();
      expect(d.connectionsRepo.findByIdInScope).toHaveBeenCalledWith(
        d.tx,
        'c-b',
        TENANT,
      );
    });

    it('pausar una conexión de otro tenant responde 404 uniforme y no la detiene ni retiene mensajes', async () => {
      const d = build();
      const foreign = foreignConnection();
      d.connectionsRepo.findByIdInScope.mockResolvedValue(foreign);
      const attempt = await d.service
        .pauseConnection('c-b', actor)
        .catch((e: any) => e);
      d.connectionsRepo.findByIdInScope.mockResolvedValue(null);
      const missing = await d.service
        .pauseConnection('c-b', actor)
        .catch((e: any) => e);

      expect(attempt.getStatus()).toBe(404);
      expect(attempt.getResponse()).toEqual(missing.getResponse());
      expect(foreign.stateConceptId).toBe(INTEG.CONN_ACTIVE);
      expect(d.outboundRepo.holdQueuedForConnection).not.toHaveBeenCalled();
    });
  });
});
