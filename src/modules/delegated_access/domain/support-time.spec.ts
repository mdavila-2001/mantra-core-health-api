import {
  DEFAULT_TIME_ZONE,
  endOfZonedDayExclusive,
  evaluateWindows,
  isValidTimeZone,
  isWithinWindows,
  nextResetAt,
  periodKey,
  startOfZonedDay,
  zonedParts,
} from './support-time';

const LA_PAZ = 'America/La_Paz';
/** Hora de La Paz (UTC−4, sin horario de verano) como instante. */
const at = (iso: string): Date => new Date(`${iso}-04:00`);

describe('support-time · zona horaria', () => {
  it('La Paz es la zona por defecto y las zonas inventadas se rechazan', () => {
    expect(DEFAULT_TIME_ZONE).toBe(LA_PAZ);
    expect(isValidTimeZone('America/La_Paz')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Marte/Olympus')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('zonedParts convierte el instante a hora local con día de la semana (0 = domingo)', () => {
    expect(zonedParts(at('2026-11-03T10:30:00'), LA_PAZ)).toMatchObject({
      year: 2026,
      month: 11,
      day: 3,
      hour: 10,
      minute: 30,
      weekday: 2,
    });
    // 02:30 UTC del 2027-01-01 es 22:30 del 31-dic en La Paz (viernes).
    expect(zonedParts(new Date('2027-01-01T02:30:00Z'), LA_PAZ)).toMatchObject({
      year: 2026,
      month: 12,
      day: 31,
      hour: 22,
      weekday: 4,
    });
    expect(zonedParts(new Date(), 'Marte/Olympus')).toBeUndefined();
  });
});

describe('support-time · ventanas horarias (falla cerrado)', () => {
  const lunesAViernes = [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }];

  it('intervalo semiabierto [from, to)', () => {
    expect(
      isWithinWindows(lunesAViernes, at('2026-11-03T07:30:00'), LA_PAZ),
    ).toBe(true);
    expect(
      isWithinWindows(lunesAViernes, at('2026-11-03T18:29:59'), LA_PAZ),
    ).toBe(true);
    expect(
      isWithinWindows(lunesAViernes, at('2026-11-03T18:30:00'), LA_PAZ),
    ).toBe(false);
    expect(
      isWithinWindows(lunesAViernes, at('2026-11-03T07:29:59'), LA_PAZ),
    ).toBe(false);
  });

  it('los días son 0-6 con 0 = domingo', () => {
    // sábado 2026-11-07
    expect(
      isWithinWindows(lunesAViernes, at('2026-11-07T10:00:00'), LA_PAZ),
    ).toBe(false);
    expect(
      isWithinWindows(
        [{ days: [6], from: '08:00', to: '12:00' }],
        at('2026-11-07T10:00:00'),
        LA_PAZ,
      ),
    ).toBe(true);
    expect(
      isWithinWindows(
        [{ days: [0], from: '08:00', to: '12:00' }],
        at('2026-11-08T10:00:00'),
        LA_PAZ,
      ),
    ).toBe(true);
  });

  it('C-02: una ventana que cruza la medianoche cuenta el día en que EMPIEZA', () => {
    const noche = [{ days: [5], from: '22:00', to: '06:00' }];
    expect(isWithinWindows(noche, at('2026-11-06T23:30:00'), LA_PAZ)).toBe(
      true,
    ); // vie 23:30
    expect(isWithinWindows(noche, at('2026-11-07T05:59:00'), LA_PAZ)).toBe(
      true,
    ); // sáb 05:59
    expect(isWithinWindows(noche, at('2026-11-07T06:00:00'), LA_PAZ)).toBe(
      false,
    ); // sáb 06:00
    expect(isWithinWindows(noche, at('2026-11-06T21:59:00'), LA_PAZ)).toBe(
      false,
    ); // vie 21:59
    // El sábado a las 23:30 NO está: la ventana empieza el viernes.
    expect(isWithinWindows(noche, at('2026-11-07T23:30:00'), LA_PAZ)).toBe(
      false,
    );
  });

  it('una unión de ventanas basta con que alguna contenga el instante', () => {
    const dos = [
      { days: [1, 2, 3, 4, 5], from: '08:00', to: '18:00' },
      { days: [6], from: '08:00', to: '12:00' },
    ];
    expect(isWithinWindows(dos, at('2026-11-07T11:00:00'), LA_PAZ)).toBe(true);
    expect(isWithinWindows(dos, at('2026-11-07T13:00:00'), LA_PAZ)).toBe(false);
  });

  it('T/F/I: una franja vacía, un patrón roto o una zona inválida son indeterminados y cierran', () => {
    expect(
      evaluateWindows(lunesAViernes, at('2026-11-03T10:30:00'), LA_PAZ),
    ).toBe('T');
    expect(
      evaluateWindows(lunesAViernes, at('2026-11-02T19:10:00'), LA_PAZ),
    ).toBe('F');
    expect(
      evaluateWindows(
        [{ days: [2], from: '08:00', to: '08:00' }],
        at('2026-11-03T08:00:00'),
        LA_PAZ,
      ),
    ).toBe('I');
    expect(
      evaluateWindows(
        [{ days: [2], from: '8am', to: '10:00' }],
        at('2026-11-03T09:00:00'),
        LA_PAZ,
      ),
    ).toBe('I');
    expect(
      evaluateWindows(
        [{ days: [9], from: '08:00', to: '10:00' }],
        at('2026-11-03T09:00:00'),
        LA_PAZ,
      ),
    ).toBe('I');
    expect(
      evaluateWindows(
        lunesAViernes,
        at('2026-11-03T10:30:00'),
        'Marte/Olympus',
      ),
    ).toBe('I');
    expect(evaluateWindows([], at('2026-11-03T10:30:00'), LA_PAZ)).toBe('I');
    // y la versión booleana falla cerrado en los tres.
    expect(
      isWithinWindows(
        [{ days: [2], from: '08:00', to: '08:00' }],
        at('2026-11-03T08:00:00'),
        LA_PAZ,
      ),
    ).toBe(false);
    expect(
      isWithinWindows(
        lunesAViernes,
        at('2026-11-03T10:30:00'),
        'Marte/Olympus',
      ),
    ).toBe(false);
  });
});

