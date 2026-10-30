import { describe, expect, it } from '@jest/globals';
import {
  addBusinessDays,
  addMonthsUtc,
  endOfDayLaPaz,
  todayLaPaz,
  toDateOnly,
} from './business-days';

describe('addBusinessDays', () => {
  it('3 días hábiles desde un jueves caen el martes siguiente', () => {
    // jueves 29/10/2026 → vie 30, lun 2, mar 3.
    expect(
      addBusinessDays(new Date('2026-10-29T15:30:00.000Z'), 3).toISOString(),
    ).toBe('2026-11-03T15:30:00.000Z');
  });

  it('desde un sábado cuenta el lunes como primer día (el fin de semana no cuenta)', () => {
    // sábado 24/10/2026 → lun 26, mar 27, mié 28 (igual que el backfill del patch).
    expect(
      addBusinessDays(new Date('2026-10-24T15:30:00.000Z'), 3).toISOString(),
    ).toBe('2026-10-28T15:30:00.000Z');
  });

  it('desde un viernes el primer día hábil es el lunes', () => {
    expect(
      addBusinessDays(new Date('2026-10-30T09:00:00.000Z'), 1).toISOString(),
    ).toBe('2026-11-02T09:00:00.000Z');
  });

  it('0 días no mueve la fecha y un negativo se trata como 0', () => {
    const base = new Date('2026-10-29T15:30:00.000Z');
    expect(addBusinessDays(base, 0).getTime()).toBe(base.getTime());
    expect(addBusinessDays(base, -4).getTime()).toBe(base.getTime());
  });

  it('no modifica la fecha de entrada', () => {
    const base = new Date('2026-10-29T15:30:00.000Z');
    addBusinessDays(base, 5);
    expect(base.toISOString()).toBe('2026-10-29T15:30:00.000Z');
  });

  it('30 días hábiles son seis semanas exactas', () => {
    expect(
      addBusinessDays(new Date('2026-10-29T00:00:00.000Z'), 30).toISOString(),
    ).toBe('2026-12-10T00:00:00.000Z');
  });
});

describe('addMonthsUtc', () => {
  it('suma meses calendario', () => {
    expect(
      addMonthsUtc(new Date('2026-10-29T00:00:00.000Z'), 36).toISOString(),
    ).toBe('2029-10-29T00:00:00.000Z');
  });

  it('recorta al último día del mes de llegada', () => {
    expect(
      addMonthsUtc(new Date('2026-01-31T00:00:00.000Z'), 1).toISOString(),
    ).toBe('2026-02-28T00:00:00.000Z');
    expect(
      addMonthsUtc(new Date('2027-12-31T00:00:00.000Z'), 2).toISOString(),
    ).toBe('2028-02-29T00:00:00.000Z');
  });
});

describe('fechas de calendario en America/La_Paz (UTC-4)', () => {
  it('toDateOnly acepta texto o Date', () => {
    expect(toDateOnly('2026-10-29')).toBe('2026-10-29');
    expect(toDateOnly('2026-10-29T00:00:00.000Z')).toBe('2026-10-29');
    expect(toDateOnly(new Date('2026-10-29T00:00:00.000Z'))).toBe('2026-10-29');
  });

  it('el vencimiento es el fin del día en La Paz, no la medianoche UTC', () => {
    expect(endOfDayLaPaz('2026-10-29').toISOString()).toBe(
      '2026-10-30T03:59:59.999Z',
    );
    // Antes el vencimiento se adelantaba cuatro horas (29/10 00:00Z).
    expect(endOfDayLaPaz('2026-10-29').getTime()).toBeGreaterThan(
      new Date('2026-10-29T23:59:59.999Z').getTime(),
    );
  });

  it('borde 23:59:59 / 00:00:00: todayLaPaz cambia a las 04:00 UTC', () => {
    expect(todayLaPaz(new Date('2026-10-30T03:59:59.999Z'))).toBe('2026-10-29');
    expect(todayLaPaz(new Date('2026-10-30T04:00:00.000Z'))).toBe('2026-10-30');
  });

  it('cruza fin de año y año bisiesto sin errores', () => {
    expect(endOfDayLaPaz('2026-12-31').toISOString()).toBe(
      '2027-01-01T03:59:59.999Z',
    );
    expect(endOfDayLaPaz('2028-02-29').toISOString()).toBe(
      '2028-03-01T03:59:59.999Z',
    );
  });
});
