import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsWebhooksService } from './integrations-webhooks.service';
import { INTEG } from '../integrations.concepts';
import {
  ResourceNotFoundException,
  UnauthorizedException,
  canonicalJson,
  deriveWebhookSecret,
  signPayload,
} from '../../../common';

/** Firma válida del payload para la conexión dada (mismo secreto que el servicio). */
function sign(connectionId: string, payload: unknown): string {
  return signPayload(
    deriveWebhookSecret('connection', connectionId),
    canonicalJson(payload),
  );
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const connectionsRepo = { findById: mockFn() };
  const inboundRepo = {
    findByConnectionAndSignature: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationsWebhooksService(
    em as any,
    connectionsRepo as any,
    inboundRepo as any,
    logger as any,
  );
  return { service, tx, connectionsRepo, inboundRepo };
}

describe('IntegrationsWebhooksService', () => {
  describe('receiveInbound (UC-12-09)', () => {
    it('throws when the connection does not exist', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.receiveInbound({
          connectionId: 'c1',
          payloadJson: {},
        } as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects a webhook with an invalid/missing signature (fail-closed)', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      await expect(
        d.service.receiveInbound({
          connectionId: 'c1',
          payloadJson: { a: 1 },
          signature: 'not-a-valid-signature',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      // No se persiste nada si la firma no valida.
      expect(d.inboundRepo.create).not.toHaveBeenCalled();
    });

    it('de-duplicates a redelivery by signature', async () => {
      const d = build();
      const payload = {};
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.inboundRepo.findByConnectionAndSignature.mockResolvedValue({
        id: 'i0',
        statusConceptId: INTEG.INBOUND_RECEIVED,
      });
      const res = await d.service.receiveInbound({
        connectionId: 'c1',
        payloadJson: payload,
        signature: sign('c1', payload),
      });
      expect(res.duplicate).toBe(true);
      expect(res.id).toBe('i0');
      expect(d.inboundRepo.create).not.toHaveBeenCalled();
    });

    it('stores a new inbound message as RECEIVED', async () => {
      const d = build();
      const payload = { a: 1 };
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.inboundRepo.findByConnectionAndSignature.mockResolvedValue(null);
      d.inboundRepo.create.mockReturnValue({
        id: 'i1',
        statusConceptId: INTEG.INBOUND_RECEIVED,
      });
      const res = await d.service.receiveInbound({
        connectionId: 'c1',
        payloadJson: payload,
        signature: sign('c1', payload),
      });
      expect(res.duplicate).toBe(false);
      expect(res.status).toBe(INTEG.INBOUND_RECEIVED);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });
  });
});
