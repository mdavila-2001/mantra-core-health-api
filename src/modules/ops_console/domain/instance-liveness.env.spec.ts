import { describe, expect, it } from '@jest/globals';
import { loadInstanceLivenessEnv } from './instance-liveness.env';

describe('loadInstanceLivenessEnv', () => {
  it('sin variables: 15 s de intervalo, 30 s degradada, 60 s caída y los 26 workers no opcionales', () => {
    const env = loadInstanceLivenessEnv({});
    expect(env.thresholds).toEqual({
      workerHeartbeatIntervalMs: 15_000,
      degradedAfterMs: 30_000,
      downAfterMs: 60_000,
      dependencyLatencyDegradedMs: 1_000,
      dependencyProbeTimeoutMs: 3_000,
      clockToleranceMs: 5_000,
    });
    expect(env.requiredWorkers.size).toBe(26);
    expect(env.requiredWorkers.has('worker-files')).toBe(false);
    expect(env.requiredWorkers.has('worker-messaging')).toBe(true);
  });

  it('toma los umbrales y el intervalo configurados', () => {
    const env = loadInstanceLivenessEnv(
      {
        OPS_LIVENESS_DEGRADED_AFTER_SECONDS: '45',
        OPS_LIVENESS_DOWN_AFTER_SECONDS: '90',
        WORKER_HEARTBEAT_INTERVAL_MS: '20000',
      },
      4_000,
    );
    expect(env.thresholds).toMatchObject({
      workerHeartbeatIntervalMs: 20_000,
      degradedAfterMs: 45_000,
      downAfterMs: 90_000,
      dependencyProbeTimeoutMs: 4_000,
    });
  });

  it('U22: down ≤ degraded aborta', () => {
    expect(() =>
      loadInstanceLivenessEnv({
        OPS_LIVENESS_DEGRADED_AFTER_SECONDS: '60',
        OPS_LIVENESS_DOWN_AFTER_SECONDS: '60',
      }),
    ).toThrow(/OPS_LIVENESS_DOWN_AFTER_SECONDS \(60\) debe ser mayor/);
  });

  it.each(['abc', '1.5', '0', '-3'])(
    'U22: un valor no entero positivo ("%s") aborta, sin caer al valor por defecto',
    (raw) => {
      expect(() =>
        loadInstanceLivenessEnv({ OPS_LIVENESS_DEGRADED_AFTER_SECONDS: raw }),
      ).toThrow(
        /OPS_LIVENESS_DEGRADED_AFTER_SECONDS debe ser un entero positivo/,
      );
    },
  );

  it('U22: degraded menor que el intervalo del latido aborta', () => {
    expect(() =>
      loadInstanceLivenessEnv({
        OPS_LIVENESS_DEGRADED_AFTER_SECONDS: '10',
        OPS_LIVENESS_DOWN_AFTER_SECONDS: '20',
      }),
    ).toThrow(/no puede ser menor que el intervalo del latido/);
  });

  it('OPS_LIVENESS_REQUIRED_WORKERS acota los requeridos y rechaza ids desconocidos', () => {
    const env = loadInstanceLivenessEnv({
      OPS_LIVENESS_REQUIRED_WORKERS:
        ' worker-messaging, worker-scheduling ,worker-workflow,worker-read_models',
    });
    expect([...env.requiredWorkers].sort()).toEqual([
      'worker-messaging',
      'worker-read_models',
      'worker-scheduling',
      'worker-workflow',
    ]);
    expect(() =>
      loadInstanceLivenessEnv({
        OPS_LIVENESS_REQUIRED_WORKERS: 'worker-messaging,worker-inventado',
      }),
    ).toThrow(/worker-inventado/);
  });
});
