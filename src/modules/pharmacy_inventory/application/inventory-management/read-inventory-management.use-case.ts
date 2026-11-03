import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PageResponseDto, type AuthenticatedUser } from '../../../../common';
import {
  LedgerManagementRepository,
  LocationsRepository,
  LotsRepository,
  StockManagementRepository,
} from '../../infrastructure/repositories';
import type {
  InventoryLedgerItemDto,
  InventoryLedgerQueryDto,
  InventoryLocationListDto,
  InventoryLocationsQueryDto,
  InventoryLotItemDto,
  InventoryLotsQueryDto,
  InventoryPositionItemDto,
  InventoryPositionsQueryDto,
} from '../../presentation/dto';
import {
  PharmacyInventoryScopePolicy,
  type PharmacyScope,
} from '../scope/pharmacy-inventory-scope.policy';
import {
  toLedgerItem,
  toLocationItem,
  toLotItems,
  toPositionItem,
} from './inventory-management.mappers';

/** Ids a management query can narrow by; each must belong to the pharmacy. */
interface ScopedIds {
  siteId?: string;
  locationId?: string;
  productId?: string;
  lotId?: string;
}

const offsetOf = (page: number, pageSize: number): number =>
  (page - 1) * pageSize;

/**
 * Read-only management view of a pharmacy's own inventory (locations,
 * positions, ledger, lots). Unlike the patient directory it also shows
 * unpublished sites. Isolation is the scope policy: the pharmacy must belong
 * to the session tenant and every id in the query must belong to the
 * pharmacy, otherwise the same 404 as a missing resource.
 */
@Injectable()
export class ReadInventoryManagementUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly scope: PharmacyInventoryScopePolicy,
    private readonly locationsRepo: LocationsRepository,
    private readonly positionsRepo: StockManagementRepository,
    private readonly ledgerRepo: LedgerManagementRepository,
    private readonly lotsRepo: LotsRepository,
  ) {}

  async locations(
    pharmacyId: string,
    query: InventoryLocationsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<InventoryLocationListDto> {
    const { tx, pharmacy } = await this.resolve(pharmacyId, query, actor);
    const rows = await this.locationsRepo.listActiveForManagement(
      tx,
      pharmacy.pharmacyId,
      query.siteId,
    );
    return { items: rows.map(toLocationItem) };
  }

  async positions(
    pharmacyId: string,
    query: InventoryPositionsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<PageResponseDto<InventoryPositionItemDto>> {
    const { tx, pharmacy } = await this.resolve(pharmacyId, query, actor);
    const { rows, total } = await this.positionsRepo.listForManagement(tx, {
      pharmacyId: pharmacy.pharmacyId,
      siteId: query.siteId,
      locationId: query.locationId,
      productId: query.productId,
      lotId: query.lotId,
      onlyWithStock: query.onlyWithStock === 'true',
      limit: query.pageSize,
      offset: offsetOf(query.page, query.pageSize),
    });
    return new PageResponseDto(
      rows.map(toPositionItem),
      total,
      query.page,
      query.pageSize,
    );
  }

  async ledger(
    pharmacyId: string,
    query: InventoryLedgerQueryDto,
    actor: AuthenticatedUser,
  ): Promise<PageResponseDto<InventoryLedgerItemDto>> {
    const { tx, pharmacy } = await this.resolve(pharmacyId, query, actor);
    const { rows, total } = await this.ledgerRepo.listForManagement(tx, {
      pharmacyId: pharmacy.pharmacyId,
      siteId: query.siteId,
      productId: query.productId,
      lotId: query.lotId,
      movementTypeCode: query.movementType,
      from: query.from === undefined ? undefined : new Date(query.from),
      to: query.to === undefined ? undefined : new Date(query.to),
      limit: query.pageSize,
      offset: offsetOf(query.page, query.pageSize),
    });
    return new PageResponseDto(
      rows.map(toLedgerItem),
      total,
      query.page,
      query.pageSize,
    );
  }

  async lots(
    pharmacyId: string,
    query: InventoryLotsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<PageResponseDto<InventoryLotItemDto>> {
    const { tx, pharmacy } = await this.resolve(pharmacyId, query, actor);
    const { rows, total } = await this.lotsRepo.listForManagement(tx, {
      pharmacyId: pharmacy.pharmacyId,
      siteId: query.siteId,
      productId: query.productId,
      expiringBefore: query.expiringBefore,
      includeExpired: query.includeExpired === 'true',
      limit: query.pageSize,
      offset: offsetOf(query.page, query.pageSize),
    });
    const stock = await this.positionsRepo.sumOnHandByLotAndSite(
      tx,
      pharmacy.pharmacyId,
      rows.map((lot) => lot.id),
      query.siteId,
    );
    return new PageResponseDto(
      toLotItems(rows, stock),
      total,
      query.page,
      query.pageSize,
    );
  }

  /** Resolves the pharmacy and every id of the query inside it (404 if not). */
  private async resolve(
    pharmacyId: string,
    ids: ScopedIds,
    actor: AuthenticatedUser,
  ): Promise<{ tx: EntityManager; pharmacy: PharmacyScope }> {
    const tx = this.em.fork({ keepTransactionContext: true });
    const pharmacy = await this.scope.requireManagedPharmacy(
      tx,
      pharmacyId,
      actor,
    );
    if (ids.siteId !== undefined) {
      const site = await this.scope.requireSite(tx, pharmacy, ids.siteId);
      if (ids.locationId !== undefined) {
        await this.scope.requireLocation(tx, site, ids.locationId);
      }
    } else if (ids.locationId !== undefined) {
      await this.scope.requireLocationInPharmacy(tx, pharmacy, ids.locationId);
    }
    if (ids.productId !== undefined) {
      await this.scope.requireProduct(tx, pharmacy, ids.productId);
    }
    if (ids.lotId !== undefined) await this.requireLot(tx, pharmacy, ids);
    return { tx, pharmacy };
  }

  /** The lot must belong to the given product, or to any product of the pharmacy. */
  private async requireLot(
    tx: EntityManager,
    pharmacy: PharmacyScope,
    ids: ScopedIds,
  ): Promise<void> {
    if (ids.productId !== undefined) {
      await this.scope.requireLot(tx, ids.lotId, ids.productId);
      return;
    }
    const lot = await this.lotsRepo.findById(tx, ids.lotId!);
    if (!lot) throw this.scope.notAvailable();
    await this.scope.requireProduct(tx, pharmacy, lot.pharmacyProductId);
  }
}
