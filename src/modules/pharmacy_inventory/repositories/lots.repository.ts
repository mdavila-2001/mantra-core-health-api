import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryLots } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear un lote de inventario. */
export interface CreateLotData {
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Valor de lot number mantenido por la instancia.
   */
  lotNumber: string;
  /**
   * Valor de manufacturer lot number mantenido por la instancia.
   */
  manufacturerLotNumber?: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.inventory_lots`. */
@Injectable()
export class LotsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<InventoryLots | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventoryLots`.
   */
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
