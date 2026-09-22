import { createHash } from 'node:crypto';
import { canonicalJson } from './annotation.policy';
import type {
  ChangeKind,
  ObjectKind,
  ObservationStatus,
} from './catalog.model';

/**
 * Reconciliación entre lo que la base muestra hoy y lo que el catálogo ya
 * sabía. Pura: recibe dos fotos y devuelve un plan; aplicarlo es trabajo del
 * servicio.
 *
 * Invariantes:
 * - Dos escaneos idénticos producen un plan sin eventos.
 * - Nada se borra. Lo que deja de verse pasa a NOT_OBSERVED, y sólo si el
 *   escaneo fue completo: un escaneo parcial no puede inferir desapariciones.
 * - Las estadísticas (filas estimadas, bytes) se refrescan sin generar eventos:
 *   cambian solas y no son un cambio de estructura.
 * - La identidad es (schema, nombre). Un renombre se ve como una baja y un
 *   alta; reasignar el historial es una decisión humana, no de este código.
 */

export interface ForeignKeyFact {
  constraintName: string;
  sourceColumns: string[];
  targetSchema: string;
  targetTable: string;
  targetColumns: string[];
}

export interface IntrospectedColumn {
  name: string;
  ordinal: number;
  nativeType: string;
  isNullable: boolean;
  defaultExpression: string | null;
  isIdentity: boolean;
  isGenerated: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  foreignKey: ForeignKeyFact | null;
  comment: string | null;
}

export interface IntrospectedObject {
  schemaName: string;
  objectName: string;
  kind: ObjectKind;
  comment: string | null;
  /** `pg_class.reltuples`; null si la tabla nunca se analizó. Estimación, no conteo. */
  estimatedRows: string | null;
  totalBytes: string | null;
  columns: IntrospectedColumn[];
}

/** Hechos técnicos de un objeto que cuentan como estructura (sin estadísticas). */
export function objectFacts(object: IntrospectedObject) {
  return {
    kind: object.kind,
    comment: object.comment,
    columnCount: object.columns.length,
    primaryKey: object.columns
      .filter((column) => column.isPrimaryKey)
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((column) => column.name),
  };
}

export function columnFacts(column: IntrospectedColumn) {
  return {
    ordinal: column.ordinal,
    nativeType: column.nativeType,
    isNullable: column.isNullable,
    defaultExpression: column.defaultExpression,
    isIdentity: column.isIdentity,
    isGenerated: column.isGenerated,
    isPrimaryKey: column.isPrimaryKey,
    isUnique: column.isUnique,
    foreignKey: column.foreignKey,
    comment: column.comment,
  };
}

export type ObjectFacts = ReturnType<typeof objectFacts>;
export type ColumnFacts = ReturnType<typeof columnFacts>;

const sha256 = (value: unknown) =>
  createHash('sha256').update(canonicalJson(value)).digest('hex');

/** El hash del objeto incluye sus columnas: cambiar una columna cambia la tabla. */
export function objectTechnicalHash(object: IntrospectedObject): string {
  return sha256({
    ...objectFacts(object),
    columns: [...object.columns]
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((column) => ({ name: column.name, ...columnFacts(column) })),
  });
}

export function columnTechnicalHash(column: IntrospectedColumn): string {
  return sha256(columnFacts(column));
}

/** Huella de todo el alcance observado: igual huella, misma estructura. */
export function snapshotHash(objects: readonly IntrospectedObject[]): string {
  return sha256(
    objects
      .map(
        (object) =>
          `${object.schemaName}.${object.objectName}:${objectTechnicalHash(object)}`,
      )
      .sort(),
  );
}

export const objectKey = (schemaName: string, objectName: string) =>
  `${schemaName}.${objectName}`;

export interface KnownColumn {
  id: string;
  name: string;
  observationStatus: ObservationStatus;
  technicalHash: string;
  facts: ColumnFacts;
}

export interface KnownObject {
  id: string;
  schemaName: string;
  objectName: string;
  observationStatus: ObservationStatus;
  technicalHash: string;
  facts: ObjectFacts;
  columns: KnownColumn[];
}

export interface PlannedEvent {
  kind: ChangeKind;
  schemaName: string;
  objectName: string;
  columnName: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export interface ColumnPlan {
  create: IntrospectedColumn[];
  /** Columnas vistas: se refrescan hechos y marca de última observación. */
  update: Array<{ id: string; next: IntrospectedColumn; changed: boolean }>;
  notObserved: string[];
}

export interface ReconciliationPlan {
  create: IntrospectedObject[];
  update: Array<{
    id: string;
    next: IntrospectedObject;
    changed: boolean;
    columns: ColumnPlan;
  }>;
  notObserved: Array<{ id: string; columnIds: string[] }>;
  events: PlannedEvent[];
  counters: ReconciliationCounters;
}

export interface ReconciliationCounters {
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

/** Sólo las claves que difieren, para que el evento diga qué cambió. */
function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const b: Record<string, unknown> = {};
  const a: Record<string, unknown> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (canonicalJson(before[key]) !== canonicalJson(after[key])) {
      b[key] = before[key] ?? null;
      a[key] = after[key] ?? null;
    }
  }
  return { before: b, after: a };
}

/**
 * Construye el plan.
 *
 * @param observed - Objetos que devolvió la introspección.
 * @param known - Lo que el catálogo conocía de la misma fuente.
 * @param complete - Si el escaneo cubrió todo el alcance. Sólo un escaneo
 *   completo puede marcar objetos como no observados.
 */
