import {
  cabeElServicio,
  cuposQueSePuedenReabrir,
  proponerHorariosDeServicio,
  restarIntervalos,
  tramoOcupado,
  unirIntervalos,
  type Intervalo,
} from './service-availability';

/** Un instante del 2026-10-05 (lunes) en UTC, `h:m`. */
const t = (h: number, m = 0): Date =>
  new Date(Date.UTC(2026, 9, 5, h, m, 0, 0));
const iv = (d: Date, h: Date): Intervalo => ({ startAt: d, endAt: h });
const horas = (r: Intervalo[]): string[] =>
  r.map(
    (i) =>
      `${i.startAt.toISOString().slice(11, 16)}-${i.endAt.toISOString().slice(11, 16)}`,
  );

const AYER = new Date(Date.UTC(2026, 9, 1));
const LEJOS = new Date(Date.UTC(2026, 11, 31));

describe('unirIntervalos', () => {
  it('funde los que se pisan o se tocan y descarta los de largo cero', () => {
    const r = unirIntervalos([
      iv(t(10), t(11)),
      iv(t(8), t(9)),
      iv(t(9), t(9, 30)),
      iv(t(9, 20), t(9, 40)),
      iv(t(12), t(12)),
    ]);
    expect(horas(r)).toEqual(['08:00-09:40', '10:00-11:00']);
  });
});

describe('restarIntervalos', () => {
  it('parte una franja alrededor de lo ocupado', () => {
    const r = restarIntervalos(
      [iv(t(8), t(12))],
      [iv(t(9), t(9, 30)), iv(t(11), t(13))],
    );
    expect(horas(r)).toEqual(['08:00-09:00', '09:30-11:00']);
  });

  it('un compromiso que cubre toda la franja no deja nada', () => {
    expect(restarIntervalos([iv(t(8), t(9))], [iv(t(7), t(10))])).toEqual([]);
  });

  it('lo ocupado fuera de la franja no la toca', () => {
    expect(
      horas(restarIntervalos([iv(t(8), t(9))], [iv(t(10), t(11))])),
    ).toEqual(['08:00-09:00']);
  });
});

describe('proponerHorariosDeServicio', () => {
  const servicio = { minDurationMinutes: 30, maxDurationMinutes: 45 };
  const base = {
    franjas: [iv(t(8), t(10))],
    ocupado: [] as Intervalo[],
    noAntesDe: AYER,
    noDespuesDe: LEJOS,
  };

  it('compromete el MÁXIMO y expone el mínimo como fin posible', () => {
    const [primero] = proponerHorariosDeServicio({ ...base, servicio });
    expect(primero.startAt).toEqual(t(8));
    expect(primero.endAtMax).toEqual(t(8, 45));
    expect(primero.endAtMin).toEqual(t(8, 30));
  });

  it('el último inicio es el que todavía entra completo en la franja', () => {
    const inicios = proponerHorariosDeServicio({ ...base, servicio }).map((h) =>
      h.startAt.toISOString().slice(11, 16),
    );
    // 45 min dentro de 08:00–10:00 con paso de 15: el último arranca a las 09:15.
    expect(inicios[inicios.length - 1]).toBe('09:15');
    expect(inicios).toHaveLength(6);
  });

  it('un servicio más largo que la franja no se ofrece', () => {
    expect(
      proponerHorariosDeServicio({
        ...base,
        franjas: [iv(t(8), t(8, 40))],
        servicio,
      }),
    ).toEqual([]);
  });

  it('el primer inicio de un hueco pega con el fin exacto del compromiso anterior', () => {
    const r = proponerHorariosDeServicio({
      ...base,
      ocupado: [iv(t(8), t(8, 7))],
      servicio,
    });
    expect(r[0].startAt).toEqual(t(8, 7));
  });

  it('no ofrece inicios que pisen una cita confirmada', () => {
    const r = proponerHorariosDeServicio({
      ...base,
      ocupado: [iv(t(8, 30), t(9))],
      servicio,
    });
    for (const h of r) {
      const pisa = h.startAt < t(9) && h.endAtMax > t(8, 30);
      expect(pisa).toBe(false);
    }
    expect(r.map((h) => h.startAt.toISOString().slice(11, 16))).toEqual([
      '09:00',
      '09:15',
    ]);
  });

  it('la preparación y la limpieza también tienen que caber, y no se reservan al paciente', () => {
    const r = proponerHorariosDeServicio({
      ...base,
      franjas: [iv(t(8), t(9))],
      servicio: { ...servicio, prepMinutes: 5, cleanupMinutes: 10 },
    });
    // 5 + 45 + 10 = 60: entra exacto una sola vez y la atención arranca a las 08:05.
    expect(r).toHaveLength(1);
    expect(r[0].startAt).toEqual(t(8, 5));
    expect(r[0].ocupaDesde).toEqual(t(8));
    expect(r[0].ocupaHasta).toEqual(t(9));
  });

  it('respeta el aviso mínimo y el horizonte de la política', () => {
    const r = proponerHorariosDeServicio({
      ...base,
      noAntesDe: t(9),
      noDespuesDe: t(9, 15),
      servicio,
    });
    expect(r.map((h) => h.startAt.toISOString().slice(11, 16))).toEqual([
      '09:00',
      '09:15',
    ]);
  });

  it('corta en el límite pedido', () => {
    expect(
      proponerHorariosDeServicio({ ...base, servicio, limite: 2 }),
    ).toHaveLength(2);
  });

  it.each([
    [{ minDurationMinutes: 0, maxDurationMinutes: 30 }],
    [{ minDurationMinutes: 40, maxDurationMinutes: 30 }],
    [{ minDurationMinutes: 30.5, maxDurationMinutes: 45 }],
    [{ minDurationMinutes: 30, maxDurationMinutes: 45, prepMinutes: -1 }],
  ])('rechaza una duración sin sentido %j', (s) => {
    expect(() => proponerHorariosDeServicio({ ...base, servicio: s })).toThrow(
      RangeError,
    );
  });
});

