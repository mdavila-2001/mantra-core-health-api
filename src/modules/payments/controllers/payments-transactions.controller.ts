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
import { PaymentsTransactionsService } from '../services';
import {
  StatusInquiryResponseDto,
  CreateRefundDto,
  RefundResponseDto,
  CreateCancellationDto,
  CancellationResponseDto,
} from '../dto';

/** Operaciones sobre una transacción ya procesada: consulta, reembolso y anulación. */
@ApiTags('payments-transactions')
@ApiBearerAuth()
@Controller('payments/transactions')
export class PaymentsTransactionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param transactionsService - Valor de transactions service requerido por la operación.
   */
  constructor(
    private readonly transactionsService: PaymentsTransactionsService,
  ) {}

  /** UC-42-07. */
  @Post(':id/status-inquiry')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar el estado de la transacción en el gateway',
    description:
      'Confirmación independiente del callback; se usa antes de aplicar efectos contables cuando hay discrepancia.',
  })
  inquireStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusInquiryResponseDto> {
    return this.transactionsService.inquireStatus(id, actor);
  }

  /** UC-42-08. */
  @Post(':id/refunds')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir un reembolso total o parcial' })
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRefundDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefundResponseDto> {
    return this.transactionsService.refund(id, dto, actor);
  }

  /** UC-42-09. */
  @Post(':id/cancellation-requests')
  @Roles('PAYMENTS_ADMIN', 'CASHIER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Solicitar la anulación del cobro' })
  requestCancellation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCancellationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CancellationResponseDto> {
    return this.transactionsService.requestCancellation(id, dto, actor);
  }
}
