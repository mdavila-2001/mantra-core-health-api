import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Propósito del cobro; determina el `purpose_concept_id` del intent. */
export type PaymentPurpose = 'INVOICE' | 'DEBT' | 'OTHER';
export const PAYMENT_PURPOSES: readonly PaymentPurpose[] = [
  'INVOICE',
  'DEBT',
  'OTHER',
];

/** Cuerpo de `POST /payments/intents` (UC-42-01). */
export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Tenant propietario del cobro', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Gateway a través del cual se cobrará',
    format: 'uuid',
  })
  @IsUUID()
  gatewayId!: string;

  @ApiProperty({
    description:
      'Importe a cobrar, como cadena decimal para no perder precisión',
    example: '150.00',
  })
  @IsNumberString()
  amount!: string;

  @ApiProperty({
    description: 'Moneda ISO-4217 del cobro',
    enum: ['BOB', 'USD'],
  })
  @IsIn(['BOB', 'USD'])
  currency!: 'BOB' | 'USD';

  @ApiProperty({ description: 'Propósito del cobro', enum: PAYMENT_PURPOSES })
  @IsIn(PAYMENT_PURPOSES as readonly string[])
  purpose!: PaymentPurpose;

  @ApiProperty({
    description:
      'Clave de idempotencia del cliente. Repetirla devuelve el intent existente en lugar de cobrar dos veces.',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  @ApiPropertyOptional({
    description: 'Conexión concreta del gateway',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  gatewayConnectionId?: string;

  @ApiPropertyOptional({
    description: 'Práctica que origina el cobro',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({
    description: 'Factura que se está cobrando',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({
    description: 'Tipo del recurso de origen (referencia polimórfica)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceRefType?: string;

  @ApiPropertyOptional({
    description: 'Id del recurso de origen',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sourceRefId?: string;

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
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ example: '150.00' })
  amount!: string;

  @ApiProperty({ description: 'Concepto de estado del intent', format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Clave de idempotencia con la que se creó' })
  idempotencyKey!: string;

  @ApiProperty({
    description:
      'true si la petición reutilizó un intent ya existente (reintento idempotente)',
  })
  reused!: boolean;
}
