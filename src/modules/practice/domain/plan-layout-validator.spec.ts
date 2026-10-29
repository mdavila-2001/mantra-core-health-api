import { FloorPlanReason } from '../plan/floor-plan.error-reasons';
import {
  validateLayoutDelta,
  type ElementState,
  type LayoutDelta,
  type PlacementState,
  type PlanCanvas,
  type SpaceInfo,
  type ValidationOutcome,
} from './plan-layout-validator';
import { rectVertices } from './plan-geometry';

const SITE = 'site-1';
const canvas: PlanCanvas = {
  widthM: 64,
  heightM: 26,
  toleranceM: 0.01,
  anchorSpaceId: 'level',
  siteId: SITE,
};

const space = (
  id: string,
  parentId: string | null,
  extra: Partial<SpaceInfo> = {},
): SpaceInfo => ({
  id,
  code: id.toUpperCase(),
  name: `Espacio ${id}`,
  parentId,
  siteId: SITE,
  retired: false,
  ...extra,
});

/** level (ancla) → ward → room1, room2 → bed1 (en room1). */
const SPACES = new Map<string, SpaceInfo>(
  [
    space('level', null),
    space('ward', 'level'),
    space('room1', 'ward'),
    space('room2', 'ward'),
    space('bed1', 'room1'),
    space('bed2', 'room1'),
    space('ghost', 'ward', { retired: true }),
    space('other', 'ward', { siteId: 'site-2' }),
  ].map((s) => [s.id, s]),
);

const rectGeo = (x: number, y: number, w: number, d: number, rot = 0) => ({
  kind: 'RECT' as const,
  centerXM: x + w / 2,
  centerYM: y + d / 2,
  widthM: w,
  depthM: d,
  rotationDeg: rot,
});

const placed = (
  spaceId: string,
  x: number,
  y: number,
  w: number,
  d: number,
  rowVersion = 1,
): PlacementState => ({
  placementId: `pl-${spaceId}`,
  spaceId,
  rowVersion,
  zOrder: 10,
  locked: false,
  shapeKind: 'RECT',
  centerXM: x + w / 2,
  centerYM: y + d / 2,
  widthM: w,
  depthM: d,
  rotationDeg: 0,
  vertices: rectVertices(x + w / 2, y + d / 2, w, d, 0),
});

const delta = (partial: Partial<LayoutDelta>): LayoutDelta => ({
  placements: [],
  elements: [],
  removeSpaceIds: [],
  removeElementIds: [],
  cascade: false,
  ...partial,
});

const run = (
  d: Partial<LayoutDelta>,
  current: PlacementState[] = [],
  elements: ElementState[] = [],
  c: PlanCanvas = canvas,
): ValidationOutcome =>
  validateLayoutDelta({
    canvas: c,
    spaces: SPACES,
    currentPlacements: current,
    currentElements: elements,
    delta: delta(d),
  });

const WARD = placed('ward', 2, 2, 20, 8.5);
const ROOM1 = placed('room1', 2, 2, 5, 8.5);

const wall = (id: string): ElementState => ({
  id,
  kind: 'WALL',
  rowVersion: 1,
  zOrder: 30,
  vertices: [
    [0, 0],
    [10, 0],
  ],
  thicknessM: 0.2,
  hostElementId: null,
  offsetM: null,
  widthM: null,
  swing: null,
  swingSide: null,
  label: null,
  verticalLinkCode: null,
  connectsSpaceAId: null,
  connectsSpaceBId: null,
});

