import {
  serviceFits,
  slotsThatCanReopen,
  proposeServiceTimes,
  subtractIntervals,
  busySpan,
  mergeIntervals,
  type Interval,
} from './service-availability';

/** Un instante del 2026-10-05 (lunes) en UTC, `h:m`. */
const t = (h: number, m = 0): Date =>
  new Date(Date.UTC(2026, 9, 5, h, m, 0, 0));
const iv = (d: Date, h: Date): Interval => ({ startAt: d, endAt: h });
const hours = (r: Interval[]): string[] =>
  r.map(
    (i) =>
      `${i.startAt.toISOString().slice(11, 16)}-${i.endAt.toISOString().slice(11, 16)}`,
  );

const YESTERDAY = new Date(Date.UTC(2026, 9, 1));
const FAR = new Date(Date.UTC(2026, 11, 31));

describe('mergeIntervals', () => {
  it('funde los que se pisan o se tocan y descarta los de largo cero', () => {
    const r = mergeIntervals([
      iv(t(10), t(11)),
      iv(t(8), t(9)),
      iv(t(9), t(9, 30)),
      iv(t(9, 20), t(9, 40)),
      iv(t(12), t(12)),
    ]);
    expect(hours(r)).toEqual(['08:00-09:40', '10:00-11:00']);
  });
});

describe('subtractIntervals', () => {
  it('parte una franja alrededor de lo ocupado', () => {
    const r = subtractIntervals(
      [iv(t(8), t(12))],
      [iv(t(9), t(9, 30)), iv(t(11), t(13))],
    );
    expect(hours(r)).toEqual(['08:00-09:00', '09:30-11:00']);
  });

  it('un compromiso que cubre toda la franja no deja nada', () => {
    expect(subtractIntervals([iv(t(8), t(9))], [iv(t(7), t(10))])).toEqual([]);
  });

  it('lo ocupado fuera de la franja no la toca', () => {
    expect(
      hours(subtractIntervals([iv(t(8), t(9))], [iv(t(10), t(11))])),
    ).toEqual(['08:00-09:00']);
  });
});

