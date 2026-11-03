import { createHash, randomUUID } from 'node:crypto';
import type {
  OperacionRecord,
  ProcesoRecord,
} from '../inventory/inventory.types';

/**
 * Plan de la importación del inventario a `data_catalog.*`: compara lo que dicen los archivos de
 * `inventario/` con lo que ya hay en las cinco tablas y decide qué insertar, qué actualizar y qué
 * dejar quieto. Es una función pura —sin base ni reloj— para poder probar la idempotencia sin
 * montar nada; `InventoryImportService` lo corre y `CatalogInventoryRepository` lo escribe.
 */

/** Valores que el importador escribe en columnas sin CHECK (decisión del parche v4.2.48). */
export const OBSERVED = 'OBSERVED';
export const NOT_OBSERVED = 'NOT_OBSERVED';

/** Lo que la base ya sabe de una operación. */
export interface KnownOperation {
  id: string;
  observationStatus: string;
  technicalHash: string | null;
}

export interface KnownStep {
  ordinal: number;
  stepCode: string;
  name: string;
  /** Ids de las operaciones de la etapa, en el orden de `catalog_process_step_operations.ordinal`. */
  operationIds: string[];
}

export interface KnownProcess {
  id: string;
  kind: string;
  name: string;
  moduleCode: string | null;
  purpose: string | null;
  steps: KnownStep[];
}

export interface KnownInventory {
  operations: ReadonlyMap<string, KnownOperation>;
  /** `schema.tabla` → id en `catalog_objects`. */
  objects: ReadonlyMap<string, string>;
  processes: ReadonlyMap<string, KnownProcess>;
}

export interface OperationRow {
  id: string;
  sourceCode: string;
  operationKey: string;
  httpMethod: string;
  routeTemplate: string;
  moduleCode: string | null;
  controllerName: string | null;
  handlerName: string | null;
  sourceRef: string | null;
  isPublic: boolean;
  requiredRoles: string[];
  riskLevel: string;
  technicalHash: string;
}

export interface ImpactRow {
  operationId: string;
  objectId: string;
  accessKind: string;
  accessDetail: string | null;
  confidence: string | null;
  callPath: string[];
  sourceRef: string | null;
}

export interface ProcessRow {
  id: string;
  processCode: string;
  kind: string;
  name: string;
  moduleCode: string | null;
  purpose: string | null;
}

export interface StepRow {
  id: string;
  processId: string;
  ordinal: number;
  stepCode: string;
  name: string;
}

export interface StepOperationRow {
  id: string;
  stepId: string;
  operationId: string;
  ordinal: number;
}

export interface ImportCounters {
  operations: {
    added: number;
    changed: number;
    reappeared: number;
    unchanged: number;
    notObserved: number;
  };
  impacts: {
    written: number;
    /** La tabla no está en el catálogo estático del inventario (`catalogada: false`) ni en la base. */
    skippedNotCataloged: number;
    /** El inventario la da por catalogada pero la sonda aún no la observó: se recupera en la siguiente corrida. */
    skippedUnresolved: number;
  };
  processes: { added: number; changed: number; unchanged: number };
  steps: { written: number };
  stepOperations: { written: number; skippedUnresolved: number };
}

export interface ImportPlan {
  operationsToInsert: OperationRow[];
  operationsToUpdate: OperationRow[];
  /** Ids de operaciones que dejaron de aparecer y estaban `OBSERVED`. */
  operationsToRetire: string[];
  /** Operaciones cuyos impactos se borran antes de reinsertar (las nuevas no tienen). */
  impactsToDeleteOf: string[];
  impactsToInsert: ImpactRow[];
  processesToInsert: ProcessRow[];
  processesToUpdate: ProcessRow[];
  /** Procesos cuyas etapas se rehacen: se borran sus etapas y puentes y se reinsertan. */
  processesToRebuildSteps: string[];
  stepsToInsert: StepRow[];
  stepOperationsToInsert: StepOperationRow[];
  counters: ImportCounters;
}

const sha256 = (valor: unknown): string =>
  createHash('sha256').update(JSON.stringify(valor)).digest('hex');

const mismosIds = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * Huella de una operación: de lo que **se guarda**, no del registro entero del inventario. El
 * registro trae ejemplos, explicaciones y fechas que cambian sin que cambie nada de lo importado;
 * hashearlo entero subiría `row_version` por nada. Incluye el id del objeto resuelto de cada
 * impacto, de modo que una tabla que la sonda observa después cambia la huella y la siguiente
 * corrida recupera el impacto que antes se saltó.
 */
function huellaDeOperacion(
  o: OperacionRecord,
  objetoDe: (schema: string, tabla: string) => string | undefined,
): string {
  return sha256({
    origen: o.origen,
    metodo: o.metodo,
    ruta: o.ruta,
    modulo: o.modulo,
    codigo: o.codigo
      ? [o.codigo.controlador, o.codigo.handler, o.codigo.fuente]
      : null,
    publica: o.autenticacion.publica,
    roles: o.autenticacion.roles,
    riesgo: o.riesgo.nivel,
    tablas: o.tablas.map((t) => [
      t.schema,
      t.tabla,
      objetoDe(t.schema, t.tabla) ?? null,
      t.operacion,
      t.detalle,
      t.confianza,
      t.via,
      t.fuente,
    ]),
  });
}

