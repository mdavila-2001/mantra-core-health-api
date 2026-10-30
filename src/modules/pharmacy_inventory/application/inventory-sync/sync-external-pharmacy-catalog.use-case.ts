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
  translateExternalStock,
  type ExternalMapping,
  type TranslatedSyncItem,
  type UnmappedExternalProduct,
} from '../../domain/sync/external-mapping';
import type { IntegrationSyncResponseDto } from '../../presentation/dto';
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
  readonly sites: readonly ActiveSiteRow[];
  readonly mappings: readonly ExternalMapping[];
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
 *    informa en `unmapped`; no se inventa ningún producto ni vínculo.
 * 4. Crea el lote y lo concilia con los casos de uso de siempre, en proceso
 *    (por HTTP son solo de la plataforma).
 * 5. Aplica cada ítem conciliado con el escritor de stock por sede
 *    (`SiteStockWriter`, `MV_SYNC_ADJUSTMENT`, origen = el lote); los
 *    productos sin vínculo no se tocan. Si este paso falla, el lote queda
 *    conciliado como rastro y la respuesta es el error.
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

    const { catalog, stockBySite } = await this.fetch(plan.sites);

    const items: TranslatedSyncItem[] = [];
    const unmapped = new Map<string, UnmappedExternalProduct>();
    for (const site of plan.sites) {
      const translated = translateExternalStock(
        plan.mappings,
        catalog,
        site.code,
        stockBySite.get(site.id) ?? [],
      );
      items.push(...translated.items);
      for (const entry of translated.unmapped) {
        unmapped.set(entry.externalCode, entry);
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

    const applied = await this.apply(plan, batch.id, actor);
    return {
      batchId: batch.id,
      received: items.length,
      mapped: items.filter((item) => item.pharmacyProductId).length,
      unmapped: [...unmapped.values()],
      applied,
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
      const sites = await this.reads.findActiveSites(
        tx,
        pharmacy.pharmacyId,
        connection.pharmacySiteId ?? undefined,
      );
      const mappings = (await this.reads.findMappings(tx, connection.id)).map(
        (mapping) => ({
          externalProductCode: mapping.externalProductCode,
          pharmacyProductId: mapping.pharmacyProductId,
        }),
      );
      return { pharmacy, sites, mappings };
    });
  }

  private async fetch(sites: readonly ActiveSiteRow[]): Promise<{
    catalog: ExternalProduct[];
    stockBySite: Map<string, ExternalStockLine[]>;
  }> {
    try {
      const catalog = await this.external.listProducts();
      const stockBySite = new Map<string, ExternalStockLine[]>();
      for (const site of sites) {
        stockBySite.set(site.id, await this.external.stockForSite(site.code));
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

  /** Aplica lo conciliado, sede por sede; devuelve cuántas posiciones cambiaron. */
  private apply(
    plan: SyncPlan,
    batchId: string,
    actor: AuthenticatedUser,
  ): Promise<number> {
    return this.em.transactional(async (tx) => {
      const matched = await this.reads.findMatchedItems(tx, batchId);
      let applied = 0;
      for (const site of plan.sites) {
        const quantities = new Map<string, number>();
        for (const item of matched) {
          if (
            item.externalLocationCode !== site.code ||
            !item.pharmacyProductId
          ) {
            continue;
          }
          quantities.set(
            item.pharmacyProductId,
            (quantities.get(item.pharmacyProductId) ?? 0) +
              Number(item.normalizedQuantity ?? '0'),
          );
        }
        const targets: { productId: string; availableQuantity: number }[] = [];
        for (const [productId, quantity] of quantities) {
          if (await this.applies(tx, plan.pharmacy, site.id, productId)) {
            targets.push({ productId, availableQuantity: quantity });
          }
        }
        if (targets.length === 0) continue;
        const results = await this.writer.write(
          tx,
          { ...plan.pharmacy, siteId: site.id },
          targets,
          {
            movementTypeConceptId: PINV.MV_SYNC_ADJUSTMENT,
            sourceId: batchId,
            actorUserId: actor.id,
          },
        );
        applied += results.filter((result) => result.changed).length;
      }
      return applied;
    });
  }

  /**
   * Un ítem conciliado se aplica si su producto sigue siendo de la farmacia y
   * no está retirado, y si la sede no lo lleva por lotes (ahí mandan las
   * recepciones y los conteos).
   */
  private async applies(
    tx: EntityManager,
    pharmacy: PharmacyScope,
    siteId: string,
    productId: string,
  ): Promise<boolean> {
    const product = await this.scopeRepo.findProductInPharmacy(
      tx,
      productId,
      pharmacy.pharmacyId,
    );
    if (!product || product.statusConceptId === PHARM.PRODUCT_RETIRED) {
      return false;
    }
    return (
      (await this.positions.countLotPositionsInSite(tx, siteId, productId)) ===
      0
    );
  }
}
