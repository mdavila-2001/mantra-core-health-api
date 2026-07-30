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

/**
 * Describe el contrato estructural de create employee data.
 */
export interface CreateEmployeeData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Valor de full name mantenido por la instancia.
   */
  fullName: string;
  /**
   * Identificador asociado a person user.
   */
  personUserId?: string;
  /**
   * Identificador asociado a role concept.
   */
  roleConceptId?: string;
  /**
   * Valor de hire date mantenido por la instancia.
   */
  hireDate?: Date;
  /**
   * Valor de base salary mantenido por la instancia.
   */
  baseSalary?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a business partner.
   */
  businessPartnerId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create purchase order data.
 */
export interface CreatePurchaseOrderData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de purchase order number mantenido por la instancia.
   */
  purchaseOrderNumber: string;
  /**
   * Identificador asociado a supplier business partner.
   */
  supplierBusinessPartnerId: string;
  /**
   * Identificador asociado a contract.
   */
  contractId?: string;
  /**
   * Identificador asociado a purchase requisition.
   */
  purchaseRequisitionId?: string;
  /**
   * Valor de order date mantenido por la instancia.
   */
  orderDate: Date;
  /**
   * Valor de expected delivery date mantenido por la instancia.
   */
  expectedDeliveryDate?: Date;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de RR. HH., compras, recepción, conciliación, ventas y arrendamientos. */
@Injectable()
export class ErpOperationsRepository {
  /**
   * Crea create employee.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create employee conforme al contrato `Employees`.
   */
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

  /**
   * Obtiene find employee by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find employee by id conforme al contrato `Promise<Employees | null>`.
   */
  findEmployeeById(em: EntityManager, id: string): Promise<Employees | null> {
    return em.findOne(Employees, { id });
  }

  /**
   * Crea create time off request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create time off request conforme al contrato `TimeOffRequests`.
   */
  createTimeOffRequest(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a employee.
       */
      employeeId: string;
      /**
       * Identificador asociado a leave type concept.
       */
      leaveTypeConceptId: string;
      /**
       * Valor de start date mantenido por la instancia.
       */
      startDate: Date;
      /**
       * Valor de end date mantenido por la instancia.
       */
      endDate: Date;
      /**
       * Valor de hours mantenido por la instancia.
       */
      hours?: string;
      /**
       * Valor de reason mantenido por la instancia.
       */
      reason?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find time off for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find time off for update conforme al contrato `Promise<TimeOffRequests | null>`.
   */
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

  /**
   * Crea create purchase order.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create purchase order conforme al contrato `PurchaseOrders`.
   */
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

  /**
   * Obtiene find purchase order for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find purchase order for update conforme al contrato `Promise<PurchaseOrders | null>`.
   */
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

  /**
   * Crea create purchase order item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create purchase order item conforme al contrato `PurchaseOrderItems`.
   */
  createPurchaseOrderItem(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a purchase order.
       */
      purchaseOrderId: string;
      /**
       * Valor de line number mantenido por la instancia.
       */
      lineNumber: number;
      /**
       * Identificador asociado a item type concept.
       */
      itemTypeConceptId: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description?: string;
      /**
       * Valor de quantity mantenido por la instancia.
       */
      quantity?: string;
      /**
       * Valor de unit price mantenido por la instancia.
       */
      unitPrice?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find items by purchase order.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param purchaseOrderId - Identificador de purchase order.
   * @returns Resultado de find items by purchase order conforme al contrato `Promise<PurchaseOrderItems[]>`.
   */
  findItemsByPurchaseOrder(
    em: EntityManager,
    purchaseOrderId: string,
  ): Promise<PurchaseOrderItems[]> {
    return em.find(PurchaseOrderItems, { purchaseOrderId });
  }

  /**
   * Crea create goods receipt.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create goods receipt conforme al contrato `GoodsReceipts`.
   */
  createGoodsReceipt(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de receipt number mantenido por la instancia.
       */
      receiptNumber: string;
      /**
       * Identificador asociado a purchase order.
       */
      purchaseOrderId: string;
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
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create goods receipt item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create goods receipt item conforme al contrato `GoodsReceiptItems`.
   */
  createGoodsReceiptItem(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a goods receipt.
       */
      goodsReceiptId: string;
      /**
       * Identificador asociado a purchase order item.
       */
      purchaseOrderItemId: string;
      /**
       * Valor de line number mantenido por la instancia.
       */
      lineNumber: number;
      /**
       * Valor de received quantity mantenido por la instancia.
       */
      receivedQuantity?: string;
      /**
       * Valor de accepted quantity mantenido por la instancia.
       */
      acceptedQuantity?: string;
      /**
       * Valor de rejected quantity mantenido por la instancia.
       */
      rejectedQuantity?: string;
      /**
       * Identificador asociado a quality status concept.
       */
      qualityStatusConceptId?: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create service entry sheet.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create service entry sheet conforme al contrato `ServiceEntrySheets`.
   */
  createServiceEntrySheet(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de sheet number mantenido por la instancia.
       */
      sheetNumber: string;
      /**
       * Identificador asociado a purchase order.
       */
      purchaseOrderId: string;
      /**
       * Identificador asociado a supplier business partner.
       */
      supplierBusinessPartnerId?: string;
      /**
       * Valor de performed from mantenido por la instancia.
       */
      performedFrom?: Date;
      /**
       * Valor de performed to mantenido por la instancia.
       */
      performedTo?: Date;
      /**
       * Identificador asociado a approval status concept.
       */
      approvalStatusConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create invoice match run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create invoice match run conforme al contrato `InvoiceMatchRuns`.
   */
  createInvoiceMatchRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a bill.
       */
      billId: string;
      /**
       * Identificador asociado a match type concept.
       */
      matchTypeConceptId: string;
      /**
       * Identificador asociado a purchase order.
       */
      purchaseOrderId?: string;
      /**
       * Valor de matched amount mantenido por la instancia.
       */
      matchedAmount?: string;
      /**
       * Valor de variance amount mantenido por la instancia.
       */
      varianceAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a result concept.
       */
      resultConceptId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create sales order.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create sales order conforme al contrato `SalesOrders`.
   */
  createSalesOrder(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de sales order number mantenido por la instancia.
       */
      salesOrderNumber: string;
      /**
       * Identificador asociado a customer business partner.
       */
      customerBusinessPartnerId: string;
      /**
       * Identificador asociado a contract.
       */
      contractId?: string;
      /**
       * Identificador asociado a opportunity.
       */
      opportunityId?: string;
      /**
       * Valor de order date mantenido por la instancia.
       */
      orderDate: Date;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create lease valuation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create lease valuation conforme al contrato `LeaseValuations`.
   */
  createLeaseValuation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a lease contract.
       */
      leaseContractId: string;
      /**
       * Valor de valuation date mantenido por la instancia.
       */
      valuationDate: Date;
      /**
       * Identificador asociado a accounting principle concept.
       */
      accountingPrincipleConceptId: string;
      /**
       * Valor de right of use asset value mantenido por la instancia.
       */
      rightOfUseAssetValue?: string;
      /**
       * Valor de lease liability value mantenido por la instancia.
       */
      leaseLiabilityValue?: string;
      /**
       * Valor de interest expense mantenido por la instancia.
       */
      interestExpense?: string;
      /**
       * Valor de depreciation expense mantenido por la instancia.
       */
      depreciationExpense?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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
