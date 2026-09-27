import {
  buildMedicationScheduleIcs,
  EmptyMedicationScheduleError,
  escapeText,
  foldLine,
  MEDICATION_DOSE_SUMMARY,
} from './medication-schedule-ics';
import {
  resolveMedicationSchedule,
  type MedicationTiming,
} from './medication-schedule';

const REQUEST_ID = '11111111-2222-3333-4444-555555555555';
const NOW = new Date('2026-09-26T15:00:00Z');

/** Calendario de una posología. */
function ics(timing: MedicationTiming, context = {}): string {
  return buildMedicationScheduleIcs({
    requestId: REQUEST_ID,
    schedule: resolveMedicationSchedule(timing, context),
    now: NOW,
  });
}

/** Desplegado (RFC 5545 §3.1) y partido en líneas. */
function lines(text: string): string[] {
  return text.replace(/\r\n /g, '').split('\r\n');
}

describe('medication-schedule-ics · iCalendar RFC 5545', () => {
  describe('correcto', () => {
    it('horas del día en La Paz: VTIMEZONE fijo, una VEVENT diaria por hora, UNTIL en UTC', () => {
      const text = ics({
        asNeeded: false,
        timesOfDay: ['08:00', '20:00'],
        startAt: new Date('2026-09-26T10:00:00Z'), // 06:00 La Paz
        durationDays: 7,
      });

      // CRLF en todas las líneas y al final.
      expect(text.endsWith('\r\n')).toBe(true);
      expect(text.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);

      const all = lines(text);
      expect(all[0]).toBe('BEGIN:VCALENDAR');
      expect(all).toContain('VERSION:2.0');
      expect(all.some((l) => l.startsWith('PRODID:'))).toBe(true);
      expect(all).toEqual(
        expect.arrayContaining([
          'BEGIN:VTIMEZONE',
          'TZID:America/La_Paz',
          'TZOFFSETFROM:-0400',
          'TZOFFSETTO:-0400',
          'TZNAME:-04',
        ]),
      );
      expect(all.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(2);
      expect(all).toContain('DTSTART;TZID=America/La_Paz:20260926T080000');
      expect(all).toContain('DTSTART;TZID=America/La_Paz:20260926T200000');
      // Fin exclusivo 2026-10-03T10:00Z → UNTIL inclusivo un segundo antes.
      expect(all).toContain('RRULE:FREQ=DAILY;UNTIL=20261003T095959Z');
      expect(all).toContain('DTSTAMP:20260926T150000Z');
      expect(all).toContain(`UID:${REQUEST_ID}-t0800@alovida`);
      expect(all[all.length - 2]).toBe('END:VCALENDAR');
    });

    it('cada 8 horas: una VEVENT con FREQ=HOURLY;INTERVAL=8 y sin UNTIL si no hay fin', () => {
      const all = lines(
        ics({
          asNeeded: false,
          frequency: 3,
          period: 1,
          periodUnit: 'd',
          startAt: new Date('2026-09-26T12:00:00Z'),
        }),
      );
      expect(all.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(1);
      expect(all).toContain('RRULE:FREQ=HOURLY;INTERVAL=8');
      expect(all).toContain('DTSTART;TZID=America/La_Paz:20260926T080000');
    });

    it('semanal y diario usan FREQ=WEEKLY / FREQ=DAILY', () => {
      expect(
        lines(
          ics({
            asNeeded: false,
            frequency: 1,
            period: 2,
            periodUnit: 'wk',
            startAt: new Date('2026-09-26T12:00:00Z'),
          }),
        ),
      ).toContain('RRULE:FREQ=WEEKLY;INTERVAL=2');
      expect(
        lines(
          ics({
            asNeeded: false,
            frequency: 1,
            period: 1,
            periodUnit: 'd',
            startAt: new Date('2026-09-26T12:00:00Z'),
          }),
        ),
      ).toContain('RRULE:FREQ=DAILY');
    });

    it('no nombra el fármaco: resumen genérico y alarma al momento de la toma', () => {
      const all = lines(
        ics({
          asNeeded: false,
          timesOfDay: ['08:00'],
          startAt: new Date('2026-09-26T10:00:00Z'),
        }),
      );
      expect(all).toContain(`SUMMARY:${MEDICATION_DOSE_SUMMARY}`);
      expect(all).toContain('TRIGGER:PT0S');
      expect(all.join('\n')).not.toMatch(/amoxicilina|paracetamol/i);
    });
  });

  describe('límite', () => {
    it('intervalo irregular (7 por día): VEVENTs sueltas sin RRULE, con tope', () => {
      const text = buildMedicationScheduleIcs({
        requestId: REQUEST_ID,
        schedule: resolveMedicationSchedule({
          asNeeded: false,
          frequency: 7,
          period: 1,
          periodUnit: 'd',
          startAt: new Date('2026-09-26T12:00:00Z'),
        }),
        now: NOW,
        maxIrregularEvents: 10,
      });
      const all = lines(text);
      expect(all.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(10);
      expect(all.some((l) => l.startsWith('RRULE:'))).toBe(false);
    });

    it('zona con horario de verano: sin VTIMEZONE, horas en UTC', () => {
      const all = lines(
        ics({
          asNeeded: false,
          timesOfDay: ['08:00'],
          timeZone: 'America/Santiago',
          startAt: new Date('2026-09-26T10:00:00Z'),
        }),
      );
      expect(all).not.toContain('BEGIN:VTIMEZONE');
      expect(all.some((l) => /^DTSTART:\d{8}T\d{6}Z$/.test(l))).toBe(true);
    });

    it('pliega a 75 octetos sin cortar un carácter UTF-8', () => {
      const long = `DESCRIPTION:${'ñ'.repeat(80)}`;
      const folded = foldLine(long);
      for (const part of folded.split('\r\n')) {
        expect(Buffer.byteLength(part, 'utf8')).toBeLessThanOrEqual(75);
      }
      expect(folded.replace(/\r\n /g, '')).toBe(long);
      expect(foldLine('SUMMARY:corto')).toBe('SUMMARY:corto');
    });

    it('escapa los caracteres especiales de TEXT', () => {
      expect(escapeText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
    });
  });

  describe('inválido', () => {
    it('PRN no produce calendario (RFC 5545 exige al menos un componente)', () => {
      expect(() => ics({ asNeeded: true })).toThrow(
        EmptyMedicationScheduleError,
      );
    });

    it('duración 0 no produce calendario', () => {
      try {
        ics({
          asNeeded: false,
          timesOfDay: ['08:00'],
          startAt: new Date('2026-09-26T10:00:00Z'),
          durationDays: 0,
        });
        throw new Error('debía lanzar');
      } catch (error) {
        expect(error).toBeInstanceOf(EmptyMedicationScheduleError);
        expect((error as EmptyMedicationScheduleError).reason).toBe(
          'ZERO_DURATION',
        );
      }
    });

    it('vigencia que termina antes de la primera hora del día: sin tomas', () => {
      expect(() =>
        ics(
          {
            asNeeded: false,
            timesOfDay: ['20:00'],
            startAt: new Date('2026-09-26T10:00:00Z'), // 06:00 La Paz
          },
          { validTo: new Date('2026-09-26T12:00:00Z') }, // 08:00 La Paz
        ),
      ).toThrow(EmptyMedicationScheduleError);
    });
  });
});
