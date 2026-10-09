import { describe, expect, it } from '@jest/globals';
import {
  diaDeLaSemana,
  diaLocalDe,
  diasLocalesQueCoinciden,
  horaLocalAUtc,
  inicioDeLoReservable,
} from './scheduling-time';

describe('horaLocalAUtc', () => {
  it('publica las 08:00 de La Paz a las 12:00 UTC, no a las 08:00 UTC', () => {
    // El defecto original: interpretar la hora de la regla como UTC hacía que
    // una agenda de «08:00 a 12:00» apareciera de 04:00 a 08:00 hora local.
    const instante = horaLocalAUtc(
      { year: 2026, month: 6, day: 1 },
      '08:00:00',
      'America/La_Paz',
    );
    expect(instante.toISOString()).toBe('2026-06-01T12:00:00.000Z');
  });

  it('acepta la hora sin segundos', () => {
    const instante = horaLocalAUtc(
      { year: 2026, month: 6, day: 1 },
      '08:30',
      'America/La_Paz',
    );
    expect(instante.toISOString()).toBe('2026-06-01T12:30:00.000Z');
  });

  it('en UTC devuelve la hora tal cual, que es el comportamiento anterior', () => {
    // Una agenda sin zona declarada cae a UTC y no debe cambiar de resultado.
    const instante = horaLocalAUtc(
      { year: 2026, month: 6, day: 1 },
      '08:00:00',
      'UTC',
    );
    expect(instante.toISOString()).toBe('2026-06-01T08:00:00.000Z');
  });

  it('respeta el horario de verano en vez de sumar un desplazamiento fijo', () => {
    // Nueva York: en enero es UTC−5 y en julio UTC−4. Un número fijo se
    // equivocaría en la mitad del año.
    const invierno = horaLocalAUtc(
      { year: 2026, month: 1, day: 15 },
      '09:00:00',
      'America/New_York',
    );
    const verano = horaLocalAUtc(
      { year: 2026, month: 7, day: 15 },
      '09:00:00',
      'America/New_York',
    );
    expect(invierno.toISOString()).toBe('2026-01-15T14:00:00.000Z');
    expect(verano.toISOString()).toBe('2026-07-15T13:00:00.000Z');
  });

  it('resuelve el día en que la zona cambia de horario', () => {
    // 2026-03-08 es el cambio en EE.UU.: a las 02:00 locales el reloj salta a
    // las 03:00. Las 09:00 de ese día ya están en horario de verano (UTC−4).
    // Es el caso que exige la segunda pasada de corrección.
    const instante = horaLocalAUtc(
      { year: 2026, month: 3, day: 8 },
      '09:00:00',
      'America/New_York',
    );
    expect(instante.toISOString()).toBe('2026-03-08T13:00:00.000Z');
  });

  it('cruza el cambio de día cuando la zona está al este', () => {
    // Tokio es UTC+9: las 06:00 locales son las 21:00 UTC del día anterior.
    const instante = horaLocalAUtc(
      { year: 2026, month: 6, day: 2 },
      '06:00:00',
      'Asia/Tokyo',
    );
    expect(instante.toISOString()).toBe('2026-06-01T21:00:00.000Z');
  });
});

describe('diaLocalDe', () => {
  it('a las 02:00 UTC en La Paz todavía es el día anterior', () => {
    const dia = diaLocalDe(new Date('2026-06-02T02:00:00Z'), 'America/La_Paz');
    expect(dia).toEqual({ year: 2026, month: 6, day: 1 });
  });

  it('a las 02:00 UTC en Tokio ya es el mismo día por la mañana', () => {
    const dia = diaLocalDe(new Date('2026-06-02T02:00:00Z'), 'Asia/Tokyo');
    expect(dia).toEqual({ year: 2026, month: 6, day: 2 });
  });
});

describe('diaDeLaSemana', () => {
  it('el 2026-06-01 es lunes', () => {
    expect(diaDeLaSemana({ year: 2026, month: 6, day: 1 })).toBe(1);
  });
});

