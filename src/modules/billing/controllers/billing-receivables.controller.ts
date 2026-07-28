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
import {
  InvoicesService,
  PaymentsReceivedService,
  ReimbursementsService,
  PatientStatementsService,
} from '../services';
import {
  IssueInvoiceFromEncounterDto,
  CreditNoteDto,
  CreatePaymentPlanDto,
  ApplyPaymentReceivedDto,
  LinkReimbursementDto,
  GeneratePatientStatementDto,
  InvoiceResponseDto,
  PaymentReceivedResponseDto,
  PaymentPlanResponseDto,
  ReimbursementResponseDto,
  PatientStatementResponseDto,
} from '../dto';

/**
 * Endpoints de cuentas por cobrar (CxC) del módulo Billing: facturación al
 * paciente, cobros, notas de crédito, reembolsos de seguro, estados de cuenta y
 * planes de pago. Capa fina: valida parámetros y delega en los servicios.
 */
@ApiTags('billing-receivables')
@ApiBearerAuth()
@Controller('billing')
export class BillingReceivablesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param invoicesService - Valor de invoices service requerido por la operación.
   * @param paymentsReceivedService - Valor de payments received service requerido por la operación.
   * @param reimbursementsService - Valor de reimbursements service requerido por la operación.
   * @param statementsService - Valor de statements service requerido por la operación.
   */
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly paymentsReceivedService: PaymentsReceivedService,
    private readonly reimbursementsService: ReimbursementsService,
    private readonly statementsService: PatientStatementsService,
  ) {}

  /** UC-17-01. */
  @Post('invoices\\:issue-from-encounter')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir factura desde los cargos del encuentro' })
  issueFromEncounter(
    @Body() dto: IssueInvoiceFromEncounterDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.issueFromEncounter(dto, actor);
  }

  /** UC-17-02. */
  @Post('payments-received\\:apply')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Aplicar un pago recibido con asignación multi-factura',
  })
  applyPayment(
    @Body() dto: ApplyPaymentReceivedDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PaymentReceivedResponseDto> {
    return this.paymentsReceivedService.apply(dto, actor);
  }

  /** UC-17-03. */
  @Post('invoices/:id\\:credit-note')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir nota de crédito / castigo sobre una factura',
  })
  creditNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreditNoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.creditNote(id, dto, actor);
  }

  /** UC-17-08. */
  @Post('reimbursements\\:link')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Vincular reembolso de reclamo de seguro a la factura',
  })
  linkReimbursement(
    @Body() dto: LinkReimbursementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReimbursementResponseDto> {
    return this.reimbursementsService.link(dto, actor);
  }

  /** UC-17-09. */
  @Post('patient-statements\\:generate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar el estado de cuenta del paciente' })
  generateStatement(
    @Body() dto: GeneratePatientStatementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PatientStatementResponseDto> {
    return this.statementsService.generate(dto, actor);
  }

  /** UC-17-11. */
  @Post('payment-plans')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Configurar un plan de pagos del paciente' })
  createPaymentPlan(
    @Body() dto: CreatePaymentPlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PaymentPlanResponseDto> {
    return this.invoicesService.createPaymentPlan(dto, actor);
  }
}
