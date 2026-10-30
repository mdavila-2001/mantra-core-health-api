import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { PaymentsTransactionsService } from '../services';
import {
  CloseGatewayDispatchDto,
  ClosedGatewayDispatchDto,
  PendingGatewayDispatchDto,
  ReconcileGatewayDispatchDto,
  TransactionResponseDto,
} from '../dto';

/**
 * Operación administrativa de las reservas de despacho de la pasarela
 * (`payments.via_gateway`): listar las que requieren conciliación, conciliar una
 * reenviando la misma creación con la misma clave, o cerrarla a mano con motivo.
 * Solo `PAYMENTS_ADMIN`. El tenant sale SIEMPRE del contexto verificado de la
 * petición, nunca de la ruta ni del cuerpo; las respuestas no llevan datos de
 * pacientes ni de pagadores.
 */
@ApiTags('payments-gateway-dispatches')
@ApiBearerAuth()
@Controller('payments/gateway-dispatches')
export class PaymentsGatewayDispatchesController {
  constructor(
    private readonly transactionsService: PaymentsTransactionsService,
  ) {}

  @Get('pending-reconciliation')
  @Roles('PAYMENTS_ADMIN')
  @ApiOperation({
    summary: 'Reservas de despacho que requieren conciliación',
    description:
      'Intenciones con una reserva sin `pi_…` más vieja que el plazo (o con fecha ilegible). Bloquean la deuda hasta que se concilian o se cierran.',
  })
  listPending(): Promise<PendingGatewayDispatchDto[]> {
    return this.transactionsService.listGatewayDispatchesRequiringReconciliation();
  }

  @Audited({
    action: 'PAYMENT_GATEWAY_DISPATCH_RECONCILED',
    entity: 'payment_intent',
    entityId: 'param:intentId',
  })
  @Post(':intentId/reconcile')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Conciliar una reserva de despacho con la pasarela',
    description:
      'Reenvía la MISMA creación con la MISMA Idempotency-Key: asocia el cobro que la pasarela ya tenía, o crea el de esta intención una sola vez. Pasadas 23 h no reenvía (409): se cierra a mano. Exige riesgo aprobado.',
  })
  reconcile(
    @Param('intentId', ParseUUIDPipe) intentId: string,
    @Body() dto: ReconcileGatewayDispatchDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.reconcileGatewayDispatch(intentId, dto);
  }

  @Audited({
    action: 'PAYMENT_GATEWAY_DISPATCH_CLOSED_MANUALLY',
    entity: 'payment_intent',
    entityId: 'param:intentId',
  })
  @Post(':intentId/close')
  @Roles('PAYMENTS_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cerrar a mano una reserva de despacho',
    description:
      'No reenvía nada a la pasarela: cancela la intención y libera la deuda. Solo si la reserva ya requiere conciliación. El motivo es obligatorio.',
  })
  close(
    @Param('intentId', ParseUUIDPipe) intentId: string,
    @Body() dto: CloseGatewayDispatchDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClosedGatewayDispatchDto> {
    return this.transactionsService.closeGatewayDispatch(
      intentId,
      dto.reason,
      actor,
    );
  }
}
