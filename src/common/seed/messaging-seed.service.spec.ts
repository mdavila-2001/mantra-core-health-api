import { jest } from '@jest/globals';
import {
  EventSubscriptions,
  MessageQueues,
} from '../../modules/messaging/entities';
import {
  GUARDIAN_LINK_DEAD_LETTER_QUEUE,
  GUARDIAN_LINK_QUEUE,
  GUARDIAN_LINK_REQUESTED_EVENT,
  GUARDIAN_LINK_REQUESTED_EVENT_VERSION,
} from '../../modules/profiles/guardian-link.contract';
import { CONCEPTS } from '../constants/concepts';
import { MESSAGING_SEED, MessagingSeedService } from './messaging-seed.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Un `em` que recuerda lo creado y en qué tanda de `flush` quedó. */
function build(existentes = false) {
  const creados: { entity: unknown; data: any; tanda: number }[] = [];
  let tanda = 0;
  const em = {
    findOne: mockFn(async () => (existentes ? { id: 'ya-existe' } : null)),
    create: mockFn((entity: unknown, data: any) => {
      creados.push({ entity, data, tanda });
      return data;
    }),
    flush: mockFn(async () => {
      tanda += 1;
    }),
  };
  const orm = { em: { fork: () => em } };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new MessagingSeedService(orm as any, logger as any);
  return { service, creados };
}

describe('MessagingSeedService · cola y suscripción del aviso al tutor', () => {
  it('siembra la cola muerta ANTES (flush aparte) que la cola que la referencia', async () => {
    const { service, creados } = build();
    await service.run();

    const colas = creados.filter((c) => c.entity === MessageQueues);
    const dlq = colas.find(
      (c) => c.data.code === GUARDIAN_LINK_DEAD_LETTER_QUEUE,
    );
    const cola = colas.find((c) => c.data.code === GUARDIAN_LINK_QUEUE);
    expect(dlq).toBeDefined();
    expect(cola?.data.deadLetterQueueId).toBe(
      MESSAGING_SEED.guardianLinkDeadLetterQueueId,
    );
    expect(cola!.tanda).toBeGreaterThan(dlq!.tanda);
  });

  it('la suscripción casa exactamente con el evento que publica el alta', async () => {
    const { service, creados } = build();
    await service.run();

    const sub = creados.find((c) => c.entity === EventSubscriptions);
    expect(sub?.data).toMatchObject({
      eventType: GUARDIAN_LINK_REQUESTED_EVENT,
      eventVersion: GUARDIAN_LINK_REQUESTED_EVENT_VERSION,
      deliveryModeConceptId: CONCEPTS.MSG_DELIVERY_MODE_QUEUE,
      targetQueue: GUARDIAN_LINK_QUEUE,
      isActive: true,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    // Global: sin tenant, la recibe el evento de cualquier organización.
    expect(sub?.data.tenantId).toBeUndefined();
  });

  it('idempotente: con todo ya sembrado no crea nada', async () => {
    const { service, creados } = build(true);
    await expect(service.run()).resolves.toEqual({ inserted: 0 });
    expect(creados).toEqual([]);
  });
});
