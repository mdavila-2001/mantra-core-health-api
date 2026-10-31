import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import {
  IntegrationReadRepository,
  InventoryScopeRepository,
  StockPositionsRepository,
  type ActiveSiteRow,
} from '../../infrastructure/repositories';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import {
  ExternalCatalogUnavailableError,
  type ExternalProduct,
  type ExternalStockLine,
} from '../../domain/sync/external-catalog';
import {
  mappedCodesNotSent,
  resolveExternalCodes,
  translateExternalStock,
  unitIssue,
  type ExternalMapping,
  type TranslatedSyncItem,
  type UnmappedExternalProduct,
} from '../../domain/sync/external-mapping';
import type {
  IntegrationSyncNotSentDto,
  IntegrationSyncResponseDto,
  IntegrationSyncSiteDto,
  IntegrationSyncSkippedDto,
  SyncSkipReason,
} from '../../presentation/dto';
import {
  EXTERNAL_PHARMACY_CATALOG_PORT,
  type ExternalPharmacyCatalogPort,
} from '../ports/external-pharmacy-catalog.port';
import {
  PharmacyInventoryScopePolicy,
  type PharmacyScope,
} from '../scope/pharmacy-inventory-scope.policy';
import { SiteStockWriter } from '../site-availability/site-stock-writer';
import { CreateInventorySyncBatchUseCase } from './create-inventory-sync-batch.use-case';
import {
  integrationConnectionInactive,
  integrationNotConfigured,
  integrationUnavailable,
} from './integration-errors';
import { ReconcileInventorySyncBatchUseCase } from './reconcile-inventory-sync-batch.use-case';

/** Ruta del recurso, tal como llega del controlador. */
export interface ConnectionRef {
  readonly pharmacyId: string;
  readonly connectionId: string;
}

/** Lo que se decide en la primera lectura, antes de llamar afuera. */
interface SyncPlan {
  readonly pharmacy: PharmacyScope;
  /** Código de la farmacia: el sistema externo distingue farmacias por él. */
  readonly pharmacyCode: string;
  readonly sites: readonly ActiveSiteRow[];
  readonly mappings: readonly ExternalMapping[];
}

/** Lo que se le pide a la sede para un producto, con su línea de origen. */
interface SiteCandidate {
  readonly productId: string;
  readonly externalCode: string;
  readonly quantity: number;
  /** Líneas del lote que lo forman (una, salvo vínculos repetidos). */
  readonly lines: number;
}

/** Lo que dejó la aplicación de una sede. */
interface SiteOutcome {
  readonly applied: number;
  readonly unchanged: number;
  readonly skipped: IntegrationSyncSkippedDto[];
}

/** Un problema de unidad de un producto, por su código externo. */
interface UnitProblem {
  readonly reason: 'UNIT_MISMATCH' | 'UNIT_NOT_REPORTED';
  readonly mappingUnitCode: string | null;
  readonly externalUnitCode: string | null;
}

/**
 * «Sincronizar ahora» (FAR-07): trae del sistema de la farmacia externa su
 * catálogo y el stock de cada sede, lo traduce con los vínculos de la conexión
 * y lo deja asentado.
 *
 * La conciliación que ya existe no alcanza sola: no usa los vínculos (marca
 * `MATCHED` solo si el ítem ya trae producto) y no toca el stock
 * (`reconcile-inventory-sync-batch.use-case.ts`). Por eso, en orden:
 *
 * 1. Lee la conexión, sus sedes y sus vínculos dentro del ámbito del actor.
 * 2. Llama al sistema externo **fuera** de toda transacción; si no responde,
 *    502 y no queda lote.
 * 3. Traduce: lo que no tiene un vínculo único va al lote sin producto y se
 *    informa en `unmapped`, diciendo si falta el vínculo o si es ambiguo; no
 *    se inventa ningún producto ni vínculo.
 * 4. Crea el lote y lo concilia con los casos de uso de siempre, en proceso
 *    (por HTTP son solo de la plataforma).
 * 5. Aplica cada sede **en su propia transacción**, con el mismo orden de
 *    candados que el «Lo tengo» de una sede: sede → posiciones → libro, y
 *    commit antes de pasar a la siguiente. Una sola transacción para todas
 *    retenía el candado del libro mientras pedía la sede siguiente, y se
 *    cruzaba con un `PUT` o un pedido en esa sede. Si una sede falla, las
 *    anteriores quedan aplicadas (volver a sincronizar no repite asientos) y
 *    la respuesta es el error.
 *
 * Lo que no se aplica se dice en `skipped`, con su motivo: un producto que no
 * está publicado, uno marcado sin stock en el catálogo o «No lo tengo» a mano
 * en la sede (la sincronización no lo pisa), uno que la sede lleva por lotes,
 * o una línea que el sistema externo cuenta en otra unidad que la del vínculo
 * (no se convierte nada). Un código vinculado que el sistema externo dejó de
 * mandar conserva su stock y se avisa en `notSent`.
 */
