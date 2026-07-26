import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventorySerials } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear un serial de inventario. */
export interface CreateSerialData {
  inventoryLotId: string;
  serialNumber: string;
  verificationIdentifier?: string;
  statusConceptId: string;
  currentInventoryLocationId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.inventory_serials`. */
@Injectable()
export class SerialsRepository {
  findById(em: EntityManager, id: string): Promise<InventorySerials | null> {
    return em.findOne(InventorySerials, { id });
  }

  create(em: EntityManager, data: CreateSerialData): InventorySerials {
    return em.create(
      InventorySerials,
      {
        inventoryLotId: data.inventoryLotId,
        serialNumber: data.serialNumber,
        verificationIdentifier: data.verificationIdentifier,
        statusConceptId: data.statusConceptId,
        currentInventoryLocationId: data.currentInventoryLocationId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
