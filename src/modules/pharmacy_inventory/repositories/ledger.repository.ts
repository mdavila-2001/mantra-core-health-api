import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryLedgerEntries } from '../entities';

/** Datos de un asiento inmutable del ledger de inventario. */
export interface AppendLedgerData {
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Identificador asociado a pharmacy site.
   */
  pharmacySiteId: string;
  /**
   * Identificador asociado a inventory location.
   */
  inventoryLocationId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Identificador asociado a inventory lot.
   */
  inventoryLotId?: string;
  /**
   * Identificador asociado a inventory serial.
   */
  inventorySerialId?: string;
  /**
   * Valor de ledger sequence mantenido por la instancia.
   */
  ledgerSequence: string;
  /**
   * Identificador asociado a movement type concept.
   */
  movementTypeConceptId: string;
  /**
   * Valor de quantity delta mantenido por la instancia.
   */
  quantityDelta: string;
  /**
   * Valor de reservation delta mantenido por la instancia.
   */
  reservationDelta?: string;
  /**
   * Valor de quarantine delta mantenido por la instancia.
   */
  quarantineDelta?: string;
  /**
   * Valor de unit cost amount mantenido por la instancia.
   */
  unitCostAmount?: string;
  /**
   * Identificador asociado a source type concept.
   */
  sourceTypeConceptId?: string;
  /**
   * Identificador asociado a source.
   */
  sourceId?: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey?: string;
  /**
   * Identificador asociado a correlation.
   */
  correlationId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
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
  /**
   * Devuelve la siguiente secuencia monotónica para una farmacia.
   *
   * Antes de calcular `max()+1` toma un advisory lock transaccional por farmacia
   * (`pg_advisory_xact_lock`): serializa la generación de secuencia entre
   * transacciones concurrentes, evitando dos asientos con el mismo
   * `ledger_sequence`. El lock se libera al COMMIT/ROLLBACK. El índice único
   * `uq_inventory_ledger_entries_pharmacy_id_ledger_sequence` es la red de
   * seguridad final. Se usa `em.execute` (no `getConnection().execute`) para que
   * lock y lectura corran DENTRO de la transacción activa y vean los asientos aún
   * no confirmados de esta misma unidad de trabajo.
   */
  async nextSequence(em: EntityManager, pharmacyId: string): Promise<string> {
    await em.execute('select pg_advisory_xact_lock(hashtext(?))', [
      `pharmacy_inventory.ledger:${pharmacyId}`,
    ]);
    const rows = await em.execute<
      {
        /**
         * Valor de max mantenido por la instancia.
         */
        max: string | null;
      }[]
    >(
      'select max(ledger_sequence) as max from pharmacy_inventory.inventory_ledger_entries where pharmacy_id = ?',
      [pharmacyId],
    );
    const current = rows?.[0]?.max ? BigInt(rows[0].max) : 0n;
    return (current + 1n).toString();
  }

  /** Ids de los asientos originados por un recurso (para respuestas idempotentes). */
  async findEntryIdsBySource(
    em: EntityManager,
    sourceId: string,
  ): Promise<string[]> {
    const entries = await em.find(
      InventoryLedgerEntries,
      { sourceId },
      { fields: ['id'], orderBy: { ledgerSequence: 'asc' } },
    );
    return entries.map((e) => e.id);
  }

  /**
   * Ejecuta la operación append.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de append conforme al contrato `InventoryLedgerEntries`.
   */
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
