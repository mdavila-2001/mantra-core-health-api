import type {
  InventoryLedgerItemDto,
  InventoryLocationItemDto,
  InventoryLotItemDto,
  InventoryPositionItemDto,
} from '../../presentation/dto';
import type { LedgerListRow } from '../../infrastructure/repositories/ledger-management.repository';
import type { LocationListRow } from '../../infrastructure/repositories/locations.repository';
import type { LotListRow } from '../../infrastructure/repositories/lots.repository';
import type {
  LotSiteStockRow,
  PositionListRow,
} from '../../infrastructure/repositories/stock-management.repository';

/** A `numeric` column (text) as a number; unreadable values count as 0. */
function quantity(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** A concept as `{ code, display }`, or `null` when the column is empty. */
function concept(
  code: string | null,
  display: string | null,
): { code: string; display: string } | null {
  return code === null ? null : { code, display: display ?? code };
}

/** A lot reference, or `null` for stock kept without lots. */
function lotRef(
  id: string | null,
  number: string | null,
  expiresAt: string | null,
): { id: string; number: string; expiresAt: string | null } | null {
  return id === null || number === null ? null : { id, number, expiresAt };
}

export function toLocationItem(row: LocationListRow): InventoryLocationItemDto {
  return {
    id: row.id,
    siteId: row.siteId,
    siteName: row.siteName,
    code: row.code,
    name: row.name,
  };
}

export function toPositionItem(row: PositionListRow): InventoryPositionItemDto {
  return {
    id: row.id,
    product: { id: row.productId, name: row.productName },
    site: { id: row.siteId, name: row.siteName },
    location: {
      id: row.locationId,
      code: row.locationCode,
      name: row.locationName,
    },
    lot: lotRef(row.lotId, row.lotNumber, row.expiresAt),
    onHand: quantity(row.onHand),
    reserved: quantity(row.reserved),
    quarantine: quantity(row.quarantine),
    available: quantity(row.available),
  };
}

export function toLedgerItem(row: LedgerListRow): InventoryLedgerItemDto {
  return {
    id: row.id,
    sequence: row.sequence,
    occurredAt: new Date(row.occurredAt).toISOString(),
    movementType: {
      id: row.movementTypeId,
      code: row.movementTypeCode,
      display: row.movementTypeDisplay,
    },
    product: { id: row.productId, name: row.productName },
    site: { id: row.siteId, name: row.siteName },
    location: {
      id: row.locationId,
      code: row.locationCode,
      name: row.locationName,
    },
    lot: lotRef(row.lotId, row.lotNumber, row.lotExpiresAt),
    quantityDelta: quantity(row.quantityDelta),
    reservationDelta: quantity(row.reservationDelta),
    quarantineDelta: quantity(row.quarantineDelta),
    sourceType: concept(row.sourceTypeCode, row.sourceTypeDisplay),
    sourceId: row.sourceId,
    unitCostAmount: row.unitCostAmount,
    currencyCode: row.currencyCode,
  };
}

/** Lots joined with their on-hand stock per site (already in the same scope). */
export function toLotItems(
  lots: readonly LotListRow[],
  stock: readonly LotSiteStockRow[],
): InventoryLotItemDto[] {
  return lots.map((lot) => {
    const bySite = stock
      .filter((row) => row.lotId === lot.id)
      .map((row) => ({
        siteId: row.siteId,
        siteName: row.siteName,
        onHand: quantity(row.onHand),
      }));
    return {
      id: lot.id,
      product: { id: lot.productId, name: lot.productName },
      lotNumber: lot.lotNumber,
      expiresAt: lot.expiresAt,
      quarantineStatus: concept(lot.quarantineCode, lot.quarantineDisplay),
      recallStatus: concept(lot.recallCode, lot.recallDisplay),
      onHandTotal: bySite.reduce((sum, site) => sum + site.onHand, 0),
      bySite,
    };
  });
}
