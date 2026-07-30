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
  PaymentsIntentsService,
  PaymentsTransactionsService,
} from '../services';
import {
  CreatePaymentIntentDto,
  PaymentIntentResponseDto,
  CreateFxLockDto,
  FxLockResponseDto,
  CreateRiskAssessmentDto,
  RiskAssessmentResponseDto,
  CreateSplitDto,
  SplitResponseDto,
  ProcessTransactionDto,
  TransactionResponseDto,
} from '../dto';

/**
 * Endpoints sobre `/payments/intents`. Capa fina: valida la entrada y delega en
 * los servicios de dominio, que son los que abren la transacción.
 */
@ApiTags('payments-intents')
@ApiBearerAuth()
@Controller('payments/intents')
export class PaymentsIntentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param intentsService - Valor de intents service requerido por la operación.
   * @param transactionsService - Valor de transactions service requerido por la operación.
   */
  constructor(
    private readonly intentsService: PaymentsIntentsService,
    private readonly transactionsService: PaymentsTransactionsService,
  ) {}

  /** UC-42-01. */
  @Post()
  @Roles('PAYMENTS_ADMIN', 'CASHIER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una intención de pago idempotente',
    description:
      'Repetir la misma `idempotencyKey` devuelve el intent existente en lugar de generar un segundo cobro.',
  })
  createIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PaymentIntentResponseDto> {
    return this.intentsService.createIntent(dto, actor);
  }

  /** UC-42-03. */
  @Post(':id/fx-lock')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bloquear el tipo de cambio de la intención' })
  lockFxRate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateFxLockDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FxLockResponseDto> {
    return this.intentsService.lockFxRate(id, dto, actor);
  }

  /** UC-42-04. */
  @Post(':id/risk-assessment')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar la evaluación de riesgo y 3-D Secure' })
  assessRisk(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRiskAssessmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RiskAssessmentResponseDto> {
    return this.intentsService.assessRisk(id, dto, actor);
  }

  /** UC-42-05. */
  @Post(':id/transactions')
  @Roles('PAYMENTS_ADMIN', 'CASHIER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Procesar la transacción contra el gateway (authorize/capture)',
  })
  processTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProcessTransactionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.processTransaction(id, dto, actor);
  }

  /** UC-42-11. */
  @Post(':id/splits')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Repartir el cobro entre cuentas conectadas' })
  addSplit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSplitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SplitResponseDto> {
    return this.intentsService.addSplit(id, dto, actor);
  }
}
