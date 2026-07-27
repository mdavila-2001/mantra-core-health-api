import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ErpOperationsRepository,
  ErpContractsRepository,
} from '../repositories';
import {
  OnboardEmployeeDto,
  EmployeeResponseDto,
  RequestTimeOffDto,
  ApproveTimeOffDto,
  TimeOffResponseDto,
  CreatePurchaseOrderDto,
  PurchaseOrderResponseDto,
  CreateGoodsReceiptDto,
  GoodsReceiptResponseDto,
  CreateServiceEntrySheetDto,
  ServiceEntrySheetResponseDto,
  CreateInvoiceMatchDto,
  InvoiceMatchResponseDto,
  CreateSalesOrderDto,
  SalesOrderResponseDto,
  CreateLeaseValuationDto,
  LeaseValuationResponseDto,
} from '../dto';

/** Estados de una solicitud de ausencia que bloquean otra en las mismas fechas. */
const BLOCKING_TIMEOFF_STATES: readonly string[] = [
  CONCEPTS.TIMEOFF_REQUESTED,
  CONCEPTS.TIMEOFF_APPROVED,
];

const DEFAULT_MATCH_TOLERANCE = '0.00';

/**
 * Operaciones de RR. HH., compras, recepción, conciliación de facturas, ventas y
 * arrendamientos (UC-38-08 … 15).
 */
