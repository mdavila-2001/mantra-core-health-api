import {
  columnHash,
  objectHash,
  planScan,
  type KnownObject,
  type ObservedColumn,
  type ObservedObject,
} from './scan-diff';

const col = (
  name: string,
  ordinal: number,
  extra: Partial<ObservedColumn> = {},
): ObservedColumn => ({
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
  ...extra,
});

const obj = (
  schemaName: string,
  objectName: string,
  columns: ObservedColumn[],
  extra: Partial<ObservedObject> = {},
): ObservedObject => ({
  schemaName,
  objectName,
  kind: 'TABLE',
  comment: null,
  estimatedRows: '10',
  totalBytes: '8192',
  primaryKey: ['id'],
  columns,
  ...extra,
});

const conocido = (
  o: ObservedObject,
  estado = 'OBSERVED',
  id = `id-${o.objectName}`,
): KnownObject => ({
  id,
  schemaName: o.schemaName,
  objectName: o.objectName,
  observationStatus: estado,
  technicalHash: objectHash(o),
  columns: new Map(
    o.columns.map((c) => [
      c.name,
      {
        id: `${id}-${c.name}`,
        observationStatus: 'OBSERVED',
        technicalHash: columnHash(c),
      },
    ]),
  ),
});

describe('planScan', () => {
  const personas = obj('profiles', 'persons', [
    col('id', 1),
    col('name', 2, { nativeType: 'varchar' }),
  ]);
  const citas = obj('scheduling', 'appointments', [
    col('id', 1),
    col('starts_at', 2, { nativeType: 'timestamptz' }),
  ]);

  it('el primer escaneo marca todo como agregado y no escribe un evento por columna', () => {
    const plan = planScan([], [personas, citas]);
    expect(plan.counters).toMatchObject({
      objectsObserved: 2,
      columnsObserved: 4,
      objectsAdded: 2,
      columnsAdded: 4,
      objectsChanged: 0,
    });
    expect(plan.events).toHaveLength(2);
    expect(
      plan.events.every((e) => e.kind === 'ADDED' && e.columnName === null),
    ).toBe(true);
  });

  it('un segundo escaneo idéntico no cambia nada ni genera eventos', () => {
    const plan = planScan(
      [conocido(personas), conocido(citas)],
      [personas, citas],
    );
    expect(plan.events).toEqual([]);
    expect(plan.counters).toMatchObject({
      objectsAdded: 0,
      objectsChanged: 0,
      objectsNotObserved: 0,
      objectsReappeared: 0,
      columnsAdded: 0,
      columnsChanged: 0,
      columnsNotObserved: 0,
    });
    expect(plan.objects.every((p) => p.change === 'UNCHANGED')).toBe(true);
  });

  it('las estadísticas cambian sin que el objeto figure como cambiado', () => {
    const conMasFilas = obj('profiles', 'persons', personas.columns, {
      estimatedRows: '999999',
      totalBytes: '99999999',
    });
    expect(
      planScan([conocido(personas)], [conMasFilas]).counters.objectsChanged,
    ).toBe(0);
  });

  it('detecta una columna nueva, una cambiada y una desaparecida en un objeto que ya existía', () => {
    const antes = conocido(personas);
    const despues = obj('profiles', 'persons', [
      col('id', 1),
      col('name', 2, { nativeType: 'text' }),
      col('birth_date', 3, { nativeType: 'date', isNullable: true }),
    ]);
    const plan = planScan([antes], [despues]);
    expect(plan.counters).toMatchObject({
      objectsChanged: 1,
      columnsAdded: 1,
      columnsChanged: 1,
      columnsNotObserved: 0,
    });
    expect(plan.events.map((e) => `${e.kind}:${e.columnName}`).sort()).toEqual([
      'ADDED:birth_date',
      'CHANGED:name',
      'CHANGED:null',
    ]);

    const sinName = obj('profiles', 'persons', [col('id', 1)]);
    const plan2 = planScan([antes], [sinName]);
    expect(plan2.counters.columnsNotObserved).toBe(1);
    expect(plan2.objects[0].columnsMissing).toEqual([
      { name: 'name', id: 'id-persons-name' },
    ]);
  });

  it('un objeto que ya no aparece pasa a no observado, y si vuelve, reaparece', () => {
    const plan = planScan([conocido(personas), conocido(citas)], [personas]);
    expect(plan.vanished.map((v) => v.objectName)).toEqual(['appointments']);
    expect(plan.counters.objectsNotObserved).toBe(1);
    expect(plan.events).toContainEqual(
      expect.objectContaining({
        kind: 'NOT_OBSERVED',
        objectKey: 'scheduling.appointments',
      }),
    );

    const volvio = planScan([conocido(citas, 'NOT_OBSERVED')], [citas]);
    expect(volvio.counters.objectsReappeared).toBe(1);
    expect(volvio.events.map((e) => e.kind)).toEqual(['REAPPEARED']);
    // un objeto que ya estaba no observado y sigue ausente no vuelve a contarse
    expect(
      planScan([conocido(citas, 'NOT_OBSERVED')], []).counters
        .objectsNotObserved,
    ).toBe(0);
  });

  it('la huella del snapshot no depende del orden en que llegan los objetos', () => {
    expect(planScan([], [personas, citas]).snapshotHash).toBe(
      planScan([], [citas, personas]).snapshotHash,
    );
    expect(planScan([], [personas, citas]).snapshotHash).not.toBe(
      planScan([], [personas]).snapshotHash,
    );
  });
});
