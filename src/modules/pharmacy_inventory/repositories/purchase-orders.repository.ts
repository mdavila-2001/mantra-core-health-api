import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PharmacyPurchaseOrders,
  PharmacyPurchaseOrderLines,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una orden de compra. */
export interface CreatePurchaseOrderData {
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Identificador asociado a pharmacy site.
   */
  pharmacySiteId: string;
  /**
   * Identificador asociado a pharmacy supplier.
   */
  pharmacySupplierId: string;
  /**
   * Valor de purchase order number mantenido por la instancia.
   */
  purchaseOrderNumber: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de ordered at mantenido por la instancia.
   */
  orderedAt?: Date;
  /**
   * Valor de expected at mantenido por la instancia.
   */
  expectedAt?: Date;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de una línea de orden de compra. */
export interface CreatePurchaseOrderLineData {
  /**
   * Identificador asociado a pharmacy purchase order.
   */
  pharmacyPurchaseOrderId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Valor de ordered quantity mantenido por la instancia.
   */
  orderedQuantity: string;
  /**
   * Valor de unit cost amount mantenido por la instancia.
   */
  unitCostAmount?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de las órdenes de compra de farmacia y sus líneas. */
@Injectable()
export class PurchaseOrdersRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PharmacyPurchaseOrders | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PharmacyPurchaseOrders | null> {
    return em.findOne(PharmacyPurchaseOrders, { id });
  }

  /** Orden previa con la misma clave de idempotencia (retry seguro). */
  findByIdempotencyKey(
    em: EntityManager,
    pharmacyId: string,
    idempotencyKey: string,
  ): Promise<PharmacyPurchaseOrders | null> {
    return em.findOne(PharmacyPurchaseOrders, { pharmacyId, idempotencyKey });
  }

  /**
   * Obtiene find lines by order.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param orderId - Identificador de order.
   * @returns Resultado de find lines by order conforme al contrato `Promise<PharmacyPurchaseOrderLines[]>`.
   */
  findLinesByOrder(
    em: EntityManager,
    orderId: string,
  ): Promise<PharmacyPurchaseOrderLines[]> {
    return em.find(PharmacyPurchaseOrderLines, {
      pharmacyPurchaseOrderId: orderId,
    });
  }

  /**
   * Obtiene find line by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find line by id conforme al contrato `Promise<PharmacyPurchaseOrderLines | null>`.
   */
  findLineById(
    em: EntityManager,
    id: string,
  ): Promise<PharmacyPurchaseOrderLines | null> {
    return em.findOne(PharmacyPurchaseOrderLines, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PharmacyPurchaseOrders`.
   */
  create(
    em: EntityManager,
    data: CreatePurchaseOrderData,
  ): PharmacyPurchaseOrders {
    return em.create(
      PharmacyPurchaseOrders,
      {
        pharmacyId: data.pharmacyId,
        pharmacySiteId: data.pharmacySiteId,
        pharmacySupplierId: data.pharmacySupplierId,
        purchaseOrderNumber: data.purchaseOrderNumber,
        statusConceptId: data.statusConceptId,
        orderedAt: data.orderedAt,
        expectedAt: data.expectedAt,
        currencyConceptId: data.currencyConceptId,
        idempotencyKey: data.idempotencyKey,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create line conforme al contrato `PharmacyPurchaseOrderLines`.
   */
  createLine(
    em: EntityManager,
    data: CreatePurchaseOrderLineData,
  ): PharmacyPurchaseOrderLines {
    return em.create(
      PharmacyPurchaseOrderLines,
      {
        pharmacyPurchaseOrderId: data.pharmacyPurchaseOrderId,
        pharmacyProductId: data.pharmacyProductId,
        orderedQuantity: data.orderedQuantity,
        unitCostAmount: data.unitCostAmount,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
