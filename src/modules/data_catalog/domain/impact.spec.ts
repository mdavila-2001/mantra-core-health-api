import { impactOf, type FkEdge } from './impact';

const fk = (from: string, to: string, name = `fk_${from}_${to}`): FkEdge => ({
  fromObjectId: from,
  fromColumns: [`${to}_id`],
  toObjectId: to,
  toColumns: ['id'],
  constraintName: name,
});

// patients ← appointments ← invoices ← payments ; appointments → practitioners
const edges = [
  fk('appointments', 'patients'),
  fk('invoices', 'appointments'),
  fk('payments', 'invoices'),
  fk('appointments', 'practitioners'),
];
const ids = (result: ReturnType<typeof impactOf>) =>
  result.nodes.map((n) => `${n.objectId}@${n.depth}`).sort();

describe('impactOf', () => {
  it('downstream: quién depende de la tabla, con su distancia', () => {
    expect(ids(impactOf('patients', edges, 'downstream', 5))).toEqual([
      'appointments@1',
      'invoices@2',
      'patients@0',
      'payments@3',
    ]);
  });

  it('upstream: de qué depende la tabla', () => {
    expect(ids(impactOf('appointments', edges, 'upstream', 5))).toEqual([
      'appointments@0',
      'patients@1',
      'practitioners@1',
    ]);
  });

  it('corta por profundidad y lo declara', () => {
    const result = impactOf('patients', edges, 'downstream', 1);
    expect(ids(result)).toEqual(['appointments@1', 'patients@0']);
    expect(result).toMatchObject({
      truncated: true,
      truncatedReason: 'MAX_DEPTH',
    });
  });

  it('corta por tope de nodos y lo declara', () => {
    const result = impactOf('patients', edges, 'downstream', 5, 2);
    expect(result.nodes).toHaveLength(2);
    expect(result.truncatedReason).toBe('MAX_NODES');
  });

  it('ciclos y autorreferencias no hacen bucle', () => {
    const cyclic = [
      fk('a', 'b'),
      fk('b', 'a', 'fk_back'),
      fk('a', 'a', 'fk_self'),
    ];
    const result = impactOf('a', cyclic, 'both', 5);
    expect(ids(result)).toEqual(['a@0', 'b@1']);
    expect(result.truncated).toBe(false);
  });

  it('las aristas se etiquetan como estructurales y el alcance se declara', () => {
    const result = impactOf('patients', edges, 'downstream', 5);
    expect(
      result.edges.every((e) => e.provenance === 'STRUCTURAL_FK_OBSERVED'),
    ).toBe(true);
    expect(result.scope).toMatch(/no prueba ausencia de impacto/);
  });

  it('una tabla aislada devuelve sólo la raíz, sin truncar', () => {
    expect(impactOf('lonely', edges, 'both', 3)).toMatchObject({
      nodes: [{ objectId: 'lonely', depth: 0 }],
      edges: [],
      truncated: false,
    });
  });

  it('la profundidad pedida se acota a 5', () => {
    expect(impactOf('patients', edges, 'downstream', 50).maxDepth).toBe(5);
  });
});
