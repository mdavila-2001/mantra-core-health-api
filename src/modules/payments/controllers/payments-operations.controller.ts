import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  Public,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  PaymentsCheckoutService,
  PaymentsOperationsService,
  PaymentsTransactionsService,
} from '../services';
import {
  OpenCheckoutSessionDto,
  CheckoutSessionResponseDto,
  GatewayCallbackDto,
  CallbackResultDto,
  CreateFeeScheduleDto,
  FeeScheduleResponseDto,
  ImportSettlementDto,
  SettlementResponseDto,
  CreatePayoutDto,
  PayoutResponseDto,
  CreateReconciliationRunDto,
  ReconciliationRunResponseDto,
} from '../dto';

/**
 * Endpoints de checkout, callbacks del proveedor y operaciones de back-office
 * (tarifas, liquidaciones, payouts y conciliación).
 */
@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsOperationsController {
  constructor(
    private readonly checkoutService: PaymentsCheckoutService,
    private readonly transactionsService: PaymentsTransactionsService,
    private readonly operationsService: PaymentsOperationsService,
  ) {}

  /** UC-42-02. */
  @Post('checkout-sessions')
  @Roles('PAYMENTS_ADMIN', 'CASHIER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Abrir una sesión de checkout con contexto de cajero',
    description:
      'El token de sesión se devuelve una sola vez; la base solo guarda su hash.',
  })
  openCheckout(
    @Body() dto: OpenCheckoutSessionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CheckoutSessionResponseDto & { sessionToken: string }> {
    return this.checkoutService.openSession(dto, actor);
  }

  /**
   * UC-42-06.
   *
   * El gateway no presenta un token de usuario, así que la ruta es pública: la
   * autenticidad se verifica con la firma del proveedor y la correlación por
   * referencia externa, no con el guard de sesión.
   */
  @Public()
  @Post('callbacks/:callbackPath')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recibir el callback/webhook del gateway (idempotente)',
    description:
      'Reintentos del proveedor devuelven `duplicate=true` sin reaplicar efectos.',
  })
  applyCallback(
    @Param('callbackPath') callbackPath: string,
    @Body() dto: GatewayCallbackDto,
  ): Promise<CallbackResultDto> {
    return this.transactionsService.applyCallback(callbackPath, dto);
  }

  /** UC-42-10. */
  @Post('fee-schedules')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar una versión del tarifario' })
  createFeeSchedule(
    @Body() dto: CreateFeeScheduleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FeeScheduleResponseDto> {
    return this.operationsService.createFeeSchedule(dto, actor);
  }

  /** UC-42-12. */
  @Post('settlements/import')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Importar la liquidación del gateway' })
  importSettlement(
    @Body() dto: ImportSettlementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SettlementResponseDto> {
    return this.operationsService.importSettlement(dto, actor);
  }

  /** UC-42-13. */
  @Post('payouts')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ejecutar un payout a una cuenta conectada' })
  executePayout(
    @Body() dto: CreatePayoutDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PayoutResponseDto> {
    return this.operationsService.executePayout(dto, actor);
  }

  /** UC-42-14. */
  @Post('reconciliation-runs')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Conciliar gateway contra ledger y abrir excepciones',
  })
  runReconciliation(
    @Body() dto: CreateReconciliationRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReconciliationRunResponseDto> {
    return this.operationsService.runReconciliation(dto, actor);
  }
}
