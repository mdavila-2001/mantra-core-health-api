import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryLots } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear un lote de inventario. */
export interface CreateLotData {
  pharmacyProductId: string;
  lotNumber: string;
  manufacturerLotNumber?: string;
  expiresAt?: Date;
  receivedAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.inventory_lots`. */
@Injectable()
export class LotsRepository {
  findById(em: EntityManager, id: string): Promise<InventoryLots | null> {
    return em.findOne(InventoryLots, { id });
  }

  /** Busca el lote de un producto por número (para el UPSERT de recepción). */
  findByProductAndNumber(
    em: EntityManager,
    pharmacyProductId: string,
    lotNumber: string,
  ): Promise<InventoryLots | null> {
    return em.findOne(InventoryLots, { pharmacyProductId, lotNumber });
  }

  create(em: EntityManager, data: CreateLotData): InventoryLots {
    return em.create(
      InventoryLots,
      {
        pharmacyProductId: data.pharmacyProductId,
        lotNumber: data.lotNumber,
        manufacturerLotNumber: data.manufacturerLotNumber,
        expiresAt: data.expiresAt,
        receivedAt: data.receivedAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
