import { describe, expect, it } from '@jest/globals';
import {
  dayOfWeek,
  localDayOf,
  matchingLocalDays,
  localTimeToUtc,
  bookableStart,
} from './scheduling-time';

describe('localTimeToUtc', () => {
  it('publica las 08:00 de La Paz a las 12:00 UTC, no a las 08:00 UTC', () => {
    // El defecto original: interpretar la hora de la regla como UTC hacía que
    // una agenda de «08:00 a 12:00» apareciera de 04:00 a 08:00 hora local.
    const instant = localTimeToUtc(
      { year: 2026, month: 6, day: 1 },
      '08:00:00',
      'America/La_Paz',
    );
    expect(instant.toISOString()).toBe('2026-06-01T12:00:00.000Z');
  });

  it('acepta la hora sin segundos', () => {
    const instant = localTimeToUtc(
      { year: 2026, month: 6, day: 1 },
      '08:30',
      'America/La_Paz',
    );
    expect(instant.toISOString()).toBe('2026-06-01T12:30:00.000Z');
  });

  it('en UTC devuelve la hora tal cual, que es el comportamiento anterior', () => {
    // Una agenda sin zona declarada cae a UTC y no debe cambiar de resultado.
    const instant = localTimeToUtc(
      { year: 2026, month: 6, day: 1 },
      '08:00:00',
      'UTC',
    );
    expect(instant.toISOString()).toBe('2026-06-01T08:00:00.000Z');
  });

  it('respeta el horario de verano en vez de sumar un desplazamiento fijo', () => {
    // Nueva York: en enero es UTC−5 y en julio UTC−4. Un número fijo se
    // equivocaría en la mitad del año.
    const winter = localTimeToUtc(
      { year: 2026, month: 1, day: 15 },
      '09:00:00',
      'America/New_York',
    );
    const summer = localTimeToUtc(
      { year: 2026, month: 7, day: 15 },
      '09:00:00',
      'America/New_York',
    );
    expect(winter.toISOString()).toBe('2026-01-15T14:00:00.000Z');
    expect(summer.toISOString()).toBe('2026-07-15T13:00:00.000Z');
  });

  it('resuelve el día en que la zona cambia de horario', () => {
    // 2026-03-08 es el cambio en EE.UU.: a las 02:00 locales el reloj salta a
    // las 03:00. Las 09:00 de ese día ya están en horario de verano (UTC−4).
    // Es el caso que exige la segunda pasada de corrección.
    const instant = localTimeToUtc(
      { year: 2026, month: 3, day: 8 },
      '09:00:00',
      'America/New_York',
    );
    expect(instant.toISOString()).toBe('2026-03-08T13:00:00.000Z');
  });

  it('cruza el cambio de día cuando la zona está al este', () => {
    // Tokio es UTC+9: las 06:00 locales son las 21:00 UTC del día anterior.
    const instant = localTimeToUtc(
      { year: 2026, month: 6, day: 2 },
      '06:00:00',
      'Asia/Tokyo',
    );
    expect(instant.toISOString()).toBe('2026-06-01T21:00:00.000Z');
  });
});

describe('localDayOf', () => {
  it('a las 02:00 UTC en La Paz todavía es el día anterior', () => {
    const day = localDayOf(new Date('2026-06-02T02:00:00Z'), 'America/La_Paz');
    expect(day).toEqual({ year: 2026, month: 6, day: 1 });
  });

  it('a las 02:00 UTC en Tokio ya es el mismo día por la mañana', () => {
    const day = localDayOf(new Date('2026-06-02T02:00:00Z'), 'Asia/Tokyo');
    expect(day).toEqual({ year: 2026, month: 6, day: 2 });
  });
});

describe('dayOfWeek', () => {
  it('el 2026-06-01 es lunes', () => {
    expect(dayOfWeek({ year: 2026, month: 6, day: 1 })).toBe(1);
  });
});

describe('matchingLocalDays', () => {
  it('encuentra el lunes local dentro de la ventana', () => {
    const days = matchingLocalDays(
      new Date('2026-06-01T00:00:00Z'),
      new Date('2026-06-02T00:00:00Z'),
      1,
      'America/La_Paz',
    );
    expect(days).toContainEqual({ year: 2026, month: 6, day: 1 });
  });

  it('incluye el día local que empieza antes de la ventana', () => {
    // La ventana arranca a las 02:00 UTC del martes; en La Paz eso todavía es
    // lunes por la noche, y ese lunes puede tener cupos dentro de la ventana.
    const days = matchingLocalDays(
      new Date('2026-06-02T02:00:00Z'),
      new Date('2026-06-03T00:00:00Z'),
      1,
      'America/La_Paz',
    );
    expect(days).toContainEqual({ year: 2026, month: 6, day: 1 });
  });

  it('devuelve un día por semana en una ventana de tres semanas', () => {
    const days = matchingLocalDays(
      new Date('2026-06-01T00:00:00Z'),
      new Date('2026-06-21T00:00:00Z'),
      1,
      'America/La_Paz',
    );
    // Los lunes 1, 8 y 15; el ensanchado de un día puede sumar el 22 según la
    // zona, así que se afirma el contenido y no una longitud exacta.
    expect(days).toContainEqual({ year: 2026, month: 6, day: 1 });
    expect(days).toContainEqual({ year: 2026, month: 6, day: 8 });
    expect(days).toContainEqual({ year: 2026, month: 6, day: 15 });
    for (const day of days) expect(dayOfWeek(day)).toBe(1);
  });

  it('no repite un día del calendario', () => {
    const days = matchingLocalDays(
      new Date('2026-06-01T00:00:00Z'),
      new Date('2026-06-30T00:00:00Z'),
      3,
      'America/New_York',
    );
    const keys = days.map((d) => `${d.year}-${d.month}-${d.day}`);
    expect(keys.length).toBe(new Set(keys).size);
  });
});

describe('bookableStart', () => {
  const YESTERDAY = new Date('2026-08-19T09:00:00.000Z');
  const NOW = new Date('2026-08-20T10:00:00.000Z');
  const TOMORROW = new Date('2026-08-21T09:00:00.000Z');

  it('adelanta el inicio hasta ahora cuando la ventana arranca en el pasado', () => {
    // Es el corazón de A-03: pedir «desde ayer, sólo disponibles» no puede
    // devolver los huecos de ayer.
    expect(bookableStart(YESTERDAY, NOW)).toBe(NOW);
  });

  it('respeta el inicio pedido cuando ya es futuro', () => {
    // Quien pregunta por la semana que viene no quiere que le corran la ventana.
    expect(bookableStart(TOMORROW, NOW)).toBe(TOMORROW);
  });

  it('con la ventana empezando justo ahora, devuelve ese mismo instante', () => {
    const same = new Date(NOW.getTime());
    expect(bookableStart(same, NOW).getTime()).toBe(NOW.getTime());
  });

  it('no depende del huso: compara instantes, no horas de pared', () => {
    // `start_at` es timestamptz. El mismo instante escrito con dos husos
    // distintos tiene que dar el mismo resultado, o el corte mentiría según
    // dónde esté la sede.
    const inLaPaz = new Date('2026-08-20T06:00:00.000-04:00');
    const inUtc = new Date('2026-08-20T10:00:00.000Z');
    expect(inLaPaz.getTime()).toBe(inUtc.getTime());
    expect(bookableStart(inLaPaz, NOW).getTime()).toBe(
      bookableStart(inUtc, NOW).getTime(),
    );
  });
});
