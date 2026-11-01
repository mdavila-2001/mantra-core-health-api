import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { INTEG } from '../../../integrations/integrations.concepts';
import {
  resolveStockMode,
  type ConnectionCheckResult,
  type OrderStockSource,
} from '../../domain/erp-connection/pharmacy-stock-mode';
import { ExternalCatalogUnavailableError } from '../../domain/sync/external-catalog';
import {
  resolveExternalCodes,
  unitIssue,
} from '../../domain/sync/external-mapping';
import { ErpConnectionRepository } from '../../infrastructure/repositories/erp-connection.repository';
import { IntegrationReadRepository } from '../../infrastructure/repositories/integration-read.repository';
import {
  PHARMACY_CATALOG_FACTORY_PORT,
  PHARMACY_CONNECTION_CIPHER_PORT,
  type PharmacyCatalogFactoryPort,
  type PharmacyConnectionCipherPort,
} from '../ports/external-pharmacy-catalog.port';
import {
  PHARMACY_SYSTEM_TIMEOUT_MS,
  resultOf,
  statusFor,
} from './erp-connection.use-cases';

const MANUAL: OrderStockSource = { mode: 'MANUAL' };

/**
 * De dónde sale el stock de un pedido nuevo (FAR-C9, D-7), resuelto **antes**
 * de abrir la transacción de reserva y adquirir candados del libro. Conserva
 * la transacción del request cuando existe: allí vive el contexto local RLS.
 *
 * - Farmacia en manual: manual.
 * - Conectada: se consulta el stock de esa sucursal, con 3 s como máximo y sin
 *   reintentos. Solo cuentan los productos con un único vínculo a un código
 *   de la farmacia; los demás conservan el carril del libro local.
 * - Si el sistema falla, la conexión queda «con error» con su motivo y el
 *   pedido sigue como manual. La siguiente llamada que funcione la deja
 *   activa otra vez.
 *
 * Nunca lanza: cualquier problema de la conexión deja el pedido en manual.
 */
@Injectable()
export class OrderStockSourceResolver {
  constructor(
    private readonly em: EntityManager,
    private readonly connections: ErpConnectionRepository,
    private readonly reads: IntegrationReadRepository,
    @Inject(PHARMACY_CATALOG_FACTORY_PORT)
    private readonly catalogs: PharmacyCatalogFactoryPort,
    @Inject(PHARMACY_CONNECTION_CIPHER_PORT)
    private readonly cipher: PharmacyConnectionCipherPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext('OrderStockSourceResolver');
  }

  async resolve(
    siteId: string,
    productIds: readonly string[],
  ): Promise<OrderStockSource> {
    try {
      return await this.resolveOrThrow(siteId, productIds);
    } catch (error) {
      this.logger.warn(
        {
          operation: 'pharmacy_inventory.order.stock_source',
          siteId,
          error: error instanceof Error ? error.name : 'unknown',
        },
        'No se pudo resolver la conexión de la farmacia: el pedido entra en manual',
      );
      return MANUAL;
    }
  }

