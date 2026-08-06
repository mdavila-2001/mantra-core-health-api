import { WorkerHealthRegistry } from './worker-health.registry';
import type { CircuitSnapshot } from '../common/resilience';

function circuit(
  state: CircuitSnapshot['state'],
  retryAfterMs = 0,
): CircuitSnapshot {
  return {
    operation: 'system-api',
    state,
    failureRate: state === 'open' ? 1 : 0,
    samples: 10,
    consecutiveOpenings: state === 'open' ? 1 : 0,
    retryAfterMs,
  };
}

describe('WorkerHealthRegistry', () => {
  let now = 0;
  let registry: WorkerHealthRegistry;

  beforeEach(() => {
    now = 0;
    registry = new WorkerHealthRegistry(() => now);
    registry.configure('messaging', 10_000);
  });

  it('arranca en "starting" y no está listo hasta que el worker arranca', () => {
    expect(registry.readiness()).toMatchObject({ healthy: false });
    registry.setStatus('running');
    expect(registry.readiness().healthy).toBe(true);
  });

  it('acumula el resultado de cada tick', () => {
    registry.setStatus('running');
    registry.tickStarted('worker.messaging.outbox-relay');
    now = 250;
    registry.tickFinished('worker.messaging.outbox-relay', 'ok');

    expect(registry.snapshot().ticks[0]).toMatchObject({
      operation: 'worker.messaging.outbox-relay',
      runs: 1,
      failures: 0,
      lastDurationMs: 250,
      lastOutcome: 'ok',
      inFlightSince: undefined,
    });
  });

  it('cuenta fallos consecutivos y los reinicia con el primer éxito', () => {
    registry.tickStarted('t');
    registry.tickFinished('t', 'failed', new Error('uno'));
    registry.tickStarted('t');
    registry.tickFinished('t', 'failed', new Error('dos'));

    expect(registry.snapshot().ticks[0]).toMatchObject({
      consecutiveFailures: 2,
      lastError: 'dos',
    });

    registry.tickStarted('t');
    registry.tickFinished('t', 'ok');

    expect(registry.snapshot().ticks[0]).toMatchObject({
      consecutiveFailures: 0,
      lastError: undefined,
    });
  });

  it('recorta el mensaje de error para que un stack no inunde la respuesta', () => {
    registry.tickStarted('t');
    registry.tickFinished('t', 'failed', new Error('x'.repeat(1_000)));

    expect(registry.snapshot().ticks[0].lastError).toHaveLength(300);
  });

  describe('liveness', () => {
    it('está sana mientras ningún tick lleve demasiado en vuelo', () => {
      registry.setStatus('running');
      expect(registry.liveness().healthy).toBe(true);
    });

    it('un tick que FALLA no justifica reiniciar el proceso', () => {
      // El fallo puede estar en la dependencia, y reiniciar no la arregla:
      // sólo suma un arranque en frío durante el incidente.
      registry.setStatus('running');
      for (let i = 0; i < 10; i += 1) {
        registry.tickStarted('t');
        registry.tickFinished('t', 'failed', new Error('la API no responde'));
      }

      expect(registry.liveness().healthy).toBe(true);
    });

    it('un tick que NO VUELVE sí: el proceso ya no puede recuperarse solo', async () => {
      registry.setStatus('running');
      const running = new Promise<void>(() => undefined);
      void registry.mutex.runExclusive(
        'worker.messaging.outbox-relay',
        () => running,
      );
      await Promise.resolve();

      now = 5_000;
      expect(registry.liveness().healthy).toBe(true);

      now = 60_000;
      const probe = registry.liveness();
      expect(probe.healthy).toBe(false);
      expect(probe.reasons[0]).toContain('worker.messaging.outbox-relay');
    });
  });

  describe('readiness', () => {
    it('un cortacircuitos abierto lo deja no-listo, pero NO no-vivo', () => {
      // Confundir las dos sondas es la causa clásica del bucle de reinicios
      // durante un incidente: reiniciar perdería el estado del circuito y
      // volvería a castigar a la dependencia que se está recuperando.
      registry.setStatus('running');
      registry.registerCircuit('system-api', () => circuit('open', 30_000));

      expect(registry.readiness().healthy).toBe(false);
      expect(registry.readiness().reasons[0]).toContain('system-api');
      expect(registry.liveness().healthy).toBe(true);
    });

    it('un circuito en media apertura ya se considera listo', () => {
      registry.setStatus('running');
      registry.registerCircuit('system-api', () => circuit('half-open'));

      expect(registry.readiness().healthy).toBe(true);
    });

    it('durante el drenaje no está listo', () => {
      registry.setStatus('draining');
      expect(registry.readiness().healthy).toBe(false);
    });
  });

  it('informa de los ticks en vuelo para el log del apagado', () => {
    registry.tickStarted('worker.messaging.outbox-relay');

    expect(registry.hasInFlightTicks()).toBe(true);
    expect(registry.inFlightOperations()).toEqual([
      'worker.messaging.outbox-relay',
    ]);

    registry.tickFinished('worker.messaging.outbox-relay', 'ok');

    expect(registry.hasInFlightTicks()).toBe(false);
  });

  it('la fotografía incluye identidad, memoria y ambas sondas', () => {
    registry.setStatus('running');
    const snapshot = registry.snapshot();

    expect(snapshot).toMatchObject({
      worker: 'messaging',
      pid: process.pid,
      status: 'running',
    });
    expect(snapshot.memory.rssBytes).toBeGreaterThan(0);
    expect(snapshot.liveness.healthy).toBe(true);
    expect(snapshot.readiness.healthy).toBe(true);
  });
});
