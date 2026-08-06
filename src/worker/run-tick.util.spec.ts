import { jest } from '@jest/globals';
import type { PinoLogger } from 'nestjs-pino';
import {
  configureTicks,
  resetTickStateForTests,
  runTick,
  startDraining,
} from './run-tick.util';
import { currentTick } from './tick-context';
import { workerHealth } from './worker-health.registry';

/**
 * Logger de prueba que devuelve las funciones simuladas **por separado** del
 * objeto tipado. Aserciones como `expect(error)` sobre un tipo de clase
 * desanclan el método de su receptor; devolverlas sueltas evita ese problema
 * sin recurrir a `any`.
 */
function buildLogger() {
  const debug = jest.fn();
  const info = jest.fn();
  const warn = jest.fn();
  const error = jest.fn();
  const logger = {
    setContext: jest.fn(),
    debug,
    info,
    warn,
    error,
  } as unknown as PinoLogger;
  return { logger, debug, info, warn, error };
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function healthOf(operation: string) {
  return workerHealth
    .snapshot()
    .ticks.find((tick) => tick.operation === operation);
}

describe('runTick', () => {
  beforeEach(() => {
    resetTickStateForTests();
  });

  afterEach(() => {
    resetTickStateForTests();
  });

  it('ejecuta el trabajo y lo contabiliza como exitoso', async () => {
    const { logger, debug, warn, error } = buildLogger();
    const work = jest.fn(() => Promise.resolve());

    await runTick(logger, 'worker.demo.tick', work);

    expect(work).toHaveBeenCalledTimes(1);
    expect(healthOf('worker.demo.tick')).toMatchObject({
      runs: 1,
      failures: 0,
      lastOutcome: 'ok',
    });
  });

  it('absorbe el error: un tick que lanza tumbaría el scheduler entero', async () => {
    const { logger, debug, warn, error } = buildLogger();

    await expect(
      runTick(logger, 'worker.demo.tick', () =>
        Promise.reject(new Error('boom')),
      ),
    ).resolves.toBeUndefined();

    expect(error).toHaveBeenCalled();
    expect(healthOf('worker.demo.tick')).toMatchObject({
      failures: 1,
      consecutiveFailures: 1,
      lastOutcome: 'failed',
      lastError: 'boom',
    });
  });

  it('descarta el tick solapado en vez de correr dos copias sobre las mismas filas', async () => {
    // `@Interval` es un `setInterval` y no espera a la ejecución anterior: sin
    // esta guarda, un tick de 5 s que tarda 30 s produce seis copias
    // simultáneas.
    const { logger, debug, warn, error } = buildLogger();
    const running = deferred();
    const second = jest.fn(() => Promise.resolve());

    const first = runTick(logger, 'worker.demo.tick', () => running.promise);
    await runTick(logger, 'worker.demo.tick', second);

    expect(second).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.objectContaining({ operation: 'worker.demo.tick' }),
      expect.stringContaining('la ejecución anterior sigue en vuelo'),
    );
    expect(healthOf('worker.demo.tick')).toMatchObject({ skipped: 1 });

    running.resolve();
    await first;
  });

  it('ticks de operaciones distintas no se bloquean entre sí', async () => {
    const { logger, debug, warn, error } = buildLogger();
    const running = deferred();
    const other = jest.fn(() => Promise.resolve());

    const first = runTick(logger, 'worker.a.tick', () => running.promise);
    await runTick(logger, 'worker.b.tick', other);

    expect(other).toHaveBeenCalledTimes(1);

    running.resolve();
    await first;
  });

  it('vuelve a admitir el tick una vez terminado el anterior', async () => {
    const { logger, debug, warn, error } = buildLogger();
    const work = jest.fn(() => Promise.resolve());

    await runTick(logger, 'worker.demo.tick', work);
    await runTick(logger, 'worker.demo.tick', work);

    expect(work).toHaveBeenCalledTimes(2);
  });

  it('libera la exclusión aunque el trabajo falle', async () => {
    const { logger, debug, warn, error } = buildLogger();

    await runTick(logger, 'worker.demo.tick', () =>
      Promise.reject(new Error('boom')),
    );
    const after = jest.fn(() => Promise.resolve());
    await runTick(logger, 'worker.demo.tick', after);

    expect(after).toHaveBeenCalledTimes(1);
  });

  it('aborta el tick al vencer su plazo y lo marca como timeout', async () => {
    const { logger, debug, warn, error } = buildLogger();
    configureTicks(20);

    await runTick(
      logger,
      'worker.demo.tick',
      () =>
        new Promise<void>((_, reject) => {
          const context = currentTick();
          context?.signal.addEventListener('abort', () =>
            reject(new Error('cancelado')),
          );
        }),
    );

    expect(healthOf('worker.demo.tick')).toMatchObject({
      timeouts: 1,
      lastOutcome: 'timeout',
    });
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ timedOut: true }),
      'Worker tick timed out',
    );
  });

  it('expone el contexto del tick al trabajo, para que la cancelación llegue a axios', async () => {
    const { logger, debug, warn, error } = buildLogger();
    let seen: ReturnType<typeof currentTick>;

    await runTick(logger, 'worker.demo.tick', () => {
      seen = currentTick();
      return Promise.resolve();
    });

    expect(seen).toMatchObject({ operation: 'worker.demo.tick' });
    expect(seen?.executionId).toEqual(expect.any(String));
    expect(seen?.signal).toBeInstanceOf(AbortSignal);
  });

  it('fuera de todo tick no hay contexto', () => {
    expect(currentTick()).toBeUndefined();
  });

  describe('modo anidado', () => {
    it('NO se bloquea contra su padre aunque comparta nombre de operación', async () => {
      // Cinco jobs reales anidan `runTick` con el mismo nombre para que el
      // fallo de un elemento no aborte el lote. Tratarlos como ticks
      // programados los habría silenciado por completo.
      const { logger, debug, warn, error } = buildLogger();
      const inner = jest.fn(() => Promise.resolve());

      await runTick(logger, 'worker.demo.tick', async () => {
        await runTick(logger, 'worker.demo.tick', inner);
        await runTick(logger, 'worker.demo.tick', inner);
      });

      expect(inner).toHaveBeenCalledTimes(2);
    });

    it('el fallo de un elemento no aborta el lote', async () => {
      const { logger, debug, warn, error } = buildLogger();
      const processed: number[] = [];

      await runTick(logger, 'worker.demo.batch', async () => {
        for (const item of [1, 2, 3]) {
          await runTick(logger, 'worker.demo.item', () => {
            if (item === 2) return Promise.reject(new Error('elemento malo'));
            processed.push(item);
            return Promise.resolve();
          });
        }
      });

      expect(processed).toEqual([1, 3]);
      expect(healthOf('worker.demo.batch')).toMatchObject({
        lastOutcome: 'ok',
      });
    });

    it('hereda el contexto del tick que lo engloba', async () => {
      const { logger, debug, warn, error } = buildLogger();
      let innerContext: ReturnType<typeof currentTick>;

      await runTick(logger, 'worker.demo.batch', async () => {
        const outer = currentTick();
        await runTick(logger, 'worker.demo.item', () => {
          innerContext = currentTick();
          return Promise.resolve();
        });
        expect(innerContext?.executionId).toBe(outer?.executionId);
      });
    });

    it('no contamina el registro de salud con unidades de trabajo', async () => {
      const { logger, debug, warn, error } = buildLogger();

      await runTick(logger, 'worker.demo.batch', async () => {
        await runTick(logger, 'worker.demo.item', () => Promise.resolve());
      });

      expect(healthOf('worker.demo.item')).toBeUndefined();
    });
  });

  describe('drenaje', () => {
    it('deja de admitir ticks nuevos', async () => {
      const { logger, debug, warn, error } = buildLogger();
      const work = jest.fn(() => Promise.resolve());

      startDraining();
      await runTick(logger, 'worker.demo.tick', work);

      expect(work).not.toHaveBeenCalled();
      expect(debug).toHaveBeenCalledWith(
        expect.objectContaining({ operation: 'worker.demo.tick' }),
        expect.stringContaining('drenando'),
      );
    });

    it('un tick ya en marcha conserva el derecho a terminar su lote', async () => {
      // Cortarlo a la mitad es justo el estado parcial que el drenaje existe
      // para evitar.
      const { logger, debug, warn, error } = buildLogger();
      const inner = jest.fn(() => Promise.resolve());

      await runTick(logger, 'worker.demo.batch', async () => {
        startDraining();
        await runTick(logger, 'worker.demo.item', inner);
      });

      expect(inner).toHaveBeenCalledTimes(1);
    });
  });
});