describe('proposeServiceTimes', () => {
  const service = { minDurationMinutes: 30, maxDurationMinutes: 45 };
  const base = {
    bands: [iv(t(8), t(10))],
    busy: [] as Interval[],
    notBefore: YESTERDAY,
    notAfter: FAR,
  };

  it('compromete el MÁXIMO y expone el mínimo como fin posible', () => {
    const [first] = proposeServiceTimes({ ...base, service: service });
    expect(first.startAt).toEqual(t(8));
    expect(first.endAtMax).toEqual(t(8, 45));
    expect(first.endAtMin).toEqual(t(8, 30));
  });

  it('el último inicio es el que todavía entra completo en la franja', () => {
    const starts = proposeServiceTimes({ ...base, service: service }).map((h) =>
      h.startAt.toISOString().slice(11, 16),
    );
    // 45 min dentro de 08:00–10:00 con paso de 15: el último arranca a las 09:15.
    expect(starts[starts.length - 1]).toBe('09:15');
    expect(starts).toHaveLength(6);
  });

  it('un servicio más largo que la franja no se ofrece', () => {
    expect(
      proposeServiceTimes({
        ...base,
        bands: [iv(t(8), t(8, 40))],
        service: service,
      }),
    ).toEqual([]);
  });

  it('el primer inicio de un hueco pega con el fin exacto del compromiso anterior', () => {
    const r = proposeServiceTimes({
      ...base,
      busy: [iv(t(8), t(8, 7))],
      service: service,
    });
    expect(r[0].startAt).toEqual(t(8, 7));
  });

  it('no ofrece inicios que pisen una cita confirmada', () => {
    const r = proposeServiceTimes({
      ...base,
      busy: [iv(t(8, 30), t(9))],
      service: service,
    });
    for (const h of r) {
      const overlaps = h.startAt < t(9) && h.endAtMax > t(8, 30);
      expect(overlaps).toBe(false);
    }
    expect(r.map((h) => h.startAt.toISOString().slice(11, 16))).toEqual([
      '09:00',
      '09:15',
    ]);
  });

  it('la preparación y la limpieza también tienen que caber, y no se reservan al paciente', () => {
    const r = proposeServiceTimes({
      ...base,
      bands: [iv(t(8), t(9))],
      service: { ...service, prepMinutes: 5, cleanupMinutes: 10 },
    });
    // 5 + 45 + 10 = 60: entra exacto una sola vez y la atención arranca a las 08:05.
    expect(r).toHaveLength(1);
    expect(r[0].startAt).toEqual(t(8, 5));
    expect(r[0].occupiesFrom).toEqual(t(8));
    expect(r[0].occupiesTo).toEqual(t(9));
  });

  it('respeta el aviso mínimo y el horizonte de la política', () => {
    const r = proposeServiceTimes({
      ...base,
      notBefore: t(9),
      notAfter: t(9, 15),
      service: service,
    });
    expect(r.map((h) => h.startAt.toISOString().slice(11, 16))).toEqual([
      '09:00',
      '09:15',
    ]);
  });

  it('corta en el límite pedido', () => {
    expect(
      proposeServiceTimes({ ...base, service: service, limit: 2 }),
    ).toHaveLength(2);
  });

  it.each([
    [{ minDurationMinutes: 0, maxDurationMinutes: 30 }],
    [{ minDurationMinutes: 40, maxDurationMinutes: 30 }],
    [{ minDurationMinutes: 30.5, maxDurationMinutes: 45 }],
    [{ minDurationMinutes: 30, maxDurationMinutes: 45, prepMinutes: -1 }],
  ])('rechaza una duración sin sentido %j', (s) => {
    expect(() => proposeServiceTimes({ ...base, service: s })).toThrow(
      RangeError,
    );
  });
});

describe('serviceFits', () => {
  const service = {
    minDurationMinutes: 30,
    maxDurationMinutes: 45,
    prepMinutes: 5,
    cleanupMinutes: 10,
  };
  const bands = [iv(t(8), t(10))];

  it('cabe en un hueco libre', () => {
    expect(serviceFits(bands, [], service, t(8, 5))).toBe(true);
  });

  it('no cabe si la preparación se sale de la franja', () => {
    expect(serviceFits(bands, [], service, t(8))).toBe(false);
  });

  it('no cabe si otro paciente retuvo parte del rango entre tanto', () => {
    expect(serviceFits(bands, [iv(t(8, 40), t(9, 10))], service, t(8, 5))).toBe(
      false,
    );
  });
});

describe('slotsThatCanReopen', () => {
  const retracted = [
    { id: 'a', startAt: t(9), endAt: t(9, 30) },
    { id: 'b', startAt: t(9, 30), endAt: t(10) },
    { id: 'c', startAt: t(10), endAt: t(10, 30) },
  ];

  it('sin nada comprometido vuelven todos', () => {
    expect(slotsThatCanReopen(retracted, [])).toEqual(['a', 'b', 'c']);
  });

  it('el cupo que sigue pisado por otro servicio no vuelve', () => {
    expect(slotsThatCanReopen(retracted, [iv(t(9, 45), t(10, 15))])).toEqual([
      'a',
    ]);
  });

  it('un compromiso que apenas termina cuando empieza el cupo no lo pisa', () => {
    expect(slotsThatCanReopen(retracted, [iv(t(8), t(9))])).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});

describe('busySpan', () => {
  it('suma la preparación antes y la limpieza después', () => {
    const r = busySpan(t(9), t(9, 45), {
      prepMinutes: 5,
      cleanupMinutes: 10,
    });
    expect(hours([r])).toEqual(['08:55-09:55']);
  });

  it('sin colchones es el turno tal cual', () => {
    expect(hours([busySpan(t(9), t(9, 45), {})])).toEqual(['09:00-09:45']);
  });
});
