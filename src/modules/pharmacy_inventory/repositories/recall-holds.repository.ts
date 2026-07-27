import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryRecallHolds } from '../entities';
import { createdBy } from '../../../common';

/** Datos para aplicar un hold de recall sobre un lote/producto. */
export interface CreateRecallHoldData {
  pharmacyProductId: string;
  inventoryLotId?: string;
  recallReference: string;
  recallClassConceptId: string;
  holdStatusConceptId: string;
  initiatedAt?: Date;
  sourceAuthorityTenantId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.inventory_recall_holds`. */
@Injectable()
export class RecallHoldsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<InventoryRecallHolds | null> {
    return em.findOne(InventoryRecallHolds, { id });
  }

  create(em: EntityManager, data: CreateRecallHoldData): InventoryRecallHolds {
    return em.create(
      InventoryRecallHolds,
      {
        pharmacyProductId: data.pharmacyProductId,
        inventoryLotId: data.inventoryLotId,
        recallReference: data.recallReference,
        recallClassConceptId: data.recallClassConceptId,
        holdStatusConceptId: data.holdStatusConceptId,
        initiatedAt: data.initiatedAt,
        sourceAuthorityTenantId: data.sourceAuthorityTenantId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
