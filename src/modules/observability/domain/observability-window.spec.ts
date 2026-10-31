import { DomainException } from '../../../common/errors/domain.exception';
import {
  DEFAULT_TIMEZONE,
  isValidTimezone,
  resolveObsWindow,
  startOfLocalDay,
} from './observability-window';

const NOW = new Date('2026-10-31T15:30:00.000Z'); // 11:30 en La Paz (UTC-4)

function reasonOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    if (error instanceof DomainException) return error.reason;
    throw error;
  }
  return undefined;
}

describe('resolveObsWindow', () => {
  it('«hoy» arranca a las 00:00 de America/La_Paz (04:00 UTC) y la API declara la zona', () => {
    const w = resolveObsWindow({}, NOW);
    expect(w.timezone).toBe(DEFAULT_TIMEZONE);
    expect(w.from.toISOString()).toBe('2026-10-31T04:00:00.000Z');
    expect(w.to).toEqual(NOW);
    // 11,5 h → por hora
    expect(w.interval).toBe('hour');
  });

  it('con otra zona, el inicio del día cambia', () => {
    const w = resolveObsWindow({ tz: 'UTC' }, NOW);
    expect(w.from.toISOString()).toBe('2026-10-31T00:00:00.000Z');
    expect(w.timezone).toBe('UTC');
  });

  it('`to` justo a medianoche local mira el día anterior', () => {
    const w = resolveObsWindow({ to: '2026-10-31T04:00:00.000Z' }, NOW);
    expect(w.from.toISOString()).toBe('2026-10-30T04:00:00.000Z');
  });

  it('elige el intervalo: ≤2 h minuto, ≤7 d hora, más día', () => {
    expect(
      resolveObsWindow({
        from: '2026-10-31T14:00:00Z',
        to: '2026-10-31T15:00:00Z',
      }).interval,
    ).toBe('minute');
    expect(
      resolveObsWindow({
        from: '2026-10-25T00:00:00Z',
        to: '2026-10-31T00:00:00Z',
      }).interval,
    ).toBe('hour');
    expect(
      resolveObsWindow({
        from: '2026-09-01T00:00:00Z',
        to: '2026-10-31T00:00:00Z',
      }).interval,
    ).toBe('day');
  });

  it.each([
    [{ from: 'basura' }, 'INVALID_DATE'],
    [{ from: '1' }, 'INVALID_DATE'],
    [{ to: '2026-13-45' }, 'INVALID_DATE'],
    [{ to: 'basura' }, 'INVALID_DATE'],
    [
      { from: '2026-10-31T10:00:00Z', to: '2026-10-31T10:00:00Z' },
      'EMPTY_WINDOW',
    ],
    [
      { from: '2026-10-31T11:00:00Z', to: '2026-10-31T10:00:00Z' },
      'EMPTY_WINDOW',
    ],
    [
      { from: '2026-01-01T00:00:00Z', to: '2026-10-31T00:00:00Z' },
      'WINDOW_TOO_LARGE',
    ],
    [{ tz: 'Mars/Olympus' }, 'INVALID_TIMEZONE'],
    [{ tz: "UTC'; drop table x" }, 'INVALID_TIMEZONE'],
    [
      {
        from: '2026-10-29T00:00:00Z',
        to: '2026-10-31T00:00:00Z',
        interval: 'minute' as const,
      },
      'INTERVAL_TOO_FINE',
    ],
    [
      {
        from: '2026-10-01T00:00:00Z',
        to: '2026-10-31T00:00:00Z',
        interval: 'hour' as const,
      },
      'INTERVAL_TOO_FINE',
    ],
  ])('ventana inválida %j → 422 con reason %s', (input, reason) => {
    expect(reasonOf(() => resolveObsWindow(input, NOW))).toBe(reason);
    try {
      resolveObsWindow(input, NOW);
    } catch (error) {
      expect((error as DomainException).getStatus()).toBe(422);
    }
  });

  it('límites exactos: 92 días vale, 92 días + 1 ms no; 24 h por minuto vale', () => {
    const to = new Date('2026-10-31T00:00:00.000Z');
    const from92 = new Date(to.getTime() - 92 * 86_400_000).toISOString();
    expect(
      resolveObsWindow({ from: from92, to: to.toISOString() }).interval,
    ).toBe('day');
    const from92p = new Date(to.getTime() - 92 * 86_400_000 - 1).toISOString();
    expect(
      reasonOf(() => resolveObsWindow({ from: from92p, to: to.toISOString() })),
    ).toBe('WINDOW_TOO_LARGE');
    const from24 = new Date(to.getTime() - 24 * 3_600_000).toISOString();
    expect(
      resolveObsWindow({
        from: from24,
        to: to.toISOString(),
        interval: 'minute',
      }).interval,
    ).toBe('minute');
  });
});

describe('zonas', () => {
  it('valida zonas IANA', () => {
    expect(isValidTimezone('America/La_Paz')).toBe(true);
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('')).toBe(false);
    expect(isValidTimezone('x'.repeat(100))).toBe(false);
  });

  it('startOfLocalDay respeta zonas con horario de verano', () => {
    // Nueva York el 2026-11-01 (fin del horario de verano): el día local empieza a las 04:00 UTC (EDT).
    expect(
      startOfLocalDay(
        new Date('2026-11-01T18:00:00Z'),
        'America/New_York',
      ).toISOString(),
    ).toBe('2026-11-01T04:00:00.000Z');
  });
});
