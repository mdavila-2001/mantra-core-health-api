import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  defaultInventoryDirectory,
  readCatalogacionInventory,
  type CatalogacionInventory,
} from '../../../modules/data_catalog/application/catalogacion/catalogacion-inventory';
import type { VaultDataset } from '../../../modules/data_catalog/application/catalogacion/quality-context';
import { ensureSeedActor } from '../seed-actor';
import vaultJson from './data/vault-table-notes.json';
import {
  buildCatalogSeedPlan,
  CATALOG_SEED_VERSION,
  type CatalogSeedPlan,
} from './catalog-seed.plan';
import { PgCatalogSeedStore } from './catalog-seed.store';
import {
  ANNOTATION_REVISIONS,
  ANNOTATIONS,
  DATA_CLASSIFICATIONS,
  DATA_DOMAINS,
  EVIDENCE_ITEMS,
  GLOSSARY_REVISIONS,
  GLOSSARY_TERMS,
  LINEAGE_EDGES,
  type CatalogSeedStore,
  type ObjectIndex,
  type SeedTableSpec,
} from './catalog-seed.types';

export type StepSkip = 'TABLE_MISSING' | 'NO_OBSERVED_OBJECTS';

export interface StepResult {
  planned: number;
  inserted: number;
  skipped?: StepSkip;
}

/** Resultado de una pasada. En la segunda corrida todo `inserted` vale cero. */
export interface CatalogSeedResult {
  version: string;
  /**
   * Filas escritas en esta pasada (suma de cada `inserted` anidado). El resumen de la cadena
   * de siembra solo suma contadores de primer nivel: sin este total informaba como «insertadas»
   * las aristas de linaje descartadas (`lineageSkippedUncataloged`) y callaba las reales.
   */
  inserted: number;
  domains: StepResult;
  classifications: StepResult;
  glossaryTerms: StepResult;
  glossaryRevisions: StepResult;
  lineageEdges: StepResult;
  annotations: StepResult;
  annotationRevisions: StepResult;
  evidence: StepResult;
  objectDomainLinks: StepResult;
  /** Lo que el plan no pudo sembrar porque el escaneo todavía no observó el objeto. */
  unresolved: { tables: number; columns: number };
  /** Vínculos operación→tabla no sembrados porque la tabla no está en el catálogo. */
  lineageSkippedUncataloged: number;
  glossaryDuplicatesDropped: number;
}

const OBSERVED_NONE: StepResult = { planned: 0, inserted: 0 };

async function insertStep(
  store: CatalogSeedStore,
  spec: SeedTableSpec,
  rows: readonly Record<string, unknown>[],
): Promise<{ result: StepResult; ids: Set<string> }> {
  if (!(await store.hasTable(spec.table)))
    return {
      result: { planned: rows.length, inserted: 0, skipped: 'TABLE_MISSING' },
      ids: new Set(),
    };
  const ids = new Set(await store.insertMissing(spec, rows));
  return { result: { planned: rows.length, inserted: ids.size }, ids };
}

/**
 * Ejecuta la siembra contra un `store`. Separada del servicio para que la prueba use el doble en
 * memoria y el servicio, la base real, con exactamente el mismo orden y las mismas reglas.
 *
 * Orden: dominios → clasificaciones → glosario → linaje → fichas (necesitan el escaneo) → evidencia
 * → enlace de dominio. Un paso cuya tabla no existe (parche del modelo sin aplicar) se omite y se
 * informa; nunca falla el arranque.
 */
