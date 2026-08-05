import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PharmacyGoodsReceipts, PharmacyGoodsReceiptLines } from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de una recepción de mercancía. */
export interface CreateGoodsReceiptData {
  /**
   * Identificador asociado a pharmacy purchase order.
   */
  pharmacyPurchaseOrderId: string;
  /**
   * Identificador asociado a pharmacy site.
   */
  pharmacySiteId: string;
  /**
   * Valor de receipt number mantenido por la instancia.
   */
  receiptNumber: string;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt: Date;
  /**
   * Valor de supplier delivery reference mantenido por la instancia.
   */
  supplierDeliveryReference?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de una línea de recepción. */
export interface CreateGoodsReceiptLineData {
  /**
   * Identificador asociado a pharmacy goods receipt.
   */
  pharmacyGoodsReceiptId: string;
  /**
   * Identificador asociado a pharmacy purchase order line.
   */
  pharmacyPurchaseOrderLineId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId: string;
  /**
   * Identificador asociado a inventory lot.
   */
  inventoryLotId?: string;
  /**
   * Identificador asociado a inventory location.
   */
  inventoryLocationId?: string;
  /**
   * Valor de received quantity mantenido por la instancia.
   */
  receivedQuantity: string;
  /**
   * Valor de accepted quantity mantenido por la instancia.
   */
  acceptedQuantity?: string;
  /**
   * Valor de rejected quantity mantenido por la instancia.
   */
  rejectedQuantity?: string;
  /**
   * Valor de unit cost amount mantenido por la instancia.
   */
  unitCostAmount?: string;
  /**
   * Identificador asociado a ledger entry.
   */
  ledgerEntryId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de las recepciones de mercancía y sus líneas. */
@Injectable()
export class GoodsReceiptsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PharmacyGoodsReceipts | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PharmacyGoodsReceipts | null> {
    return em.findOne(PharmacyGoodsReceipts, { id });
  }

  /** Recepción previa con la misma clave de idempotencia (retry seguro). */
  findByIdempotencyKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<PharmacyGoodsReceipts | null> {
    return em.findOne(PharmacyGoodsReceipts, { idempotencyKey });
  }

  /** Líneas de una recepción (para reconstruir lotes en respuestas idempotentes). */
  findLines(
    em: EntityManager,
    receiptId: string,
  ): Promise<PharmacyGoodsReceiptLines[]> {
    return em.find(PharmacyGoodsReceiptLines, {
      pharmacyGoodsReceiptId: receiptId,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PharmacyGoodsReceipts`.
   */
  create(
    em: EntityManager,
    data: CreateGoodsReceiptData,
  ): PharmacyGoodsReceipts {
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

  /**
   * Crea create line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create line conforme al contrato `PharmacyGoodsReceiptLines`.
   */
  createLine(
    em: EntityManager,
    data: CreateGoodsReceiptLineData,
  ): PharmacyGoodsReceiptLines {
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
