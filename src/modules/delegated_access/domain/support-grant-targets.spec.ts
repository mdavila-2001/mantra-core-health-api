import {
  atomsOfGrant,
  effectiveAtoms,
  grantsOverlap,
  isGrantLive,
  targetCells,
  targetWithin,
  type GrantTargetFacts,
  type AtomHoldingGrant,
} from './support-grant-targets';

const NOW = new Date('2026-11-03T10:30:00-04:00');
const SITE = 'site-1';
const EDIF_A = 'sp-edificio-a';
const PISO_1 = 'sp-piso-1';
const PISO_2 = 'sp-piso-2';
const SALA_103 = 'sp-103';
const pathOf = (...ids: string[]): string => `/${[SITE, ...ids].join('/')}/`;

const service = (id: string): GrantTargetFacts => ({
  targetKind: 'SERVICE',
  healthcareServiceId: id,
});
const doctor = (id: string): GrantTargetFacts => ({
  targetKind: 'PRACTITIONER',
  practitionerProfileId: id,
});
const location = (id: string, path: string): GrantTargetFacts => ({
  targetKind: 'LOCATION',
  careSpaceId: id,
  careSpacePath: path,
});
const doctorLocation = (
  d: string,
  id: string,
  path: string,
): GrantTargetFacts => ({
  targetKind: 'PRACTITIONER_LOCATION',
  practitionerProfileId: d,
  careSpaceId: id,
  careSpacePath: path,
});
const ALL: GrantTargetFacts = { targetKind: 'ALL' };

describe('targetCells · un permiso como celdas por dimensión', () => {
  it('un permiso DYNAMIC es una celda: acotado = ids, libre o «todos» = null', () => {
    expect(targetCells(service('eco'))).toEqual([
      {
        practitioner: null,
        service: { ids: ['eco'] },
        location: null,
      },
    ]);
    expect(targetCells(ALL)).toEqual([
      { practitioner: null, service: null, location: null },
    ]);
  });

  it('un objetivo acotado sin referencia (dato roto) no cubre nada', () => {
    const cells = targetCells({ targetKind: 'PRACTITIONER' });
    expect(cells).toHaveLength(1);
    expect(cells[0].practitioner).toEqual({ ids: [] });
  });

  it('un permiso FIXED es una celda por fila de la foto; las filas vacías se ignoran', () => {
    const cells = targetCells({
      targetKind: 'ALL',
      expansionMode: 'FIXED',
      snapshot: {
        rows: [
          { practitionerProfileId: 'd1', healthcareServiceId: 's1' },
          {},
          { careSpaceId: 'sp1' },
        ],
      },
    });
    expect(cells).toHaveLength(2);
    expect(cells[0]).toMatchObject({
      practitioner: { ids: ['d1'] },
      service: { ids: ['s1'] },
      location: null,
    });
  });

  it('un FIXED sin foto no cubre nada', () => {
    expect(targetCells({ targetKind: 'ALL', expansionMode: 'FIXED' })).toEqual(
      [],
    );
  });
});

