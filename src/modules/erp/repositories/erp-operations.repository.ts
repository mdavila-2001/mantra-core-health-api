import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  Employees,
  TimeOffRequests,
  PurchaseOrders,
  PurchaseOrderItems,
  GoodsReceipts,
  GoodsReceiptItems,
  ServiceEntrySheets,
  InvoiceMatchRuns,
  SalesOrders,
  LeaseValuations,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateEmployeeData {
  practiceId: string;
  fullName: string;
  personUserId?: string;
  roleConceptId?: string;
  hireDate?: Date;
  baseSalary?: string;
  currencyConceptId?: string;
  businessPartnerId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreatePurchaseOrderData {
  tenantId: string;
  purchaseOrderNumber: string;
  supplierBusinessPartnerId: string;
  contractId?: string;
  purchaseRequisitionId?: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  currencyConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de RR. HH., compras, recepción, conciliación, ventas y arrendamientos. */
@Injectable()
export class ErpOperationsRepository {
  createEmployee(em: EntityManager, data: CreateEmployeeData): Employees {
    return em.create(
      Employees,
      {
        practiceId: data.practiceId,
        fullName: data.fullName,
        personUserId: data.personUserId,
        roleConceptId: data.roleConceptId,
        hireDate: data.hireDate,
        baseSalary: data.baseSalary,
        currencyConceptId: data.currencyConceptId,
        businessPartnerId: data.businessPartnerId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findEmployeeById(em: EntityManager, id: string): Promise<Employees | null> {
    return em.findOne(Employees, { id });
  }

  createTimeOffRequest(
    em: EntityManager,
    data: {
      employeeId: string;
      leaveTypeConceptId: string;
      startDate: Date;
      endDate: Date;
      hours?: string;
      reason?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): TimeOffRequests {
    return em.create(
      TimeOffRequests,
      {
        employeeId: data.employeeId,
        leaveTypeConceptId: data.leaveTypeConceptId,
        startDate: data.startDate,
        endDate: data.endDate,
        hours: data.hours,
        reason: data.reason,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findTimeOffForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<TimeOffRequests | null> {
    return em.findOne(
      TimeOffRequests,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Ausencias del empleado que se solapan con un rango. Aprobar dos permisos para
   * los mismos días dejaría el calendario inconsistente.
   */
  findOverlappingTimeOff(
    em: EntityManager,
    employeeId: string,
    startDate: Date,
    endDate: Date,
    blockingStatuses: string[],
  ): Promise<TimeOffRequests[]> {
    return em.find(TimeOffRequests, {
      employeeId,
      statusConceptId: { $in: blockingStatuses },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
  }

  createPurchaseOrder(
    em: EntityManager,
    data: CreatePurchaseOrderData,
  ): PurchaseOrders {
    return em.create(
      PurchaseOrders,
      {
        tenantId: data.tenantId,
        purchaseOrderNumber: data.purchaseOrderNumber,
        supplierBusinessPartnerId: data.supplierBusinessPartnerId,
        contractId: data.contractId,
        purchaseRequisitionId: data.purchaseRequisitionId,
        orderDate: data.orderDate,
        expectedDeliveryDate: data.expectedDeliveryDate,
        currencyConceptId: data.currencyConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findPurchaseOrderForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PurchaseOrders | null> {
    return em.findOne(
      PurchaseOrders,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createPurchaseOrderItem(
    em: EntityManager,
    data: {
      purchaseOrderId: string;
      lineNumber: number;
      itemTypeConceptId: string;
      description?: string;
      quantity?: string;
      unitPrice?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): PurchaseOrderItems {
    return em.create(
      PurchaseOrderItems,
      {
        purchaseOrderId: data.purchaseOrderId,
        lineNumber: data.lineNumber,
        itemTypeConceptId: data.itemTypeConceptId,
        description: data.description,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findItemsByPurchaseOrder(
    em: EntityManager,
    purchaseOrderId: string,
  ): Promise<PurchaseOrderItems[]> {
    return em.find(PurchaseOrderItems, { purchaseOrderId });
  }

  createGoodsReceipt(
    em: EntityManager,
    data: {
      tenantId: string;
      receiptNumber: string;
      purchaseOrderId: string;
      receivedAt: Date;
      supplierDeliveryReference?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): GoodsReceipts {
    return em.create(
      GoodsReceipts,
      {
        tenantId: data.tenantId,
        receiptNumber: data.receiptNumber,
        purchaseOrderId: data.purchaseOrderId,
        receivedAt: data.receivedAt,
        supplierDeliveryReference: data.supplierDeliveryReference,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createGoodsReceiptItem(
    em: EntityManager,
    data: {
      goodsReceiptId: string;
      purchaseOrderItemId: string;
      lineNumber: number;
      receivedQuantity?: string;
      acceptedQuantity?: string;
      rejectedQuantity?: string;
      qualityStatusConceptId?: string;
      actorUserId?: string;
    },
  ): GoodsReceiptItems {
    return em.create(
      GoodsReceiptItems,
      {
        goodsReceiptId: data.goodsReceiptId,
        purchaseOrderItemId: data.purchaseOrderItemId,
        lineNumber: data.lineNumber,
        receivedQuantity: data.receivedQuantity,
        acceptedQuantity: data.acceptedQuantity,
        rejectedQuantity: data.rejectedQuantity,
        qualityStatusConceptId: data.qualityStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createServiceEntrySheet(
    em: EntityManager,
    data: {
      tenantId: string;
      sheetNumber: string;
      purchaseOrderId: string;
      supplierBusinessPartnerId?: string;
      performedFrom?: Date;
      performedTo?: Date;
      approvalStatusConceptId: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): ServiceEntrySheets {
    return em.create(
      ServiceEntrySheets,
      {
        tenantId: data.tenantId,
        sheetNumber: data.sheetNumber,
        purchaseOrderId: data.purchaseOrderId,
        supplierBusinessPartnerId: data.supplierBusinessPartnerId,
        performedFrom: data.performedFrom,
        performedTo: data.performedTo,
        approvalStatusConceptId: data.approvalStatusConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createInvoiceMatchRun(
    em: EntityManager,
    data: {
      tenantId: string;
      billId: string;
      matchTypeConceptId: string;
      purchaseOrderId?: string;
      matchedAmount?: string;
      varianceAmount?: string;
      currencyConceptId?: string;
      resultConceptId?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): InvoiceMatchRuns {
    return em.create(
      InvoiceMatchRuns,
      {
        tenantId: data.tenantId,
        billId: data.billId,
        matchTypeConceptId: data.matchTypeConceptId,
        purchaseOrderId: data.purchaseOrderId,
        runAt: new Date(),
        matchedAmount: data.matchedAmount,
        varianceAmount: data.varianceAmount,
        currencyConceptId: data.currencyConceptId,
        resultConceptId: data.resultConceptId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  createSalesOrder(
    em: EntityManager,
    data: {
      tenantId: string;
      salesOrderNumber: string;
      customerBusinessPartnerId: string;
      contractId?: string;
      opportunityId?: string;
      orderDate: Date;
      currencyConceptId?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): SalesOrders {
    return em.create(
      SalesOrders,
      {
        tenantId: data.tenantId,
        salesOrderNumber: data.salesOrderNumber,
        customerBusinessPartnerId: data.customerBusinessPartnerId,
        contractId: data.contractId,
        opportunityId: data.opportunityId,
        orderDate: data.orderDate,
        currencyConceptId: data.currencyConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createLeaseValuation(
    em: EntityManager,
    data: {
      leaseContractId: string;
      valuationDate: Date;
      accountingPrincipleConceptId: string;
      rightOfUseAssetValue?: string;
      leaseLiabilityValue?: string;
      interestExpense?: string;
      depreciationExpense?: string;
      currencyConceptId?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): LeaseValuations {
    return em.create(
      LeaseValuations,
      {
        leaseContractId: data.leaseContractId,
        valuationDate: data.valuationDate,
        accountingPrincipleConceptId: data.accountingPrincipleConceptId,
        rightOfUseAssetValue: data.rightOfUseAssetValue,
        leaseLiabilityValue: data.leaseLiabilityValue,
        interestExpense: data.interestExpense,
        depreciationExpense: data.depreciationExpense,
        currencyConceptId: data.currencyConceptId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