  private async resolveOrThrow(
    siteId: string,
    productIds: readonly string[],
  ): Promise<OrderStockSource> {
    const em = this.em.fork({ keepTransactionContext: true });
    const site = await this.connections.findSite(em, siteId);
    if (!site) return MANUAL;
    const record = await this.connections.findForPharmacy(em, site.pharmacyId);
    const mode = resolveStockMode(
      record && {
        linked: true,
        enabled: record.connection.stateConceptId === INTEG.CONN_ACTIVE,
        hasCredential: record.credential !== null,
        supportedSystem: record.systemCode !== null,
      },
    );
    if (
      mode === 'MANUAL' ||
      !record?.systemCode ||
      !record.credential?.secretRef
    ) {
      return MANUAL;
    }
    if (!this.cipher.isConfigured()) return MANUAL;

    const wanted = new Set(productIds);
    const mappings = await this.reads.findMappings(em, record.link.id);
    // Resolve the complete connection before selecting the requested products:
    // a conflicting product outside this order still makes its ERP code ambiguous.
    const resolved = resolveExternalCodes(mappings);
    const codeOf = new Map<string, string>();
    const repeated = new Set<string>();
    for (const mapping of mappings) {
      if (!wanted.has(mapping.pharmacyProductId)) continue;
      if (codeOf.has(mapping.pharmacyProductId))
        repeated.add(mapping.pharmacyProductId);
      codeOf.set(mapping.pharmacyProductId, mapping.externalProductCode);
    }
    for (const [productId, code] of codeOf) {
      if (repeated.has(productId) || resolved.get(code)?.status !== 'MAPPED') {
        codeOf.delete(productId);
      }
    }
    if (codeOf.size === 0) {
      return { mode: 'CONNECTED', liveQuantities: new Map() };
    }

    const catalog = this.catalogs.forAccess({
      systemCode: record.systemCode,
      baseUrl: record.config.baseUrl,
      pharmacyCode: record.config.pharmacyCode,
      apiKey: this.cipher.decrypt(record.credential.secretRef),
      timeoutMs: PHARMACY_SYSTEM_TIMEOUT_MS,
    });
    const siteCode = record.config.siteCodes[site.id] ?? site.code;
    let result: ConnectionCheckResult;
    let live: ReadonlyMap<string, number> | null = null;
    let reportedUnits: ReadonlyMap<string, string | undefined> = new Map();
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      const requiresUnitCatalog = [...codeOf.values()].some((code) => {
        const mapping = resolved.get(code);
        return mapping?.status === 'MAPPED' && mapping.externalUnitCode?.trim();
      });
      // Catalog and stock share one deadline; adding unit validation must not
      // turn the three-second ERP lookup into two consecutive time budgets.
      const [products, lines] = await Promise.race([
        Promise.all([
          requiresUnitCatalog ? catalog.listProducts() : Promise.resolve([]),
          catalog.stockForSite(siteCode, record.config.pharmacyCode),
        ]),
        new Promise<never>((_, reject) => {
          deadline = setTimeout(
            () =>
              reject(
                new ExternalCatalogUnavailableError(
                  'Order stock lookup deadline exceeded',
                ),
              ),
            PHARMACY_SYSTEM_TIMEOUT_MS,
          );
        }),
      ]);
      reportedUnits = new Map(
        products.map((product) => [product.code, product.unitCode]),
      );
      live = new Map(lines.map((line) => [line.code, line.quantity]));
      result = 'OK';
    } catch (error) {
      result = resultOf(error);
      this.logger.warn(
        {
          operation: 'pharmacy_inventory.order.live_stock',
          pharmacyId: site.pharmacyId,
          siteId,
          result,
          detail:
            error instanceof ExternalCatalogUnavailableError
              ? error.detail
              : 'unknown',
        },
        'El sistema de la farmacia falló: el pedido entra «por confirmar»',
      );
    } finally {
      if (deadline !== undefined) clearTimeout(deadline);
    }
    await this.recordStatus(record.connection.id, result);
    if (!live) return MANUAL;

    const liveQuantities = new Map<string, number>();
    for (const [productId, code] of codeOf) {
      const mapping = resolved.get(code);
      if (mapping?.status !== 'MAPPED') continue;
      const issue = unitIssue(
        mapping.externalUnitCode,
        reportedUnits.get(code),
      );
      if (issue) {
        this.logger.warn(
          {
            operation: 'pharmacy_inventory.order.unit',
            productId,
            reason: issue,
          },
          'La unidad externa no permite interpretar el stock: se conserva el libro local',
        );
        continue;
      }
      // Un código que el sistema no lista es un producto que no tiene: 0.
      liveQuantities.set(productId, live.get(code) ?? 0);
    }
    return { mode: 'CONNECTED', liveQuantities };
  }

  /** Registra el estado conservando la frontera transaccional/RLS del request. */
  private async recordStatus(
    connectionId: string,
    result: ConnectionCheckResult,
  ): Promise<void> {
    try {
      await this.em
        .fork({ keepTransactionContext: true })
        .transactional(async (tx) => {
          const record = await this.connections.findConnectionById(
            tx,
            connectionId,
          );
          if (record) {
            this.connections.recordStatus(
              record,
              statusFor(result, new Date()),
            );
          }
        });
    } catch (error) {
      this.logger.warn(
        {
          operation: 'pharmacy_inventory.order.record_connection_status',
          connectionId,
          error: error instanceof Error ? error.name : 'unknown',
        },
        'No se pudo guardar el estado de la conexión de la farmacia',
      );
    }
  }
}