describe('validateLayoutDelta · ubicaciones', () => {
  it('un padre y su hijo en el mismo guardado, en cualquier orden: padre primero al escribir', () => {
    const out = run({
      placements: [
        { spaceId: 'room1', geometry: rectGeo(2, 2, 5, 8.5) },
        { spaceId: 'ward', geometry: rectGeo(2, 2, 20, 8.5) },
      ],
    });
    expect(out.errors).toEqual([]);
    expect(out.placementsToWrite.map((w) => w.spaceId)).toEqual([
      'ward',
      'room1',
    ]);
    expect(out.counts).toMatchObject({ placed: 2, moved: 0, removed: 0 });
    expect(out.placementsToWrite[0].areaM2).toBe(170);
  });

  it('pared compartida (tocarse) no es solapar', () => {
    const out = run(
      { placements: [{ spaceId: 'room2', geometry: rectGeo(7, 2, 5, 8.5) }] },
      [WARD, ROOM1],
    );
    expect(out.errors).toEqual([]);
    expect(out.counts.placed).toBe(1);
  });

  it('un solape de hermanos da PLAN_SIBLING_OVERLAP con el vecino y los m²', () => {
    const out = run(
      { placements: [{ spaceId: 'room2', geometry: rectGeo(6, 2, 5, 8.5) }] },
      [WARD, ROOM1],
    );
    expect(out.errors).toHaveLength(1);
    expect(out.errors[0]).toMatchObject({
      kind: 'SPACE',
      id: 'room2',
      code: FloorPlanReason.PLAN_SIBLING_OVERLAP,
      field: 'geometry',
      conflictsWith: [
        { kind: 'SPACE', id: 'room1', code: 'ROOM1', overlapAreaM2: 8.5 },
      ],
    });
    expect(out.errors[0].nextAction?.label).toBeTruthy();
  });

  it('mover una habitación sobre su hermana se detecta desde la que se mueve', () => {
    const room2 = placed('room2', 7, 2, 5, 8.5);
    const out = run(
      { placements: [{ spaceId: 'room1', geometry: rectGeo(4, 2, 5, 8.5) }] },
      [WARD, ROOM1, room2],
    );
    expect(out.errors.map((e) => e.code)).toEqual([
      FloorPlanReason.PLAN_SIBLING_OVERLAP,
    ]);
  });

  it('intercambiar dos locales de lugar en un mismo guardado es válido', () => {
    const room2 = placed('room2', 7, 2, 4, 8.5);
    const out = run(
      {
        placements: [
          { spaceId: 'room1', geometry: rectGeo(7, 2, 4, 8.5) },
          { spaceId: 'room2', geometry: rectGeo(3, 2, 4, 8.5) },
        ],
      },
      [WARD, placed('room1', 3, 2, 4, 8.5), room2],
    );
    expect(out.errors).toEqual([]);
    expect(out.counts.moved).toBe(2);
  });

  it('un hijo fuera de su padre da PLAN_CHILD_OUTSIDE_PARENT', () => {
    const out = run(
      { placements: [{ spaceId: 'room1', geometry: rectGeo(20, 2, 5, 8.5) }] },
      [WARD],
    );
    expect(out.errors[0]).toMatchObject({
      id: 'room1',
      code: FloorPlanReason.PLAN_CHILD_OUTSIDE_PARENT,
      conflictsWith: [{ id: 'ward' }],
    });
  });

  it('un hijo que ya estaba dibujado y queda fuera al mover el padre también se informa', () => {
    const out = run(
      { placements: [{ spaceId: 'ward', geometry: rectGeo(10, 2, 20, 8.5) }] },
      [WARD, ROOM1],
    );
    expect(out.errors.map((e) => [e.id, e.code])).toEqual([
      ['room1', FloorPlanReason.PLAN_CHILD_OUTSIDE_PARENT],
    ]);
  });

  it('mover la habitación con sus camas en un mismo guardado es válido', () => {
    const bed = placed('bed1', 3, 3, 1, 2);
    const out = run(
      {
        placements: [
          { spaceId: 'ward', geometry: rectGeo(2, 2, 20, 8.5) },
          { spaceId: 'room1', geometry: rectGeo(10, 2, 5, 8.5) },
          { spaceId: 'bed1', geometry: rectGeo(11, 3, 1, 2) },
        ],
      },
      [WARD, ROOM1, bed],
    );
    expect(out.errors).toEqual([]);
    expect(out.counts.moved).toBe(2);
  });

  it('dibujar un hijo sin su padre da PLAN_PARENT_NOT_PLACED', () => {
    const out = run({
      placements: [{ spaceId: 'room1', geometry: rectGeo(2, 2, 5, 8.5) }],
    });
    expect(out.errors[0]).toMatchObject({
      id: 'room1',
      code: FloorPlanReason.PLAN_PARENT_NOT_PLACED,
      field: 'parent',
    });
  });

  it('un hijo directo del ancla no necesita padre dibujado; una raíz no cabe en un lienzo anclado', () => {
    expect(
      run({ placements: [{ spaceId: 'ward', geometry: rectGeo(2, 2, 20, 8.5) }] })
        .errors,
    ).toEqual([]);
    expect(
      run({ placements: [{ spaceId: 'level', geometry: rectGeo(0, 0, 60, 20) }] })
        .errors[0].code,
    ).toBe(FloorPlanReason.PLAN_PARENT_NOT_PLACED);
  });

  it('en el campus (sin ancla) sólo entran raíces y lo que cuelga de lo dibujado', () => {
    const campus: PlanCanvas = { ...canvas, anchorSpaceId: null };
    expect(
      run(
        { placements: [{ spaceId: 'level', geometry: rectGeo(0, 0, 60, 20) }] },
        [],
        [],
        campus,
      ).errors,
    ).toEqual([]);
    expect(
      run(
        { placements: [{ spaceId: 'ward', geometry: rectGeo(2, 2, 20, 8.5) }] },
        [],
        [],
        campus,
      ).errors[0].code,
    ).toBe(FloorPlanReason.PLAN_PARENT_NOT_PLACED);
  });

  it('una figura fuera del lienzo da PLAN_OUT_OF_BOUNDS; con la tolerancia de contacto cabe', () => {
    expect(
      run({ placements: [{ spaceId: 'ward', geometry: rectGeo(60, 2, 10, 8) }] })
        .errors[0].code,
    ).toBe(FloorPlanReason.PLAN_OUT_OF_BOUNDS);
    expect(
      run({ placements: [{ spaceId: 'ward', geometry: rectGeo(0, 0, 64, 26) }] })
        .errors,
    ).toEqual([]);
  });

  it('geometría inválida: rectángulo chico, polígono con corbata, tipo desconocido', () => {
    const out = run({
      placements: [
        { spaceId: 'ward', geometry: rectGeo(2, 2, 0.01, 5) },
        {
          spaceId: 'room1',
          geometry: {
            kind: 'POLYGON',
            vertices: [
              [0, 0],
              [4, 4],
              [4, 0],
              [0, 5],
            ],
          },
        },
        { spaceId: 'room2', geometry: { kind: 'CIRCLE' } },
      ],
    });
    expect(out.errors.map((e) => e.code)).toEqual([
      FloorPlanReason.PLAN_GEOMETRY_INVALID,
      FloorPlanReason.PLAN_GEOMETRY_INVALID,
      FloorPlanReason.PLAN_GEOMETRY_INVALID,
    ]);
    expect(out.placementsToWrite).toEqual([]);
  });

  it('acepta un polígono en L y lo escribe con sus derivadas', () => {
    const out = run({
      placements: [
        {
          spaceId: 'ward',
          geometry: {
            kind: 'POLYGON',
            vertices: [
              [2, 2],
              [8, 2],
              [8, 5],
              [12, 5],
              [12, 9],
              [2, 9],
            ],
          },
        },
      ],
    });
    expect(out.errors).toEqual([]);
    expect(out.placementsToWrite[0]).toMatchObject({
      shapeKind: 'POLYGON',
      areaM2: 58,
      centerXM: null,
    });
  });

  it('un espacio de otra sede o clausurado no se dibuja', () => {
    const out = run({
      placements: [
        { spaceId: 'other', geometry: rectGeo(2, 2, 3, 3) },
        { spaceId: 'ghost', geometry: rectGeo(2, 2, 3, 3) },
        { spaceId: 'inexistente', geometry: rectGeo(2, 2, 3, 3) },
      ],
    });
    expect(out.errors.map((e) => e.code)).toEqual([
      FloorPlanReason.PLAN_SPACE_NOT_PLACEABLE,
      FloorPlanReason.PLAN_SPACE_NOT_PLACEABLE,
      FloorPlanReason.PLAN_SPACE_NOT_PLACEABLE,
    ]);
  });

  it('un clausurado que ya estaba dibujado se puede mover', () => {
    const ghost = placed('ghost', 14, 2, 3, 3);
    const out = run(
      { placements: [{ spaceId: 'ghost', geometry: rectGeo(15, 2, 3, 3) }] },
      [WARD, ghost],
    );
    expect(out.errors).toEqual([]);
  });

  it('reintentar el mismo guardado no cambia nada (idempotente)', () => {
    const out = run(
      { placements: [{ spaceId: 'ward', geometry: rectGeo(2, 2, 20, 8.5) }] },
      [WARD],
    );
    expect(out.errors).toEqual([]);
    expect(out.placementsToWrite).toEqual([]);
    expect(out.counts).toMatchObject({ placed: 0, moved: 0 });
  });

  it('expectedRowVersion que no coincide es un conflicto de versión, no un error de figura', () => {
    const out = run(
      {
        placements: [
          { spaceId: 'ward', geometry: rectGeo(4, 2, 20, 8.5), expectedRowVersion: 1 },
        ],
      },
      [placed('ward', 2, 2, 20, 8.5, 3)],
    );
    expect(out.rowVersionConflicts).toEqual([
      { kind: 'SPACE', id: 'ward', currentRowVersion: 3, expectedRowVersion: 1 },
    ]);
    expect(out.placementsToWrite).toEqual([]);
  });

  it('el mismo espacio dos veces en un guardado es un error', () => {
    const out = run({
      placements: [
        { spaceId: 'ward', geometry: rectGeo(2, 2, 20, 8.5) },
        { spaceId: 'ward', geometry: rectGeo(2, 2, 10, 8.5) },
      ],
    });
    expect(out.errors[0].code).toBe(FloorPlanReason.PLAN_ELEMENT_INVALID);
  });
});