export async function runCatalogSeed(args: {
  store: CatalogSeedStore;
  inventory: CatalogacionInventory;
  vault: VaultDataset;
  now: Date;
}): Promise<{ result: CatalogSeedResult; plan: CatalogSeedPlan }> {
  const { store, inventory, vault, now } = args;
  const objects: ObjectIndex = (await store.hasTable(
    'data_catalog.catalog_objects',
  ))
    ? await store.loadObjects()
    : new Map();
  const plan = buildCatalogSeedPlan({ inventory, vault, objects, now });

  const domains = await insertStep(store, DATA_DOMAINS, plan.domains);
  const classifications = await insertStep(
    store,
    DATA_CLASSIFICATIONS,
    plan.classifications,
  );
  const terms = await insertStep(store, GLOSSARY_TERMS, plan.glossary.terms);
  const termRevisions = await insertStep(
    store,
    GLOSSARY_REVISIONS,
    plan.glossary.revisions.filter((r) => terms.ids.has(String(r.term_id))),
  );
  const lineage = await insertStep(store, LINEAGE_EDGES, plan.lineage.edges);

  let annotations: StepResult = { ...OBSERVED_NONE };
  let annotationRevisions: StepResult = { ...OBSERVED_NONE };
  let evidence: StepResult = { ...OBSERVED_NONE };
  let links: StepResult = { ...OBSERVED_NONE };
  if (objects.size === 0) {
    annotations = { planned: 0, inserted: 0, skipped: 'NO_OBSERVED_OBJECTS' };
    annotationRevisions = { ...annotations };
    evidence = { ...annotations };
    links = { ...annotations };
  } else {
    const ann = await insertStep(
      store,
      ANNOTATIONS,
      plan.annotations.annotations,
    );
    annotations = ann.result;
    annotationRevisions = (
      await insertStep(
        store,
        ANNOTATION_REVISIONS,
        plan.annotations.revisions.filter((r) =>
          ann.ids.has(String(r.annotation_id)),
        ),
      )
    ).result;
    evidence = (
      await insertStep(store, EVIDENCE_ITEMS, plan.annotations.evidence)
    ).result;
    const domainIds = await store.loadDomainIds();
    const pairs = plan.annotations.domainLinks.flatMap((l) => {
      const domainId = domainIds.get(l.domainCode);
      return domainId ? [{ objectId: l.objectId, domainId }] : [];
    });
    links = {
      planned: pairs.length,
      inserted: await store.linkObjectDomains(pairs),
    };
  }

  const inserted = [
    domains.result,
    classifications.result,
    terms.result,
    termRevisions.result,
    lineage.result,
    annotations,
    annotationRevisions,
    evidence,
    links,
  ].reduce((total, step) => total + step.inserted, 0);

  return {
    plan,
    result: {
      version: CATALOG_SEED_VERSION,
      inserted,
      domains: domains.result,
      classifications: classifications.result,
      glossaryTerms: terms.result,
      glossaryRevisions: termRevisions.result,
      lineageEdges: lineage.result,
      annotations,
      annotationRevisions,
      evidence,
      objectDomainLinks: links,
      unresolved: {
        tables: plan.annotations.stats.tablesUnresolved,
        columns: plan.annotations.stats.columnsUnresolved,
      },
      lineageSkippedUncataloged: plan.lineage.skippedUncataloged,
      glossaryDuplicatesDropped: plan.glossary.duplicatesDropped,
    },
  };
}

/**
 * Siembra la catalogación: dominios de datos, niveles de clasificación, glosario del dominio,
 * linaje endpoint→tabla, y las fichas de tabla y de columna (borrador, con procedencia) desde el
 * inventario, las reglas del clasificador y la bóveda.
 *
 * ## Qué no hace
 *
 * - No aprueba nada: toda ficha entra `DRAFT`, `NEEDS_REVIEW` o `AUTO_DETECTED`; el linaje entra
 *   con `is_official = false`. Aprobar es de una persona.
 * - No rellena: un campo sin fuente queda `null` con una pregunta abierta; un texto que es plantilla
 *   no se copia (ver `explanation-quality.ts`).
 * - No toca `system_ops.entity_registry` ni las políticas de mutabilidad (las siembra
 *   `MutabilityRegistrySeedService`).
 *
 * ## Idempotencia
 *
 * Ids deterministas (UUIDv5 sobre claves estables) + `insert … on conflict do nothing`: lo que ya
 * existe, también lo creado por una persona con otro id, no se toca ni se duplica. Las fichas
 * necesitan que el escaneo haya observado el objeto: sin él se informan como `unresolved` y la
 * corrida siguiente las siembra. Todo el paso es una sola transacción.
 */
@Injectable()
export class CatalogDocumentationSeedService {
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CatalogDocumentationSeedService.name);
  }

  async run(
    options: { inventoryDir?: string; now?: Date } = {},
  ): Promise<CatalogSeedResult | { skipped: 'INVENTORY_MISSING' }> {
    let inventory: CatalogacionInventory;
    try {
      inventory = readCatalogacionInventory(
        options.inventoryDir ?? defaultInventoryDirectory(),
      );
    } catch (error) {
      this.logger.warn(
        {
          operation: 'seed.catalog-documentation',
          error: (error as Error).message,
        },
        'Inventario ausente: no se siembra la catalogación',
      );
      return { skipped: 'INVENTORY_MISSING' };
    }
    const em = this.orm.em.fork();
    await ensureSeedActor(em);
    const now = options.now ?? new Date();
    const { result } = await em.transactional((tx) =>
      runCatalogSeed({
        store: new PgCatalogSeedStore(tx),
        inventory,
        vault: vaultJson,
        now,
      }),
    );
    this.logger.info(
      { operation: 'seed.catalog-documentation', ...result },
      'Catalogación sembrada',
    );
    return result;
  }
}
