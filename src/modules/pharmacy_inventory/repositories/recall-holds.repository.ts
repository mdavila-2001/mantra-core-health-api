import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InventoryRecallHolds } from '../entities';
import { createdBy } from '../../../common';

/** Datos para aplicar un hold de recall sobre un lote/producto. */
export interface CreateRecallHoldData {
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Identificador asociado a inventory lot.
   */
  inventoryLotId?: string;
  /**
   * Valor de recall reference mantenido por la instancia.
   */
  recallReference: string;
  /**
   * Identificador asociado a recall class concept.
   */
  recallClassConceptId: string;
  /**
   * Identificador asociado a hold status concept.
   */
  holdStatusConceptId: string;
  /**
   * Valor de initiated at mantenido por la instancia.
   */
  initiatedAt?: Date;
  /**
   * Identificador asociado a source authority tenant.
   */
  sourceAuthorityTenantId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `pharmacy_inventory.inventory_recall_holds`. */
@Injectable()
export class RecallHoldsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<InventoryRecallHolds | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<InventoryRecallHolds | null> {
    return em.findOne(InventoryRecallHolds, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `InventoryRecallHolds`.
   */
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