export function planImport(
  operaciones: readonly OperacionRecord[],
  procesos: readonly ProcesoRecord[],
  known: KnownInventory,
  newId: () => string = randomUUID,
): ImportPlan {
  const plan: ImportPlan = {
    operationsToInsert: [],
    operationsToUpdate: [],
    operationsToRetire: [],
    impactsToDeleteOf: [],
    impactsToInsert: [],
    processesToInsert: [],
    processesToUpdate: [],
    processesToRebuildSteps: [],
    stepsToInsert: [],
    stepOperationsToInsert: [],
    counters: {
      operations: {
        added: 0,
        changed: 0,
        reappeared: 0,
        unchanged: 0,
        notObserved: 0,
      },
      impacts: { written: 0, skippedNotCataloged: 0, skippedUnresolved: 0 },
      processes: { added: 0, changed: 0, unchanged: 0 },
      steps: { written: 0 },
      stepOperations: { written: 0, skippedUnresolved: 0 },
    },
  };
  const c = plan.counters;
  const objetoDe = (schema: string, tabla: string): string | undefined =>
    known.objects.get(`${schema}.${tabla}`);

  // ---- operaciones e impactos --------------------------------------------------------------
  const idDeOperacion = new Map<string, string>();
  const vistas = new Set<string>();
  for (const o of operaciones) {
    vistas.add(o.id);
    const previa = known.operations.get(o.id);
    const id = previa?.id ?? newId();
    idDeOperacion.set(o.id, id);
    const huella = huellaDeOperacion(o, objetoDe);
    // Los saltados describen el estado actual (inventario contra catálogo) y se cuentan siempre;
    // los escritos, sólo lo que esta corrida escribe.
    const impactos: ImpactRow[] = [];
    for (const t of o.tablas) {
      const objectId = objetoDe(t.schema, t.tabla);
      if (!objectId) {
        if (t.catalogada) c.impacts.skippedUnresolved++;
        else c.impacts.skippedNotCataloged++;
        continue;
      }
      impactos.push({
        operationId: id,
        objectId,
        accessKind: t.operacion,
        accessDetail: t.detalle,
        confidence: t.confianza,
        callPath: t.via,
        sourceRef: t.fuente,
      });
    }
    if (
      previa &&
      previa.technicalHash === huella &&
      previa.observationStatus === OBSERVED
    ) {
      c.operations.unchanged++;
      continue;
    }
    const fila: OperationRow = {
      id,
      sourceCode: o.origen,
      operationKey: o.id,
      httpMethod: o.metodo,
      routeTemplate: o.ruta,
      moduleCode: o.modulo,
      controllerName: o.codigo?.controlador ?? null,
      handlerName: o.codigo?.handler ?? null,
      sourceRef: o.codigo?.fuente ?? null,
      isPublic: o.autenticacion.publica,
      requiredRoles: o.autenticacion.roles,
      riskLevel: o.riesgo.nivel,
      technicalHash: huella,
    };
    if (!previa) {
      plan.operationsToInsert.push(fila);
      c.operations.added++;
    } else {
      plan.operationsToUpdate.push(fila);
      plan.impactsToDeleteOf.push(id);
      if (previa.observationStatus === OBSERVED) c.operations.changed++;
      else c.operations.reappeared++;
    }
    plan.impactsToInsert.push(...impactos);
    c.impacts.written += impactos.length;
  }
  for (const [clave, previa] of known.operations) {
    if (vistas.has(clave) || previa.observationStatus !== OBSERVED) continue;
    plan.operationsToRetire.push(previa.id);
    c.operations.notObserved++;
  }

  // ---- procesos, etapas y su puente con las operaciones -----------------------------------------
  for (const p of procesos) {
    const previo = known.processes.get(p.codigo);
    const fila: ProcessRow = {
      id: previo?.id ?? newId(),
      processCode: p.codigo,
      kind: p.tipo,
      name: p.nombre,
      moduleCode: p.modulo,
      purpose: p.paraQueSirve?.texto ?? null,
    };
    if (!previo) {
      plan.processesToInsert.push(fila);
      c.processes.added++;
    } else if (
      previo.kind !== fila.kind ||
      previo.name !== fila.name ||
      previo.moduleCode !== fila.moduleCode ||
      previo.purpose !== fila.purpose
    ) {
      plan.processesToUpdate.push(fila);
      c.processes.changed++;
    } else {
      c.processes.unchanged++;
    }

    // el orden de las etapas y de sus operaciones es el ordinal: 1..n, como `attnum` en las columnas
    const etapas = p.etapas.map((e, i) => {
      const unicas = [...new Set(e.operaciones.map((x) => x.operacionId))];
      const operationIds: string[] = [];
      for (const clave of unicas) {
        const id = idDeOperacion.get(clave);
        if (id) operationIds.push(id);
        else c.stepOperations.skippedUnresolved++;
      }
      return {
        ordinal: i + 1,
        stepCode: e.codigo,
        name: e.nombre,
        operationIds,
      };
    });
    const iguales =
      previo !== undefined &&
      previo.steps.length === etapas.length &&
      etapas.every((e, i) => {
        const k = previo.steps[i];
        return (
          k.ordinal === e.ordinal &&
          k.stepCode === e.stepCode &&
          k.name === e.name &&
          mismosIds(k.operationIds, e.operationIds)
        );
      });
    if (iguales) continue;
    if (previo) plan.processesToRebuildSteps.push(previo.id);
    for (const e of etapas) {
      const stepId = newId();
      plan.stepsToInsert.push({
        id: stepId,
        processId: fila.id,
        ordinal: e.ordinal,
        stepCode: e.stepCode,
        name: e.name,
      });
      c.steps.written++;
      e.operationIds.forEach((operationId, i) => {
        plan.stepOperationsToInsert.push({
          id: newId(),
          stepId,
          operationId,
          ordinal: i + 1,
        });
        c.stepOperations.written++;
      });
    }
  }
  return plan;
}
