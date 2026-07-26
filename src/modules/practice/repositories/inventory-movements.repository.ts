import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryMovements } from '../entities';

/**
 * Datos para registrar un movimiento de inventario. La tabla es append-only y
 * NO tiene columnas de auditoría/versión (solo `recorded_at`/`recorded_by`).
 */
export interface CreateMovementData {
  inventoryItemId: string;
  movementTypeConceptId: string;
  quantity: string;
  relatedResourceType?: string;
  relatedResourceId?: string;
  occurredAt?: Date;
  recordedAt: Date;
  recordedByUserId?: string;
}

/** Acceso a datos de `practice.inventory_movements` (stateless, append-only). */
@Injectable()
export class InventoryMovementsRepository {
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
