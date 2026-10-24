import { jest } from '@jest/globals';
import { UniqueConstraintViolationException } from '@mikro-orm/core';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationsWebhooksService } from './integrations-webhooks.service';
import { INTEG } from '../integrations.concepts';
import { IntegrationsErrorReason } from '../integrations.error-reasons';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  canonicalJson,
  signPayload,
} from '../../../common';

/** Secretos que la bóveda entrega para la credencial activa (>= 32 caracteres). */
const SECRET_NEW = 'secreto-vigente-de-la-conexion-0001';
const SECRET_OLD = 'secreto-anterior-de-la-conexion-0002';

/** Firma válida del payload bajo el secreto dado. */
function sign(secret: string, payload: unknown): string {
  return signPayload(secret, canonicalJson(payload));
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    execute: mockFn().mockResolvedValue(undefined),
  };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => tx),
  };
  const connectionsRepo = { findById: mockFn() };
  const inboundRepo = {
    findByConnectionAndSignature: mockFn(),
    create: mockFn(),
  };
  const secrets = {
    resolveActiveSecrets: mockFn().mockResolvedValue([SECRET_NEW]),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new IntegrationsWebhooksService(
    em as any,
    connectionsRepo as any,
    inboundRepo as any,
    secrets as any,
    logger as any,
  );
  return { service, tx, em, connectionsRepo, inboundRepo, secrets };
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
        signature: sign(SECRET_NEW, payload),
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
        signature: sign(SECRET_NEW, payload),
      });
      expect(res.duplicate).toBe(false);
      expect(res.status).toBe(INTEG.INBOUND_RECEIVED);
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });
  });

  describe('secreto de la credencial activa (INT-02)', () => {
    it('verifica contra el secreto que entrega la bóveda para esa conexión, no contra una derivación', async () => {
      const d = build();
      const payload = { evento: 'x' };
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.inboundRepo.findByConnectionAndSignature.mockResolvedValue(null);
      d.inboundRepo.create.mockReturnValue({
        id: 'i1',
        statusConceptId: INTEG.INBOUND_RECEIVED,
      });

      const res = await d.service.receiveInbound({
        connectionId: 'c1',
        payloadJson: payload,
        signature: sign(SECRET_NEW, payload),
      });

      expect(res.duplicate).toBe(false);
      expect(d.secrets.resolveActiveSecrets).toHaveBeenCalledWith(d.tx, 'c1');
    });

    it('rechaza una firma hecha con un secreto que no es el de la credencial activa', async () => {
      const d = build();
      const payload = { evento: 'x' };
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      await expect(
        d.service.receiveInbound({
          connectionId: 'c1',
          payloadJson: payload,
          signature: sign('otro-secreto-que-no-es-de-la-conexion-0', payload),
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(d.inboundRepo.create).not.toHaveBeenCalled();
    });

    it('durante una rotación valen la clave nueva y la anterior', async () => {
      const d = build();
      const payload = { evento: 'x' };
      d.secrets.resolveActiveSecrets.mockResolvedValue([
        SECRET_NEW,
        SECRET_OLD,
      ]);
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.inboundRepo.findByConnectionAndSignature.mockResolvedValue(null);
      d.inboundRepo.create.mockReturnValue({
        id: 'i1',
        statusConceptId: INTEG.INBOUND_RECEIVED,
      });

      const viejo = await d.service.receiveInbound({
        connectionId: 'c1',
        payloadJson: payload,
        signature: sign(SECRET_OLD, payload),
      });
      const nuevo = await d.service.receiveInbound({
        connectionId: 'c1',
        payloadJson: payload,
        signature: sign(SECRET_NEW, payload),
      });

      expect(viejo.duplicate).toBe(false);
      expect(nuevo.duplicate).toBe(false);
    });

    it('cerrada la ventana de rotación, la clave anterior deja de valer', async () => {
      const d = build();
      const payload = { evento: 'x' };
      d.secrets.resolveActiveSecrets.mockResolvedValue([SECRET_NEW]);
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      await expect(
        d.service.receiveInbound({
          connectionId: 'c1',
          payloadJson: payload,
          signature: sign(SECRET_OLD, payload),
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('si la bóveda no entrega un secreto activo falla cerrado, con error catalogado y sin persistir', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.secrets.resolveActiveSecrets.mockRejectedValue(
        new PreconditionFailedException(
          'La conexión no tiene un secreto activo disponible',
          { connectionId: 'c1' },
          IntegrationsErrorReason.INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE,
        ),
      );
      await expect(
        d.service.receiveInbound({
          connectionId: 'c1',
          payloadJson: { a: 1 },
          signature: 'cualquiera',
        }),
      ).rejects.toMatchObject({
        reason:
          IntegrationsErrorReason.INTEGRATIONS_CONNECTION_SECRET_UNAVAILABLE,
      });
      expect(d.inboundRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('deduplicación atómica (INT-03)', () => {
    it('toma el lock transaccional por (conexión, firma) antes de consultar', async () => {
      const d = build();
      const payload = { a: 1 };
      const signature = sign(SECRET_NEW, payload);
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.inboundRepo.findByConnectionAndSignature.mockResolvedValue(null);
      d.inboundRepo.create.mockReturnValue({
        id: 'i1',
        statusConceptId: INTEG.INBOUND_RECEIVED,
      });

      await d.service.receiveInbound({
        connectionId: 'c1',
        payloadJson: payload,
        signature,
      });

      expect(d.tx.execute).toHaveBeenCalledWith(
        expect.stringContaining('pg_advisory_xact_lock'),
        [`integrations.inbound:c1:${signature}`],
      );
      expect(d.tx.execute.mock.invocationCallOrder[0]).toBeLessThan(
        d.inboundRepo.findByConnectionAndSignature.mock.invocationCallOrder[0],
      );
    });

    it('dos entregas simultáneas con la misma firma persisten una sola vez', async () => {
      const d = build();
      const payload = { a: 1 };
      const signature = sign(SECRET_NEW, payload);
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });

      // Base simulada: el lock transaccional serializa las transacciones que
      // piden la misma clave y se libera al terminar la transacción.
      const store: Array<{ id: string; statusConceptId: string }> = [];
      const queues = new Map<string, Promise<void>>();
      d.em.transactional.mockImplementation(async (cb: any) => {
        const released: Array<() => void> = [];
        const tx = {
          execute: async (_sql: string, [key]: [string]) => {
            const previous = queues.get(key) ?? Promise.resolve();
            let release!: () => void;
            const mine = new Promise<void>((resolve) => (release = resolve));
            queues.set(
              key,
              previous.then(() => mine),
            );
            released.push(release);
            await previous;
          },
          flush: async () => undefined,
        };
        d.inboundRepo.findByConnectionAndSignature.mockImplementation(
          async () => store[0] ?? null,
        );
        d.inboundRepo.create.mockImplementation(() => {
          const row = {
            id: `i${store.length + 1}`,
            statusConceptId: INTEG.INBOUND_RECEIVED,
          };
          store.push(row);
          return row;
        });
        try {
          return await cb(tx);
        } finally {
          released.forEach((release) => release());
        }
      });

      const [first, second] = await Promise.all([
        d.service.receiveInbound({
          connectionId: 'c1',
          payloadJson: payload,
          signature,
        }),
        d.service.receiveInbound({
          connectionId: 'c1',
          payloadJson: payload,
          signature,
        }),
      ]);

      expect(store).toHaveLength(1);
      expect([first.duplicate, second.duplicate].sort()).toEqual([false, true]);
      expect(second.id).toBe(first.id);
    });

    it('si el índice único rechaza la inserción, responde como duplicado de la fila ya confirmada', async () => {
      const d = build();
      const payload = { a: 1 };
      const signature = sign(SECRET_NEW, payload);
      d.em.transactional.mockRejectedValue(
        new UniqueConstraintViolationException(new Error('duplicate key')),
      );
      d.inboundRepo.findByConnectionAndSignature.mockResolvedValue({
        id: 'i0',
        statusConceptId: INTEG.INBOUND_RECEIVED,
      });

      const res = await d.service.receiveInbound({
        connectionId: 'c1',
        payloadJson: payload,
        signature,
      });

      expect(res).toEqual({
        id: 'i0',
        status: INTEG.INBOUND_RECEIVED,
        duplicate: true,
      });
    });

    it('una violación de unicidad sin fila que releer no se oculta', async () => {
      const d = build();
      const payload = { a: 1 };
      d.em.transactional.mockRejectedValue(
        new UniqueConstraintViolationException(new Error('duplicate key')),
      );
      d.inboundRepo.findByConnectionAndSignature.mockResolvedValue(null);
      await expect(
        d.service.receiveInbound({
          connectionId: 'c1',
          payloadJson: payload,
          signature: sign(SECRET_NEW, payload),
        }),
      ).rejects.toBeInstanceOf(UniqueConstraintViolationException);
    });

    it('sin firma no hay lock ni deduplicación', async () => {
      const d = build();
      d.connectionsRepo.findById.mockResolvedValue({ id: 'c1' });
      d.secrets.resolveActiveSecrets.mockResolvedValue([SECRET_NEW]);
      await expect(
        d.service.receiveInbound({ connectionId: 'c1', payloadJson: {} }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(d.tx.execute).not.toHaveBeenCalled();
    });
  });
});