export function planReconciliation(
  observed: readonly IntrospectedObject[],
  known: readonly KnownObject[],
  complete: boolean,
): ReconciliationPlan {
  const knownByKey = new Map(
    known.map((object) => [
      objectKey(object.schemaName, object.objectName),
      object,
    ]),
  );
  const seen = new Set<string>();
  const plan: ReconciliationPlan = {
    create: [],
    update: [],
    notObserved: [],
    events: [],
    counters: {
      objectsObserved: observed.length,
      columnsObserved: observed.reduce((sum, o) => sum + o.columns.length, 0),
      objectsAdded: 0,
      objectsChanged: 0,
      objectsNotObserved: 0,
      objectsReappeared: 0,
      columnsAdded: 0,
      columnsChanged: 0,
      columnsNotObserved: 0,
    },
  };

  for (const object of observed) {
    const key = objectKey(object.schemaName, object.objectName);
    seen.add(key);
    const previous = knownByKey.get(key);
    const ref = {
      schemaName: object.schemaName,
      objectName: object.objectName,
    };

    if (!previous) {
      plan.create.push(object);
      plan.counters.objectsAdded += 1;
      // Las columnas de un objeto nuevo no generan un evento cada una: el alta
      // del objeto ya las implica, y 20 000 eventos en el primer escaneo no
      // informan de nada.
      plan.events.push({
        kind: 'ADDED',
        ...ref,
        columnName: null,
        before: null,
        after: objectFacts(object),
      });
      continue;
    }

    const reappeared = previous.observationStatus === 'NOT_OBSERVED';
    const changed = previous.technicalHash !== objectTechnicalHash(object);
    if (reappeared) {
      plan.counters.objectsReappeared += 1;
      plan.events.push({
        kind: 'REAPPEARED',
        ...ref,
        columnName: null,
        before: { observationStatus: previous.observationStatus },
        after: { observationStatus: 'OBSERVED' },
      });
    }
    const facts = objectFacts(object);
    const factsDiff = diff(previous.facts, facts);
    if (Object.keys(factsDiff.after).length > 0) {
      plan.counters.objectsChanged += 1;
      plan.events.push({
        kind: 'CHANGED',
        ...ref,
        columnName: null,
        ...factsDiff,
      });
    }

    // Una columna que desaparece de una tabla que sí se leyó entera es un hecho,
    // no una inferencia: por eso planColumns no depende de `complete`.
    const columns = planColumns(object, previous, plan, reappeared);
    plan.update.push({ id: previous.id, next: object, changed, columns });
  }

  if (complete) {
    for (const previous of known) {
      const key = objectKey(previous.schemaName, previous.objectName);
      if (seen.has(key) || previous.observationStatus !== 'OBSERVED') continue;
      plan.counters.objectsNotObserved += 1;
      plan.notObserved.push({
        id: previous.id,
        columnIds: previous.columns
          .filter((column) => column.observationStatus === 'OBSERVED')
          .map((column) => column.id),
      });
      plan.events.push({
        kind: 'NOT_OBSERVED',
        schemaName: previous.schemaName,
        objectName: previous.objectName,
        columnName: null,
        before: { observationStatus: 'OBSERVED' },
        after: { observationStatus: 'NOT_OBSERVED' },
      });
    }
  }
  return plan;
}

function planColumns(
  object: IntrospectedObject,
  previous: KnownObject,
  plan: ReconciliationPlan,
  parentReappeared: boolean,
): ColumnPlan {
  const byName = new Map(
    previous.columns.map((column) => [column.name, column]),
  );
  const seen = new Set<string>();
  const result: ColumnPlan = { create: [], update: [], notObserved: [] };
  const ref = { schemaName: object.schemaName, objectName: object.objectName };

  for (const column of object.columns) {
    seen.add(column.name);
    const known = byName.get(column.name);
    if (!known) {
      result.create.push(column);
      plan.counters.columnsAdded += 1;
      plan.events.push({
        kind: 'ADDED',
        ...ref,
        columnName: column.name,
        before: null,
        after: columnFacts(column),
      });
      continue;
    }
    const changed = known.technicalHash !== columnTechnicalHash(column);
    // Si reaparece la tabla entera, sus columnas vuelven con ella: el evento
    // del objeto ya lo dice, igual que el alta de un objeto implica sus columnas.
    if (known.observationStatus === 'NOT_OBSERVED' && !parentReappeared) {
      plan.events.push({
        kind: 'REAPPEARED',
        ...ref,
        columnName: column.name,
        before: { observationStatus: known.observationStatus },
        after: { observationStatus: 'OBSERVED' },
      });
    }
    if (changed) {
      plan.counters.columnsChanged += 1;
      plan.events.push({
        kind: 'CHANGED',
        ...ref,
        columnName: column.name,
        ...diff(known.facts, columnFacts(column)),
      });
    }
    result.update.push({ id: known.id, next: column, changed });
  }

  for (const known of previous.columns) {
    if (seen.has(known.name) || known.observationStatus !== 'OBSERVED')
      continue;
    result.notObserved.push(known.id);
    plan.counters.columnsNotObserved += 1;
    plan.events.push({
      kind: 'NOT_OBSERVED',
      ...ref,
      columnName: known.name,
      before: { observationStatus: 'OBSERVED' },
      after: { observationStatus: 'NOT_OBSERVED' },
    });
  }
  return result;
}
