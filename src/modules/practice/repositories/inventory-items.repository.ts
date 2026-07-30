import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryItems } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un insumo de inventario. */
export interface CreateInventoryItemData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de quantity on hand mantenido por la instancia.
   */
  quantityOnHand: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a product concept.
   */
  productConceptId?: string;
  /**
   * Valor de lot number mantenido por la instancia.
   */
  lotNumber?: string;
  /**
   * Valor de expiry date mantenido por la instancia.
   */
  expiryDate?: Date;
  /**
   * Identificador asociado a unit concept.
   */
  unitConceptId?: string;
  /**
   * Valor de reorder level mantenido por la instancia.
   */
  reorderLevel?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `practice.inventory_items` (stateless). */
@Injectable()
export class InventoryItemsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<InventoryItems | null>`.
   */
  findById(em: EntityManager, id: string): Promise<InventoryItems | null> {
    return em.findOne(InventoryItems, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventoryItems`.
   */
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
