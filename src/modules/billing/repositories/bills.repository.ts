import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Bills, BillLines, Vendors } from '../entities';
import { createdBy } from '../../../common';

/** Cabecera de factura de proveedor a crear. */
export interface CreateBillData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Identificador asociado a vendor.
   */
  vendorId: string;
  /**
   * Valor de bill number mantenido por la instancia.
   */
  billNumber: string;
  /**
   * Valor de issue date mantenido por la instancia.
   */
  issueDate: Date;
  /**
   * Valor de due date mantenido por la instancia.
   */
  dueDate?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de subtotal mantenido por la instancia.
   */
  subtotal?: string;
  /**
   * Valor de tax total mantenido por la instancia.
   */
  taxTotal?: string;
  /**
   * Valor de total mantenido por la instancia.
   */
  total?: string;
  /**
   * Valor de paid total mantenido por la instancia.
   */
  paidTotal?: string;
  /**
   * Valor de balance mantenido por la instancia.
   */
  balance?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a purchase order.
   */
  purchaseOrderId?: string;
  /**
   * Identificador asociado a contract.
   */
  contractId?: string;
  /**
   * Identificador asociado a supplier subledger account.
   */
  supplierSubledgerAccountId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Línea de factura de proveedor a crear. */
export interface CreateBillLineData {
  /**
   * Identificador asociado a bill.
   */
  billId: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Valor de quantity mantenido por la instancia.
   */
  quantity: string;
  /**
   * Valor de unit price mantenido por la instancia.
   */
  unitPrice: string;
  /**
   * Valor de tax amount mantenido por la instancia.
   */
  taxAmount?: string;
  /**
   * Valor de line total mantenido por la instancia.
   */
  lineTotal?: string;
  /**
   * Identificador asociado a expense account.
   */
  expenseAccountId?: string;
  /**
   * Identificador asociado a cost center.
   */
  costCenterId?: string;
  /**
   * Identificador asociado a purchase order item.
   */
  purchaseOrderItemId?: string;
  /**
   * Identificador asociado a goods receipt item.
   */
  goodsReceiptItemId?: string;
  /**
   * Identificador asociado a service entry item.
   */
  serviceEntryItemId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `billing.bills`, `billing.bill_lines` y lectura de vendors. */
@Injectable()
export class BillsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Bills | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Bills | null> {
    return em.findOne(Bills, { id });
  }

  /**
   * Obtiene find by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param vendorId - Identificador de vendor.
   * @param billNumber - Valor de bill number requerido por la operación.
   * @returns Resultado de find by number conforme al contrato `Promise<Bills | null>`.
   */
  findByNumber(
    em: EntityManager,
    practiceId: string,
    vendorId: string,
    billNumber: string,
  ): Promise<Bills | null> {
    return em.findOne(Bills, { practiceId, vendorId, billNumber });
  }

  /**
   * Obtiene find vendor.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param vendorId - Identificador de vendor.
   * @returns Resultado de find vendor conforme al contrato `Promise<Vendors | null>`.
   */
  findVendor(em: EntityManager, vendorId: string): Promise<Vendors | null> {
    return em.findOne(Vendors, { id: vendorId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Bills`.
   */
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

  /**
   * Crea create line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create line conforme al contrato `BillLines`.
   */
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
