import { describe, expect, it } from '@jest/globals';
import { WindowError } from '../../telemetry/domain/analytics-window';
import { resolveTrafficWindow } from './traffic-window';

const NOW = new Date('2026-10-17T15:30:00.000Z');

describe('resolveTrafficWindow', () => {
  it('por defecto: hoy 00:00 UTC hasta ahora, por hora', () => {
    const window = resolveTrafficWindow({}, NOW);

    expect(window.from.toISOString()).toBe('2026-10-17T00:00:00.000Z');
    expect(window.to).toEqual(NOW);
    expect(window.interval).toBe('hour');
    expect(window.timezone).toBe('UTC');
  });

  it('sin from pero con to: arranca a las 00:00 UTC del día de to', () => {
    const window = resolveTrafficWindow(
      { to: '2026-10-10T18:00:00.000Z' },
      NOW,
    );

    expect(window.from.toISOString()).toBe('2026-10-10T00:00:00.000Z');
  });

  it('to justo a medianoche: mira el día anterior en vez de una ventana vacía', () => {
    const window = resolveTrafficWindow(
      { to: '2026-10-17T00:00:00.000Z' },
      NOW,
    );

    expect(window.from.toISOString()).toBe('2026-10-16T00:00:00.000Z');
  });

  it('un from explícito manda', () => {
    const window = resolveTrafficWindow(
      { from: '2026-10-15T12:00:00.000Z' },
      NOW,
    );

    expect(window.from.toISOString()).toBe('2026-10-15T12:00:00.000Z');
  });

  it('el intervalo por defecto pasa a día cuando la ventana supera dos días', () => {
    const window = resolveTrafficWindow(
      { from: '2026-10-10T00:00:00.000Z' },
      NOW,
    );

    expect(window.interval).toBe('day');
  });

  it('respeta el intervalo pedido', () => {
    expect(resolveTrafficWindow({ interval: 'day' }, NOW).interval).toBe('day');
  });

  it('hereda las reglas de analítica: from posterior a to es una ventana vacía', () => {
    expect(() =>
      resolveTrafficWindow({ from: '2026-10-18T00:00:00.000Z' }, NOW),
    ).toThrow(WindowError);
  });

  it('hereda el tope de 92 días', () => {
    expect(() =>
      resolveTrafficWindow({ from: '2026-06-01T00:00:00.000Z' }, NOW),
    ).toThrow(/92 días/);
  });

  it('por hora no admite ventanas largas', () => {
    expect(() =>
      resolveTrafficWindow(
        { from: '2026-10-01T00:00:00.000Z', interval: 'hour' },
        NOW,
      ),
    ).toThrow(WindowError);
  });

  it('una fecha inválida es INVALID_DATE, no un NaN silencioso', () => {
    try {
      resolveTrafficWindow({ to: 'no-es-fecha' }, NOW);
      throw new Error('debió lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(WindowError);
      expect((error as WindowError).reason).toBe('INVALID_DATE');
    }
  });
});
