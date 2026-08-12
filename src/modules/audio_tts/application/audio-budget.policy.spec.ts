import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AudioBudgetPolicy, dayKeyOf, monthKeyOf } from './audio-budget.policy';
import type { AudioTtsConfig } from '../config/audio-tts.env';

const NOW = new Date('2026-08-11T10:00:00.000Z');

function config(overrides: Partial<AudioTtsConfig> = {}): AudioTtsConfig {
  return {
    nodeEnv: 'development',
    enabled: true,
    provider: 'elevenlabs',
    allowRuntimeGeneration: true,
    prodLicenseConfirmed: false,
    monthlyBudgetUnits: 1000,
    safetyReserveUnits: 100,
    runtimeGenerationsPerActorDay: 3,
    actorLimitUnlimited: false,
    ...overrides,
  } as AudioTtsConfig;
}

function build(overrides: Partial<AudioTtsConfig> = {}) {
  const quota = {
    reserveBudget: mockFn().mockResolvedValue(true),
    releaseBudget: mockFn().mockResolvedValue(undefined),
    settleBudget: mockFn().mockResolvedValue(undefined),
    readBudget: mockFn().mockResolvedValue({
      reservedUnits: 0,
      settledUnits: 0,
    }),
    claimActorGeneration: mockFn().mockResolvedValue(true),
    releaseActorGeneration: mockFn().mockResolvedValue(undefined),
  };
  const policy = new AudioBudgetPolicy(quota as any, config(overrides));
  return { policy, quota, em: {} as any };
}

describe('AudioBudgetPolicy', () => {
  it('descuenta el colchón de seguridad del presupuesto gastable', () => {
    expect(build().policy.usableUnits).toBe(900);
  });

  it('nunca devuelve un presupuesto gastable negativo', () => {
    expect(
      build({ monthlyBudgetUnits: 10, safetyReserveUnits: 1000 }).policy
        .usableUnits,
    ).toBe(0);
  });

  it('deniega con el interruptor maestro apagado', async () => {
    const d = build({ enabled: false });
    await expect(
      d.policy.reserve(d.em, 10, 'runtime', 'actor-1', NOW),
    ).resolves.toMatchObject({ allowed: false, reason: 'TTS_DISABLED' });
    // Y sin tocar la base: las puertas baratas van primero.
    expect(d.quota.claimActorGeneration).not.toHaveBeenCalled();
    expect(d.quota.reserveBudget).not.toHaveBeenCalled();
  });

  it('deniega la generación en caliente cuando está cerrada, pero deja pasar prewarm', async () => {
    const d = build({ allowRuntimeGeneration: false });
    await expect(
      d.policy.reserve(d.em, 10, 'runtime', 'actor-1', NOW),
    ).resolves.toMatchObject({ reason: 'RUNTIME_GENERATION_DISABLED' });
    await expect(
      d.policy.reserve(d.em, 10, 'prewarm', undefined, NOW),
    ).resolves.toMatchObject({ allowed: true });
  });

  it('deniega en producción sin licencia confirmada', async () => {
    const d = build({ nodeEnv: 'production', prodLicenseConfirmed: false });
    await expect(
      d.policy.reserve(d.em, 10, 'runtime', 'actor-1', NOW),
    ).resolves.toMatchObject({ reason: 'PRODUCTION_LICENSE_NOT_CONFIRMED' });
  });

  it('trata el límite 0 por actor como bloqueado, no como ilimitado', async () => {
    const d = build({ runtimeGenerationsPerActorDay: 0 });
    await expect(
      d.policy.reserve(d.em, 10, 'runtime', 'actor-1', NOW),
    ).resolves.toMatchObject({ reason: 'ACTOR_DAILY_LIMIT' });
    expect(d.quota.claimActorGeneration).not.toHaveBeenCalled();
  });

  it('omite el cupo por actor cuando se declara ilimitado de forma explícita', async () => {
    const d = build({ actorLimitUnlimited: true });
    await expect(
      d.policy.reserve(d.em, 10, 'runtime', 'actor-1', NOW),
    ).resolves.toMatchObject({ allowed: true, actorClaimed: false });
    expect(d.quota.claimActorGeneration).not.toHaveBeenCalled();
  });

  it('devuelve el cupo del actor si la reserva mensual no cabe', async () => {
    // Cobrarle un intento que nunca llegó a generarse le gastaría el cupo del día
    // sin darle un solo audio.
    const d = build();
    d.quota.reserveBudget.mockResolvedValue(false);
    await expect(
      d.policy.reserve(d.em, 10, 'runtime', 'actor-1', NOW),
    ).resolves.toMatchObject({ reason: 'MONTHLY_BUDGET_RESERVED' });
    expect(d.quota.releaseActorGeneration).toHaveBeenCalledWith(
      d.em,
      'actor-1',
      '2026-08-11',
    );
  });

  it('reserva contra la ventana del proveedor y el mes en curso', async () => {
    const d = build();
    const reservation = await d.policy.reserve(
      d.em,
      25,
      'runtime',
      'actor-1',
      NOW,
    );
    expect(reservation).toMatchObject({
      allowed: true,
      units: 25,
      actorClaimed: true,
    });
    expect(d.quota.reserveBudget).toHaveBeenCalledWith(
      d.em,
      { provider: 'elevenlabs', monthKey: '2026-08' },
      25,
      900,
    );
  });

  it('al liberar devuelve presupuesto y cupo del actor', async () => {
    const d = build();
    const reservation = await d.policy.reserve(
      d.em,
      25,
      'runtime',
      'actor-1',
      NOW,
    );
    await d.policy.release(d.em, reservation, 'actor-1', NOW);
    expect(d.quota.releaseBudget).toHaveBeenCalledWith(
      d.em,
      { provider: 'elevenlabs', monthKey: '2026-08' },
      25,
    );
    expect(d.quota.releaseActorGeneration).toHaveBeenCalled();
  });

  it('no libera nada de una reserva que fue denegada', async () => {
    const d = build({ enabled: false });
    const denied = await d.policy.reserve(d.em, 25, 'runtime', 'actor-1', NOW);
    await d.policy.release(d.em, denied, 'actor-1', NOW);
    expect(d.quota.releaseBudget).not.toHaveBeenCalled();
  });

  it('revalida el presupuesto contra lo ya liquidado antes de gastar', async () => {
    const d = build();
    d.quota.readBudget.mockResolvedValue({
      reservedUnits: 0,
      settledUnits: 895,
    });
    await expect(d.policy.stillWithinBudget(d.em, 5, NOW)).resolves.toBe(true);
    await expect(d.policy.stillWithinBudget(d.em, 6, NOW)).resolves.toBe(false);
  });

  it('calcula las ventanas en UTC', () => {
    expect(monthKeyOf(NOW)).toBe('2026-08');
    expect(dayKeyOf(NOW)).toBe('2026-08-11');
  });
});