describe('validateLayoutDelta · quitar', () => {
  const bed = placed('bed1', 3, 3, 1, 2);

  it('quitar un padre con hijos dibujados da PLAN_HAS_PLACED_CHILDREN y ofrece cascade', () => {
    const out = run({ removeSpaceIds: ['room1'] }, [WARD, ROOM1, bed]);
    expect(out.errors[0]).toMatchObject({
      id: 'room1',
      code: FloorPlanReason.PLAN_HAS_PLACED_CHILDREN,
      conflictsWith: [{ id: 'bed1' }],
    });
  });

  it('con cascade quita el subárbol dibujado, hijos primero', () => {
    const out = run({ removeSpaceIds: ['room1'], cascade: true }, [
      WARD,
      ROOM1,
      bed,
    ]);
    expect(out.errors).toEqual([]);
    expect(out.placementsToRemove.map((p) => p.spaceId)).toEqual([
      'bed1',
      'room1',
    ]);
    expect(out.counts.removed).toBe(2);
  });

  it('quitar padre e hijos juntos no necesita cascade', () => {
    const out = run({ removeSpaceIds: ['room1', 'bed1'] }, [WARD, ROOM1, bed]);
    expect(out.errors).toEqual([]);
    expect(out.placementsToRemove.map((p) => p.spaceId)).toEqual([
      'bed1',
      'room1',
    ]);
  });

  it('quitar lo que no está dibujado se ignora', () => {
    const out = run({ removeSpaceIds: ['room2'] }, [WARD]);
    expect(out.counts.removed).toBe(0);
  });

  it('quitar y guardar el mismo espacio a la vez es un error', () => {
    const out = run(
      {
        removeSpaceIds: ['ward'],
        placements: [{ spaceId: 'ward', geometry: rectGeo(2, 2, 20, 8.5) }],
      },
      [WARD],
    );
    expect(out.errors.some((e) => e.id === 'ward')).toBe(true);
  });

  it('quitar el padre de un hijo que se dibuja en el mismo guardado da PLAN_PARENT_NOT_PLACED', () => {
    const out = run(
      {
        removeSpaceIds: ['ward'],
        cascade: true,
        placements: [{ spaceId: 'room2', geometry: rectGeo(7, 2, 5, 8.5) }],
      },
      [WARD],
    );
    expect(out.errors.map((e) => e.code)).toContain(
      FloorPlanReason.PLAN_PARENT_NOT_PLACED,
    );
  });
});

