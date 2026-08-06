import { jest } from '@jest/globals';
import { OperationTimeoutError } from './resilience.errors';
import { delay, withTimeout } from './with-timeout';

describe('withTimeout', () => {
  it('devuelve el resultado cuando la operación termina a tiempo', async () => {
    await expect(
      withTimeout('op', 1_000, () => Promise.resolve(42)),
    ).resolves.toBe(42);
  });

  it('lanza OperationTimeoutError al vencer el plazo', async () => {
    await expect(
      withTimeout('op', 10, (signal) => delay(5_000, signal)),
    ).rejects.toBeInstanceOf(OperationTimeoutError);
  });

  it('aborta de verdad la operación, no sólo deja de esperarla', async () => {
    // Es la diferencia con `Promise.race`: sin señal, el trabajo perdedor
    // seguiría vivo ocupando el socket. Aquí se comprueba que se le avisa.
    let aborted = false;

    await expect(
      withTimeout('op', 10, (signal) => {
        signal.addEventListener('abort', () => {
          aborted = true;
        });
        return delay(5_000, signal);
      }),
    ).rejects.toBeInstanceOf(OperationTimeoutError);

    expect(aborted).toBe(true);
  });

  it('propaga el error original cuando la operación falla antes del plazo', async () => {
    const boom = new Error('boom');
    await expect(
      withTimeout('op', 1_000, () => Promise.reject(boom)),
    ).rejects.toBe(boom);
  });

  it('un plazo no positivo significa "sin plazo"', async () => {
    await expect(
      withTimeout('op', 0, () => Promise.resolve('ok')),
    ).resolves.toBe('ok');
  });

  it('respeta la señal del llamador y la compone con la propia', async () => {
    const parent = new AbortController();
    const promise = withTimeout(
      'op',
      10_000,
      (signal) => delay(5_000, signal),
      parent.signal,
    );

    parent.abort(new Error('el llamador se rindió'));

    await expect(promise).rejects.toThrow('el llamador se rindió');
  });

  it('falla de inmediato si la señal del llamador ya venía abortada', async () => {
    const parent = new AbortController();
    parent.abort(new Error('ya cancelado'));
    const fn = jest.fn(() => Promise.resolve('no debería ejecutarse'));

    await expect(withTimeout('op', 1_000, fn, parent.signal)).rejects.toThrow(
      'ya cancelado',
    );
    expect(fn).not.toHaveBeenCalled();
  });

  it('limpia el temporizador en el camino feliz', async () => {
    // Un `setTimeout` que sobrevive a la operación mantiene vivo el event loop
    // y retrasa el apagado, multiplicado por cada llamada.
    const clear = jest.spyOn(global, 'clearTimeout');
    await withTimeout('op', 60_000, () => Promise.resolve('ok'));
    expect(clear).toHaveBeenCalled();
    clear.mockRestore();
  });
});

describe('delay', () => {
  it('resuelve de inmediato para esperas no positivas', async () => {
    await expect(delay(0)).resolves.toBeUndefined();
  });

  it('es cancelable: no retrasa el apagado tanto como dure la espera', async () => {
    const controller = new AbortController();
    const promise = delay(60_000, controller.signal);
    controller.abort(new Error('apagando'));
    await expect(promise).rejects.toThrow('apagando');
  });

  it('rechaza de inmediato si la señal ya venía abortada', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(delay(1_000, controller.signal)).rejects.toBeInstanceOf(Error);
  });
});
