import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  BOUNDED_DECIMAL_MESSAGE,
  BOUNDED_DECIMAL_REGEX,
} from '../services/payment-money';
import {
  GATEWAY_PAYMENT_METHOD_TYPES,
  type GatewayNextAction,
  type GatewayPaymentIntentStatus,
  type GatewayPaymentMethodType,
} from '../gateway/payments-gateway.types';

/** Propósito del cobro; determina el `purpose_concept_id` del intent. */
export type PaymentPurpose = 'INVOICE' | 'DEBT' | 'OTHER';
export const PAYMENT_PURPOSES: readonly PaymentPurpose[] = [
  'INVOICE',
  'DEBT',
  'OTHER',
];

/** Cuerpo de `POST /payments/intents` (UC-42-01). */
export class CreatePaymentIntentDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant propietario del cobro', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a gateway.
   */
  @ApiProperty({
    description: 'Gateway a través del cual se cobrará',
    format: 'uuid',
  })
  @IsUUID()
  gatewayId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Importe a cobrar, como cadena decimal para no perder precisión',
    example: '150.00',
  })
  @IsNumberString()
  @Matches(BOUNDED_DECIMAL_REGEX, { message: BOUNDED_DECIMAL_MESSAGE })
  amount!: string;

  /**
   * Valor de currency mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Moneda ISO-4217 del cobro',
    enum: ['BOB', 'USD'],
  })
  @IsIn(['BOB', 'USD'])
  currency!: 'BOB' | 'USD';

  /**
   * Valor de purpose mantenido por la instancia.
   */
  @ApiProperty({ description: 'Propósito del cobro', enum: PAYMENT_PURPOSES })
  @IsIn(PAYMENT_PURPOSES as readonly string[])
  purpose!: PaymentPurpose;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Clave de idempotencia del cliente. Repetirla devuelve el intent existente en lugar de cobrar dos veces.',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  /**
   * Identificador asociado a gateway connection.
   */
  @ApiPropertyOptional({
    description: 'Conexión concreta del gateway',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  gatewayConnectionId?: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({
    description: 'Práctica que origina el cobro',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Identificador asociado a invoice.
   */
  @ApiPropertyOptional({
    description: 'Factura que se está cobrando',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  /**
   * Valor de source ref type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo del recurso de origen (referencia polimórfica)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceRefType?: string;

  /**
   * Identificador asociado a source ref.
   */
  @ApiPropertyOptional({
    description: 'Id del recurso de origen',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sourceRefId?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vencimiento del intent',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  /**
   * Medio de pago en la pasarela (sólo con `payments.via_gateway`).
   */
  @ApiPropertyOptional({
    description:
      'Medio de pago en la pasarela. Obligatorio sólo con `payments.via_gateway` encendido; sin el flag se ignora.',
    enum: GATEWAY_PAYMENT_METHOD_TYPES,
  })
  @IsOptional()
  @IsIn(GATEWAY_PAYMENT_METHOD_TYPES as readonly string[])
  paymentMethodType?: GatewayPaymentMethodType;
}

/** Representación de un intent devuelta por la API. */
export class PaymentIntentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ example: '150.00' })
  amount!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ description: 'Concepto de estado del intent', format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiProperty({ description: 'Clave de idempotencia con la que se creó' })
  idempotencyKey!: string;

  /**
   * Valor de reused mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si la petición reutilizó un intent ya existente (reintento idempotente)',
  })
  reused!: boolean;

  /**
   * Cobro creado en la pasarela; ausente en el camino previo.
   */
  @ApiPropertyOptional({
    description:
      'Presente sólo cuando el cobro se creó por la pasarela (`payments.via_gateway`)',
    type: () => PaymentIntentGatewayDto,
  })
  gateway?: PaymentIntentGatewayDto;
}

/** Cobro creado en la pasarela (sólo con `payments.via_gateway` encendido). */
export class PaymentIntentGatewayDto {
  /**
   * Identificador del cobro en la pasarela.
   */
  @ApiProperty({
    description: 'Identificador del cobro en la pasarela (`pi_…`)',
  })
  paymentIntentId!: string;

  /**
   * Estado del cobro en la pasarela.
   */
  @ApiProperty({
    description: 'Estado del cobro en la pasarela',
    enum: [
      'requires_action',
      'processing',
      'succeeded',
      'failed',
      'canceled',
      'expired',
    ],
  })
  status!: GatewayPaymentIntentStatus;

  /**
   * Qué tiene que hacer el pagador, si hay algo pendiente.
   */
  @ApiPropertyOptional({
    description:
      'Qué tiene que hacer el pagador: mostrar el QR, transferir con una referencia o ir al formulario del banco',
    type: 'object',
    additionalProperties: true,
  })
  nextAction?: GatewayNextAction;
}
