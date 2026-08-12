import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  AudioReconcileService,
  retentionCutoffDay,
} from './audio-reconcile.service';
import type { AudioTtsConfig } from '../config/audio-tts.env';

function build() {
  const config = {
    maxAttempts: 4,
    leaseSeconds: 300,
    reconcileBatchSize: 100,
    reconcileStaleSeconds: 900,
    actorDailyRetentionDays: 90,
  } as AudioTtsConfig;

  const assets = {
    sweepExhausted: mockFn().mockResolvedValue([]),
    countStalled: mockFn().mockResolvedValue(0),
    statusCounts: mockFn().mockResolvedValue({ READY: 3 }),
  };
  const quota = {
    releaseBudget: mockFn().mockResolvedValue(undefined),
    purgeActorDailyBefore: mockFn().mockResolvedValue(0),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const service = new AudioReconcileService(
    config,
    {} as any,
    assets as any,
    quota as any,
    logger as any,
  );
  return { service, assets, quota, logger };
}

describe('AudioReconcileService', () => {
  it('no reporta nada cuando no hay trabajo que hacer', async () => {
    const d = build();
    await expect(d.service.runOnce()).resolves.toEqual({
      exhausted: 0,
      releasedUnits: 0,
      purgedActorDays: 0,
      stalled: 0,
    });
    // Un barrido cada cinco minutos que siempre escribe convierte el log en ruido.
    expect(d.logger.warn).not.toHaveBeenCalled();
  });

  it('devuelve al presupuesto la reserva de cada asset agotado', async () => {
    const d = build();
    d.assets.sweepExhausted.mockResolvedValue([
      {
        id: 'a1',
        provider: 'elevenlabs',
        reservedUnits: 18,
        createdAt: new Date('2026-07-15T00:00:00.000Z'),
      },
      {
        id: 'a2',
        provider: 'elevenlabs',
        reservedUnits: 7,
        createdAt: new Date('2026-08-02T00:00:00.000Z'),
      },
    ]);

    const report = await d.service.runOnce();

    expect(report).toMatchObject({ exhausted: 2, releasedUnits: 25 });
    // Cada uno contra la ventana de SU alta: liberar todo contra el mes en curso
    // descuadraría las dos ventanas a la vez.
    expect(d.quota.releaseBudget).toHaveBeenCalledWith(
      {},
      { provider: 'elevenlabs', monthKey: '2026-07' },
      18,
    );
    expect(d.quota.releaseBudget).toHaveBeenCalledWith(
      {},
      { provider: 'elevenlabs', monthKey: '2026-08' },
      7,
    );
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('no intenta liberar una reserva que ya estaba a cero', async () => {
    const d = build();
    d.assets.sweepExhausted.mockResolvedValue([
      {
        id: 'a1',
        provider: 'elevenlabs',
        reservedUnits: 0,
        createdAt: new Date(),
      },
    ]);
    const report = await d.service.runOnce();
    expect(report.releasedUnits).toBe(0);
    expect(d.quota.releaseBudget).not.toHaveBeenCalled();
  });

  it('aplica retención al contador diario por actor', async () => {
    const d = build();
    d.quota.purgeActorDailyBefore.mockResolvedValue(12);
    await expect(d.service.runOnce()).resolves.toMatchObject({
      purgedActorDays: 12,
    });
    expect(d.quota.purgeActorDailyBefore).toHaveBeenCalledWith(
      {},
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it('publica los encallados sin corregirlos', async () => {
    // Es la única señal que distingue "la cola está vacía" de "el worker no drena".
    const d = build();
    d.assets.countStalled.mockResolvedValue(7);
    await expect(d.service.runOnce()).resolves.toMatchObject({ stalled: 7 });
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('expone el recuento por estado', async () => {
    await expect(build().service.statusCounts()).resolves.toEqual({ READY: 3 });
  });
});

describe('retentionCutoffDay', () => {
  it('calcula el corte en UTC restando los días de retención', () => {
    expect(retentionCutoffDay(90, new Date('2026-08-11T10:00:00.000Z'))).toBe(
      '2026-05-13',
    );
  });

  it('cruza el límite de mes sin saltarse días', () => {
    expect(retentionCutoffDay(1, new Date('2026-03-01T00:30:00.000Z'))).toBe(
      '2026-02-28',
    );
  });
});
