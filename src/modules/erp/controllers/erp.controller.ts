import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ErpContractsService, ErpOperationsService } from '../services';
import {
  CreatePartnerDto,
  PartnerResponseDto,
  VerifyBankAccountResponseDto,
  CreateContractDto,
  ContractResponseDto,
  RequestApprovalDto,
  ApprovalResponseDto,
  CreateAmendmentDto,
  CreateRenewalDto,
  CreateTerminationDto,
  ContractChangeResponseDto,
  GeneratePaymentScheduleDto,
  PaymentScheduleResponseDto,
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

/** Endpoints de ERP: socios, contratos, RR. HH., compras, ventas y arrendamientos. */
@ApiTags('erp')
@ApiBearerAuth()
@Controller('erp')
export class ErpController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param contractsService - Valor de contracts service requerido por la operación.
   * @param operationsService - Valor de operations service requerido por la operación.
   */
  constructor(
    private readonly contractsService: ErpContractsService,
    private readonly operationsService: ErpOperationsService,
  ) {}

  /** UC-38-01. */
  @Post('business-partners')
  @Roles('ERP_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de socio de negocio con su cuenta bancaria' })
  createPartner(
    @Body() dto: CreatePartnerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PartnerResponseDto> {
    return this.contractsService.createPartner(dto, actor);
  }

  /** UC-38-02. */
  @Post('business-partners/:id/bank-accounts/:accId/verify')
  @Roles('ERP_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar la cuenta bancaria del socio',
    description: 'Requisito para usarla en pagos salientes.',
  })
  verifyBankAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('accId', ParseUUIDPipe) accId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<VerifyBankAccountResponseDto> {
    return this.contractsService.verifyBankAccount(id, accId, actor);
  }

  /** UC-38-03. */
  @Post('contracts')
  @Roles('ERP_ADMIN', 'CONTRACT_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un contrato en borrador' })
  createContract(
    @Body() dto: CreateContractDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ContractResponseDto> {
    return this.contractsService.createContract(dto, actor);
  }

  /** UC-38-04. */
  @Post('contracts/:id/approval-requests')
  @Roles('ERP_ADMIN', 'CONTRACT_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar o resolver la aprobación del contrato',
    description: 'Aprobar activa el contrato.',
  })
  requestApproval(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestApprovalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ApprovalResponseDto> {
    return this.contractsService.requestApproval(id, dto, actor);
  }

  /** UC-38-05. */
  @Post('contracts/:id/amendments')
  @Roles('ERP_ADMIN', 'CONTRACT_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enmendar el contrato',
    description: 'La enmienda devuelve el contrato a aprobación pendiente.',
  })
  createAmendment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAmendmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ContractChangeResponseDto> {
    return this.contractsService.createAmendment(id, dto, actor);
  }

  /** UC-38-06. */
  @Post('contracts/:id/renewals')
  @Roles('ERP_ADMIN', 'CONTRACT_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Renovar el contrato extendiendo su vigencia' })
  createRenewal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRenewalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ContractChangeResponseDto> {
    return this.contractsService.createRenewal(id, dto, actor);
  }

  /** UC-38-07. */
  @Post('contracts/:id/terminations')
  @Roles('ERP_ADMIN', 'CONTRACT_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Terminar el contrato y liquidarlo' })
  createTermination(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTerminationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ContractChangeResponseDto> {
    return this.contractsService.createTermination(id, dto, actor);
  }

  /** UC-38-16. */
  @Post('contracts/:id/payment-schedules/generate')
  @Roles('ERP_ADMIN', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generar el cronograma de cuotas del contrato',
    description: 'Idempotente: si ya existen cuotas no se regeneran.',
  })
  generatePaymentSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GeneratePaymentScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PaymentScheduleResponseDto> {
    return this.contractsService.generatePaymentSchedule(id, dto, actor);
  }

  /** UC-38-08. */
  @Post('employees/onboard')
  @Roles('ERP_ADMIN', 'HR_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de empleado' })
  onboardEmployee(
    @Body() dto: OnboardEmployeeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EmployeeResponseDto> {
    return this.operationsService.onboardEmployee(dto, actor);
  }

  /** UC-38-09. */
  @Post('employees/:id/time-off')
  @Roles('ERP_ADMIN', 'HR_ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar una ausencia' })
  requestTimeOff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestTimeOffDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TimeOffResponseDto> {
    return this.operationsService.requestTimeOff(id, dto, actor);
  }

  /** UC-38-09. */
  @Post('employees/:id/time-off/:reqId/approve')
  @Roles('ERP_ADMIN', 'HR_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar o rechazar la solicitud de ausencia' })
  approveTimeOff(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reqId', ParseUUIDPipe) reqId: string,
    @Body() dto: ApproveTimeOffDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TimeOffResponseDto> {
    return this.operationsService.approveTimeOff(reqId, dto, actor);
  }

  /** UC-38-10. */
  @Post('purchase-orders')
  @Roles('ERP_ADMIN', 'BUYER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir una orden de compra desde la requisición' })
  createPurchaseOrder(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PurchaseOrderResponseDto> {
    return this.operationsService.createPurchaseOrder(dto, actor);
  }

  /** UC-38-11. */
  @Post('purchase-orders/:id/goods-receipts')
  @Roles('ERP_ADMIN', 'BUYER', 'WAREHOUSE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar la recepción de mercancía' })
  createGoodsReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateGoodsReceiptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<GoodsReceiptResponseDto> {
    return this.operationsService.createGoodsReceipt(id, dto, actor);
  }

  /** UC-38-12. */
  @Post('purchase-orders/:id/service-entry-sheets')
  @Roles('ERP_ADMIN', 'BUYER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar la hoja de servicios prestados' })
  createServiceEntrySheet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceEntrySheetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceEntrySheetResponseDto> {
    return this.operationsService.createServiceEntrySheet(id, dto, actor);
  }

  /** UC-38-13. */
  @Post('bills/:billId/invoice-match-runs')
  @Roles('ERP_ADMIN', 'ACCOUNTS_PAYABLE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Conciliar la factura contra orden y recepción (three-way match)',
    description:
      'Una diferencia mayor que la tolerancia se marca como desviación.',
  })
  runInvoiceMatch(
    @Param('billId', ParseUUIDPipe) billId: string,
    @Body() dto: CreateInvoiceMatchDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InvoiceMatchResponseDto> {
    return this.operationsService.runInvoiceMatch(billId, dto, actor);
  }

  /** UC-38-14. */
  @Post('sales-orders')
  @Roles('ERP_ADMIN', 'SALES')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una orden de venta' })
  createSalesOrder(
    @Body() dto: CreateSalesOrderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SalesOrderResponseDto> {
    return this.operationsService.createSalesOrder(dto, actor);
  }

  /** UC-38-15. */
  @Post('lease-contracts/:id/valuations')
  @Roles('ERP_ADMIN', 'ACCOUNTANT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar la valoración IFRS 16 del arrendamiento',
  })
  createLeaseValuation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLeaseValuationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LeaseValuationResponseDto> {
    return this.operationsService.createLeaseValuation(id, dto, actor);
  }
}
