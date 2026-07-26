import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryItems } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un insumo de inventario. */
export interface CreateInventoryItemData {
  practiceId: string;
  name: string;
  quantityOnHand: string;
  statusConceptId: string;
  productConceptId?: string;
  lotNumber?: string;
  expiryDate?: Date;
  unitConceptId?: string;
  reorderLevel?: string;
  actorUserId?: string;
}

/** Acceso a datos de `practice.inventory_items` (stateless). */
@Injectable()
export class InventoryItemsRepository {
  findById(em: EntityManager, id: string): Promise<InventoryItems | null> {
    return em.findOne(InventoryItems, { id });
  }

  create(em: EntityManager, data: CreateInventoryItemData): InventoryItems {
    return em.create(
      InventoryItems,
      {
        practiceId: data.practiceId,
        productConceptId: data.productConceptId,
        name: data.name,
        lotNumber: data.lotNumber,
        expiryDate: data.expiryDate,
        quantityOnHand: data.quantityOnHand,
        unitConceptId: data.unitConceptId,
        reorderLevel: data.reorderLevel,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
