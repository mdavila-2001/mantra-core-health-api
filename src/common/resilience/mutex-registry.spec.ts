import { jest } from '@jest/globals';
import { MutexRegistry } from './mutex-registry';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('MutexRegistry', () => {
  it('ejecuta cuando la clave está libre', async () => {
    const registry = new MutexRegistry();
    const outcome = await registry.runExclusive('tick', () =>
      Promise.resolve(7),
    );

    expect(outcome).toEqual({ ran: true, result: 7 });
    expect(registry.isHeld('tick')).toBe(false);
  });

  it('descarta la ejecución solapada en vez de encolarla', async () => {
    // Encolarla garantizaría que la cola crezca exactamente al ritmo al que el
    // sistema va lento; descartarla convierte la degradación en una pérdida de
    // frecuencia, que es recuperable y medible.
    const registry = new MutexRegistry();
    const running = deferred();
    const second = jest.fn(() => Promise.resolve());

    const first = registry.runExclusive('tick', () => running.promise);
    const skipped = await registry.runExclusive('tick', second);

    expect(skipped.ran).toBe(false);
    expect(second).not.toHaveBeenCalled();

    running.resolve();
    await first;
  });

  it('claves distintas no se bloquean entre sí', async () => {
    const registry = new MutexRegistry();
    const running = deferred();

    const first = registry.runExclusive('a', () => running.promise);
    const other = await registry.runExclusive('b', () => Promise.resolve('ok'));

    expect(other).toEqual({ ran: true, result: 'ok' });

    running.resolve();
    await first;
  });

  it('libera la clave aunque la ejecución lance', async () => {
    // Una clave retenida por un error sería un tick que no vuelve a ejecutarse
    // nunca: un fallo silencioso peor que el original.
    const registry = new MutexRegistry();

    await expect(
      registry.runExclusive('tick', () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');

    expect(registry.isHeld('tick')).toBe(false);
  });

  it('cuenta los descartes por clave', async () => {
    const registry = new MutexRegistry();
    const running = deferred();
    const first = registry.runExclusive('tick', () => running.promise);

    await registry.runExclusive('tick', () => Promise.resolve());
    await registry.runExclusive('tick', () => Promise.resolve());

    expect(registry.snapshot()).toContainEqual(
      expect.objectContaining({ key: 'tick', skipped: 2 }),
    );

    running.resolve();
    await first;
  });

  it('identifica las claves atascadas por encima del umbral', async () => {
    let now = 0;
    const registry = new MutexRegistry(() => now);
    const running = deferred();
    const first = registry.runExclusive('tick', () => running.promise);

    now = 5_000;
    expect(registry.stuckKeys(10_000)).toEqual([]);

    now = 30_000;
    expect(registry.stuckKeys(10_000)).toEqual([
      expect.objectContaining({ key: 'tick', heldForMs: 30_000 }),
    ]);

    running.resolve();
    await first;
  });

  it('heldForMs es undefined cuando la clave está libre', () => {
    const registry = new MutexRegistry();
    expect(registry.heldForMs('tick')).toBeUndefined();
  });
});