describe('grantsOverlap · ¿las coberturas se solapan?', () => {
  const eco = service('eco');
  const table: ReadonlyArray<
    [string, GrantTargetFacts, GrantTargetFacts, boolean]
  > = [
    ['mismo servicio', eco, service('eco'), true],
    ['servicios distintos', eco, service('card'), false],
    ['todo con un servicio', ALL, eco, true],
    [
      'doctor y servicio (dimensiones libres entre sí)',
      doctor('perez'),
      eco,
      true,
    ],
    ['doctores distintos', doctor('perez'), doctor('rojas'), false],
    [
      'ubicación contenida en otra (piso en edificio)',
      location(EDIF_A, pathOf(EDIF_A)),
      location(PISO_1, pathOf(EDIF_A, PISO_1)),
      true,
    ],
    [
      'pisos hermanos',
      location(PISO_1, pathOf(EDIF_A, PISO_1)),
      location(PISO_2, pathOf(EDIF_A, PISO_2)),
      false,
    ],
    [
      'doctor×ubicación frente a ubicación contenedora',
      doctorLocation('suarez', PISO_2, pathOf(EDIF_A, PISO_2)),
      location(EDIF_A, pathOf(EDIF_A)),
      true,
    ],
    [
      'doctor×ubicación frente a otro doctor sobre la misma ubicación',
      doctorLocation('suarez', PISO_2, pathOf(EDIF_A, PISO_2)),
      doctorLocation('perez', PISO_2, pathOf(EDIF_A, PISO_2)),
      false,
    ],
    [
      'ubicaciones sin ruta y distintas: se desconoce, cuenta como solape (cierra del lado seguro)',
      { targetKind: 'LOCATION', careSpaceId: 'x' },
      { targetKind: 'LOCATION', careSpaceId: 'y' },
      true,
    ],
  ];
  it.each(table)('%s', (_n, a, b, expected) => {
    expect(grantsOverlap(a, b)).toBe(expected);
  });

  it('es simétrica y reflexiva para un permiso que cubre algo', () => {
    const items = table.flatMap(([, a, b]) => [a, b]);
    for (const a of items) {
      expect(grantsOverlap(a, a)).toBe(true);
      for (const b of items)
        expect(grantsOverlap(a, b)).toBe(grantsOverlap(b, a));
    }
  });

  it('un FIXED vacío no se solapa con nada, ni consigo mismo', () => {
    const empty: GrantTargetFacts = {
      targetKind: 'ALL',
      expansionMode: 'FIXED',
    };
    expect(grantsOverlap(empty, ALL)).toBe(false);
    expect(grantsOverlap(empty, empty)).toBe(false);
  });

  it('un FIXED se solapa si alguna de sus filas toca el otro permiso', () => {
    const fixed: GrantTargetFacts = {
      targetKind: 'ALL',
      expansionMode: 'FIXED',
      snapshot: {
        rows: [{ practitionerProfileId: 'perez', healthcareServiceId: 'eco' }],
      },
    };
    expect(grantsOverlap(fixed, eco)).toBe(true);
    expect(grantsOverlap(fixed, service('card'))).toBe(false);
    expect(grantsOverlap(fixed, doctor('rojas'))).toBe(false);
  });
});

describe('targetWithin · ¿lo gestionado cae dentro del alcance del delegado? (§6.4)', () => {
  const jefaEco = service('eco'); // jefa de Ecografía
  const jefePiso1 = location(PISO_1, pathOf(EDIF_A, PISO_1));
  const table: ReadonlyArray<
    [string, GrantTargetFacts, GrantTargetFacts, boolean]
  > = [
    ['mismo servicio', service('eco'), jefaEco, true],
    ['otro servicio', service('card'), jefaEco, false],
    ['más amplio: ALL frente a SERVICE', ALL, jefaEco, false],
    [
      'dimensión libre del gestionado frente a servicio acotado',
      doctor('suarez'),
      jefaEco,
      false,
    ],
    [
      'doctor × ubicación frente a servicio (Suárez×Norte no es de Ecografía)',
      doctorLocation('suarez', PISO_2, pathOf(EDIF_A, PISO_2)),
      jefaEco,
      false,
    ],
    [
      'cualquier cosa dentro de un delegado con alcance ALL',
      doctor('suarez'),
      ALL,
      true,
    ],
    [
      'sala dentro del piso del delegado',
      location(SALA_103, pathOf(EDIF_A, PISO_1, SALA_103)),
      jefePiso1,
      true,
    ],
    [
      'el mismo piso',
      location(PISO_1, pathOf(EDIF_A, PISO_1)),
      jefePiso1,
      true,
    ],
    [
      'el edificio completo frente al piso (más amplio)',
      location(EDIF_A, pathOf(EDIF_A)),
      jefePiso1,
      false,
    ],
    ['otro piso', location(PISO_2, pathOf(EDIF_A, PISO_2)), jefePiso1, false],
    [
      'doctor × sala del piso: la dimensión de doctor es libre en el delegado',
      doctorLocation('perez', SALA_103, pathOf(EDIF_A, PISO_1, SALA_103)),
      jefePiso1,
      true,
    ],
    [
      'sin ruta y espacios distintos: se desconoce y no cuenta como dentro',
      { targetKind: 'LOCATION', careSpaceId: 'x' },
      { targetKind: 'LOCATION', careSpaceId: 'y' },
      false,
    ],
  ];
  it.each(table)('%s', (_n, managed, admin, expected) => {
    expect(targetWithin(managed, admin)).toBe(expected);
  });

  it('un gestionado FIXED exige que TODAS sus filas estén dentro', () => {
    const fixed = (
      rows: Array<{ s?: string; d?: string }>,
    ): GrantTargetFacts => ({
      targetKind: 'ALL',
      expansionMode: 'FIXED',
      snapshot: {
        rows: rows.map((r) => ({
          healthcareServiceId: r.s,
          practitionerProfileId: r.d,
        })),
      },
    });
    expect(
      targetWithin(
        fixed([
          { s: 'eco', d: 'a' },
          { s: 'eco', d: 'b' },
        ]),
        jefaEco,
      ),
    ).toBe(true);
    expect(
      targetWithin(
        fixed([
          { s: 'eco', d: 'a' },
          { s: 'card', d: 'b' },
        ]),
        jefaEco,
      ),
    ).toBe(false);
  });

  it('un gestionado que no cubre nada nunca está «dentro» (falla cerrado)', () => {
    expect(
      targetWithin({ targetKind: 'ALL', expansionMode: 'FIXED' }, ALL),
    ).toBe(false);
  });

  it('es transitiva sobre la tabla: si A⊆B y B⊆C entonces A⊆C', () => {
    const pool = [
      ALL,
      jefaEco,
      jefePiso1,
      doctor('perez'),
      location(SALA_103, pathOf(EDIF_A, PISO_1, SALA_103)),
      doctorLocation('perez', SALA_103, pathOf(EDIF_A, PISO_1, SALA_103)),
    ];
    for (const a of pool)
      for (const b of pool)
        for (const c of pool)
          if (targetWithin(a, b) && targetWithin(b, c)) {
            expect(targetWithin(a, c)).toBe(true);
          }
  });
});

