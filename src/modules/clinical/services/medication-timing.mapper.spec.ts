import {
  hasStructuredTiming,
  timingOf,
  timingResponseOf,
} from './medication-timing.mapper';

describe('medication-timing.mapper', () => {
  it('lectura: columnas → bloque timing con la zona por defecto', () => {
    const row: any = {
      timingAsNeeded: false,
      timingFrequency: 2,
      timingPeriod: '1',
      timingPeriodUnit: 'd',
    };
    expect(timingResponseOf(row)).toEqual({
      asNeeded: false,
      frequency: 2,
      period: 1,
      periodUnit: 'd',
      timesOfDay: null,
      startAt: null,
      durationDays: null,
      timeZone: 'America/La_Paz',
    });
  });

  it('receta sólo con texto libre: sin bloque timing', () => {
    const row: any = { timingAsNeeded: false, frequencyText: 'cada 8 horas' };
    expect(hasStructuredTiming(row)).toBe(false);
    expect(timingResponseOf(row)).toBeUndefined();
  });

  it('PRN cuenta como posología declarada', () => {
    expect(timingResponseOf({ timingAsNeeded: true } as any)?.asNeeded).toBe(
      true,
    );
  });

  it('nulos de la base → ausentes para el generador; numeric → número', () => {
    const row: any = {
      timingAsNeeded: false,
      timingFrequency: null,
      timingPeriod: '12.5',
      timingPeriodUnit: null,
      timingTimesOfDay: null,
    };
    expect(timingOf(row)).toEqual({
      asNeeded: false,
      frequency: undefined,
      period: 12.5,
      periodUnit: undefined,
      timesOfDay: undefined,
      startAt: undefined,
      durationDays: undefined,
      timeZone: undefined,
    });
  });
});
