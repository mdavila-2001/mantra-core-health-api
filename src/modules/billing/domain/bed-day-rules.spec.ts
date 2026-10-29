import {
  bedDayKey,
  categoryAt,
  computeBedNights,
  orTimeKey,
  type CategoryPeriod,
  type OccupancyPeriod,
} from './bed-day-rules';

const TZ = 'America/La_Paz'; // UTC-4 todo el año
const at = (local: string): Date => new Date(`${local}-04:00`);
const SHARED = 'cat-shared';
const ICU = 'cat-icu';
const PRIVATE = 'cat-private';

const open = (careSpaceId: string, category: string): CategoryPeriod => ({
  careSpaceId,
  categoryConceptId: category,
  validFrom: at('2026-01-01T00:00:00'),
  validTo: null,
});
const stay = (
  id: string,
  careSpaceId: string,
  start: string,
  end: string | null,
): OccupancyPeriod => ({
  id,
  careSpaceId,
  start: at(start),
  end: end ? at(end) : null,
});
const cap = at('2026-12-31T00:00:00');
const base = { timeZone: TZ, cap, minimumOneDay: true } as const;
const dates = (r: ReturnType<typeof computeBedNights>): string[] =>
  r.nights.map((n) => n.serviceDate);

describe('computeBedNights · regla de medianoche (D7)', () => {
  it('ejemplo del contrato: ingreso 27/10 15:00, traslado a UCI 28/10 10:00, egreso 30/10 09:00 = 3 días-cama (27 compartida, 28 y 29 UCI)', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p1', 'bed-a', '2026-10-27T15:00:00', '2026-10-28T10:00:00'),
        stay('p2', 'bed-b', '2026-10-28T10:00:00', '2026-10-30T09:00:00'),
      ],
      categories: [open('bed-a', SHARED), open('bed-b', ICU)],
    });
    expect(dates(r)).toEqual(['2026-10-27', '2026-10-28', '2026-10-29']);
    expect(r.nights.map((n) => n.categoryConceptId)).toEqual([
      SHARED,
      ICU,
      ICU,
    ]);
    expect(r.nights.map((n) => n.careSpaceId)).toEqual([
      'bed-a',
      'bed-b',
      'bed-b',
    ]);
    expect(r.nights.every((n) => !n.minimumStay)).toBe(true);
    expect(r.uncategorized).toEqual([]);
  });

  it('ejemplo del proceso 11: ingreso 28/10 15:00, traslado 30/10 09:00, egreso 31/10 10:00 = 28 y 29 compartida, 30 UTI', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p1', 'bed-a', '2026-10-28T15:00:00', '2026-10-30T09:00:00'),
        stay('p2', 'bed-b', '2026-10-30T09:00:00', '2026-10-31T10:00:00'),
      ],
      categories: [open('bed-a', SHARED), open('bed-b', ICU)],
    });
    expect(r.nights.map((n) => [n.serviceDate, n.categoryConceptId])).toEqual([
      ['2026-10-28', SHARED],
      ['2026-10-29', SHARED],
      ['2026-10-30', ICU],
    ]);
  });

  it('el día del egreso no se cobra y una sola medianoche es un solo día', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p', 'bed-a', '2026-11-01T22:00:00', '2026-11-02T08:00:00'),
      ],
      categories: [open('bed-a', SHARED)],
    });
    expect(dates(r)).toEqual(['2026-11-01']);
  });

  it('ingreso y egreso el mismo día: un día mínimo que no cuenta como noche', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p', 'bed-a', '2026-11-03T08:00:00', '2026-11-03T18:00:00'),
      ],
      categories: [open('bed-a', SHARED)],
    });
    expect(r.nights).toEqual([
      expect.objectContaining({
        serviceDate: '2026-11-03',
        midnight: null,
        minimumStay: true,
        careSpaceId: 'bed-a',
      }),
    ]);
  });

  it('sin billing.bed_day_min_one la estancia sin medianoche no devenga nada', () => {
    const r = computeBedNights({
      ...base,
      minimumOneDay: false,
      periods: [
        stay('p', 'bed-a', '2026-11-03T08:00:00', '2026-11-03T18:00:00'),
      ],
      categories: [open('bed-a', SHARED)],
    });
    expect(r.nights).toEqual([]);
  });

  it('quien sigue internado el mismo día aún no devenga el mínimo (puede cruzar la noche)', () => {
    const r = computeBedNights({
      ...base,
      cap: at('2026-11-03T20:00:00'),
      periods: [stay('p', 'bed-a', '2026-11-03T08:00:00', null)],
      categories: [open('bed-a', SHARED)],
    });
    expect(r.nights).toEqual([]);
  });

  it('estancia abierta: sólo las medianoches que ya pasaron (hasta el tope)', () => {
    const r = computeBedNights({
      ...base,
      cap: at('2026-11-03T10:00:00'),
      periods: [stay('p', 'bed-a', '2026-11-01T09:00:00', null)],
      categories: [open('bed-a', SHARED)],
    });
    expect(dates(r)).toEqual(['2026-11-01', '2026-11-02']);
  });

  it('el tope de un día pedido acota las noches: cap = medianoche que cierra ese día', () => {
    const r = computeBedNights({
      ...base,
      cap: at('2026-11-03T00:00:00'), // cierra el 2 de noviembre
      periods: [stay('p', 'bed-a', '2026-11-01T09:00:00', null)],
      categories: [open('bed-a', SHARED)],
    });
    expect(dates(r)).toEqual(['2026-11-01', '2026-11-02']);
  });

  it('egreso exactamente a las 00:00: esa medianoche no se cobra', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p', 'bed-a', '2026-11-01T22:00:00', '2026-11-03T00:00:00'),
      ],
      categories: [open('bed-a', SHARED)],
    });
    expect(dates(r)).toEqual(['2026-11-01']);
  });

  it('ingreso exactamente a las 00:00: no se paga el día anterior', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p', 'bed-a', '2026-11-02T00:00:00', '2026-11-03T12:00:00'),
      ],
      categories: [open('bed-a', SHARED)],
    });
    expect(dates(r)).toEqual(['2026-11-02']);
  });

  it('cambio de categoría a media mañana: la medianoche anterior conserva la vieja', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p', 'bed-a', '2026-11-08T20:00:00', '2026-11-12T08:00:00'),
      ],
      categories: [
        {
          careSpaceId: 'bed-a',
          categoryConceptId: SHARED,
          validFrom: at('2026-01-01T00:00:00'),
          validTo: at('2026-11-10T10:00:00'),
        },
        {
          careSpaceId: 'bed-a',
          categoryConceptId: PRIVATE,
          validFrom: at('2026-11-10T10:00:00'),
          validTo: null,
        },
      ],
    });
    expect(r.nights.map((n) => [n.serviceDate, n.categoryConceptId])).toEqual([
      ['2026-11-08', SHARED],
      ['2026-11-09', SHARED],
      ['2026-11-10', PRIVATE],
      ['2026-11-11', PRIVATE],
    ]);
  });

  it('cambio de categoría exactamente a medianoche: rige desde ese instante', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p', 'bed-a', '2026-11-08T20:00:00', '2026-11-11T08:00:00'),
      ],
      categories: [
        {
          careSpaceId: 'bed-a',
          categoryConceptId: SHARED,
          validFrom: at('2026-01-01T00:00:00'),
          validTo: at('2026-11-10T00:00:00'),
        },
        {
          careSpaceId: 'bed-a',
          categoryConceptId: PRIVATE,
          validFrom: at('2026-11-10T00:00:00'),
          validTo: null,
        },
      ],
    });
    expect(r.nights.map((n) => [n.serviceDate, n.categoryConceptId])).toEqual([
      ['2026-11-08', SHARED],
      ['2026-11-09', PRIVATE],
      ['2026-11-10', PRIVATE],
    ]);
  });

  it('permiso de salida con cama retenida: el período no se corta y devenga las medianoches', () => {
    const r = computeBedNights({
      ...base,
      cap: at('2027-02-01T00:00:00'),
      periods: [
        stay('p', 'bed-a', '2027-01-05T10:00:00', '2027-01-09T10:00:00'),
      ],
      categories: [open('bed-a', SHARED)],
    });
    expect(dates(r)).toEqual([
      '2027-01-05',
      '2027-01-06',
      '2027-01-07',
      '2027-01-08',
    ]);
  });

  it('una cama sin categoría vigente en la medianoche no devenga por defecto: se informa', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p', 'bed-a', '2025-06-01T10:00:00', '2025-06-03T10:00:00'),
      ],
      categories: [open('bed-a', SHARED)].map((c) => ({
        ...c,
        validFrom: at('2026-01-01T00:00:00'),
      })),
    });
    expect(r.nights).toEqual([]);
    expect(r.uncategorized).toEqual([
      { serviceDate: '2025-06-01', careSpaceId: 'bed-a' },
      { serviceDate: '2025-06-02', careSpaceId: 'bed-a' },
    ]);
  });

  it('un día mínimo sin categoría tampoco devenga: se informa', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p', 'bed-a', '2026-11-03T08:00:00', '2026-11-03T18:00:00'),
      ],
      categories: [],
    });
    expect(r.nights).toEqual([]);
    expect(r.uncategorized).toEqual([
      { serviceDate: '2026-11-03', careSpaceId: 'bed-a' },
    ]);
  });

  it('dos períodos que cubren la misma noche devengan una sola vez', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p1', 'bed-a', '2026-11-01T10:00:00', '2026-11-02T10:00:00'),
        stay('p2', 'bed-b', '2026-11-01T20:00:00', '2026-11-02T08:00:00'),
      ],
      categories: [open('bed-a', SHARED), open('bed-b', ICU)],
    });
    expect(r.nights).toHaveLength(1);
    expect(r.nights[0].occupancyId).toBe('p1');
  });

  it('un cambio de cama el mismo día no duplica ni salta noches', () => {
    const r = computeBedNights({
      ...base,
      periods: [
        stay('p1', 'bed-a', '2026-11-01T10:00:00', '2026-11-01T23:30:00'),
        stay('p2', 'bed-b', '2026-11-01T23:30:00', '2026-11-03T08:00:00'),
      ],
      categories: [open('bed-a', SHARED), open('bed-b', ICU)],
    });
    expect(r.nights.map((n) => [n.serviceDate, n.careSpaceId])).toEqual([
      ['2026-11-01', 'bed-b'],
      ['2026-11-02', 'bed-b'],
    ]);
  });

  it('la medianoche es la local de la sede: en UTC la misma estancia cuenta otras noches', () => {
    const periods = [
      {
        id: 'p',
        careSpaceId: 'bed-a',
        start: new Date('2026-11-01T22:00:00Z'),
        end: new Date('2026-11-02T03:00:00Z'),
      },
    ];
    const categories = [open('bed-a', SHARED)];
    const laPaz = computeBedNights({ ...base, periods, categories });
    // En La Paz es 18:00 → 23:00 del 1/11: sin medianoche, día mínimo.
    expect(laPaz.nights.map((n) => [n.serviceDate, n.minimumStay])).toEqual([
      ['2026-11-01', true],
    ]);
    const utc = computeBedNights({
      ...base,
      timeZone: 'UTC',
      periods,
      categories,
    });
    expect(utc.nights.map((n) => [n.serviceDate, n.minimumStay])).toEqual([
      ['2026-11-01', false],
    ]);
  });
});

describe('categoryAt', () => {
  it('[valid_from, valid_to): incluye el inicio y excluye el fin', () => {
    const cats: CategoryPeriod[] = [
      {
        careSpaceId: 'b',
        categoryConceptId: SHARED,
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validTo: new Date('2026-02-01T00:00:00Z'),
      },
    ];
    expect(categoryAt(cats, 'b', new Date('2026-01-01T00:00:00Z'))).toBe(
      SHARED,
    );
    expect(categoryAt(cats, 'b', new Date('2026-02-01T00:00:00Z'))).toBeNull();
    expect(
      categoryAt(cats, 'otra', new Date('2026-01-15T00:00:00Z')),
    ).toBeNull();
  });
});

describe('claves de idempotencia', () => {
  it('BEDDAY y ORTIME; las correcciones llevan :rN', () => {
    expect(bedDayKey('e1', '2026-10-27')).toBe('BEDDAY:e1:2026-10-27');
    expect(bedDayKey('e1', '2026-10-27', 2)).toBe('BEDDAY:e1:2026-10-27:r2');
    expect(orTimeKey('c1')).toBe('ORTIME:c1');
    expect(orTimeKey('c1', 3)).toBe('ORTIME:c1:r3');
  });
});