describe('diasLocalesQueCoinciden', () => {
  it('encuentra el lunes local dentro de la ventana', () => {
    const dias = diasLocalesQueCoinciden(
      new Date('2026-06-01T00:00:00Z'),
      new Date('2026-06-02T00:00:00Z'),
      1,
      'America/La_Paz',
    );
    expect(dias).toContainEqual({ year: 2026, month: 6, day: 1 });
  });

  it('incluye el día local que empieza antes de la ventana', () => {
    // La ventana arranca a las 02:00 UTC del martes; en La Paz eso todavía es
    // lunes por la noche, y ese lunes puede tener cupos dentro de la ventana.
    const dias = diasLocalesQueCoinciden(
      new Date('2026-06-02T02:00:00Z'),
      new Date('2026-06-03T00:00:00Z'),
      1,
      'America/La_Paz',
    );
    expect(dias).toContainEqual({ year: 2026, month: 6, day: 1 });
  });

  it('devuelve un día por semana en una ventana de tres semanas', () => {
    const dias = diasLocalesQueCoinciden(
      new Date('2026-06-01T00:00:00Z'),
      new Date('2026-06-21T00:00:00Z'),
      1,
      'America/La_Paz',
    );
    // Los lunes 1, 8 y 15; el ensanchado de un día puede sumar el 22 según la
    // zona, así que se afirma el contenido y no una longitud exacta.
    expect(dias).toContainEqual({ year: 2026, month: 6, day: 1 });
    expect(dias).toContainEqual({ year: 2026, month: 6, day: 8 });
    expect(dias).toContainEqual({ year: 2026, month: 6, day: 15 });
    for (const dia of dias) expect(diaDeLaSemana(dia)).toBe(1);
  });

  it('no repite un día del calendario', () => {
    const dias = diasLocalesQueCoinciden(
      new Date('2026-06-01T00:00:00Z'),
      new Date('2026-06-30T00:00:00Z'),
      3,
      'America/New_York',
    );
    const claves = dias.map((d) => `${d.year}-${d.month}-${d.day}`);
    expect(claves.length).toBe(new Set(claves).size);
  });
});

describe('inicioDeLoReservable', () => {
  const AYER = new Date('2026-08-19T09:00:00.000Z');
  const AHORA = new Date('2026-08-20T10:00:00.000Z');
  const MANANA = new Date('2026-08-21T09:00:00.000Z');

  it('adelanta el inicio hasta ahora cuando la ventana arranca en el pasado', () => {
    // Es el corazón de A-03: pedir «desde ayer, sólo disponibles» no puede
    // devolver los huecos de ayer.
    expect(inicioDeLoReservable(AYER, AHORA)).toBe(AHORA);
  });

  it('respeta el inicio pedido cuando ya es futuro', () => {
    // Quien pregunta por la semana que viene no quiere que le corran la ventana.
    expect(inicioDeLoReservable(MANANA, AHORA)).toBe(MANANA);
  });

  it('con la ventana empezando justo ahora, devuelve ese mismo instante', () => {
    const mismo = new Date(AHORA.getTime());
    expect(inicioDeLoReservable(mismo, AHORA).getTime()).toBe(AHORA.getTime());
  });

  it('no depende del huso: compara instantes, no horas de pared', () => {
    // `start_at` es timestamptz. El mismo instante escrito con dos husos
    // distintos tiene que dar el mismo resultado, o el corte mentiría según
    // dónde esté la sede.
    const enLaPaz = new Date('2026-08-20T06:00:00.000-04:00');
    const enUtc = new Date('2026-08-20T10:00:00.000Z');
    expect(enLaPaz.getTime()).toBe(enUtc.getTime());
    expect(inicioDeLoReservable(enLaPaz, AHORA).getTime()).toBe(
      inicioDeLoReservable(enUtc, AHORA).getTime(),
    );
  });
});
