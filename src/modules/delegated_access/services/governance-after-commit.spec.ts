import { jest } from '@jest/globals';
import { EventManager, EventType } from '@mikro-orm/core';
import { afterCommit } from './governance-after-commit';

/** Un EntityManager de juguete que reparte los eventos de transacción como MikroORM. */
function fakeEm(inTransaction: boolean) {
  const events = new EventManager([]);
  const ctx = {
    getTransactionContext: () => (inTransaction ? {} : undefined),
    getEventManager: () => events,
  };
  const em: any = { getContext: () => ctx };
  const emit = (event: EventType, transaction: object) =>
    events.dispatchEvent(event, { em: ctx, transaction } as any);
  return { em, emit };
}
const ROOT = {};
const SAVEPOINT = Object.defineProperty({}, 'savepointName', {
  value: 'trx2',
});

describe('afterCommit · V-4: lo que avisa a otras réplicas va DESPUÉS del commit real', () => {
  it('sin transacción abierta alrededor (la propia ya confirmó) corre al instante', () => {
    const { em } = fakeEm(false);
    const run = (jest.fn as any)();
    afterCommit(em, run);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('un EntityManager sin contexto (dobles de prueba) corre al instante', () => {
    const run = (jest.fn as any)();
    afterCommit({} as any, run);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('dentro de la transacción de la petición NO corre al liberar un savepoint: espera el commit de la raíz', async () => {
    const { em, emit } = fakeEm(true);
    const run = (jest.fn as any)();
    afterCommit(em, run);
    expect(run).not.toHaveBeenCalled();
    await emit(EventType.afterTransactionCommit, SAVEPOINT);
    expect(run).not.toHaveBeenCalled();
    await emit(EventType.afterTransactionCommit, ROOT);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('corre una sola vez aunque haya más commits', async () => {
    const { em, emit } = fakeEm(true);
    const run = (jest.fn as any)();
    afterCommit(em, run);
    await emit(EventType.afterTransactionCommit, ROOT);
    await emit(EventType.afterTransactionCommit, ROOT);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('si la transacción raíz se revierte también corre (la caché pudo guardar lo no confirmado), pero no por el rollback de un savepoint', async () => {
    const { em, emit } = fakeEm(true);
    const run = (jest.fn as any)();
    afterCommit(em, run);
    await emit(EventType.afterTransactionRollback, SAVEPOINT);
    expect(run).not.toHaveBeenCalled();
    await emit(EventType.afterTransactionRollback, ROOT);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('un fallo del aviso no rompe la transacción que acaba de confirmar', async () => {
    const { em, emit } = fakeEm(true);
    const attempted = (jest.fn as any)(() => {
      throw new Error('redis caído');
    });
    afterCommit(em, attempted);
    await emit(EventType.afterTransactionCommit, ROOT);
    expect(attempted).toHaveBeenCalledTimes(1);
  });
});
