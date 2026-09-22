import { EMPTY_CONTENT } from './catalog.model';
import { objectCoverage, summarizeCoverage } from './coverage.policy';
import {
  columnFacts,
  columnTechnicalHash,
  objectFacts,
  objectTechnicalHash,
  planReconciliation,
  snapshotHash,
  type IntrospectedColumn,
  type IntrospectedObject,
  type KnownObject,
} from './reconciliation';

function column(
  name: string,
  ordinal: number,
  over: Partial<IntrospectedColumn> = {},
): IntrospectedColumn {
  return {
    name,
    ordinal,
    nativeType: 'uuid',
    isNullable: false,
    defaultExpression: null,
    isIdentity: false,
    isGenerated: false,
    isPrimaryKey: name === 'id',
    isUnique: name === 'id',
    foreignKey: null,
    comment: null,
    ...over,
  };
}

function table(
  schemaName: string,
  objectName: string,
  columns: IntrospectedColumn[],
  over: Partial<IntrospectedObject> = {},
): IntrospectedObject {
  return {
    schemaName,
    objectName,
    kind: 'TABLE',
    comment: null,
    estimatedRows: '10',
    totalBytes: '8192',
    columns,
    ...over,
  };
}

/** Lo que el catálogo "sabría" tras haber persistido `object`. */
function known(
  id: string,
  object: IntrospectedObject,
  status: KnownObject['observationStatus'] = 'OBSERVED',
): KnownObject {
  return {
    id,
    schemaName: object.schemaName,
    objectName: object.objectName,
    observationStatus: status,
    technicalHash: objectTechnicalHash(object),
    facts: objectFacts(object),
    columns: object.columns.map((c) => ({
      id: `${id}:${c.name}`,
      name: c.name,
      observationStatus: 'OBSERVED' as const,
      technicalHash: columnTechnicalHash(c),
      facts: columnFacts(c),
    })),
  };
}

describe('planReconciliation', () => {
  const orders = table('sales', 'orders', [
    column('id', 1),
    column('total', 2, { nativeType: 'numeric' }),
  ]);
  // Mismo nombre en otro schema: la identidad no es sólo el nombre.
  const ordersArchive = table('archive', 'orders', [column('id', 1)]);

  it('el primer escaneo da de alta objetos sin un evento por columna', () => {
    const plan = planReconciliation([orders, ordersArchive], [], true);
    expect(plan.create).toHaveLength(2);
    expect(
      plan.events.map((e) => [e.kind, e.schemaName, e.columnName]),
    ).toEqual([
      ['ADDED', 'sales', null],
      ['ADDED', 'archive', null],
    ]);
  });

  it('dos escaneos idénticos no producen eventos', () => {
    const plan = planReconciliation([orders], [known('o1', orders)], true);
    expect(plan.events).toEqual([]);
    expect(plan.update).toEqual([
      expect.objectContaining({ id: 'o1', changed: false }),
    ]);
  });

  it('las estadísticas no cuentan como cambio de estructura', () => {
    const grown = { ...orders, estimatedRows: '999999', totalBytes: '1048576' };
    expect(
      planReconciliation([grown], [known('o1', orders)], true).events,
    ).toEqual([]);
  });

  it('un cambio de tipo es un CHANGED de columna con antes y después', () => {
    const changed = table('sales', 'orders', [
      column('id', 1),
      column('total', 2, { nativeType: 'bigint' }),
    ]);
    const plan = planReconciliation([changed], [known('o1', orders)], true);
    expect(plan.events).toEqual([
      expect.objectContaining({
        kind: 'CHANGED',
        columnName: 'total',
        before: { nativeType: 'numeric' },
        after: { nativeType: 'bigint' },
      }),
    ]);
    expect(plan.counters.columnsChanged).toBe(1);
  });

  it('una columna nueva en una tabla existente sí genera evento', () => {
    const wider = table('sales', 'orders', [
      ...orders.columns,
      column('currency', 3, { nativeType: 'varchar' }),
    ]);
    const plan = planReconciliation([wider], [known('o1', orders)], true);
    expect(plan.events.map((e) => [e.kind, e.columnName])).toEqual([
      ['CHANGED', null],
      ['ADDED', 'currency'],
    ]);
  });

  it('un escaneo completo marca lo que falta como NOT_OBSERVED sin borrarlo', () => {
    const plan = planReconciliation(
      [orders],
      [known('o1', orders), known('a1', ordersArchive)],
      true,
    );
    expect(plan.notObserved).toEqual([{ id: 'a1', columnIds: ['a1:id'] }]);
    expect(plan.events).toEqual([
      expect.objectContaining({ kind: 'NOT_OBSERVED', schemaName: 'archive' }),
    ]);
  });

  it('un escaneo parcial no infiere desapariciones', () => {
    const plan = planReconciliation(
      [orders],
      [known('o1', orders), known('a1', ordersArchive)],
      false,
    );
    expect(plan.notObserved).toEqual([]);
    expect(plan.events).toEqual([]);
  });

  it('un objeto que vuelve a verse se registra como REAPPEARED', () => {
    const plan = planReconciliation(
      [ordersArchive],
      [known('a1', ordersArchive, 'NOT_OBSERVED')],
      true,
    );
    expect(plan.events).toEqual([
      expect.objectContaining({ kind: 'REAPPEARED' }),
    ]);
    expect(plan.counters.objectsReappeared).toBe(1);
  });

  it('las columnas de un objeto que reaparece no emiten un evento cada una', () => {
    const gone = known('a1', ordersArchive, 'NOT_OBSERVED');
    gone.columns = gone.columns.map((c) => ({
      ...c,
      observationStatus: 'NOT_OBSERVED' as const,
    }));
    const plan = planReconciliation([ordersArchive], [gone], true);
    expect(plan.events.map((e) => [e.kind, e.columnName])).toEqual([
      ['REAPPEARED', null],
    ]);
    expect(plan.update[0].columns.update).toHaveLength(1);
  });

  it('una columna que reaparece en una tabla que siguió viva sí emite evento', () => {
    const live = known('o1', orders);
    live.columns = live.columns.map((c) =>
      c.name === 'total'
        ? { ...c, observationStatus: 'NOT_OBSERVED' as const }
        : c,
    );
    const plan = planReconciliation([orders], [live], true);
    expect(plan.events.map((e) => [e.kind, e.columnName])).toEqual([
      ['REAPPEARED', 'total'],
    ]);
  });

  it('un renombre se ve como baja + alta, sin reasignar el historial', () => {
    const renamed = table('sales', 'purchase_orders', orders.columns);
    const plan = planReconciliation([renamed], [known('o1', orders)], true);
    expect(plan.create.map((o) => o.objectName)).toEqual(['purchase_orders']);
    expect(plan.notObserved.map((o) => o.id)).toEqual(['o1']);
  });

  it('la huella del snapshot no depende del orden ni de las estadísticas', () => {
    const a = snapshotHash([orders, ordersArchive]);
    const b = snapshotHash([ordersArchive, { ...orders, estimatedRows: '5' }]);
    expect(a).toBe(b);
  });
});

