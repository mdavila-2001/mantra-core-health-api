import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import {
  GATEWAY_PAYMENT_METHOD_TYPES,
  type GatewayPaymentMethodType,
} from '../gateway/payments-gateway.types';

/** Cuerpo de la conciliación de una reserva de despacho. */
export class ReconcileGatewayDispatchDto {
  @ApiProperty({
    description:
      'El MISMO medio de pago con el que se intentó el cobro la primera vez (no se persiste): con otro, la pasarela contesta `idempotency_key_reused`.',
    enum: GATEWAY_PAYMENT_METHOD_TYPES,
  })
  @IsIn(GATEWAY_PAYMENT_METHOD_TYPES as readonly string[])
  paymentMethodType!: GatewayPaymentMethodType;
}

/** Cuerpo del cierre manual de una reserva de despacho. */
export class CloseGatewayDispatchDto {
  @ApiProperty({
    description:
      'Motivo del cierre, obligatorio: qué se comprobó contra la pasarela. Sin datos personales ni de pacientes.',
    minLength: 10,
    maxLength: 300,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(300)
  reason!: string;
}

/** Una reserva de despacho que requiere conciliación. Sin datos personales. */
export class PendingGatewayDispatchDto {
  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  @ApiPropertyOptional({
    description:
      'Antigüedad de la reserva en milisegundos; ausente si su fecha no se puede leer.',
    nullable: true,
  })
  ageMs!: number | null;

  @ApiProperty({
    description:
      '`true` si todavía se puede reenviar con la misma clave (conciliar); `false` si hay que cerrarla a mano.',
  })
  canReconcile!: boolean;
}

/** Resultado del cierre manual. */
export class ClosedGatewayDispatchDto {
  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
