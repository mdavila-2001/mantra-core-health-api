import { jest } from '@jest/globals';
import { Bulkhead } from './bulkhead';
import { BulkheadFullError } from './resilience.errors';

/** Promesa que el test controla, para mantener ocupado un hueco del mamparo. */
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('Bulkhead', () => {
  it('ejecuta sin esperar mientras hay huecos', async () => {
    const bulkhead = new Bulkhead({ operation: 'api', maxConcurrent: 2 });
    await expect(bulkhead.execute(() => Promise.resolve('ok'))).resolves.toBe(
      'ok',
    );
    expect(bulkhead.snapshot().inFlight).toBe(0);
  });

  it('acota las operaciones en vuelo', async () => {
    const bulkhead = new Bulkhead({
      operation: 'api',
      maxConcurrent: 2,
      maxQueued: 2,
    });
    const first = deferred();
    const second = deferred();

    void bulkhead.execute(() => first.promise);
    void bulkhead.execute(() => second.promise);

    expect(bulkhead.snapshot().inFlight).toBe(2);

    first.resolve();
    second.resolve();
  });

  it('encola cuando no hay hueco y libera al terminar el anterior', async () => {
    const bulkhead = new Bulkhead({
      operation: 'api',
      maxConcurrent: 1,
      maxQueued: 1,
    });
    const running = deferred();
    const queued = jest.fn(() => Promise.resolve('segundo'));

    const first = bulkhead.execute(() => running.promise);
    const second = bulkhead.execute(queued);

    expect(queued).not.toHaveBeenCalled();
    expect(bulkhead.snapshot().queued).toBe(1);

    running.resolve();
    await first;

    await expect(second).resolves.toBe('segundo');
  });

  it('rechaza rápido cuando la cola está llena', async () => {
    // Una cola sin límite convertiría la saturación en un OOM: las peticiones
    // se aceptarían, se apilarían y el proceso moriría sin rechazar ninguna.
    const bulkhead = new Bulkhead({
      operation: 'api',
      maxConcurrent: 1,
      maxQueued: 1,
    });
    const running = deferred();

    void bulkhead.execute(() => running.promise);
    void bulkhead.execute(() => Promise.resolve('en cola'));

    await expect(
      bulkhead.execute(() => Promise.resolve('de más')),
    ).rejects.toBeInstanceOf(BulkheadFullError);
    expect(bulkhead.snapshot().rejected).toBe(1);

    running.resolve();
  });

  it('maxQueued = 0 rechaza en cuanto no hay hueco', async () => {
    const bulkhead = new Bulkhead({ operation: 'api', maxConcurrent: 1 });
    const running = deferred();
    void bulkhead.execute(() => running.promise);

    await expect(
      bulkhead.execute(() => Promise.resolve('x')),
    ).rejects.toBeInstanceOf(BulkheadFullError);

    running.resolve();
  });

  it('libera el hueco aunque la operación falle', async () => {
    const bulkhead = new Bulkhead({ operation: 'api', maxConcurrent: 1 });

    await bulkhead
      .execute(() => Promise.reject(new Error('boom')))
      .catch(() => undefined);

    expect(bulkhead.snapshot().inFlight).toBe(0);
    await expect(bulkhead.execute(() => Promise.resolve('ok'))).resolves.toBe(
      'ok',
    );
  });

  it('saca de la cola a quien cancela: un apagado no espera a nadie', async () => {
    const bulkhead = new Bulkhead({
      operation: 'api',
      maxConcurrent: 1,
      maxQueued: 2,
    });
    const running = deferred();
    const controller = new AbortController();

    void bulkhead.execute(() => running.promise);
    const waiting = bulkhead.execute(
      () => Promise.resolve('x'),
      controller.signal,
    );

    expect(bulkhead.snapshot().queued).toBe(1);
    controller.abort(new Error('apagando'));

    await expect(waiting).rejects.toThrow('apagando');
    expect(bulkhead.snapshot().queued).toBe(0);

    running.resolve();
  });

  it('la fotografía refleja los límites configurados', () => {
    const bulkhead = new Bulkhead({
      operation: 'api',
      maxConcurrent: 4,
      maxQueued: 8,
    });
    expect(bulkhead.snapshot()).toMatchObject({
      operation: 'api',
      maxConcurrent: 4,
      maxQueued: 8,
      inFlight: 0,
      queued: 0,
      rejected: 0,
    });
  });
});
