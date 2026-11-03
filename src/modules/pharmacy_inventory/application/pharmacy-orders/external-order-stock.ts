import { recordExternalSystemCheck } from '../inventory-sync/record-external-system-check';
import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PHARM } from '../../../pharmacy/pharmacy.concepts';
import { IntegrationReadRepository } from '../../infrastructure/repositories/integration-read.repository';
import {
  EXTERNAL_PHARMACY_SYSTEM_PORT,
  type ExternalPharmacySystemPort,
  type ExternalSystemCheckToken,
} from '../ports/external-pharmacy-system.port';
import {
  ExternalCatalogUnavailableError,
  type ExternalSystemCheckResult,
} from '../../domain/sync/external-catalog';
import {
  resolveExternalCodes,
  unitIssue,
} from '../../domain/sync/external-mapping';
import type {
  PharmacySiteSnapshot,
  PharmacySnapshot,
} from '../ports/pharmacy-directory.port';

export type ExternalOrderStockSource =
  | { readonly mode: 'MANUAL' }
  | {
      readonly mode: 'CONTRACT_PENDING';
      readonly reason: 'CONNECTION_PRECEDENCE';
    }
  | {
      readonly mode: 'CONNECTED';
      readonly liveQuantities: ReadonlyMap<string, number>;
    };

const MANUAL: ExternalOrderStockSource = { mode: 'MANUAL' };
const DEADLINE_MS = 3_000;

/** Own systems only. No precedence is invented for overlapping connections. */
@Injectable()
export class ExternalOrderStock {
  constructor(
    private readonly em: EntityManager,
    private readonly reads: IntegrationReadRepository,
    @Inject(EXTERNAL_PHARMACY_SYSTEM_PORT)
    private readonly systems: ExternalPharmacySystemPort,
    private readonly logger: PinoLogger,
  ) {}

  async resolve(
    site: PharmacySiteSnapshot,
    pharmacy: PharmacySnapshot,
    productIds: readonly string[],
    actorUserId: string,
  ): Promise<ExternalOrderStockSource> {
    const em = this.em.fork({ keepTransactionContext: true });
    const links = (await this.reads.findConnections(em, pharmacy.id)).filter(
      (link) =>
        link.statusConceptId === PHARM.CONNECTION_ACTIVE &&
        link.supportsStockQuery === true &&
        (!link.pharmacySiteId || link.pharmacySiteId === site.id),
    );
    // Preserve dev's ledger behavior for this blocked subset; never choose newest/first.
    if (links.length > 1)
      return { mode: 'CONTRACT_PENDING', reason: 'CONNECTION_PRECEDENCE' };
    const branch = (
      await this.reads.findActiveSites(em, pharmacy.id, site.id)
    )[0];
    if (!branch) return MANUAL;
    const link = links[0];
    if (!link?.connectionId) return MANUAL;
    const system = await this.systems.resolve(
      em,
      pharmacy.tenantId,
      link.connectionId,
    );
    if (system.status === 'UNAVAILABLE') {
      await this.record(
        pharmacy.tenantId,
        system.check,
        system.errorReason,
        actorUserId,
      );
      return MANUAL;
    }
    if (system.status !== 'READY' || system.source !== 'PHARMACY')
      return MANUAL;
    const mappings = await this.reads.findMappings(em, link.id);
    const resolved = resolveExternalCodes(mappings);
    const wanted = new Set(productIds);
    const codeOf = new Map<string, string>();
    const repeated = new Set<string>();
    for (const mapping of mappings) {
      if (!wanted.has(mapping.pharmacyProductId)) continue;
      if (codeOf.has(mapping.pharmacyProductId))
        repeated.add(mapping.pharmacyProductId);
      codeOf.set(mapping.pharmacyProductId, mapping.externalProductCode);
    }
    for (const [product, code] of codeOf) {
      if (repeated.has(product) || resolved.get(code)?.status !== 'MAPPED')
        codeOf.delete(product);
    }
    if (!codeOf.size) return { mode: 'CONNECTED', liveQuantities: new Map() };
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const needsUnits = [...codeOf.values()].some((code) => {
        const mapping = resolved.get(code);
        return (
          mapping?.status === 'MAPPED' &&
          Boolean(mapping.externalUnitCode?.trim())
        );
      });
      const [catalog, stock] = await Promise.race([
        Promise.all([
          needsUnits
            ? system.client.listProducts({ signal: abort.signal })
            : Promise.resolve([]),
          system.client.stockForSite(branch.code, undefined, {
            signal: abort.signal,
          }),
        ]),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            abort.abort();
            reject(new ExternalCatalogUnavailableError('order deadline'));
          }, DEADLINE_MS);
        }),
      ]);
      const units = new Map<string, string | undefined>();
      const conflictingUnits = new Set<string>();
      for (const item of catalog) {
        if (units.has(item.code) && units.get(item.code) !== item.unitCode)
          conflictingUnits.add(item.code);
        units.set(item.code, item.unitCode);
      }
      const quantities = new Map<string, number>();
      const duplicateStock = new Set<string>();
      for (const line of stock) {
        if (!Number.isSafeInteger(line.quantity) || line.quantity < 0)
          throw new ExternalCatalogUnavailableError('invalid stock');
        if (quantities.has(line.code)) duplicateStock.add(line.code);
        quantities.set(line.code, line.quantity);
      }
      const liveQuantities = new Map<string, number>();
      for (const [product, code] of codeOf) {
        const mapping = resolved.get(code);
        if (
          mapping?.status !== 'MAPPED' ||
          conflictingUnits.has(code) ||
          duplicateStock.has(code) ||
          unitIssue(mapping.externalUnitCode, units.get(code))
        )
          continue;
        // Missing rows retain the approved ledger contract, as in C8.
        if (quantities.has(code))
          liveQuantities.set(product, quantities.get(code)!);
      }
      if (system.check)
        await this.record(pharmacy.tenantId, system.check, 'OK', actorUserId);
      return { mode: 'CONNECTED', liveQuantities };
    } catch (error) {
      if (!(error instanceof ExternalCatalogUnavailableError)) throw error;
      if (system.check)
        await this.record(
          pharmacy.tenantId,
          system.check,
          error.errorReason,
          actorUserId,
        );
      return MANUAL;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      abort.abort();
    }
  }

  private async record(
    tenantId: string,
    check: ExternalSystemCheckToken,
    result: ExternalSystemCheckResult,
    actorUserId: string,
  ): Promise<void> {
    await recordExternalSystemCheck(
      this.em.fork({ keepTransactionContext: true }),
      this.systems,
      { tenantId, check, result, actorUserId },
      () =>
        this.logger.warn(
          {
            operation: 'pharmacy_inventory.order.check_status',
            connectionId: check.connectionId,
            result: 'PERSISTENCE_FAILED',
          },
          'No se pudo registrar el estado del sistema',
        ),
    );
  }
}
