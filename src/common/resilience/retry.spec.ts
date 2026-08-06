import { jest } from '@jest/globals';
import { retry, type RetryClock, type RetryPolicy } from './retry';

/** Reloj determinista: sin aleatoriedad ni esperas reales. */
function testClock(
  random = 1,
): RetryClock & { elapsed: number; slept: number[] } {
  const clock = {
    elapsed: 0,
    slept: [] as number[],
    now: () => clock.elapsed,
    random: () => random,
    sleep: (ms: number) => {
      clock.slept.push(ms);
      clock.elapsed += ms;
      return Promise.resolve();
    },
  };
  return clock;
}

const POLICY: RetryPolicy = {
  attempts: 4,
  baseDelayMs: 100,
  maxDelayMs: 1_000,
};

/**
 * Fallo con la forma de un error de cliente HTTP. Es un `Error` de verdad —y no
 * un objeto suelto— porque es lo que rechaza una promesa en la realidad, y
 * porque `Promise.reject` de algo que no es `Error` pierde el stack.
 */
function transient(status: number, headers?: Record<string, string>): Error {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: { status, headers },
  });
}

describe('retry', () => {
  it('devuelve el resultado del primer intento cuando no falla', async () => {
    const fn = jest.fn(() => Promise.resolve('ok'));
    const clock = testClock();

    await expect(retry('op', fn, POLICY, undefined, clock)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(clock.slept).toEqual([]);
  });

  it('reintenta los fallos transitorios hasta agotar los intentos', async () => {
    const fn = jest.fn(() => Promise.reject(transient(503)));
    const clock = testClock();

    await expect(retry('op', fn, POLICY, undefined, clock)).rejects.toThrow(
      'HTTP 503',
    );
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('NO reintenta los fallos permanentes: un 409 no se cura reintentando', async () => {
    const fn = jest.fn(() => Promise.reject(transient(409)));
    const clock = testClock();

    await expect(retry('op', fn, POLICY, undefined, clock)).rejects.toThrow(
      'HTTP 409',
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('aplica backoff exponencial acotado por maxDelayMs', async () => {
    // Con `random() === 1`, el jitter completo devuelve la ventana entera, que
    // es lo que permite comprobar la progresión de forma determinista.
    const fn = jest.fn(() => Promise.reject(transient(500)));
    const clock = testClock(1);

    await expect(
      retry(
        'op',
        fn,
        { attempts: 5, baseDelayMs: 100, maxDelayMs: 400 },
        undefined,
        clock,
      ),
    ).rejects.toBeDefined();

    expect(clock.slept).toEqual([100, 200, 400, 400]);
  });

  it('el jitter reparte la espera dentro de la ventana, no la fija', async () => {
    const fn = jest.fn(() => Promise.reject(transient(500)));
    const clock = testClock(0.5);

    await expect(
      retry(
        'op',
        fn,
        { attempts: 3, baseDelayMs: 200, maxDelayMs: 10_000 },
        undefined,
        clock,
      ),
    ).rejects.toBeDefined();

    expect(clock.slept).toEqual([100, 200]);
  });

  it('respeta Retry-After por encima del backoff calculado', async () => {
    const error = transient(429, { 'retry-after': '3' });
    const fn = jest.fn(() => Promise.reject(error));
    const clock = testClock(1);

    await expect(
      retry(
        'op',
        fn,
        { attempts: 2, baseDelayMs: 100, maxDelayMs: 100 },
        undefined,
        clock,
      ),
    ).rejects.toBe(error);

    expect(clock.slept).toEqual([3000]);
  });

  it('corta cuando la siguiente espera excedería el presupuesto total', async () => {
    // Tres intentos caben en `attempts`, pero no en el tiempo: dormir para
    // fallar igual después sólo alarga la latencia de un fallo ya decidido.
    const fn = jest.fn(() => Promise.reject(transient(500)));
    const clock = testClock(1);

    await expect(
      retry(
        'op',
        fn,
        {
          attempts: 5,
          baseDelayMs: 400,
          maxDelayMs: 10_000,
          totalBudgetMs: 500,
        },
        undefined,
        clock,
      ),
    ).rejects.toBeDefined();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(clock.slept).toEqual([400]);
  });

  it('deja de reintentar cuando la señal se aborta', async () => {
    const controller = new AbortController();
    const fn = jest.fn(() => {
      controller.abort(new Error('apagando'));
      return Promise.reject(transient(500));
    });
    const clock = testClock();

    await expect(
      retry('op', fn, POLICY, controller.signal, clock),
    ).rejects.toThrow('HTTP 500');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('no ejecuta nada si la señal ya venía abortada', async () => {
    const controller = new AbortController();
    controller.abort(new Error('apagando'));
    const fn = jest.fn(() => Promise.resolve('ok'));

    await expect(
      retry('op', fn, POLICY, controller.signal, testClock()),
    ).rejects.toThrow('apagando');
    expect(fn).not.toHaveBeenCalled();
  });

  it('informa de cada reintento por el gancho de observabilidad', async () => {
    const onRetry = jest.fn();
    const fn = jest
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(transient(502))
      .mockResolvedValueOnce('ok');

    await expect(
      retry('op', fn, { ...POLICY, onRetry }, undefined, testClock()),
    ).resolves.toBe('ok');

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'op',
        attempt: 1,
        serverDirected: false,
      }),
    );
  });

  it('attempts = 1 desactiva el reintento', async () => {
    const fn = jest.fn(() => Promise.reject(transient(500)));
    await expect(
      retry(
        'op',
        fn,
        { attempts: 1, baseDelayMs: 1, maxDelayMs: 1 },
        undefined,
        testClock(),
      ),
    ).rejects.toBeDefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