@Injectable()
export class ErpOperationsService {
  constructor(
    private readonly em: EntityManager,
    private readonly operationsRepo: ErpOperationsRepository,
    private readonly contractsRepo: ErpContractsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ErpOperationsService.name);
  }

  /** UC-38-08: alta de empleado. */
  async onboardEmployee(
    dto: OnboardEmployeeDto,
    actor: AuthenticatedUser,
  ): Promise<EmployeeResponseDto> {
    this.logger.info(
      { operation: 'erp.employee.onboard', practiceId: dto.practiceId },
      'Onboarding employee',
    );

    return this.em.transactional(async (tx) => {
      const employee = this.operationsRepo.createEmployee(tx, {
        practiceId: dto.practiceId,
        fullName: dto.fullName,
        personUserId: dto.personUserId,
        hireDate: dto.hireDate ? new Date(dto.hireDate) : new Date(),
        baseSalary: dto.baseSalary,
        currencyConceptId: dto.baseSalary ? CONCEPTS.CURRENCY_BOB : undefined,
        statusConceptId: CONCEPTS.EMPLOYEE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: employee.id,
        fullName: dto.fullName,
        statusConceptId: CONCEPTS.EMPLOYEE_ACTIVE,
      };
    });
  }

  /**
   * UC-38-09: solicita una ausencia.
   *
   * Se rechaza si el empleado ya tiene otra solicitud vigente que se solapa:
   * dos permisos aprobados para los mismos días dejarían el calendario y la nómina
   * en un estado ambiguo.
   */
  async requestTimeOff(
    employeeId: string,
    dto: RequestTimeOffDto,
    actor: AuthenticatedUser,
  ): Promise<TimeOffResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new PreconditionFailedException(
        'La ausencia debe terminar después de empezar',
        {
          employeeId,
        },
      );
    }

    this.logger.info(
      {
        operation: 'erp.timeoff.request',
        employeeId,
        leaveType: dto.leaveType,
      },
      'Requesting time off',
    );

    return this.em.transactional(async (tx) => {
      const employee = await this.operationsRepo.findEmployeeById(
        tx,
        employeeId,
      );
      if (!employee) {
        throw new ResourceNotFoundException('Empleado no encontrado', {
          employeeId,
        });
      }

      const overlapping = await this.operationsRepo.findOverlappingTimeOff(
        tx,
        employeeId,
        startDate,
        endDate,
        [...BLOCKING_TIMEOFF_STATES],
      );
      if (overlapping.length > 0) {
        throw new ConflictException(
          'El empleado ya tiene una ausencia en esas fechas',
          {
            employeeId,
            conflictingRequestId: overlapping[0].id,
          },
        );
      }

      const request = this.operationsRepo.createTimeOffRequest(tx, {
        employeeId,
        leaveTypeConceptId:
          dto.leaveType === 'VACATION'
            ? CONCEPTS.LEAVE_VACATION
            : CONCEPTS.LEAVE_SICK,
        startDate,
        endDate,
        reason: dto.reason,
        statusConceptId: CONCEPTS.TIMEOFF_REQUESTED,
        actorUserId: actor.id,
      });

      return { id: request.id, statusConceptId: CONCEPTS.TIMEOFF_REQUESTED };
    });
  }

  /** UC-38-09: resuelve la solicitud de ausencia. */
  async approveTimeOff(
    requestId: string,
    dto: ApproveTimeOffDto,
    actor: AuthenticatedUser,
  ): Promise<TimeOffResponseDto> {
    this.logger.info(
      { operation: 'erp.timeoff.approve', requestId, approved: dto.approved },
      'Resolving time off request',
    );

    return this.em.transactional(async (tx) => {
      const request = await this.operationsRepo.findTimeOffForUpdate(
        tx,
        requestId,
      );
      if (!request) {
        throw new ResourceNotFoundException(
          'Solicitud de ausencia no encontrada',
          { requestId },
        );
      }
      if (request.statusConceptId !== CONCEPTS.TIMEOFF_REQUESTED) {
        throw new ConflictException('La solicitud ya fue resuelta', {
          requestId,
        });
      }

      request.statusConceptId = dto.approved
        ? CONCEPTS.TIMEOFF_APPROVED
        : CONCEPTS.TIMEOFF_REJECTED;
      request.approverUserId = actor.id;
      request.approvedAt = new Date();
      touch(request, actor.id);

      return { id: requestId, statusConceptId: request.statusConceptId };
    });
  }

  /**
   * UC-38-10: emite la orden de compra con sus líneas.
   *
   * El importe total se deriva de las líneas en vez de aceptarse del cliente, para
   * que la cabecera nunca descuadre con el detalle.
   */
  async createPurchaseOrder(
    dto: CreatePurchaseOrderDto,
    actor: AuthenticatedUser,
  ): Promise<PurchaseOrderResponseDto> {
    this.logger.info(
      {
        operation: 'erp.po.create',
        tenantId: dto.tenantId,
        poNumber: dto.purchaseOrderNumber,
      },
      'Creating purchase order',
    );

    return this.em.transactional(async (tx) => {
      const supplier = await this.contractsRepo.findPartnerById(
        tx,
        dto.supplierBusinessPartnerId,
      );
      if (!supplier) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          partnerId: dto.supplierBusinessPartnerId,
        });
      }

      const order = this.operationsRepo.createPurchaseOrder(tx, {
        tenantId: dto.tenantId,
        purchaseOrderNumber: dto.purchaseOrderNumber,
        supplierBusinessPartnerId: dto.supplierBusinessPartnerId,
        contractId: dto.contractId,
        purchaseRequisitionId: dto.purchaseRequisitionId,
        orderDate: new Date(),
        expectedDeliveryDate: dto.expectedDeliveryDate
          ? new Date(dto.expectedDeliveryDate)
          : undefined,
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        statusConceptId: CONCEPTS.PO_OPEN,
        actorUserId: actor.id,
      });

      let total = 0;
      dto.items.forEach((item, index) => {
        total += Number(item.quantity) * Number(item.unitPrice);
        this.operationsRepo.createPurchaseOrderItem(tx, {
          purchaseOrderId: order.id,
          lineNumber: index + 1,
          itemTypeConceptId:
            item.itemType === 'MATERIAL'
              ? CONCEPTS.ITEM_TYPE_MATERIAL
              : CONCEPTS.ITEM_TYPE_SERVICE,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          statusConceptId: CONCEPTS.PO_OPEN,
          actorUserId: actor.id,
        });
      });

      return {
        id: order.id,
        purchaseOrderNumber: dto.purchaseOrderNumber,
        itemCount: dto.items.length,
        totalAmount: total.toFixed(2),
      };
    });
  }

  /**
   * UC-38-11: registra la recepción de mercancía.
   *
   * Lo aceptado por defecto es lo recibido; la diferencia entre ambos es lo
   * rechazado en el control de calidad, y es lo que después limita el three-way match.
   */
  async createGoodsReceipt(
    purchaseOrderId: string,
    dto: CreateGoodsReceiptDto,
    actor: AuthenticatedUser,
  ): Promise<GoodsReceiptResponseDto> {
    this.logger.info(
      {
        operation: 'erp.receipt.create',
        purchaseOrderId,
        receiptNumber: dto.receiptNumber,
      },
      'Registering goods receipt',
    );

    return this.em.transactional(async (tx) => {
      const order = await this.operationsRepo.findPurchaseOrderForUpdate(
        tx,
        purchaseOrderId,
      );
      if (!order) {
        throw new ResourceNotFoundException('Orden de compra no encontrada', {
          purchaseOrderId,
        });
      }
      if (order.statusConceptId === CONCEPTS.PO_CLOSED) {
        throw new PreconditionFailedException(
          'La orden de compra está cerrada',
          {
            purchaseOrderId,
          },
        );
      }

      const receipt = this.operationsRepo.createGoodsReceipt(tx, {
        tenantId: dto.tenantId,
        receiptNumber: dto.receiptNumber,
        purchaseOrderId,
        receivedAt: new Date(),
        supplierDeliveryReference: dto.supplierDeliveryReference,
        statusConceptId: CONCEPTS.RECEIPT_POSTED,
        actorUserId: actor.id,
      });

      let rejectedUnits = 0;
      dto.items.forEach((item, index) => {
        const received = Number(item.receivedQuantity);
        const accepted = item.acceptedQuantity
          ? Number(item.acceptedQuantity)
          : received;
        if (accepted > received) {
          throw new PreconditionFailedException(
            'La cantidad aceptada no puede superar la recibida',
            { purchaseOrderItemId: item.purchaseOrderItemId },
          );
        }
        const rejected = received - accepted;
        rejectedUnits += rejected;

        this.operationsRepo.createGoodsReceiptItem(tx, {
          goodsReceiptId: receipt.id,
          purchaseOrderItemId: item.purchaseOrderItemId,
          lineNumber: index + 1,
          receivedQuantity: item.receivedQuantity,
          acceptedQuantity: accepted.toString(),
          rejectedQuantity: rejected.toString(),
          qualityStatusConceptId:
            rejected > 0
              ? CONCEPTS.QUALITY_REJECTED
              : CONCEPTS.QUALITY_ACCEPTED,
          actorUserId: actor.id,
        });
      });

      order.statusConceptId = CONCEPTS.PO_RECEIVED;
      touch(order, actor.id);

      return {
        id: receipt.id,
        receiptNumber: dto.receiptNumber,
        itemCount: dto.items.length,
        rejectedUnits: rejectedUnits.toString(),
      };
    });
  }

  /** UC-38-12: registra la hoja de servicios prestados sobre la orden. */
  async createServiceEntrySheet(
    purchaseOrderId: string,
    dto: CreateServiceEntrySheetDto,
    actor: AuthenticatedUser,
  ): Promise<ServiceEntrySheetResponseDto> {
    this.logger.info(
      {
        operation: 'erp.service-sheet.create',
        purchaseOrderId,
        sheetNumber: dto.sheetNumber,
      },
      'Registering service entry sheet',
    );

    return this.em.transactional(async (tx) => {
      const order = await this.operationsRepo.findPurchaseOrderForUpdate(
        tx,
        purchaseOrderId,
      );
      if (!order) {
        throw new ResourceNotFoundException('Orden de compra no encontrada', {
          purchaseOrderId,
        });
      }

      const sheet = this.operationsRepo.createServiceEntrySheet(tx, {
        tenantId: dto.tenantId,
        sheetNumber: dto.sheetNumber,
        purchaseOrderId,
        supplierBusinessPartnerId: order.supplierBusinessPartnerId,
        performedFrom: dto.performedFrom
          ? new Date(dto.performedFrom)
          : undefined,
        performedTo: dto.performedTo ? new Date(dto.performedTo) : undefined,
        approvalStatusConceptId: CONCEPTS.APPROVAL_PENDING,
        statusConceptId: CONCEPTS.SHEET_SUBMITTED,
        actorUserId: actor.id,
      });

      return {
        id: sheet.id,
        sheetNumber: dto.sheetNumber,
        statusConceptId: CONCEPTS.SHEET_SUBMITTED,
      };
    });
  }

  /**
   * UC-38-13: three-way match entre factura, orden y recepción.
   *
   * Se compara lo facturado contra el valor de la orden. Si la diferencia excede la
   * tolerancia se marca desviación en vez de aprobar: pagar una factura que no
   * cuadra con lo pedido es el error que este control existe para evitar.
   */
  async runInvoiceMatch(
    billId: string,
    dto: CreateInvoiceMatchDto,
    actor: AuthenticatedUser,
  ): Promise<InvoiceMatchResponseDto> {
    this.logger.info(
      {
        operation: 'erp.invoice.match',
        billId,
        purchaseOrderId: dto.purchaseOrderId,
      },
      'Running invoice match',
    );

    return this.em.transactional(async (tx) => {
      const order = await this.operationsRepo.findPurchaseOrderForUpdate(
        tx,
        dto.purchaseOrderId,
      );
      if (!order) {
        throw new ResourceNotFoundException('Orden de compra no encontrada', {
          purchaseOrderId: dto.purchaseOrderId,
        });
      }

      const items = await this.operationsRepo.findItemsByPurchaseOrder(
        tx,
        dto.purchaseOrderId,
      );
      const orderedAmount = items.reduce(
        (sum, item) =>
          sum + Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0),
        0,
      );
      const variance = Number(dto.invoicedAmount) - orderedAmount;
      const tolerance = Number(dto.toleranceAmount ?? DEFAULT_MATCH_TOLERANCE);
      const matched = Math.abs(variance) <= tolerance;

      const run = this.operationsRepo.createInvoiceMatchRun(tx, {
        tenantId: dto.tenantId,
        billId,
        matchTypeConceptId: CONCEPTS.MATCH_THREE_WAY,
        purchaseOrderId: dto.purchaseOrderId,
        matchedAmount: orderedAmount.toFixed(2),
        varianceAmount: variance.toFixed(2),
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        resultConceptId: matched
          ? CONCEPTS.MATCH_RESULT_OK
          : CONCEPTS.MATCH_RESULT_VARIANCE,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      if (!matched) {
        this.logger.warn(
          {
            operation: 'erp.invoice.match',
            billId,
            variance: variance.toFixed(2),
          },
          'Invoice match found a variance beyond tolerance',
        );
      }

      return {
        id: run.id,
        matchedAmount: orderedAmount.toFixed(2),
        varianceAmount: variance.toFixed(2),
        matched,
      };
    });
  }

  /** UC-38-14: crea la orden de venta, opcionalmente desde una oportunidad ganada. */
  async createSalesOrder(
    dto: CreateSalesOrderDto,
    actor: AuthenticatedUser,
  ): Promise<SalesOrderResponseDto> {
    this.logger.info(
      { operation: 'erp.sales-order.create', tenantId: dto.tenantId },
      'Creating sales order',
    );

    return this.em.transactional(async (tx) => {
      const customer = await this.contractsRepo.findPartnerById(
        tx,
        dto.customerBusinessPartnerId,
      );
      if (!customer) {
        throw new ResourceNotFoundException('Cliente no encontrado', {
          partnerId: dto.customerBusinessPartnerId,
        });
      }

      const order = this.operationsRepo.createSalesOrder(tx, {
        tenantId: dto.tenantId,
        salesOrderNumber: dto.salesOrderNumber,
        customerBusinessPartnerId: dto.customerBusinessPartnerId,
        contractId: dto.contractId,
        opportunityId: dto.opportunityId,
        orderDate: new Date(),
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        statusConceptId: CONCEPTS.SALES_ORDER_OPEN,
        actorUserId: actor.id,
      });

      return {
        id: order.id,
        salesOrderNumber: dto.salesOrderNumber,
        statusConceptId: CONCEPTS.SALES_ORDER_OPEN,
      };
    });
  }

  /** UC-38-15: registra la valoración IFRS 16 del arrendamiento. */
  async createLeaseValuation(
    leaseContractId: string,
    dto: CreateLeaseValuationDto,
    actor: AuthenticatedUser,
  ): Promise<LeaseValuationResponseDto> {
    this.logger.info(
      { operation: 'erp.lease.valuate', leaseContractId },
      'Recording lease valuation',
    );

    return this.em.transactional(async (tx) => {
      const valuation = this.operationsRepo.createLeaseValuation(tx, {
        leaseContractId,
        valuationDate: new Date(dto.valuationDate),
        accountingPrincipleConceptId: CONCEPTS.ACCOUNTING_IFRS16,
        rightOfUseAssetValue: dto.rightOfUseAssetValue,
        leaseLiabilityValue: dto.leaseLiabilityValue,
        interestExpense: dto.interestExpense,
        depreciationExpense: dto.depreciationExpense,
        currencyConceptId: CONCEPTS.CURRENCY_BOB,
        statusConceptId: CONCEPTS.VALUATION_POSTED,
        actorUserId: actor.id,
      });

      return {
        id: valuation.id,
        leaseContractId,
        statusConceptId: CONCEPTS.VALUATION_POSTED,
      };
    });
  }
}