describe('coverage', () => {
  const complete = {
    ...EMPTY_CONTENT,
    purpose: 'p',
    existenceRationale: 'r',
    rowGrain: 'g',
    businessOwner: 'Agenda',
    sensitivity: 'PHI' as const,
  };

  it('sin escaneo terminado todo es UNKNOWN, no 0%', () => {
    const summary = summarizeCoverage([], false);
    expect(summary.dimensions.semantic).toEqual({
      status: 'UNKNOWN',
      covered: 0,
      denominator: 0,
      ratio: null,
    });
  });

  it('con escaneo y alcance vacío es NOT_APPLICABLE, no 100%', () => {
    expect(summarizeCoverage([], true).dimensions.review.status).toBe(
      'NOT_APPLICABLE',
    );
    expect(summarizeCoverage([], true).dimensions.review.ratio).toBeNull();
  });

  it('una aprobación vieja no cubre una revisión nueva', () => {
    const coverage = objectCoverage({
      observationStatus: 'OBSERVED',
      columnCount: 3,
      annotation: {
        content: complete,
        reviewStatus: 'NEEDS_REVIEW',
        currentRevisionNo: 3,
        approvedRevisionNo: 2,
      },
      registrySensitivityKnown: false,
    });
    expect(coverage.review).toBe(false);
    expect(coverage.semantic).toBe('COMPLETE');
  });

  it('distingue deuda declarada de ausencia', () => {
    const coverage = objectCoverage({
      observationStatus: 'OBSERVED',
      columnCount: 3,
      annotation: {
        content: {
          ...EMPTY_CONTENT,
          purpose: 'p',
          rowGrain: 'g',
          openQuestions: [
            { field: 'existenceRationale', question: '¿Quién la pidió?' },
          ],
        },
        reviewStatus: 'DRAFT',
        currentRevisionNo: 1,
        approvedRevisionNo: null,
      },
      registrySensitivityKnown: true,
    });
    expect(coverage.semantic).toBe('DECLARED_DEBT');
    expect(coverage.sensitivity).toBe(true);
    expect(coverage.missingFields).toEqual([
      'existenceRationale',
      'businessOwner',
    ]);
  });

  it('agrega con denominador y ratio explicables', () => {
    const covered = objectCoverage({
      observationStatus: 'OBSERVED',
      columnCount: 1,
      annotation: {
        content: complete,
        reviewStatus: 'APPROVED',
        currentRevisionNo: 1,
        approvedRevisionNo: 1,
      },
      registrySensitivityKnown: false,
    });
    const bare = objectCoverage({
      observationStatus: 'OBSERVED',
      columnCount: 1,
      annotation: null,
      registrySensitivityKnown: false,
    });
    const summary = summarizeCoverage([covered, bare, bare], true);
    expect(summary.denominator).toBe(3);
    expect(summary.dimensions.review).toEqual({
      status: 'MEASURED',
      covered: 1,
      denominator: 3,
      ratio: 0.3333,
    });
    expect(summary.dimensions.technical.covered).toBe(3);
  });
});
