import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ProviderConnectionsRepository } from './provider-connections.repository';
import { OutboundMessagesRepository } from './outbound-messages.repository';
import { InboundMessagesRepository } from './inbound-messages.repository';

const TENANT = 'tenant-a';

/**
 * Construye un EntityManager simulado que registra las consultas.
 *
 * @returns El EntityManager y sus espías.
 */
function fakeEm() {
  const findOne: any = (jest.fn as any)(async () => null);
  const find: any = (jest.fn as any)(async () => []);
  return { em: { findOne, find } as unknown as EntityManager, findOne, find };
}

describe('ProviderConnectionsRepository · alcance por tenant (INT-01)', () => {
  const repo = new ProviderConnectionsRepository();

  it('con tenant sólo alcanza las conexiones del tenant', async () => {
    const { em, findOne } = fakeEm();
    await repo.findByIdInScope(em, 'c1', TENANT);
    expect(findOne).toHaveBeenCalledWith(expect.anything(), {
      id: 'c1',
      tenantId: TENANT,
    });
  });

  it('sin tenant (barrido interno de SYSTEM) no filtra', async () => {
    const { em, findOne } = fakeEm();
    await repo.findByIdInScope(em, 'c1', undefined);
    expect(findOne).toHaveBeenCalledWith(expect.anything(), { id: 'c1' });
  });

  it('lista los ids de las conexiones del tenant', async () => {
    const { em, find } = fakeEm();
    find.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
    const ids = await repo.findIdsByTenant(em, TENANT);
    expect(ids).toEqual(['c1', 'c2']);
    expect(find).toHaveBeenCalledWith(
      expect.anything(),
      { tenantId: TENANT },
      { fields: ['id'] },
    );
  });
});

describe('OutboundMessagesRepository · alcance por conexión (INT-01)', () => {
  const repo = new OutboundMessagesRepository();

  it('el descubrimiento de despacho se acota a las conexiones dadas', async () => {
    const { em, find } = fakeEm();
    const now = new Date();
    await repo.findQueuedForDispatch(em, 'queued', now, 10, ['c1']);
    await repo.findQueuedForDispatch(em, 'queued', now, 10);
    expect(find.mock.calls[0][1]).toEqual({
      statusConceptId: 'queued',
      scheduledAt: { $lte: now },
      connectionId: { $in: ['c1'] },
    });
    expect(find.mock.calls[1][1]).toEqual({
      statusConceptId: 'queued',
      scheduledAt: { $lte: now },
    });
  });

  it('el descubrimiento de reintentos se acota a las conexiones dadas', async () => {
    const { em, find } = fakeEm();
    await repo.findFailed(em, 'failed', 10, ['c1']);
    expect(find.mock.calls[0][1]).toEqual({
      statusConceptId: 'failed',
      connectionId: { $in: ['c1'] },
    });
  });

  it('la correlación sólo alcanza salientes de la misma conexión', async () => {
    const { em, findOne } = fakeEm();
    await repo.findByCorrelationIdInConnection(em, 'c1', 'corr-1');
    expect(findOne).toHaveBeenCalledWith(expect.anything(), {
      connectionId: 'c1',
      correlationId: 'corr-1',
    });
  });
});

describe('InboundMessagesRepository · alcance y bloqueo (INT-01, INT-03)', () => {
  const repo = new InboundMessagesRepository();

  it('el descubrimiento de callbacks se acota a las conexiones dadas', async () => {
    const { em, find } = fakeEm();
    await repo.findReceived(em, 'received', 10, ['c1']);
    expect(find.mock.calls[0][1]).toEqual({
      statusConceptId: 'received',
      connectionId: { $in: ['c1'] },
    });
  });

  it('bloquea el callback para serializar correlaciones concurrentes', async () => {
    const { em, findOne } = fakeEm();
    await repo.findByIdForUpdate(em, 'i1');
    expect(findOne).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'i1' },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  });
});
