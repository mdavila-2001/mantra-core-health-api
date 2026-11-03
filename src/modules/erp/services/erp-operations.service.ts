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
import { ErpOperationsRepository } from '../repositories';
import { ErpErrorReason } from '../erp.error-reasons';
import { ErpScopeService, TIME_OFF_NOT_FOUND } from './erp-scope.service';
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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param operationsRepo - Valor de operations repo requerido por la operación.
   * @param scope - Resolvedor de recursos acotados al tenant activo.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly operationsRepo: ErpOperationsRepository,
    private readonly scope: ErpScopeService,
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
      // La práctica del alta debe ser del tenant activo: de ella hereda el
      // empleado su organización.
      await this.scope.practice(tx, dto.practiceId);

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
      const employee = await this.scope.employee(tx, employeeId);
      // Un EMPLOYEE solo pide ausencias para sí; RR. HH. y administración, para
      // cualquier empleado de su organización.
      this.scope.assertSelfOrHr(employee, actor);

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
    employeeId: string,
    requestId: string,
    dto: ApproveTimeOffDto,
    actor: AuthenticatedUser,
  ): Promise<TimeOffResponseDto> {
    this.logger.info(
      {
        operation: 'erp.timeoff.approve',
        employeeId,
        requestId,
        approved: dto.approved,
      },
      'Resolving time off request',
    );

    return this.em.transactional(async (tx) => {
      // El empleado de la ruta debe ser de la organización y la solicitud,
      // suya: cualquier discrepancia responde igual que una solicitud inexistente.
      await this.scope.employee(tx, employeeId, TIME_OFF_NOT_FOUND);
      const request = await this.operationsRepo.findTimeOffForUpdate(
        tx,
        requestId,
        employeeId,
      );
      if (!request) {
        throw new ResourceNotFoundException(
          TIME_OFF_NOT_FOUND.message,
          undefined,
          TIME_OFF_NOT_FOUND.reason,
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
    const tenantId = this.scope.activeTenantFor(dto.tenantId);
    this.logger.info(
      {
        operation: 'erp.po.create',
        tenantId,
        poNumber: dto.purchaseOrderNumber,
      },
      'Creating purchase order',
    );

    return this.em.transactional(async (tx) => {
      // Proveedor, contrato y requisición referenciados son del mismo tenant.
      await this.scope.partner(
        tx,
        dto.supplierBusinessPartnerId,
        'Proveedor no encontrado',
      );
      if (dto.contractId) await this.scope.contract(tx, dto.contractId);
      if (dto.purchaseRequisitionId) {
        await this.scope.requisition(tx, dto.purchaseRequisitionId);
      }

      const order = this.operationsRepo.createPurchaseOrder(tx, {
        tenantId,
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

    const tenantId = this.scope.activeTenantFor(dto.tenantId);
    return this.em.transactional(async (tx) => {
      const order = await this.scope.purchaseOrderForUpdate(
        tx,
        purchaseOrderId,
      );
      if (order.statusConceptId === CONCEPTS.PO_CLOSED) {
        throw new PreconditionFailedException(
          'La orden de compra está cerrada',
          {
            purchaseOrderId,
          },
        );
      }

      // Cada línea debe existir, no repetirse y ser hija de esta orden: se
      // cargan todas de una vez (`id IN (...) + purchaseOrderId`) y se contrasta
      // la cardinalidad antes de crear la recepción.
      const requestedIds = dto.items.map((item) => item.purchaseOrderItemId);
      const orderItems = await this.operationsRepo.findItemsInPurchaseOrder(
        tx,
        purchaseOrderId,
        requestedIds,
      );
      if (
        new Set(requestedIds).size !== requestedIds.length ||
        orderItems.length !== requestedIds.length
      ) {
        throw new PreconditionFailedException(
          'Alguna línea de la recepción no pertenece a la orden de compra',
          undefined,
          ErpErrorReason.ERP_PO_ITEM_NOT_IN_ORDER,
        );
      }

      const receipt = this.operationsRepo.createGoodsReceipt(tx, {
        tenantId,
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

    const tenantId = this.scope.activeTenantFor(dto.tenantId);
    return this.em.transactional(async (tx) => {
      const order = await this.scope.purchaseOrderForUpdate(
        tx,
        purchaseOrderId,
      );

      const sheet = this.operationsRepo.createServiceEntrySheet(tx, {
        tenantId,
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

    const tenantId = this.scope.activeTenantFor(dto.tenantId);
    return this.em.transactional(async (tx) => {
      // La factura y la orden conciliadas son del mismo tenant.
      await this.scope.bill(tx, billId);
      await this.scope.purchaseOrderForUpdate(tx, dto.purchaseOrderId);

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
        tenantId,
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
    const tenantId = this.scope.activeTenantFor(dto.tenantId);
    this.logger.info(
      { operation: 'erp.sales-order.create', tenantId },
      'Creating sales order',
    );

    return this.em.transactional(async (tx) => {
      await this.scope.partner(
        tx,
        dto.customerBusinessPartnerId,
        'Cliente no encontrado',
      );
      if (dto.contractId) await this.scope.contract(tx, dto.contractId);

      const order = this.operationsRepo.createSalesOrder(tx, {
        tenantId,
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
      // El arrendamiento hereda su organización del contrato.
      await this.scope.leaseContract(tx, leaseContractId);

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
