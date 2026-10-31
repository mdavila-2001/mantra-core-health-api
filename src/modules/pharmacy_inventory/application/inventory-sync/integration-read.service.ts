import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import { IntegrationReadRepository } from '../../infrastructure/repositories';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import { resolveExternalCodes } from '../../domain/sync/external-mapping';
import type {
  ExternalCatalogListDto,
  IntegrationConnectionListDto,
  IntegrationMappingListDto,
  IntegrationSyncBatchListDto,
} from '../../presentation/dto';
import {
  EXTERNAL_PHARMACY_CATALOG_PORT,
  type ExternalPharmacyCatalogPort,
} from '../ports/external-pharmacy-catalog.port';
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';
import {
  integrationNotConfigured,
  integrationUnavailable,
} from './integration-errors';
import type { ConnectionRef } from './sync-external-pharmacy-catalog.use-case';

/** Tope de lotes que se listan de una vez. */
const MAX_BATCHES = 20;

/**
 * Lecturas de la pestaña Integración del catálogo (FAR-07): las conexiones de
 * la farmacia, los vínculos de una conexión, el catálogo del sistema externo
 * con su vínculo y los últimos lotes. Todo dentro del ámbito del actor: una
 * farmacia o una conexión ajena responde el mismo 404 que una inexistente.
 */
/**
 * La conexión tal como la lee el repositorio: la capa de aplicación no importa
 * entidades de `pharmacy`, sólo `infrastructure/` habla con otros contextos.
 */
type FoundConnection = NonNullable<
  Awaited<ReturnType<IntegrationReadRepository['findConnection']>>
>;

@Injectable()
export class IntegrationReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly reads: IntegrationReadRepository,
    @Inject(EXTERNAL_PHARMACY_CATALOG_PORT)
    private readonly external: ExternalPharmacyCatalogPort,
  ) {}

  async connections(
    pharmacyId: string,
    actor: AuthenticatedUser,
  ): Promise<IntegrationConnectionListDto> {
    const em = this.em.fork();
    const pharmacy = await this.scope.requireManagedPharmacy(
      em,
      pharmacyId,
      actor,
    );
    const connections = await this.reads.findConnections(
      em,
      pharmacy.pharmacyId,
    );
    const sites = await this.reads.findSites(
      em,
      pharmacy.pharmacyId,
      connections
        .map((connection) => connection.pharmacySiteId)
        .filter((id): id is string => typeof id === 'string'),
    );
    const siteNames = new Map(sites.map((site) => [site.id, site.name]));
    const providerConfigured = this.external.isConfigured();
    return {
      providerConfigured,
      items: connections.map((connection) => ({
        id: connection.id,
        pharmacySiteId: connection.pharmacySiteId ?? null,
        siteName: connection.pharmacySiteId
          ? (siteNames.get(connection.pharmacySiteId) ?? null)
          : null,
        integrationMode:
          connection.integrationModeConceptId ===
          PHARM.INTEGRATION_MODE_REALTIME
            ? 'REALTIME'
            : 'BATCH',
        supportsStockQuery: connection.supportsStockQuery === true,
        status:
          connection.statusConceptId === PHARM.CONNECTION_ACTIVE
            ? 'ACTIVE'
            : 'INACTIVE',
        providerConfigured,
        createdAt: connection.createdAt.toISOString(),
      })),
    };
  }

  async mappings(
    ref: ConnectionRef,
    actor: AuthenticatedUser,
  ): Promise<IntegrationMappingListDto> {
    const em = this.em.fork();
    const connection = await this.requireConnection(em, ref, actor);
    const mappings = await this.reads.findMappings(em, connection.id);
    const products = await this.reads.findProducts(
      em,
      connection.pharmacyId,
      mappings.map((mapping) => mapping.pharmacyProductId),
    );
    const byId = new Map(products.map((product) => [product.id, product]));
    return {
      items: mappings.map((mapping) => {
        const product = byId.get(mapping.pharmacyProductId);
        return {
          id: mapping.id,
          externalProductCode: mapping.externalProductCode,
          pharmacyProductId: mapping.pharmacyProductId,
          productCode: product?.productCode ?? null,
          productName: product
            ? (product.brandName ?? product.genericName ?? product.productCode)
            : null,
          externalUnitCode: mapping.externalUnitCode ?? null,
          createdAt: mapping.createdAt.toISOString(),
        };
      }),
    };
  }

  async externalProducts(
    ref: ConnectionRef,
    actor: AuthenticatedUser,
  ): Promise<ExternalCatalogListDto> {
    const em = this.em.fork();
    const connection = await this.requireConnection(em, ref, actor);
    const mappings = await this.reads.findMappings(em, connection.id);
    if (!this.external.isConfigured()) throw integrationNotConfigured();
    let catalog;
    try {
      catalog = await this.external.listProducts();
    } catch (error) {
      if (error instanceof ExternalCatalogUnavailableError) {
        throw integrationUnavailable();
      }
      throw error;
    }
    const byCode = resolveExternalCodes(mappings);
    return {
      items: catalog.map((product) => {
        const resolution = byCode.get(product.code);
        return {
          code: product.code,
          name: product.name,
          presentation: product.presentation ?? null,
          unitCode: product.unitCode ?? null,
          mappedProductId:
            resolution?.status === 'MAPPED' ? resolution.productId : null,
          mappingStatus: !resolution
            ? 'UNMAPPED'
            : resolution.status === 'MAPPED'
              ? 'MAPPED'
              : 'AMBIGUOUS',
          mappedProductIds: !resolution
            ? []
            : resolution.status === 'MAPPED'
              ? [resolution.productId]
              : [...resolution.productIds],
        };
      }),
    };
  }

  async syncBatches(
    ref: ConnectionRef,
    limit: number | undefined,
    actor: AuthenticatedUser,
  ): Promise<IntegrationSyncBatchListDto> {
    const em = this.em.fork();
    const connection = await this.requireConnection(em, ref, actor);
    const batches = await this.reads.findBatches(
      em,
      connection.id,
      Math.min(Math.max(limit ?? 5, 1), MAX_BATCHES),
    );
    const discrepancies = await this.reads.countDiscrepancies(
      em,
      batches.map((batch) => batch.id),
    );
    return {
      items: batches.map((batch) => ({
        id: batch.id,
        status:
          batch.statusConceptId === PINV.BATCH_COMPLETED
            ? 'COMPLETED'
            : 'RECEIVED',
        receivedAt: batch.receivedAt?.toISOString() ?? null,
        completedAt: batch.completedAt?.toISOString() ?? null,
        itemCount: batch.itemCount ?? 0,
        discrepancies: discrepancies.get(batch.id) ?? 0,
      })),
    };
  }

  private async requireConnection(
    em: EntityManager,
    ref: ConnectionRef,
    actor: AuthenticatedUser,
  ): Promise<FoundConnection> {
    const pharmacy = await this.scope.requireManagedPharmacy(
      em,
      ref.pharmacyId,
      actor,
    );
    const connection = await this.reads.findConnection(
      em,
      pharmacy.pharmacyId,
      ref.connectionId,
    );
    if (!connection) throw this.scope.notAvailable();
    return connection;
  }
}