describe('cabeElServicio', () => {
  const servicio = {
    minDurationMinutes: 30,
    maxDurationMinutes: 45,
    prepMinutes: 5,
    cleanupMinutes: 10,
  };
  const franjas = [iv(t(8), t(10))];

  it('cabe en un hueco libre', () => {
    expect(cabeElServicio(franjas, [], servicio, t(8, 5))).toBe(true);
  });

  it('no cabe si la preparación se sale de la franja', () => {
    expect(cabeElServicio(franjas, [], servicio, t(8))).toBe(false);
  });

  it('no cabe si otro paciente retuvo parte del rango entre tanto', () => {
    expect(
      cabeElServicio(franjas, [iv(t(8, 40), t(9, 10))], servicio, t(8, 5)),
    ).toBe(false);
  });
});

describe('cuposQueSePuedenReabrir', () => {
  const retraidos = [
    { id: 'a', startAt: t(9), endAt: t(9, 30) },
    { id: 'b', startAt: t(9, 30), endAt: t(10) },
    { id: 'c', startAt: t(10), endAt: t(10, 30) },
  ];

  it('sin nada comprometido vuelven todos', () => {
    expect(cuposQueSePuedenReabrir(retraidos, [])).toEqual(['a', 'b', 'c']);
  });

  it('el cupo que sigue pisado por otro servicio no vuelve', () => {
    expect(
      cuposQueSePuedenReabrir(retraidos, [iv(t(9, 45), t(10, 15))]),
    ).toEqual(['a']);
  });

  it('un compromiso que apenas termina cuando empieza el cupo no lo pisa', () => {
    expect(cuposQueSePuedenReabrir(retraidos, [iv(t(8), t(9))])).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});

describe('tramoOcupado', () => {
  it('suma la preparación antes y la limpieza después', () => {
    const r = tramoOcupado(t(9), t(9, 45), {
      prepMinutes: 5,
      cleanupMinutes: 10,
    });
    expect(horas([r])).toEqual(['08:55-09:55']);
  });

  it('sin colchones es el turno tal cual', () => {
    expect(horas([tramoOcupado(t(9), t(9, 45), {})])).toEqual(['09:00-09:45']);
  });
});