@Injectable()
export class SyncExternalPharmacyCatalogUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly scopeRepo: InventoryScopeRepository,
    private readonly reads: IntegrationReadRepository,
    private readonly positions: StockPositionsRepository,
    private readonly createBatch: CreateInventorySyncBatchUseCase,
    private readonly reconcile: ReconcileInventorySyncBatchUseCase,
    private readonly writer: SiteStockWriter,
    @Inject(EXTERNAL_PHARMACY_CATALOG_PORT)
    private readonly external: ExternalPharmacyCatalogPort,
    private readonly logger: PinoLogger,
  ) {}

  async execute(
    ref: ConnectionRef,
    actor: AuthenticatedUser,
  ): Promise<IntegrationSyncResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.integration.sync',
        pharmacyId: ref.pharmacyId,
        connectionId: ref.connectionId,
      },
      'Syncing external pharmacy catalog',
    );
    const plan = await this.plan(ref, actor);
    if (!this.external.isConfigured()) throw integrationNotConfigured();

    const { catalog, stockBySite } = await this.fetch(plan);

    const items: TranslatedSyncItem[] = [];
    const unmapped = new Map<string, UnmappedExternalProduct>();
    const tallies = new Map<string, { received: number; unmapped: number }>();
    const notSent: IntegrationSyncNotSentDto[] = [];
    for (const site of plan.sites) {
      const lines = stockBySite.get(site.id) ?? [];
      const translated = translateExternalStock(
        plan.mappings,
        catalog,
        site.code,
        lines,
      );
      items.push(...translated.items);
      tallies.set(site.id, {
        received: translated.items.length,
        unmapped: translated.unmapped.length,
      });
      for (const entry of translated.unmapped) {
        unmapped.set(entry.externalCode, entry);
      }
      for (const missing of mappedCodesNotSent(plan.mappings, lines)) {
        notSent.push({ siteId: site.id, siteCode: site.code, ...missing });
      }
    }

    // Sin `idempotencyKey`: es única global y reusaría ítems de lotes viejos.
    // La idempotencia del stock la da el escritor (sin cambio, sin asiento).
    const batch = await this.createBatch.execute(
      {
        pharmacyIntegrationConnectionId: ref.connectionId,
        sourceBatchIdentifier: `sync-${new Date().toISOString()}`,
        items: items.map((item) => ({ ...item })),
      },
      actor,
    );
    await this.reconcile.execute(batch.id, actor);

    const units = unitProblems(plan.mappings, catalog);
    const candidates = await this.candidatesBySite(plan, batch.id);
    const sites: IntegrationSyncSiteDto[] = [];
    const skipped: IntegrationSyncSkippedDto[] = [];
    for (const site of plan.sites) {
      const siteCandidates = candidates.get(site.id) ?? [];
      const outcome = await this.applySite(
        plan,
        site,
        siteCandidates,
        units,
        batch.id,
        actor,
      );
      const tally = tallies.get(site.id) ?? { received: 0, unmapped: 0 };
      sites.push({
        siteId: site.id,
        siteCode: site.code,
        siteName: site.name,
        received: tally.received,
        mapped: tally.received - tally.unmapped,
        unmapped: tally.unmapped,
        applied: outcome.applied,
        unchanged: outcome.unchanged,
        skipped: outcome.skipped.length,
      });
      skipped.push(...outcome.skipped);
    }

    const mapped = items.filter((item) => item.pharmacyProductId).length;
    return {
      batchId: batch.id,
      received: items.length,
      mapped,
      unmappedLines: items.length - mapped,
      unmapped: [...unmapped.values()].map((entry) => ({
        ...entry,
        productIds: [...entry.productIds],
      })),
      applied: sites.reduce((sum, site) => sum + site.applied, 0),
      sites,
      skipped,
      notSent,
    };
  }

  private plan(
    ref: ConnectionRef,
    actor: AuthenticatedUser,
  ): Promise<SyncPlan> {
    return this.em.transactional(async (tx) => {
      const pharmacy = await this.scope.requireManagedPharmacy(
        tx,
        ref.pharmacyId,
        actor,
      );
      const connection = await this.reads.findConnection(
        tx,
        pharmacy.pharmacyId,
        ref.connectionId,
      );
      if (!connection) throw this.scope.notAvailable();
      if (
        connection.statusConceptId !== PHARM.CONNECTION_ACTIVE ||
        connection.supportsStockQuery !== true
      ) {
        throw integrationConnectionInactive();
      }
      const pharmacyCode =
        (await this.reads.findPharmacyCode(tx, pharmacy.pharmacyId)) ?? '';
      const sites = await this.reads.findActiveSites(
        tx,
        pharmacy.pharmacyId,
        connection.pharmacySiteId ?? undefined,
      );
      const mappings = (await this.reads.findMappings(tx, connection.id)).map(
        (mapping) => ({
          externalProductCode: mapping.externalProductCode,
          pharmacyProductId: mapping.pharmacyProductId,
          externalUnitCode: mapping.externalUnitCode ?? null,
        }),
      );
      return { pharmacy, pharmacyCode, sites, mappings };
    });
  }

  private async fetch(plan: SyncPlan): Promise<{
    catalog: ExternalProduct[];
    stockBySite: Map<string, ExternalStockLine[]>;
  }> {
    try {
      const catalog = await this.external.listProducts();
      const stockBySite = new Map<string, ExternalStockLine[]>();
      for (const site of plan.sites) {
        stockBySite.set(
          site.id,
          await this.external.stockForSite(site.code, plan.pharmacyCode),
        );
      }
      return { catalog, stockBySite };
    } catch (error) {
      if (error instanceof ExternalCatalogUnavailableError) {
        this.logger.warn(
          {
            operation: 'pharmacy_inventory.integration.sync',
            detail: error.detail,
          },
          'External pharmacy catalog unavailable',
        );
        throw integrationUnavailable();
      }
      throw error;
    }
  }

  /** Lo conciliado del lote, agrupado por sede y producto. */
  private async candidatesBySite(
    plan: SyncPlan,
    batchId: string,
  ): Promise<Map<string, SiteCandidate[]>> {
    const matched = await this.em.transactional((tx) =>
      this.reads.findMatchedItems(tx, batchId),
    );
    const bySite = new Map<string, SiteCandidate[]>();
    for (const site of plan.sites) {
      const byProduct = new Map<string, SiteCandidate>();
      for (const item of matched) {
        if (
          item.externalLocationCode !== site.code ||
          !item.pharmacyProductId
        ) {
          continue;
        }
        const previous = byProduct.get(item.pharmacyProductId);
        byProduct.set(item.pharmacyProductId, {
          productId: item.pharmacyProductId,
          externalCode:
            previous?.externalCode ?? item.externalProductCode ?? '',
          quantity:
            (previous?.quantity ?? 0) + Number(item.normalizedQuantity ?? '0'),
          lines: (previous?.lines ?? 0) + 1,
        });
      }
      bySite.set(site.id, [...byProduct.values()]);
    }
    return bySite;
  }

  /**
   * Aplica una sede en su propia transacción: sede → lecturas → posiciones →
   * libro, como el «Lo tengo».
   */
  private applySite(
    plan: SyncPlan,
    site: ActiveSiteRow,
    candidates: readonly SiteCandidate[],
    units: ReadonlyMap<string, UnitProblem>,
    batchId: string,
    actor: AuthenticatedUser,
  ): Promise<SiteOutcome> {
    if (candidates.length === 0) {
      return Promise.resolve({ applied: 0, unchanged: 0, skipped: [] });
    }
    return this.em.transactional(async (tx) => {
      // El estado de la sede se lee con su candado ya tomado: un «No lo
      // tengo» que entra mientras tanto espera a que esta sede termine.
      await this.writer.lockSite(tx, site.id);
      const skipped: IntegrationSyncSkippedDto[] = [];
      const skip = (
        candidate: SiteCandidate,
        reason: SyncSkipReason,
        unit?: UnitProblem,
      ) => {
        for (let line = 0; line < candidate.lines; line++) {
          skipped.push({
            siteId: site.id,
            siteCode: site.code,
            externalCode: candidate.externalCode,
            productId: candidate.productId,
            quantity: candidate.quantity,
            reason,
            ...(unit
              ? {
                  mappingUnitCode: unit.mappingUnitCode,
                  externalUnitCode: unit.externalUnitCode,
                }
              : {}),
          });
        }
      };

      const writable: SiteCandidate[] = [];
      for (const candidate of candidates) {
        const unit = units.get(candidate.productId);
        if (unit) {
          skip(candidate, unit.reason, unit);
          continue;
        }
        const reason = await this.skipReason(
          tx,
          plan.pharmacy,
          site.id,
          candidate,
        );
        if (reason) skip(candidate, reason);
        else writable.push(candidate);
      }
      const marked = await this.reads.findMarkedNotAvailable(
        tx,
        site.id,
        writable
          .filter((candidate) => candidate.quantity > 0)
          .map((candidate) => candidate.productId),
      );
      const targets = writable.filter((candidate) => {
        if (!marked.has(candidate.productId)) return true;
        skip(candidate, 'SITE_MARKED_NOT_AVAILABLE');
        return false;
      });
      if (targets.length === 0) return { applied: 0, unchanged: 0, skipped };

      const results = await this.writer.write(
        tx,
        { ...plan.pharmacy, siteId: site.id },
        targets.map((target) => ({
          productId: target.productId,
          availableQuantity: target.quantity,
        })),
        {
          movementTypeConceptId: PINV.MV_SYNC_ADJUSTMENT,
          sourceId: batchId,
          actorUserId: actor.id,
        },
      );
      const lines = new Map(
        targets.map((target) => [target.productId, target.lines]),
      );
      let applied = 0;
      let unchanged = 0;
      for (const result of results) {
        const count = lines.get(result.productId) ?? 1;
        if (result.changed) applied += count;
        else unchanged += count;
      }
      return { applied, unchanged, skipped };
    });
  }

  /**
   * Por qué un producto no se escribe en la sede, o `null` si se escribe:
   * tiene que seguir siendo de la farmacia y estar publicado (como el `PUT`
   * de la sede), no estar marcado sin stock en el catálogo si trae unidades,
   * y la sede no tiene que llevarlo por lotes (ahí mandan las recepciones y
   * los conteos).
   */
  private async skipReason(
    tx: EntityManager,
    pharmacy: PharmacyScope,
    siteId: string,
    candidate: SiteCandidate,
  ): Promise<SyncSkipReason | null> {
    const product = await this.scopeRepo.findProductInPharmacy(
      tx,
      candidate.productId,
      pharmacy.pharmacyId,
    );
    if (!product) return 'PRODUCT_NOT_AVAILABLE';
    if (product.statusConceptId !== PHARM.PRODUCT_ACTIVE) {
      return 'PRODUCT_NOT_PUBLISHED';
    }
    if (candidate.quantity > 0 && product.outOfStockDeclared === true) {
      return 'PRODUCT_OUT_OF_STOCK_DECLARED';
    }
    const lots = await this.positions.countLotPositionsInSite(
      tx,
      siteId,
      candidate.productId,
    );
    return lots > 0 ? 'SITE_PRODUCT_KEPT_BY_LOTS' : null;
  }
}

/**
 * Los productos cuya línea no se puede leer en su unidad: el vínculo declara
 * una unidad y el catálogo externo cuenta ese código en otra, o no dice en
 * cuál.
 */
function unitProblems(
  mappings: readonly ExternalMapping[],
  catalog: readonly ExternalProduct[],
): Map<string, UnitProblem> {
  const units = new Map(catalog.map((product) => [product.code, product]));
  const problems = new Map<string, UnitProblem>();
  for (const [code, resolution] of resolveExternalCodes(mappings)) {
    if (resolution.status !== 'MAPPED') continue;
    const externalUnitCode = units.get(code)?.unitCode ?? null;
    const reason = unitIssue(resolution.externalUnitCode, externalUnitCode);
    if (reason) {
      problems.set(resolution.productId, {
        reason,
        mappingUnitCode: resolution.externalUnitCode,
        externalUnitCode,
      });
    }
  }
  return problems;
}
