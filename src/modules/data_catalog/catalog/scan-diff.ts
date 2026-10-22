import { createHash } from 'node:crypto';
import type { ObjectKind } from './catalog.constants';

export interface ForeignKeyInfo {
  constraintName: string;
  sourceColumns: string[];
  targetSchema: string;
  targetTable: string;
  targetColumns: string[];
}

export interface ObservedColumn {
  name: string;
  ordinal: number;
  nativeType: string;
  isNullable: boolean;
  defaultExpression: string | null;
  isIdentity: boolean;
  isGenerated: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  foreignKey: ForeignKeyInfo | null;
  comment: string | null;
}

export interface ObservedObject {
  schemaName: string;
  objectName: string;
  kind: ObjectKind;
  comment: string | null;
  /** Estimaciones del motor: `bigint` como texto, `null` si el motor no las tiene. */
  estimatedRows: string | null;
  totalBytes: string | null;
  primaryKey: string[];
  columns: ObservedColumn[];
}

/** Lo que el catálogo ya tiene guardado de un objeto. */
export interface KnownObject {
  id: string;
  schemaName: string;
  objectName: string;
  observationStatus: string;
  technicalHash: string;
  columns: Map<
    string,
    { id: string; observationStatus: string; technicalHash: string }
  >;
}

export type ChangeKind = 'ADDED' | 'CHANGED' | 'NOT_OBSERVED' | 'REAPPEARED';

