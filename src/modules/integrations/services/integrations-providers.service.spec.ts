import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime jest, sin las firmas estrictas de @jest/globals.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsProvidersService } from './integrations-providers.service';
import { INTEG } from '../integrations.concepts';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { IntegrationsErrorReason } from '../integrations.error-reasons';

const TENANT = 'tenant-a';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const providersRepo = {
    findByCode: mockFn(),
    findById: mockFn(),
    create: mockFn(),
  };
  const endpointsRepo = {
    findByProviderAndVersion: mockFn(),
    createEndpoint: mockFn(),
    createFieldMapping: mockFn(),
  };
  const webhooksRepo = { findByLogicalKey: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationsProvidersService(
    em as any,
    providersRepo,
    endpointsRepo as any,
    webhooksRepo,
    logger as any,
  );
  return { service, tx, providersRepo, endpointsRepo, webhooksRepo };
}

describe('IntegrationsProvidersService', () => {
  describe('registerProvider (UC-12-01)', () => {
    it('creates the provider ACTIVE and flushes', async () => {
      const d = build();
      d.providersRepo.findByCode.mockResolvedValue(null);
      const created = {
        id: 'p1',
        code: 'LAB',
        name: 'Lab',
        stateConceptId: INTEG.PROVIDER_ACTIVE,
        createdAt: new Date(),
      };
      d.providersRepo.create.mockReturnValue(created);

      const res = await d.service.registerProvider(
        { code: 'LAB', name: 'Lab', providerType: 'LAB' } as any,
        actor,
      );

      expect(res.id).toBe('p1');
      expect(res.state).toBe(INTEG.PROVIDER_ACTIVE);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate code (conflict)', async () => {
      const d = build();
      d.providersRepo.findByCode.mockResolvedValue({ id: 'existing' });
      await expect(
        d.service.registerProvider(
          { code: 'LAB', name: 'Lab', providerType: 'LAB' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.providersRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('publishEndpoint (UC-12-04)', () => {
    it('throws when the provider does not exist', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishEndpoint(
          'p1',
          { code: 'c', operation: 'o', version: 'v1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the provider is not active (precondition)', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        stateConceptId: INTEG.PROVIDER_DRAFT,
      });
      await expect(
        d.service.publishEndpoint(
          'p1',
          { code: 'c', operation: 'o', version: 'v1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate version (conflict)', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        stateConceptId: INTEG.PROVIDER_ACTIVE,
      });
      d.endpointsRepo.findByProviderAndVersion.mockResolvedValue({ id: 'e0' });
      await expect(
        d.service.publishEndpoint(
          'p1',
          { code: 'c', operation: 'o', version: 'v1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('publishes the endpoint, flushes the parent, then creates mappings', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        stateConceptId: INTEG.PROVIDER_ACTIVE,
      });
      d.endpointsRepo.findByProviderAndVersion.mockResolvedValue(null);
      d.endpointsRepo.createEndpoint.mockReturnValue({
        id: 'e1',
        code: 'c',
        version: 'v1',
        stateConceptId: INTEG.ENDPOINT_PUBLISHED,
      });

      const res = await d.service.publishEndpoint(
        'p1',
        {
          code: 'c',
          operation: 'o',
          version: 'v1',
          mappings: [
            { sourcePath: 'a', targetField: 'b', direction: 'OUTBOUND' },
          ],
        } as any,
        actor,
      );

      expect(res.mappingsCount).toBe(1);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(d.endpointsRepo.createFieldMapping).toHaveBeenCalledTimes(1);
    });
  });

  describe('createWebhookSubscription (UC-12-11)', () => {
    it('creates a new subscription when none exists', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        stateConceptId: INTEG.PROVIDER_ACTIVE,
      });
      d.webhooksRepo.findByLogicalKey.mockResolvedValue(null);
      d.webhooksRepo.create.mockReturnValue({
        id: 'w1',
        eventType: 'e',
        stateConceptId: INTEG.WEBHOOK_ACTIVE,
      });

      const res = await runWithTenant(TENANT, () =>
        d.service.createWebhookSubscription(
          'p1',
          { eventType: 'e', callbackUrl: 'https://x.io/cb' },
          actor,
        ),
      );
      expect(res.updated).toBe(false);
      expect(res.id).toBe('w1');
      // La suscripción pertenece al tenant del contexto, no a uno del cuerpo.
      expect(d.webhooksRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
      expect(d.webhooksRepo.findByLogicalKey).toHaveBeenCalledWith(
        d.tx,
        'p1',
        'e',
        TENANT,
      );
    });

    it('updates an existing subscription (upsert)', async () => {
      const d = build();
      d.providersRepo.findById.mockResolvedValue({
        id: 'p1',
        stateConceptId: INTEG.PROVIDER_ACTIVE,
      });
      const existing = {
        id: 'w1',
        eventType: 'e',
        callbackUrl: 'old',
        stateConceptId: INTEG.WEBHOOK_DISABLED,
        updatedAt: new Date(),
      };
      d.webhooksRepo.findByLogicalKey.mockResolvedValue(existing);

      const res = await runWithTenant(TENANT, () =>
        d.service.createWebhookSubscription(
          'p1',
          { eventType: 'e', callbackUrl: 'https://x.io/new' },
          actor,
        ),
      );
      expect(res.updated).toBe(true);
      expect(existing.callbackUrl).toBe('https://x.io/new');
      expect(existing.stateConceptId).toBe(INTEG.WEBHOOK_ACTIVE);
      expect(d.webhooksRepo.create).not.toHaveBeenCalled();
    });

    it('rechaza un tenantId del cuerpo distinto del activo, sin crear ni actualizar', async () => {
      const d = build();
      const attempt = runWithTenant(TENANT, () =>
        d.service.createWebhookSubscription(
          'p1',
          {
            tenantId: 'tenant-b',
            eventType: 'e',
            callbackUrl: 'https://x.io/cb',
          },
          actor,
        ),
      );
      await expect(attempt).rejects.toBeInstanceOf(PreconditionFailedException);
      await expect(attempt).rejects.toMatchObject({
        reason: IntegrationsErrorReason.INTEGRATIONS_TENANT_MISMATCH,
      });
      expect(d.webhooksRepo.findByLogicalKey).not.toHaveBeenCalled();
      expect(d.webhooksRepo.create).not.toHaveBeenCalled();
    });

    it('sin tenant activo no hay suscripción global implícita (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(
        d.service.createWebhookSubscription(
          'p1',
          { eventType: 'e', callbackUrl: 'https://x.io/cb' },
          actor,
        ),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
      expect(d.webhooksRepo.create).not.toHaveBeenCalled();
    });
  });
});
