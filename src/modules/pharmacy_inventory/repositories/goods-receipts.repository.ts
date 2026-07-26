import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyGoodsReceipts, PharmacyGoodsReceiptLines } from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una recepción de mercancía. */
export interface CreateGoodsReceiptData {
  pharmacyPurchaseOrderId: string;
  pharmacySiteId: string;
  receiptNumber: string;
  receivedAt: Date;
  supplierDeliveryReference?: string;
  statusConceptId: string;
  idempotencyKey?: string;
  actorUserId?: string;
}

/** Datos de una línea de recepción. */
export interface CreateGoodsReceiptLineData {
  pharmacyGoodsReceiptId: string;
  pharmacyPurchaseOrderLineId: string;
  pharmacyProductId: string;
  inventoryLotId?: string;
  inventoryLocationId?: string;
  receivedQuantity: string;
  acceptedQuantity?: string;
  rejectedQuantity?: string;
  unitCostAmount?: string;
  ledgerEntryId?: string;
  actorUserId?: string;
}

/** Acceso a datos de las recepciones de mercancía y sus líneas. */
@Injectable()
export class GoodsReceiptsRepository {
  findById(em: EntityManager, id: string): Promise<PharmacyGoodsReceipts | null> {
    return em.findOne(PharmacyGoodsReceipts, { id });
  }

  create(em: EntityManager, data: CreateGoodsReceiptData): PharmacyGoodsReceipts {
    return em.create(
      PharmacyGoodsReceipts,
      {
        pharmacyPurchaseOrderId: data.pharmacyPurchaseOrderId,
        pharmacySiteId: data.pharmacySiteId,
        receiptNumber: data.receiptNumber,
        receivedAt: data.receivedAt,
        supplierDeliveryReference: data.supplierDeliveryReference,
        statusConceptId: data.statusConceptId,
        idempotencyKey: data.idempotencyKey,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createLine(em: EntityManager, data: CreateGoodsReceiptLineData): PharmacyGoodsReceiptLines {
    return em.create(
      PharmacyGoodsReceiptLines,
      {
        pharmacyGoodsReceiptId: data.pharmacyGoodsReceiptId,
        pharmacyPurchaseOrderLineId: data.pharmacyPurchaseOrderLineId,
        pharmacyProductId: data.pharmacyProductId,
        inventoryLotId: data.inventoryLotId,
        inventoryLocationId: data.inventoryLocationId,
        receivedQuantity: data.receivedQuantity,
        acceptedQuantity: data.acceptedQuantity,
        rejectedQuantity: data.rejectedQuantity,
        unitCostAmount: data.unitCostAmount,
        ledgerEntryId: data.ledgerEntryId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
