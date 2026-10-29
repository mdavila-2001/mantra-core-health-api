import {
  AGENDA_SPACE_FUNCTIONS,
  OPEN_ENDED_BLOCK_END,
  bandContaining,
  findSpaceBandClash,
  validitiesIntersect,
  windowTouches,
  type SpacePlan,
  type TemplateBand,
} from './care-space-agenda';

const NOW = new Date('2026-11-02T12:00:00.000Z'); // lunes
const band = (dayOfWeek: number, startTime: string, endTime: string) => ({
  dayOfWeek,
  startTime,
  endTime,
});
const plan = (over: Partial<SpacePlan> = {}): SpacePlan => ({
  timeZone: 'America/La_Paz',
  bands: [band(1, '14:00:00', '14:30:00')],
  ...over,
});

describe('agenda por espacio · funciones que admiten horario propio', () => {
  it('son el consultorio, la sala de procedimientos y la sala de imagen', () => {
    expect([...AGENDA_SPACE_FUNCTIONS].sort()).toEqual([
      'SPACE_FN_CONSULTING_ROOM',
      'SPACE_FN_IMAGING_ROOM',
      'SPACE_FN_PROCEDURE_ROOM',
    ]);
  });
});

describe('validitiesIntersect', () => {
  const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
  it('dos vigencias abiertas se tocan', () => {
    expect(validitiesIntersect({}, {})).toBe(true);
  });
  it('se tocan si comparten al menos un día (extremos inclusive)', () => {
    expect(
      validitiesIntersect(
        { validFrom: d('2026-11-01'), validTo: d('2026-11-10') },
        { validFrom: d('2026-11-10'), validTo: d('2026-11-20') },
      ),
    ).toBe(true);
  });
  it('no se tocan si una termina antes de que empiece la otra', () => {
    expect(
      validitiesIntersect(
        { validTo: d('2026-11-09') },
        { validFrom: d('2026-11-10') },
      ),
    ).toBe(false);
  });
  it('una abierta por un extremo no acota a la otra', () => {
    expect(
      validitiesIntersect(
        { validFrom: d('2030-01-01') },
        { validFrom: d('2026-11-01'), validTo: d('2026-11-10') },
      ),
    ).toBe(false);
    expect(
      validitiesIntersect(
        { validFrom: d('2026-01-01') },
        { validTo: d('2026-11-10') },
      ),
    ).toBe(true);
  });
});

describe('findSpaceBandClash · dos plantillas en el mismo espacio', () => {
  it('14:00–14:30 y 14:15–14:45 el mismo día se pisan, y dice cuáles franjas', () => {
    const clash = findSpaceBandClash(
      plan({ bands: [band(1, '14:15:00', '14:45:00')] }),
      plan(),
      NOW,
    );
    expect(clash).toEqual({
      mine: 'lunes 14:15:00–14:45:00',
      other: 'lunes 14:00:00–14:30:00',
    });
  });

  it('contiguas (14:30 contra 14:30) no se pisan: el rango es [inicio, fin)', () => {
    expect(
      findSpaceBandClash(
        plan({ bands: [band(1, '14:30:00', '15:00:00')] }),
        plan(),
        NOW,
      ),
    ).toBeNull();
  });

  it('otro día de la semana no se pisa', () => {
    expect(
      findSpaceBandClash(
        plan({ bands: [band(2, '14:00:00', '14:30:00')] }),
        plan(),
        NOW,
      ),
    ).toBeNull();
  });

  it('compara instantes, no textos: 13:00–15:00 de La Paz es 14:00–16:00 de São Paulo', () => {
    const laPaz = plan({
      timeZone: 'America/La_Paz',
      bands: [band(1, '13:00:00', '15:00:00')],
    });
    const saoPaulo = plan({
      timeZone: 'America/Sao_Paulo',
      bands: [band(1, '14:00:00', '16:00:00')],
    });
    // Como texto las horas se cruzan a medias; como instantes son exactamente el mismo rato.
    expect(findSpaceBandClash(laPaz, saoPaulo, NOW)).not.toBeNull();
    // Al revés: el mismo texto en zonas distintas son instantes distintos (13:00 de São Paulo
    // es 16:00Z; 13:00 de La Paz es 17:00Z) y las franjas de una hora quedan contiguas.
    const mismoTexto = plan({
      timeZone: 'America/Sao_Paulo',
      bands: [band(1, '13:00:00', '14:00:00')],
    });
    const otro = plan({
      timeZone: 'America/La_Paz',
      bands: [band(1, '13:00:00', '14:00:00')],
    });
    expect(findSpaceBandClash(mismoTexto, otro, NOW)).toBeNull();
    const solapadas = plan({
      timeZone: 'America/Sao_Paulo',
      bands: [band(1, '13:30:00', '14:30:00')],
    });
    // 13:30–14:30 São Paulo = 16:30Z–17:30Z pisa 17:00Z–18:00Z de La Paz.
    expect(findSpaceBandClash(solapadas, otro, NOW)).not.toBeNull();
  });

  it('vigencias que no se tocan no se pisan aunque el horario sea el mismo', () => {
    expect(
      findSpaceBandClash(
        plan({ validFrom: new Date('2027-01-01T00:00:00Z') }),
        plan({ validTo: new Date('2026-12-31T00:00:00Z') }),
        NOW,
      ),
    ).toBeNull();
  });

  it('una vigencia común que ya terminó no traba a nadie', () => {
    expect(
      findSpaceBandClash(
        plan({ validTo: new Date('2026-10-01T00:00:00Z') }),
        plan({ validTo: new Date('2026-10-15T00:00:00Z') }),
        NOW,
      ),
    ).toBeNull();
  });

  it('una vigencia futura se compara contra la semana en que empieza', () => {
    const clash = findSpaceBandClash(
      plan({ validFrom: new Date('2027-03-01T00:00:00Z') }),
      plan({ validFrom: new Date('2027-02-01T00:00:00Z') }),
      NOW,
    );
    expect(clash).not.toBeNull();
  });

  it('cualquiera de varias franjas que choque alcanza', () => {
    const clash = findSpaceBandClash(
      plan({
        bands: [
          band(1, '08:00:00', '09:00:00'),
          band(1, '14:10:00', '14:20:00'),
        ],
      }),
      plan(),
      NOW,
    );
    expect(clash?.mine).toBe('lunes 14:10:00–14:20:00');
  });
});

