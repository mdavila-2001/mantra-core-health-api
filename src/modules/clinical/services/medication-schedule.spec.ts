import {
  InvalidMedicationTimingError,
  medicationDosesBetween,
  resolveMedicationSchedule,
  type MedicationTiming,
} from './medication-schedule';

const iso = (dates: Date[]): string[] => dates.map((d) => d.toISOString());

/** Resuelve y lista las tomas en `[from, to)`. */
function doses(
  timing: MedicationTiming,
  from: string,
  to: string,
  context = {},
): string[] {
  return iso(
    medicationDosesBetween(
      resolveMedicationSchedule(timing, context),
      new Date(from),
      new Date(to),
    ),
  );
}

/** Captura el código del error de posología. */
function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    if (error instanceof InvalidMedicationTimingError) return error.code;
    throw error;
  }
  return undefined;
}

describe('medication-schedule · generador de tomas', () => {
  describe('correcto', () => {
    it('cada 8 horas (3 por día) desde el ancla', () => {
      expect(
        doses(
          {
            asNeeded: false,
            frequency: 3,
            period: 1,
            periodUnit: 'd',
            startAt: new Date('2026-09-26T12:00:00Z'),
          },
          '2026-09-26T00:00:00Z',
          '2026-09-27T12:00:00Z',
        ),
      ).toEqual([
        '2026-09-26T12:00:00.000Z',
        '2026-09-26T20:00:00.000Z',
        '2026-09-27T04:00:00.000Z',
      ]);
    });

    it('horas del día en La Paz (08:00, 14:00, 20:00 locales = 12, 18, 00 UTC)', () => {
      expect(
        doses(
          {
            asNeeded: false,
            timesOfDay: ['20:00', '08:00', '14:00', '08:00'],
            startAt: new Date('2026-09-26T10:00:00Z'), // 06:00 en La Paz
          },
          '2026-09-26T00:00:00Z',
          '2026-09-27T13:00:00Z',
        ),
      ).toEqual([
        '2026-09-26T12:00:00.000Z',
        '2026-09-26T18:00:00.000Z',
        '2026-09-27T00:00:00.000Z',
        '2026-09-27T12:00:00.000Z',
      ]);
    });

    it('semanal: una toma cada semana', () => {
      expect(
        doses(
          {
            asNeeded: false,
            frequency: 1,
            period: 1,
            periodUnit: 'wk',
            startAt: new Date('2026-09-01T12:00:00Z'),
          },
          '2026-09-01T00:00:00Z',
          '2026-09-30T00:00:00Z',
        ),
      ).toEqual([
        '2026-09-01T12:00:00.000Z',
        '2026-09-08T12:00:00.000Z',
        '2026-09-15T12:00:00.000Z',
        '2026-09-22T12:00:00.000Z',
        '2026-09-29T12:00:00.000Z',
      ]);
    });

    it('sin startAt usa el inicio de vigencia; validTo corta las tomas', () => {
      expect(
        doses(
          { asNeeded: false, frequency: 1, period: 12, periodUnit: 'h' },
          '2026-09-26T00:00:00Z',
          '2026-10-30T00:00:00Z',
          {
            validFrom: new Date('2026-09-26T12:00:00Z'),
            validTo: new Date('2026-09-27T12:00:00Z'),
          },
        ),
      ).toEqual([
        '2026-09-26T12:00:00.000Z',
        '2026-09-27T00:00:00.000Z',
        // validTo es inclusivo: la toma exacta a esa hora todavía vale.
        '2026-09-27T12:00:00.000Z',
      ]);
    });

    it('la duración en días corta las tomas', () => {
      expect(
        doses(
          {
            asNeeded: false,
            frequency: 2,
            period: 1,
            periodUnit: 'd',
            startAt: new Date('2026-09-26T12:00:00Z'),
            durationDays: 1,
          },
          '2026-09-26T00:00:00Z',
          '2026-10-30T00:00:00Z',
        ),
      ).toEqual(['2026-09-26T12:00:00.000Z', '2026-09-27T00:00:00.000Z']);
    });
  });

  describe('límite', () => {
    it('PRN («según necesidad») no tiene tomas', () => {
      const schedule = resolveMedicationSchedule({ asNeeded: true });
      expect(schedule).toEqual({ kind: 'EMPTY', reason: 'AS_NEEDED' });
      expect(
        medicationDosesBetween(
          schedule,
          new Date('2026-01-01'),
          new Date('2027-01-01'),
        ),
      ).toEqual([]);
    });

    it('duración 0 no tiene tomas', () => {
      expect(
        resolveMedicationSchedule({
          asNeeded: false,
          frequency: 3,
          period: 1,
          periodUnit: 'd',
          startAt: new Date('2026-09-26T12:00:00Z'),
          durationDays: 0,
        }),
      ).toEqual({ kind: 'EMPTY', reason: 'ZERO_DURATION' });
    });

    it('sin posología estructurada ni ancla: vacío con motivo, no error', () => {
      expect(resolveMedicationSchedule({ asNeeded: false })).toEqual({
        kind: 'EMPTY',
        reason: 'NO_TIMING',
      });
      expect(
        resolveMedicationSchedule({ asNeeded: false, timesOfDay: ['08:00'] }),
      ).toEqual({ kind: 'EMPTY', reason: 'NO_START' });
    });

    it('La Paz: 21:30 local cae al día siguiente en UTC (cruce de medianoche)', () => {
      expect(
        doses(
          {
            asNeeded: false,
            timesOfDay: ['21:30'],
            timeZone: 'America/La_Paz',
            startAt: new Date('2026-09-26T04:00:00Z'), // 00:00 del 26 en La Paz
          },
          '2026-09-26T00:00:00Z',
          '2026-09-28T00:00:00Z',
        ),
      ).toEqual(['2026-09-27T01:30:00.000Z']);
    });

    it('ventana de 15 minutos: el inicio es inclusivo y el fin exclusivo', () => {
      const timing: MedicationTiming = {
        asNeeded: false,
        frequency: 1,
        period: 15,
        periodUnit: 'h',
        startAt: new Date('2026-09-26T12:00:00Z'),
      };
      // Pasada que empieza exactamente en la toma: la incluye.
      expect(
        doses(timing, '2026-09-26T12:00:00Z', '2026-09-26T12:15:00Z'),
      ).toEqual(['2026-09-26T12:00:00.000Z']);
      // Pasada que termina exactamente en la toma: no la incluye (la avisa la siguiente).
      expect(
        doses(timing, '2026-09-26T11:45:00Z', '2026-09-26T12:00:00Z'),
      ).toEqual([]);
    });

    it('un intervalo no entero (7 por día) no acumula deriva', () => {
      const out = doses(
        {
          asNeeded: false,
          frequency: 7,
          period: 1,
          periodUnit: 'd',
          startAt: new Date('2026-09-26T00:00:00Z'),
        },
        '2026-09-26T00:00:00Z',
        '2026-10-06T00:00:00Z',
      );
      expect(out).toHaveLength(70);
      expect(out[7]).toBe('2026-09-27T00:00:00.000Z');
      expect(out[69]).not.toBe('2026-10-06T00:00:00.000Z');
    });
  });

  describe('inválido', () => {
    it('frecuencia sin período', () => {
      expect(
        codeOf(() =>
          resolveMedicationSchedule({ asNeeded: false, frequency: 3 }),
        ),
      ).toBe('FREQUENCY_WITHOUT_PERIOD');
    });

    it('hora 25:00', () => {
      expect(
        codeOf(() =>
          resolveMedicationSchedule({
            asNeeded: false,
            timesOfDay: ['08:00', '25:00'],
          }),
        ),
      ).toBe('INVALID_TIME_OF_DAY');
    });

    it('zona inexistente', () => {
      expect(
        codeOf(() =>
          resolveMedicationSchedule({
            asNeeded: false,
            timesOfDay: ['08:00'],
            timeZone: 'America/Atlantida',
          }),
        ),
      ).toBe('INVALID_TIME_ZONE');
    });

    it('período 0', () => {
      expect(
        codeOf(() =>
          resolveMedicationSchedule({
            asNeeded: false,
            frequency: 1,
            period: 0,
            periodUnit: 'h',
          }),
        ),
      ).toBe('INVALID_PERIOD');
    });

    it('PRN con horario, y horas del día con frecuencia', () => {
      expect(
        codeOf(() =>
          resolveMedicationSchedule({ asNeeded: true, timesOfDay: ['08:00'] }),
        ),
      ).toBe('AS_NEEDED_WITH_SCHEDULE');
      expect(
        codeOf(() =>
          resolveMedicationSchedule({
            asNeeded: false,
            timesOfDay: ['08:00'],
            frequency: 1,
            period: 1,
            periodUnit: 'd',
          }),
        ),
      ).toBe('EXCLUSIVE_SCHEDULE');
    });

    it('duración negativa', () => {
      expect(
        codeOf(() =>
          resolveMedicationSchedule({
            asNeeded: false,
            timesOfDay: ['08:00'],
            durationDays: -1,
          }),
        ),
      ).toBe('INVALID_DURATION');
    });
  });
});