export interface ChangeEvent {
  /** `null` mientras el objeto no tiene id: se completa al persistir. */
  objectKey: string;
  columnName: string | null;
  kind: ChangeKind;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface ScanCounters {
  objectsObserved: number;
  columnsObserved: number;
  objectsAdded: number;
  objectsChanged: number;
  objectsNotObserved: number;
  objectsReappeared: number;
  columnsAdded: number;
  columnsChanged: number;
  columnsNotObserved: number;
}

export interface ScanPlan {
  /** Objetos observados con su estado respecto de lo conocido. */
  objects: {
    observed: ObservedObject;
    hash: string;
    known: KnownObject | null;
    change: 'ADDED' | 'CHANGED' | 'UNCHANGED';
    reappeared: boolean;
    columns: {
      observed: ObservedColumn;
      hash: string;
      known: {
        id: string;
        observationStatus: string;
        technicalHash: string;
      } | null;
      change: 'ADDED' | 'CHANGED' | 'UNCHANGED';
      reappeared: boolean;
    }[];
    /** Columnas que estaban observadas y ya no están. */
    columnsMissing: { name: string; id: string }[];
  }[];
  /** Objetos conocidos y observados antes que no aparecieron esta vez. */
  vanished: KnownObject[];
  events: ChangeEvent[];
  counters: ScanCounters;
  snapshotHash: string;
}

const sha = (valor: unknown): string =>
  createHash('sha256').update(JSON.stringify(valor)).digest('hex');

/** Hash de los hechos técnicos de una columna. Lo volátil (nada, hoy) queda fuera. */
export function columnHash(c: ObservedColumn): string {
  return sha([
    c.name,
    c.ordinal,
    c.nativeType,
    c.isNullable,
    c.defaultExpression,
    c.isIdentity,
    c.isGenerated,
    c.isPrimaryKey,
    c.isUnique,
    c.foreignKey,
    c.comment,
  ]);
}

/**
 * Hash de los hechos técnicos de un objeto. Las estadísticas (filas y bytes) **no** entran: cambian
 * con cada escritura y harían que todo objeto figure como «cambiado» en cada escaneo.
 */
export function objectHash(o: ObservedObject): string {
  return sha([o.kind, o.comment, o.primaryKey, o.columns.map(columnHash)]);
}

const resumenColumna = (c: ObservedColumn): Record<string, unknown> => ({
  nativeType: c.nativeType,
  isNullable: c.isNullable,
  defaultExpression: c.defaultExpression,
  isPrimaryKey: c.isPrimaryKey,
  isUnique: c.isUnique,
  foreignKey: c.foreignKey?.constraintName ?? null,
});

/**
 * Compara lo observado con lo conocido y dice qué hay que escribir, qué eventos registrar y qué
 * contadores informar. Es pura: no toca la base.
 *
 * Los eventos de columna se emiten sólo para objetos que **ya existían**: de un objeto nuevo basta
 * un `ADDED` con su cantidad de columnas; sumarle un evento por columna haría que el primer
 * escaneo de una base grande escriba decenas de miles de filas que no informan nada.
 */
export function planScan(
  known: KnownObject[],
  observed: ObservedObject[],
): ScanPlan {
  const conocidos = new Map(
    known.map((k) => [`${k.schemaName}.${k.objectName}`, k]),
  );
  const vistos = new Set<string>();
  const events: ChangeEvent[] = [];
  const counters: ScanCounters = {
    objectsObserved: observed.length,
    columnsObserved: observed.reduce((n, o) => n + o.columns.length, 0),
    objectsAdded: 0,
    objectsChanged: 0,
    objectsNotObserved: 0,
    objectsReappeared: 0,
    columnsAdded: 0,
    columnsChanged: 0,
    columnsNotObserved: 0,
  };
  const objects: ScanPlan['objects'] = [];

  for (const o of [...observed].sort((a, b) =>
    `${a.schemaName}.${a.objectName}`.localeCompare(
      `${b.schemaName}.${b.objectName}`,
      'en',
    ),
  )) {
    const key = `${o.schemaName}.${o.objectName}`;
    vistos.add(key);
    const hash = objectHash(o);
    const previo = conocidos.get(key) ?? null;
    const reappeared =
      previo !== null && previo.observationStatus !== 'OBSERVED';
    const change: 'ADDED' | 'CHANGED' | 'UNCHANGED' =
      previo === null
        ? 'ADDED'
        : previo.technicalHash !== hash
          ? 'CHANGED'
          : 'UNCHANGED';
    if (change === 'ADDED') {
      counters.objectsAdded += 1;
      counters.columnsAdded += o.columns.length;
      events.push({
        objectKey: key,
        columnName: null,
        kind: 'ADDED',
        before: null,
        after: { kind: o.kind, columnCount: o.columns.length },
      });
    } else {
      if (reappeared) {
        counters.objectsReappeared += 1;
        events.push({
          objectKey: key,
          columnName: null,
          kind: 'REAPPEARED',
          before: { observationStatus: previo.observationStatus },
          after: { observationStatus: 'OBSERVED' },
        });
      }
      if (change === 'CHANGED') {
        counters.objectsChanged += 1;
        events.push({
          objectKey: key,
          columnName: null,
          kind: 'CHANGED',
          before: { technicalHash: previo!.technicalHash },
          after: {
            technicalHash: hash,
            kind: o.kind,
            columnCount: o.columns.length,
          },
        });
      }
    }

    const columns: ScanPlan['objects'][number]['columns'] = [];
    const nombres = new Set<string>();
    for (const c of [...o.columns].sort((a, b) => a.ordinal - b.ordinal)) {
      nombres.add(c.name);
      const h = columnHash(c);
      const k = previo?.columns.get(c.name) ?? null;
      const cambio: 'ADDED' | 'CHANGED' | 'UNCHANGED' =
        k === null ? 'ADDED' : k.technicalHash !== h ? 'CHANGED' : 'UNCHANGED';
      const reaparece = k !== null && k.observationStatus !== 'OBSERVED';
      columns.push({
        observed: c,
        hash: h,
        known: k,
        change: cambio,
        reappeared: reaparece,
      });
      if (previo === null) continue; // objeto nuevo: sin eventos por columna
      if (cambio === 'ADDED') {
        counters.columnsAdded += 1;
        events.push({
          objectKey: key,
          columnName: c.name,
          kind: 'ADDED',
          before: null,
          after: resumenColumna(c),
        });
      } else {
        if (reaparece)
          events.push({
            objectKey: key,
            columnName: c.name,
            kind: 'REAPPEARED',
            before: { observationStatus: k.observationStatus },
            after: { observationStatus: 'OBSERVED' },
          });
        if (cambio === 'CHANGED') {
          counters.columnsChanged += 1;
          events.push({
            objectKey: key,
            columnName: c.name,
            kind: 'CHANGED',
            before: { technicalHash: k!.technicalHash },
            after: resumenColumna(c),
          });
        }
      }
    }
    const columnsMissing: { name: string; id: string }[] = [];
    if (previo)
      for (const [nombre, k] of previo.columns)
        if (!nombres.has(nombre) && k.observationStatus === 'OBSERVED') {
          columnsMissing.push({ name: nombre, id: k.id });
          counters.columnsNotObserved += 1;
          events.push({
            objectKey: key,
            columnName: nombre,
            kind: 'NOT_OBSERVED',
            before: { observationStatus: 'OBSERVED' },
            after: { observationStatus: 'NOT_OBSERVED' },
          });
        }
    objects.push({
      observed: o,
      hash,
      known: previo,
      change,
      reappeared,
      columns,
      columnsMissing,
    });
  }

  const vanished = known.filter(
    (k) =>
      !vistos.has(`${k.schemaName}.${k.objectName}`) &&
      k.observationStatus === 'OBSERVED',
  );
  for (const k of vanished) {
    counters.objectsNotObserved += 1;
    events.push({
      objectKey: `${k.schemaName}.${k.objectName}`,
      columnName: null,
      kind: 'NOT_OBSERVED',
      before: { observationStatus: 'OBSERVED' },
      after: { observationStatus: 'NOT_OBSERVED' },
    });
  }

  const snapshotHash = sha(
    objects.map((p) => [
      `${p.observed.schemaName}.${p.observed.objectName}`,
      p.hash,
    ]),
  );
  return { objects, vanished, events, counters, snapshotHash };
}
