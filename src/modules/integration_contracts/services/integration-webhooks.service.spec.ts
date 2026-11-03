import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationWebhooksService } from './integration-webhooks.service';
import { ICON } from '../integration_contracts.concepts';
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
  // Por defecto el contrato pedido es del tenant activo (el repositorio real
  // filtra por tenant); las pruebas de aislamiento lo sustituyen.
  const contractsRepo = {
    findByIdInTenant: mockFn(
      async (_tx: any, tenantId: string, id: string) => ({
        id,
        tenantId,
        statusConceptId: ICON.CONTRACT_ACTIVE,
      }),
    ),
  };
  const versionsRepo = { findActiveByContract: mockFn() };
  const subscriptionsRepo = {
    findById: mockFn(),
    findDuplicate: mockFn(),
    create: mockFn(),
  };
  const exchangeRecordsRepo = { create: mockFn() };
  const evidenceRepo = { create: mockFn() };
  // Entrega HTTP real mockeada: por defecto 2xx.
  const http = {
    post: mockFn().mockResolvedValue({
      ok: true,
      httpStatus: 200,
      latencyMs: 10,
      signature: 'sig',
      responseBody: { ok: true },
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationWebhooksService(
    em as any,
    contractsRepo as any,
    versionsRepo as any,
    subscriptionsRepo as any,
    exchangeRecordsRepo as any,
    evidenceRepo,
    http,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT),
    raw: service,
    tx,
    contractsRepo,
    versionsRepo,
    subscriptionsRepo,
    exchangeRecordsRepo,
    evidenceRepo,
    http,
  };
}

describe('IntegrationWebhooksService', () => {
  describe('subscribe (UC-31-04)', () => {
    it('subscribes a webhook on an ACTIVE contract', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_ACTIVE,
      });
      d.subscriptionsRepo.findDuplicate.mockResolvedValue(null);
      d.subscriptionsRepo.create.mockReturnValue({
        id: 's1',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });

      const res = await d.service.subscribe(
        'c1',
        { callbackUri: 'https://x/cb' },
        actor,
      );

      expect(res).toEqual({
        id: 's1',
        integrationContractId: 'c1',
        status: ICON.SUBSCRIPTION_ACTIVE,
      });
    });

    it('rejects subscribing when the contract is not ACTIVE (422)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_DRAFT,
      });
      await expect(
        d.service.subscribe(
          'c1',
          { callbackUri: 'https://x/cb' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate subscription (409)', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c1',
        tenantId: TENANT,
        statusConceptId: ICON.CONTRACT_ACTIVE,
      });
      d.subscriptionsRepo.findDuplicate.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.subscribe(
          'c1',
          { callbackUri: 'https://x/cb' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('deliver (UC-31-09)', () => {
    it('records an OUTBOUND exchange and delivery evidence, flushing the record first', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue({
        id: 's1',
        integrationContractId: 'c1',
        callbackUri: 'https://consumer.example/cb',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue({ id: 'v1' });
      d.exchangeRecordsRepo.create.mockReturnValue({
        id: 'r1',
        outcomeConceptId: ICON.OUTCOME_SUCCESS,
      });
      d.evidenceRepo.create.mockReturnValue({
        id: 'e1',
        outcomeConceptId: ICON.DELIVERY_DELIVERED,
      });

      const res = await d.service.deliver(
        's1',
        { outcome: 'DELIVERED' } as any,
        actor,
      );

      expect(d.http.post).toHaveBeenCalledTimes(1);
      expect(res).toEqual({
        id: 'e1',
        integrationExchangeRecordId: 'r1',
        outcome: ICON.DELIVERY_DELIVERED,
      });
      expect(d.exchangeRecordsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          directionConceptId: ICON.DIRECTION_OUTBOUND,
          messageTypeConceptId: ICON.MESSAGE_WEBHOOK,
          integrationContractVersionId: 'v1',
        }),
      );
      expect(d.evidenceRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          integrationExchangeRecordId: 'r1',
          webhookSubscriptionId: 's1',
        }),
      );
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });

    it('throws not found when the subscription is absent (404)', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.deliver('s1', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects delivery when there is no ACTIVE contract version (422)', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue({
        id: 's1',
        integrationContractId: 'c1',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue(null);
      await expect(
        d.service.deliver('s1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects delivery when the subscription has no callbackUri (422)', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue({
        id: 's1',
        integrationContractId: 'c1',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue({ id: 'v1' });
      await expect(
        d.service.deliver('s1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('records a FAILED delivery when the consumer responds with an error', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue({
        id: 's1',
        integrationContractId: 'c1',
        callbackUri: 'https://consumer.example/cb',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });
      d.versionsRepo.findActiveByContract.mockResolvedValue({ id: 'v1' });
      d.exchangeRecordsRepo.create.mockReturnValue({ id: 'r1' });
      d.evidenceRepo.create.mockReturnValue({
        id: 'e1',
        outcomeConceptId: ICON.DELIVERY_FAILED,
      });
      d.http.post.mockResolvedValue({
        ok: false,
        httpStatus: 500,
        latencyMs: 40,
        signature: 'sig',
        responseBody: undefined,
        errorText: 'HTTP 500',
      });

      const res = await d.service.deliver('s1', {}, actor);

      expect(res.outcome).toBe(ICON.DELIVERY_FAILED);
      expect(d.evidenceRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ outcomeConceptId: ICON.DELIVERY_FAILED }),
      );
    });
  });
  describe('aislamiento por tenant (ICON-01)', () => {
    it('suscribir un webhook sobre el contrato de otro tenant responde 404 uniforme', async () => {
      const d = build();
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);
      const foreign = await d.service
        .subscribe('c-b', { callbackUri: 'https://x/cb' } as any, actor)
        .catch((e: any) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.reason).toBe(
        IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
      );
      expect(foreign.details).toBeUndefined();
      expect(d.subscriptionsRepo.create).not.toHaveBeenCalled();
      expect(d.contractsRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        'c-b',
      );
    });

    it('entregar una suscripción de otro tenant no firma, no llama al callback ni deja evidencia', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue({
        id: 's-b',
        integrationContractId: 'c-b',
        callbackUri: 'https://tenant-b.example/cb',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });
      // El repositorio acotado por tenant no encuentra el contrato ajeno.
      d.contractsRepo.findByIdInTenant.mockResolvedValue(null);
      d.versionsRepo.findActiveByContract.mockResolvedValue({ id: 'v-b' });

      const foreign = await d.service
        .deliver('s-b', {} as any, actor)
        .catch((e: any) => e);
      d.subscriptionsRepo.findById.mockResolvedValue(null);
      const missing = await d.service
        .deliver('s-b', {} as any, actor)
        .catch((e: any) => e);

      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getStatus()).toBe(404);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.reason).toBe(
        IntegrationContractsErrorReason.INTEGRATION_RESOURCE_OUT_OF_SCOPE,
      );
      expect(d.http.post).not.toHaveBeenCalled();
      expect(d.exchangeRecordsRepo.create).not.toHaveBeenCalled();
      expect(d.evidenceRepo.create).not.toHaveBeenCalled();
      expect(d.contractsRepo.findByIdInTenant).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        'c-b',
      );
    });

    it('defensa en profundidad: un contrato ajeno devuelto por el repositorio también se rechaza', async () => {
      const d = build();
      d.subscriptionsRepo.findById.mockResolvedValue({
        id: 's-b',
        integrationContractId: 'c-b',
        callbackUri: 'https://tenant-b.example/cb',
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
      });
      d.contractsRepo.findByIdInTenant.mockResolvedValue({
        id: 'c-b',
        tenantId: OTHER_TENANT,
      });
      await expect(
        d.service.deliver('s-b', {} as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.http.post).not.toHaveBeenCalled();
    });

    it('sin tenant activo no se entrega nada (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(d.raw.deliver('s1', {} as any, actor)).rejects.toMatchObject(
        { details: { reason: 'TENANT_REQUIRED' } },
      );
      expect(d.http.post).not.toHaveBeenCalled();
    });
  });
});
