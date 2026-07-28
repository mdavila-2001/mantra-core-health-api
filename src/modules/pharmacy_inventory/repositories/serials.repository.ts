import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventorySerials } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear un serial de inventario. */
export interface CreateSerialData {
  /**
   * Identificador asociado a inventory lot.
   */
  inventoryLotId: string;
  /**
   * Valor de serial number mantenido por la instancia.
   */
  serialNumber: string;
  /**
   * Valor de verification identifier mantenido por la instancia.
   */
  verificationIdentifier?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a current inventory location.
   */
  currentInventoryLocationId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.inventory_serials`. */
@Injectable()
export class SerialsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<InventorySerials | null>`.
   */
  findById(em: EntityManager, id: string): Promise<InventorySerials | null> {
    return em.findOne(InventorySerials, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventorySerials`.
   */
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
