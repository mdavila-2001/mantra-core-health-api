import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { PaymentProofsService } from '../services/payment-proofs.service';
import {
  CreatePaymentProofDto,
  ProviderPaymentTableQueryDto,
  RejectPaymentProofDto,
} from '../dto';

/**
 * C-01 · Comprobantes de pago del paciente. Sin `@Roles` a propósito, como
 * `/billing/simulated/*`: el paciente y el médico no tienen rol de facturación
 * y SÍ tienen qué hacer acá; el permiso lo decide el servicio por objeto
 * (paciente: sólo sus cargos; médico: sólo sus consultas; fuera de alcance,
 * 404).
 */
@ApiTags('billing-payment-proofs')
@ApiBearerAuth()
@Controller('billing')
export class PaymentProofsController {
  constructor(private readonly service: PaymentProofsService) {}

  @Get('me/charges/:chargeId/payment-context')
  @ApiOperation({
    summary:
      'Paciente: cuánto paga por la consulta, su parte según el seguro, el QR de la sede y sus comprobantes',
  })
  paymentContext(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chargeId', ParseUUIDPipe) chargeId: string,
  ) {
    return this.service.paymentContext(user, chargeId);
  }

  @Audited({
    action: 'PAYMENT_PROOF_SUBMITTED',
    entity: 'payment_proof',
    entityId: 'param:chargeId',
  })
  @Post('me/charges/:chargeId/payment-proofs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Paciente: subir el comprobante de la transferencia por QR o declarar que pagó en efectivo',
  })
  createProof(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chargeId', ParseUUIDPipe) chargeId: string,
    @Body() dto: CreatePaymentProofDto,
  ) {
    return this.service.createProof(user, chargeId, dto);
  }

  @Get('me/provider-payment-table')
  @ApiOperation({
    summary:
      'Prestador: tabla de pagos por sesión del período (monto, parte paciente, parte seguro, estado, comprobante)',
  })
  providerPaymentTable(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProviderPaymentTableQueryDto,
  ) {
    return this.service.providerPaymentTable(user, query);
  }

  @Get('charges/:chargeId/payment-proofs')
  @ApiOperation({
    summary: 'Médico o administración: los comprobantes de un cargo propio',
  })
  listForCharge(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chargeId', ParseUUIDPipe) chargeId: string,
  ) {
    return this.service.listForCharge(user, chargeId);
  }

  @Audited({
    action: 'PAYMENT_PROOF_ACCEPTED',
    entity: 'payment_proof',
    entityId: 'param:id',
  })
  @Post('payment-proofs/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Aceptar el comprobante: el cargo queda pagado (409 si ya fue revisado)',
  })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.accept(user, id);
  }

  @Audited({
    action: 'PAYMENT_PROOF_REJECTED',
    entity: 'payment_proof',
    entityId: 'param:id',
  })
  @Post('payment-proofs/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rechazar el comprobante con motivo: el cargo vuelve a pendiente',
  })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectPaymentProofDto,
  ) {
    return this.service.reject(user, id, dto);
  }
}