describe('bandContaining · qué franja contiene el inicio de una cita', () => {
  const bands: TemplateBand[] = [
    {
      templateId: 't1',
      careSpaceId: 'sala-1',
      ...band(1, '09:00:00', '12:00:00'),
    },
    {
      templateId: 't2',
      careSpaceId: 'sala-2',
      ...band(1, '14:00:00', '18:00:00'),
      validFrom: new Date('2026-11-09T00:00:00Z'),
    },
  ];
  // 2026-11-02 es lunes. 10:00 de La Paz = 14:00Z.
  it('el lunes a las 10:00 locales cae en la primera franja', () => {
    expect(
      bandContaining(new Date('2026-11-02T14:00:00Z'), bands, 'America/La_Paz')
        ?.templateId,
    ).toBe('t1');
  });
  it('el fin de la franja no la contiene ([inicio, fin))', () => {
    expect(
      bandContaining(new Date('2026-11-02T16:00:00Z'), bands, 'America/La_Paz'),
    ).toBeNull();
  });
  it('una franja con vigencia futura no cuenta antes de empezar', () => {
    // 16:00 locales del lunes 2 (aún no vigente) y del lunes 9 (vigente).
    expect(
      bandContaining(new Date('2026-11-02T20:00:00Z'), bands, 'America/La_Paz'),
    ).toBeNull();
    expect(
      bandContaining(new Date('2026-11-09T20:00:00Z'), bands, 'America/La_Paz')
        ?.templateId,
    ).toBe('t2');
  });
  it('usa la zona del recurso: la misma hora UTC es otro día local', () => {
    // Lunes 03:00Z es domingo 23:00 en La Paz.
    expect(
      bandContaining(new Date('2026-11-02T03:00:00Z'), bands, 'America/La_Paz'),
    ).toBeNull();
  });
});

describe('windowTouches', () => {
  const w = (a: string, b: string) => ({
    start: new Date(a),
    end: new Date(b),
  });
  it('se tocan si comparten tiempo y no si sólo comparten el borde', () => {
    expect(
      windowTouches(
        w('2026-11-02T10:00Z', '2026-11-02T10:30Z'),
        w('2026-11-02T10:15Z', '2026-11-02T11:00Z'),
      ),
    ).toBe(true);
    expect(
      windowTouches(
        w('2026-11-02T10:00Z', '2026-11-02T10:30Z'),
        w('2026-11-02T10:30Z', '2026-11-02T11:00Z'),
      ),
    ).toBe(false);
  });
  it('un bloqueo sin fin se extiende hasta el fin de los tiempos', () => {
    expect(OPEN_ENDED_BLOCK_END.getUTCFullYear()).toBe(9999);
    expect(
      windowTouches(w('2050-01-01T10:00Z', '2050-01-01T10:30Z'), {
        start: new Date('2026-11-02T00:00Z'),
        end: OPEN_ENDED_BLOCK_END,
      }),
    ).toBe(true);
  });
});
