import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PharmacyPurchaseOrders,
  PharmacyPurchaseOrderLines,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una orden de compra. */
export interface CreatePurchaseOrderData {
  pharmacyId: string;
  pharmacySiteId: string;
  pharmacySupplierId: string;
  purchaseOrderNumber: string;
  statusConceptId: string;
  orderedAt?: Date;
  expectedAt?: Date;
  currencyConceptId?: string;
  idempotencyKey?: string;
  actorUserId?: string;
}

/** Datos de una línea de orden de compra. */
export interface CreatePurchaseOrderLineData {
  pharmacyPurchaseOrderId: string;
  pharmacyProductId: string;
  orderedQuantity: string;
  unitCostAmount?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de las órdenes de compra de farmacia y sus líneas. */
@Injectable()
export class PurchaseOrdersRepository {
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

  findLinesByOrder(
    em: EntityManager,
    orderId: string,
  ): Promise<PharmacyPurchaseOrderLines[]> {
    return em.find(PharmacyPurchaseOrderLines, {
      pharmacyPurchaseOrderId: orderId,
    });
  }

  findLineById(
    em: EntityManager,
    id: string,
  ): Promise<PharmacyPurchaseOrderLines | null> {
    return em.findOne(PharmacyPurchaseOrderLines, { id });
  }

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
