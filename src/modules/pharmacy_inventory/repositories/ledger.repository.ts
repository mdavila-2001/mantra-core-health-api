import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryLedgerEntries } from '../entities';

/** Datos de un asiento inmutable del ledger de inventario. */
export interface AppendLedgerData {
  pharmacyId: string;
  pharmacySiteId: string;
  inventoryLocationId: string;
  pharmacyProductId: string;
  inventoryLotId?: string;
  inventorySerialId?: string;
  ledgerSequence: string;
  movementTypeConceptId: string;
  quantityDelta: string;
  reservationDelta?: string;
  quarantineDelta?: string;
  unitCostAmount?: string;
  sourceTypeConceptId?: string;
  sourceId?: string;
  idempotencyKey?: string;
  correlationId?: string;
  recordedByUserId?: string;
}

/**
 * Acceso a datos de `pharmacy_inventory.inventory_ledger_entries` (append-only).
 *
 * El ledger es inmutable: solo se insertan asientos, nunca se actualizan o
 * borran. El servicio calcula la siguiente secuencia por farmacia con `nextSequence`.
 */
@Injectable()
export class LedgerRepository {
  /** Devuelve la siguiente secuencia monotónica para una farmacia. */
  async nextSequence(em: EntityManager, pharmacyId: string): Promise<string> {
    const rows = await em
      .getConnection()
      .execute<{ max: string | null }[]>(
        'select max(ledger_sequence) as max from pharmacy_inventory.inventory_ledger_entries where pharmacy_id = ?',
        [pharmacyId],
      );
    const current = rows?.[0]?.max ? BigInt(rows[0].max) : 0n;
    return (current + 1n).toString();
  }

  append(em: EntityManager, data: AppendLedgerData): InventoryLedgerEntries {
    const now = new Date();
    return em.create(
      InventoryLedgerEntries,
      {
        pharmacyId: data.pharmacyId,
        pharmacySiteId: data.pharmacySiteId,
        inventoryLocationId: data.inventoryLocationId,
        pharmacyProductId: data.pharmacyProductId,
        inventoryLotId: data.inventoryLotId,
        inventorySerialId: data.inventorySerialId,
        ledgerSequence: data.ledgerSequence,
        movementTypeConceptId: data.movementTypeConceptId,
        quantityDelta: data.quantityDelta,
        reservationDelta: data.reservationDelta,
        quarantineDelta: data.quarantineDelta,
        unitCostAmount: data.unitCostAmount,
        sourceTypeConceptId: data.sourceTypeConceptId,
        sourceId: data.sourceId,
        idempotencyKey: data.idempotencyKey,
        correlationId: data.correlationId,
        occurredAt: now,
        recordedAt: now,
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }
}
