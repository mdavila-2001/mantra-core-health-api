import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryMovements } from '../entities';

/**
 * Datos para registrar un movimiento de inventario. La tabla es append-only y
 * NO tiene columnas de auditoría/versión (solo `recorded_at`/`recorded_by`).
 */
export interface CreateMovementData {
  /**
   * Identificador asociado a inventory item.
   */
  inventoryItemId: string;
  /**
   * Identificador asociado a movement type concept.
   */
  movementTypeConceptId: string;
  /**
   * Valor de quantity mantenido por la instancia.
   */
  quantity: string;
  /**
   * Valor de related resource type mantenido por la instancia.
   */
  relatedResourceType?: string;
  /**
   * Identificador asociado a related resource.
   */
  relatedResourceId?: string;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt?: Date;
  /**
   * Valor de recorded at mantenido por la instancia.
   */
  recordedAt: Date;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/** Acceso a datos de `practice.inventory_movements` (stateless, append-only). */
@Injectable()
export class InventoryMovementsRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventoryMovements`.
   */
  create(em: EntityManager, data: CreateMovementData): InventoryMovements {
    return em.create(
      InventoryMovements,
      {
        inventoryItemId: data.inventoryItemId,
        movementTypeConceptId: data.movementTypeConceptId,
        quantity: data.quantity,
        relatedResourceType: data.relatedResourceType,
        relatedResourceId: data.relatedResourceId,
        occurredAt: data.occurredAt,
        recordedAt: data.recordedAt,
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }
}
