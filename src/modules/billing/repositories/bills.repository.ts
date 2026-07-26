import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Bills, BillLines, Vendors } from '../entities';
import { createdBy } from '../../../common';

/** Cabecera de factura de proveedor a crear. */
export interface CreateBillData {
  practiceId: string;
  vendorId: string;
  billNumber: string;
  issueDate: Date;
  dueDate?: Date;
  statusConceptId: string;
  subtotal?: string;
  taxTotal?: string;
  total?: string;
  paidTotal?: string;
  balance?: string;
  currencyConceptId?: string;
  purchaseOrderId?: string;
  contractId?: string;
  supplierSubledgerAccountId?: string;
  actorUserId?: string;
}

/** Línea de factura de proveedor a crear. */
export interface CreateBillLineData {
  billId: string;
  description?: string;
  quantity: string;
  unitPrice: string;
  taxAmount?: string;
  lineTotal?: string;
  expenseAccountId?: string;
  costCenterId?: string;
  purchaseOrderItemId?: string;
  goodsReceiptItemId?: string;
  serviceEntryItemId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `billing.bills`, `billing.bill_lines` y lectura de vendors. */
@Injectable()
export class BillsRepository {
  findById(em: EntityManager, id: string): Promise<Bills | null> {
    return em.findOne(Bills, { id });
  }

  findByNumber(em: EntityManager, practiceId: string, vendorId: string, billNumber: string): Promise<Bills | null> {
    return em.findOne(Bills, { practiceId, vendorId, billNumber });
  }

  findVendor(em: EntityManager, vendorId: string): Promise<Vendors | null> {
    return em.findOne(Vendors, { id: vendorId });
  }

  create(em: EntityManager, data: CreateBillData): Bills {
    return em.create(
      Bills,
      {
        practiceId: data.practiceId,
        vendorId: data.vendorId,
        billNumber: data.billNumber,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        statusConceptId: data.statusConceptId,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        total: data.total,
        paidTotal: data.paidTotal,
        balance: data.balance,
        currencyConceptId: data.currencyConceptId,
        purchaseOrderId: data.purchaseOrderId,
        contractId: data.contractId,
        supplierSubledgerAccountId: data.supplierSubledgerAccountId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createLine(em: EntityManager, data: CreateBillLineData): BillLines {
    return em.create(
      BillLines,
      {
        billId: data.billId,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        taxAmount: data.taxAmount,
        lineTotal: data.lineTotal,
        expenseAccountId: data.expenseAccountId,
        costCenterId: data.costCenterId,
        purchaseOrderItemId: data.purchaseOrderItemId,
        goodsReceiptItemId: data.goodsReceiptItemId,
        serviceEntryItemId: data.serviceEntryItemId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