describe('átomos efectivos de una persona', () => {
  const grant = (over: Partial<AtomHoldingGrant>): AtomHoldingGrant => ({
    grantId: 'g',
    targetKind: 'ALL',
    actions: [],
    ...over,
  });

  it('un alias se expande a su paquete y un átomo se da a sí mismo', () => {
    expect(
      atomsOfGrant(
        grant({ actions: ['billing.collect', 'agenda.appointment.view'] }),
      ),
    ).toEqual(
      expect.arrayContaining([
        'billing.payment.collect',
        'agenda.appointment.view',
      ]),
    );
  });

  it('ignora códigos desconocidos y no repite átomos', () => {
    const atoms = atomsOfGrant(
      grant({
        actions: [
          'nada.que.ver',
          'agenda.appointment.view',
          'agenda.appointment.view',
        ],
        atomGrants: [{ atom: 'agenda.appointment.view' }],
      }),
    );
    expect(atoms).toEqual(['agenda.appointment.view']);
  });

  it('isGrantLive: vigencia, activo y efecto', () => {
    expect(isGrantLive(grant({}), NOW)).toBe(true);
    expect(isGrantLive(grant({ active: false }), NOW)).toBe(false);
    expect(isGrantLive(grant({ validTo: NOW }), NOW)).toBe(false);
    expect(
      isGrantLive(grant({ validFrom: new Date(NOW.getTime() + 1) }), NOW),
    ).toBe(false);
  });

  it('effectiveAtoms: une las concesiones ALLOW vivas; las DENY no restan', () => {
    const atoms = effectiveAtoms(
      [
        grant({ grantId: 'a', actions: ['billing.payment.collect'] }),
        grant({
          grantId: 'b',
          actions: ['billing.receipt.void'],
          effect: 'DENY',
        }),
        grant({
          grantId: 'c',
          actions: ['billing.receipt.issue'],
          active: false,
        }),
        grant({ grantId: 'd', actions: ['agenda.appointment.view'] }),
      ],
      NOW,
    );
    expect(atoms).toEqual([
      'agenda.appointment.view',
      'billing.payment.collect',
    ]);
  });

  it('propiedad: el orden de las concesiones no cambia los átomos efectivos', () => {
    const grants = [
      grant({ grantId: '1', actions: ['billing.collect'] }),
      grant({
        grantId: '2',
        actions: ['schedule.view', 'agenda.appointment.cancel'],
      }),
      grant({ grantId: '3', actions: ['patient.register'] }),
    ];
    const expected = effectiveAtoms(grants, NOW);
    for (let i = 0; i < 6; i += 1) {
      const rotated = [...grants.slice(i % 3), ...grants.slice(0, i % 3)];
      const reversed = i % 2 ? [...rotated].reverse() : rotated;
      expect(effectiveAtoms(reversed, NOW)).toEqual(expected);
    }
  });
});
