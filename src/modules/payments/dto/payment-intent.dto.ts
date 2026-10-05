import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Propósito del cobro; determina el `purpose_concept_id` del intent. */
export enum PaymentPurpose {
  INVOICE = 'INVOICE',
  DEBT = 'DEBT',
  OTHER = 'OTHER',
}

/** Monedas soportadas por el módulo de pagos (ISO-4217). */
export enum CurrencyCode {
  BOB = 'BOB',
  USD = 'USD',
}

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
  amount!: string;

  /**
   * Valor de currency mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Moneda ISO-4217 del cobro',
    enum: CurrencyCode,
  })
  @IsEnum(CurrencyCode)
  currency!: CurrencyCode;

  /**
   * Valor de purpose mantenido por la instancia.
   */
  @ApiProperty({ description: 'Propósito del cobro', enum: PaymentPurpose })
  @IsEnum(PaymentPurpose)
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
}
