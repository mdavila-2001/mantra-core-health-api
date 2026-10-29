import {
  addDays,
  isIsoDay,
  isValidTimeZone,
  localDate,
  localMidnight,
} from './zoned-time';

describe('zoned-time', () => {
  it('localDate usa la zona de la sede, no UTC', () => {
    // 03:00 UTC del 28 es todavía el 27 a las 23:00 en La Paz (UTC-4).
    expect(localDate(new Date('2026-10-28T03:00:00Z'), 'America/La_Paz')).toBe(
      '2026-10-27',
    );
    expect(localDate(new Date('2026-10-28T04:00:00Z'), 'America/La_Paz')).toBe(
      '2026-10-28',
    );
  });

  it('localMidnight es el 00:00 local de la sede', () => {
    expect(localMidnight('2026-10-28', 'America/La_Paz').toISOString()).toBe(
      '2026-10-28T04:00:00.000Z',
    );
    expect(localMidnight('2026-10-28', 'UTC').toISOString()).toBe(
      '2026-10-28T00:00:00.000Z',
    );
  });

  it('localMidnight respeta el horario de verano (Nueva York, 8 de marzo de 2026)', () => {
    // El 8/3 a las 02:00 se adelanta el reloj: 00:00 del 8 es EST (UTC-5), 00:00 del 9 es EDT (UTC-4).
    expect(localMidnight('2026-03-08', 'America/New_York').toISOString()).toBe(
      '2026-03-08T05:00:00.000Z',
    );
    expect(localMidnight('2026-03-09', 'America/New_York').toISOString()).toBe(
      '2026-03-09T04:00:00.000Z',
    );
  });

  it('addDays cruza meses y años', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('isIsoDay rechaza lo que no es un día del calendario', () => {
    expect(isIsoDay('2026-02-29')).toBe(false);
    expect(isIsoDay('2026-13-01')).toBe(false);
    expect(isIsoDay('26-10-29')).toBe(false);
    expect(isIsoDay('2026-10-29')).toBe(true);
  });

  it('isValidTimeZone', () => {
    expect(isValidTimeZone('America/La_Paz')).toBe(true);
    expect(isValidTimeZone('Marte/Olimpo')).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
  });
});
