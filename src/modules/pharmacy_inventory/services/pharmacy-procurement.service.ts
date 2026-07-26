import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  SuppliersRepository,
  PurchaseOrdersRepository,
  GoodsReceiptsRepository,
  LocationsRepository,
  LotsRepository,
  LedgerRepository,
  StockPositionsRepository,
} from '../repositories';
import {
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  CreateGoodsReceiptDto,
  IdResponseDto,
  PurchaseOrderResponseDto,
  GoodsReceiptResponseDto,
} from '../dto';
import { PINV } from '../pharmacy_inventory.concepts';

const num = (v: string | null | undefined): number => (v == null ? 0 : Number(v));

/**
 * Aprovisionamiento: proveedores (bootstrap), emisión de órdenes de compra
 * (UC-25-01) y recepción de mercancía por lote (UC-25-02). La recepción es la
 * puerta de entrada del stock: UPSERT de lotes, asiento inmutable en el ledger y
 * actualización de la posición de stock, todo en la misma transacción.
 */
@Injectable()
export class PharmacyProcurementService {
  constructor(
    private readonly em: EntityManager,
    private readonly suppliersRepo: SuppliersRepository,
    private readonly ordersRepo: PurchaseOrdersRepository,
    private readonly receiptsRepo: GoodsReceiptsRepository,
    private readonly locationsRepo: LocationsRepository,
    private readonly lotsRepo: LotsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly stockRepo: StockPositionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PharmacyProcurementService.name);
  }

  /** Bootstrap: crea un proveedor activo para una farmacia. */
  async createSupplier(
    pharmacyId: string,
    dto: CreateSupplierDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    this.logger.info({ operation: 'pharmacy_inventory.supplier.create', pharmacyId }, 'Creating supplier');
    return this.em.transactional(async (tx) => {
      const supplier = this.suppliersRepo.create(tx, {
        pharmacyId,
        supplierTenantId: dto.supplierTenantId,
        supplierCode: dto.supplierCode,
        businessPartnerId: dto.businessPartnerId,
        paymentTermsConceptId: PINV.PAYMENT_TERMS_NET30,
        statusConceptId: PINV.SUPPLIER_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: supplier.id };
    });
  }

  /** UC-25-01: emite una orden de compra (DRAFT -> ORDERED) con N líneas. */
  async createPurchaseOrder(
    pharmacyId: string,
    dto: CreatePurchaseOrderDto,
    actor: AuthenticatedUser,
  ): Promise<PurchaseOrderResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.purchase_order.create', pharmacyId, lines: dto.lines.length },
      'Placing purchase order',
    );
    return this.em.transactional(async (tx) => {
      const supplier = await this.suppliersRepo.findById(tx, dto.pharmacySupplierId);
      if (!supplier) {
        throw new ResourceNotFoundException('Proveedor no encontrado', { supplierId: dto.pharmacySupplierId });
      }
      if (supplier.statusConceptId !== PINV.SUPPLIER_ACTIVE) {
        throw new PreconditionFailedException('El proveedor no está activo', {
          supplierId: supplier.id,
        });
      }

      const number = dto.purchaseOrderNumber ?? `PO-${Date.now()}`;
      const order = this.ordersRepo.create(tx, {
        pharmacyId,
        pharmacySiteId: dto.pharmacySiteId,
        pharmacySupplierId: dto.pharmacySupplierId,
        purchaseOrderNumber: number,
        statusConceptId: PINV.PO_ORDERED,
        orderedAt: new Date(),
        currencyConceptId: PINV.CURRENCY_USD,
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      await tx.flush();

      const lineIds: string[] = [];
      for (const line of dto.lines) {
        const created = this.ordersRepo.createLine(tx, {
          pharmacyPurchaseOrderId: order.id,
          pharmacyProductId: line.pharmacyProductId,
          orderedQuantity: String(line.orderedQuantity),
          unitCostAmount: line.unitCostAmount != null ? String(line.unitCostAmount) : undefined,
          statusConceptId: PINV.PO_LINE_ORDERED,
          actorUserId: actor.id,
        });
        lineIds.push(created.id);
      }
      await tx.flush();

      return { id: order.id, purchaseOrderNumber: number, lineIds };
    });
  }

  /** UC-25-02: recepción de mercancía; ingresa stock vía ledger inmutable. */
  async receiveGoods(
    pharmacyId: string,
    dto: CreateGoodsReceiptDto,
    actor: AuthenticatedUser,
  ): Promise<GoodsReceiptResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.goods_receipt.create', pharmacyId, poId: dto.pharmacyPurchaseOrderId },
      'Posting goods receipt',
    );
    return this.em.transactional(async (tx) => {
      const order = await this.ordersRepo.findById(tx, dto.pharmacyPurchaseOrderId);
      if (!order) {
        throw new ResourceNotFoundException('Orden de compra no encontrada', {
          poId: dto.pharmacyPurchaseOrderId,
        });
      }
      if (order.statusConceptId !== PINV.PO_ORDERED && order.statusConceptId !== PINV.PO_PARTIAL) {
        throw new PreconditionFailedException('La orden no admite recepción', {
          poId: order.id,
        });
      }
      const location = await this.locationsRepo.findById(tx, dto.inventoryLocationId);
      if (!location) {
        throw new ResourceNotFoundException('Ubicación destino no encontrada', {
          locationId: dto.inventoryLocationId,
        });
      }

      const receipt = this.receiptsRepo.create(tx, {
        pharmacyPurchaseOrderId: order.id,
        pharmacySiteId: dto.pharmacySiteId,
        receiptNumber: `GR-${Date.now()}`,
        receivedAt: new Date(),
        supplierDeliveryReference: dto.supplierDeliveryReference,
        statusConceptId: PINV.RECEIPT_POSTED,
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      await tx.flush();

      const lotIds: string[] = [];
      const ledgerEntryIds: string[] = [];

      for (const line of dto.lines) {
        const poLine = await this.ordersRepo.findLineById(tx, line.pharmacyPurchaseOrderLineId);
        if (!poLine) {
          throw new ResourceNotFoundException('Línea de orden no encontrada', {
            lineId: line.pharmacyPurchaseOrderLineId,
          });
        }

        // UPSERT del lote por (producto, número de lote).
        let lot = await this.lotsRepo.findByProductAndNumber(tx, line.pharmacyProductId, line.lotNumber);
        if (!lot) {
          lot = this.lotsRepo.create(tx, {
            pharmacyProductId: line.pharmacyProductId,
            lotNumber: line.lotNumber,
            expiresAt: line.expiresAt ? new Date(line.expiresAt) : undefined,
            receivedAt: new Date(),
            statusConceptId: PINV.LOT_ACTIVE,
            actorUserId: actor.id,
          });
          await tx.flush();
        }
        lotIds.push(lot.id);

        const accepted = line.acceptedQuantity ?? line.receivedQuantity;

        const sequence = await this.ledgerRepo.nextSequence(tx, pharmacyId);
        const entry = this.ledgerRepo.append(tx, {
          pharmacyId,
          pharmacySiteId: dto.pharmacySiteId,
          inventoryLocationId: dto.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: lot.id,
          ledgerSequence: sequence,
          movementTypeConceptId: PINV.MV_RECEIPT,
          quantityDelta: String(accepted),
          unitCostAmount: line.unitCostAmount != null ? String(line.unitCostAmount) : undefined,
          sourceId: receipt.id,
          idempotencyKey: dto.idempotencyKey,
          recordedByUserId: actor.id,
        });
        await tx.flush();
        ledgerEntryIds.push(entry.id);

        // UPSERT de la posición de stock del lote.
        let position = await this.stockRepo.findByKey(tx, {
          inventoryLocationId: dto.inventoryLocationId,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: lot.id,
        });
        if (!position) {
          position = this.stockRepo.create(tx, {
            inventoryLocationId: dto.inventoryLocationId,
            pharmacyProductId: line.pharmacyProductId,
            inventoryLotId: lot.id,
            onHandQuantity: String(accepted),
            availableQuantity: String(accepted),
            lastLedgerSequence: sequence,
          });
        } else {
          position.onHandQuantity = String(num(position.onHandQuantity) + accepted);
          position.availableQuantity = String(
            num(position.onHandQuantity) - num(position.reservedQuantity) - num(position.quarantineQuantity),
          );
          position.lastLedgerSequence = sequence;
          position.updatedAt = new Date();
        }

        this.receiptsRepo.createLine(tx, {
          pharmacyGoodsReceiptId: receipt.id,
          pharmacyPurchaseOrderLineId: poLine.id,
          pharmacyProductId: line.pharmacyProductId,
          inventoryLotId: lot.id,
          inventoryLocationId: dto.inventoryLocationId,
          receivedQuantity: String(line.receivedQuantity),
          acceptedQuantity: String(accepted),
          rejectedQuantity: line.rejectedQuantity != null ? String(line.rejectedQuantity) : undefined,
          unitCostAmount: line.unitCostAmount != null ? String(line.unitCostAmount) : undefined,
          actorUserId: actor.id,
        });

        // Avance de la línea de la orden.
        poLine.receivedQuantity = String(num(poLine.receivedQuantity) + accepted);
        poLine.statusConceptId =
          num(poLine.receivedQuantity) >= num(poLine.orderedQuantity)
            ? PINV.PO_LINE_RECEIVED
            : PINV.PO_LINE_PARTIAL;
        touch(poLine, actor.id);
      }

      order.statusConceptId = PINV.PO_PARTIAL;
      touch(order, actor.id);
      await tx.flush();

      return { id: receipt.id, receiptNumber: receipt.receiptNumber, lotIds, ledgerEntryIds };
    });
  }
}