describe('validateLayoutDelta · elementos', () => {
  const base = { id: 'w1', kind: 'WALL' };

  it('un muro válido', () => {
    const out = run({
      elements: [
        {
          ...base,
          vertices: [
            [2, 2],
            [22, 2],
          ],
          thicknessM: 0.2,
        },
      ],
    });
    expect(out.errors).toEqual([]);
    expect(out.elementsToWrite[0]).toMatchObject({ kind: 'WALL', thicknessM: 0.2 });
  });

  it('una puerta en un muro del mismo guardado: el muro se escribe primero', () => {
    const out = run({
      elements: [
        {
          id: 'd1',
          kind: 'DOOR',
          hostElementId: 'w1',
          offsetM: 1,
          widthM: 0.9,
          swing: 'LEFT',
          swingSide: 'A',
        },
        {
          ...base,
          vertices: [
            [2, 2],
            [22, 2],
          ],
          thicknessM: 0.2,
        },
      ],
    });
    expect(out.errors).toEqual([]);
    expect(out.elementsToWrite.map((e) => e.id)).toEqual(['w1', 'd1']);
  });

  it('una puerta sin muro, o sobre algo que no es muro, da PLAN_HOST_NOT_WALL', () => {
    const out = run({
      elements: [
        { id: 'd1', kind: 'DOOR', hostElementId: 'no-existe', offsetM: 0, widthM: 1 },
        {
          id: 'c1',
          kind: 'COLUMN',
          vertices: [
            [1, 1],
            [2, 1],
            [2, 2],
            [1, 2],
          ],
        },
        { id: 'd2', kind: 'DOOR', hostElementId: 'c1', offsetM: 0, widthM: 1 },
        { id: 'd3', kind: 'DOOR', offsetM: 0, widthM: 1 },
      ],
    });
    expect(out.errors.map((e) => [e.id, e.code])).toEqual([
      ['d3', FloorPlanReason.PLAN_HOST_NOT_WALL],
      ['d1', FloorPlanReason.PLAN_HOST_NOT_WALL],
      ['d2', FloorPlanReason.PLAN_HOST_NOT_WALL],
    ]);
  });

  it('una abertura que excede el largo del muro da PLAN_OPENING_OUTSIDE_WALL', () => {
    const out = run(
      {
        elements: [
          { id: 'd1', kind: 'DOOR', hostElementId: 'w1', offsetM: 9.5, widthM: 1 },
        ],
      },
      [],
      [wall('w1')],
    );
    expect(out.errors[0]).toMatchObject({
      id: 'd1',
      code: FloorPlanReason.PLAN_OPENING_OUTSIDE_WALL,
      field: 'size',
    });
  });

  it('acortar un muro con aberturas colgando se rechaza', () => {
    const door: ElementState = {
      ...wall('d1'),
      kind: 'DOOR',
      vertices: null,
      thicknessM: null,
      hostElementId: 'w1',
      offsetM: 8,
      widthM: 1,
    };
    const out = run(
      {
        elements: [
          {
            id: 'w1',
            kind: 'WALL',
            vertices: [
              [0, 0],
              [5, 0],
            ],
            thicknessM: 0.2,
          },
        ],
      },
      [],
      [wall('w1'), door],
    );
    expect(out.errors.map((e) => [e.id, e.code])).toEqual([
      ['d1', FloorPlanReason.PLAN_OPENING_OUTSIDE_WALL],
    ]);
  });

  it('quitar un muro arrastra sus aberturas; aberturas primero', () => {
    const door: ElementState = {
      ...wall('d1'),
      kind: 'DOOR',
      vertices: null,
      thicknessM: null,
      hostElementId: 'w1',
      offsetM: 1,
      widthM: 1,
    };
    const out = run({ removeElementIds: ['w1'] }, [], [wall('w1'), door]);
    expect(out.errors).toEqual([]);
    expect(out.elementsToRemove.map((e) => e.id)).toEqual(['d1', 'w1']);
    expect(out.counts.elementsRemoved).toBe(2);
  });

  it('campos que no corresponden al tipo se rechazan', () => {
    const out = run({
      elements: [
        {
          ...base,
          vertices: [
            [2, 2],
            [22, 2],
          ],
          thicknessM: 0.2,
          swing: 'LEFT',
        },
      ],
    });
    expect(out.errors[0].code).toBe(FloorPlanReason.PLAN_ELEMENT_INVALID);
  });

  it('espesor, ancho y enumeraciones fuera de rango', () => {
    const out = run({
      elements: [
        { ...base, vertices: [[0, 0], [5, 0]], thicknessM: 5 },
        { id: 'd1', kind: 'DOOR', hostElementId: 'w2', offsetM: 0, widthM: 0.1 },
        { id: 'd2', kind: 'DOOR', hostElementId: 'w2', offsetM: 0, widthM: 1, swing: 'X' },
      ],
    });
    expect(out.errors).toHaveLength(3);
    expect(out.errors.every((e) => e.kind === 'ELEMENT')).toBe(true);
  });

  it('anotación: un punto y rótulo; escalera con código vertical; polígono simple', () => {
    const out = run({
      elements: [
        { id: 'a1', kind: 'ANNOTATION', vertices: [[5, 5]], label: 'N' },
        {
          id: 's1',
          kind: 'STAIRS',
          vertices: [
            [1, 1],
            [3, 1],
            [3, 4],
            [1, 4],
          ],
          verticalLinkCode: 'ESC-A',
        },
      ],
    });
    expect(out.errors).toEqual([]);
    expect(out.elementsToWrite.find((e) => e.id === 's1')?.verticalLinkCode).toBe(
      'ESC-A',
    );
    const bad = run({
      elements: [{ id: 'a2', kind: 'ANNOTATION', vertices: [[5, 5]] }],
    });
    expect(bad.errors[0].code).toBe(FloorPlanReason.PLAN_ELEMENT_INVALID);
  });

  it('un elemento fuera del lienzo da PLAN_OUT_OF_BOUNDS', () => {
    const out = run({
      elements: [
        { ...base, vertices: [[0, 0], [200, 0]], thicknessM: 0.2 },
      ],
    });
    expect(out.errors[0].code).toBe(FloorPlanReason.PLAN_OUT_OF_BOUNDS);
  });

  it('un tipo desconocido y un orden de pintado fuera de rango', () => {
    const out = run({
      elements: [
        { id: 'x', kind: 'TELEPORTER' },
        { ...base, vertices: [[0, 0], [5, 0]], thicknessM: 0.2, zOrder: 5000 },
      ],
    });
    expect(out.errors).toHaveLength(2);
  });

  it('conflicto de versión por elemento', () => {
    const out = run(
      {
        elements: [
          {
            ...base,
            vertices: [[0, 0], [5, 0]],
            thicknessM: 0.2,
            expectedRowVersion: 9,
          },
        ],
      },
      [],
      [wall('w1')],
    );
    expect(out.rowVersionConflicts).toEqual([
      { kind: 'ELEMENT', id: 'w1', currentRowVersion: 1, expectedRowVersion: 9 },
    ]);
  });
});

describe('validateLayoutDelta · topes', () => {
  it('limita la cantidad de errores informados y cuenta los omitidos', () => {
    const many = Array.from({ length: 250 }, (_, i) => ({
      id: `e${i}`,
      kind: 'TELEPORTER',
    }));
    const out = run({ elements: many });
    expect(out.errors).toHaveLength(200);
    expect(out.omittedErrors).toBe(50);
  });
});