describe('support-time · días y periodos en la zona de la organización', () => {
  it('startOfZonedDay: medianoche local con desplazamiento en días', () => {
    const hoy = at('2026-11-03T10:30:00');
    expect(startOfZonedDay(hoy, LA_PAZ)?.toISOString()).toBe(
      '2026-11-03T04:00:00.000Z',
    );
    expect(startOfZonedDay(hoy, LA_PAZ, -1)?.toISOString()).toBe(
      '2026-11-02T04:00:00.000Z',
    );
    expect(startOfZonedDay(hoy, LA_PAZ, 14)?.toISOString()).toBe(
      '2026-11-17T04:00:00.000Z',
    );
    expect(startOfZonedDay(hoy, 'Marte/Olympus')).toBeUndefined();
  });

  it('endOfZonedDayExclusive: el inicio del día siguiente', () => {
    const hoy = at('2026-11-03T23:59:00');
    expect(endOfZonedDayExclusive(hoy, LA_PAZ)?.toISOString()).toBe(
      '2026-11-04T04:00:00.000Z',
    );
    expect(endOfZonedDayExclusive(hoy, LA_PAZ, 7)?.toISOString()).toBe(
      '2026-11-11T04:00:00.000Z',
    );
  });

  it('periodKey e identificadores: día calendario, semana ISO y ventana deslizante', () => {
    const t = at('2026-11-03T10:30:00');
    expect(periodKey('DAY', t, LA_PAZ)).toBe('2026-11-03');
    expect(periodKey('WEEK', t, LA_PAZ)).toBe('2026-W45');
    expect(periodKey('HOUR', t, LA_PAZ)).toBe('sliding-60m');
    // El lunes 2026-11-02 00:30 La Paz todavía es la semana 45; el domingo 11-01 es la 44.
    expect(periodKey('WEEK', at('2026-11-01T23:00:00'), LA_PAZ)).toBe(
      '2026-W44',
    );
    expect(periodKey('WEEK', at('2026-11-02T00:30:00'), LA_PAZ)).toBe(
      '2026-W45',
    );
  });

  it('C-04: el día se renueva a la medianoche local', () => {
    const t = at('2026-11-03T10:30:00');
    expect(nextResetAt('DAY', t, LA_PAZ)?.toISOString()).toBe(
      '2026-11-04T04:00:00.000Z',
    );
    // La semana ISO se renueva el lunes siguiente a las 00:00 locales.
    expect(nextResetAt('WEEK', t, LA_PAZ)?.toISOString()).toBe(
      '2026-11-09T04:00:00.000Z',
    );
    expect(nextResetAt('HOUR', t, LA_PAZ)?.toISOString()).toBe(
      '2026-11-03T15:30:00.000Z',
    );
  });
});
