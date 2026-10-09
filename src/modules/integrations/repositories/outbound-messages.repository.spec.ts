import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboundMessagesRepository } from './outbound-messages.repository';

/**
 * P-11 del informe de fallos tragados: retener los mensajes de una conexión
 * pasa por la unidad de trabajo del ORM (row_version + espejo de historial),
 * no por un `nativeUpdate` que se saltea los dos.
 */
describe('OutboundMessagesRepository.holdQueuedForConnection', () => {
  it('retiene cada mensaje encolado por el ORM, con quién lo cambió, y no usa nativeUpdate', async () => {
    const queued = [
      { id: 'm1', statusConceptId: 'QUEUED', updatedAt: new Date(0) },
      { id: 'm2', statusConceptId: 'QUEUED', updatedAt: new Date(0) },
    ];
    const em = {
      find: jest.fn(async () => queued),
      flush: jest.fn(async () => undefined),
      nativeUpdate: jest.fn(),
    };

    const held = await new OutboundMessagesRepository().holdQueuedForConnection(
      em as unknown as EntityManager,
      'conn-1',
      'QUEUED',
      'HELD',
      'user-1',
    );

    expect(held).toBe(2);
    expect(em.find).toHaveBeenCalledWith(expect.anything(), {
      connectionId: 'conn-1',
      statusConceptId: 'QUEUED',
    });
    expect(queued.map((m) => m.statusConceptId)).toEqual(['HELD', 'HELD']);
    expect(queued.every((m) => (m as { updatedByUserId?: string }).updatedByUserId === 'user-1')).toBe(true);
    expect(em.flush).toHaveBeenCalledTimes(1);
    expect(em.nativeUpdate).not.toHaveBeenCalled();
  });
});
