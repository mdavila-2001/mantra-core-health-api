import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Operación solicitada al gateway. */
export type TransactionOperation = 'AUTHORIZE' | 'CAPTURE' | 'SALE';
export const TRANSACTION_OPERATIONS: readonly TransactionOperation[] = [
  'AUTHORIZE',
  'CAPTURE',
  'SALE',
];

/** Cuerpo de `POST /payments/intents/{id}/transactions` (UC-42-05). */
export class ProcessTransactionDto {
  @ApiProperty({
    description: 'Operación a ejecutar',
    enum: TRANSACTION_OPERATIONS,
  })
  @IsIn(TRANSACTION_OPERATIONS as readonly string[])
  operation!: TransactionOperation;

  @ApiPropertyOptional({
    description: 'Importe a procesar. Si se omite se toma el del intent.',
    example: '150.00',
  })
  @IsOptional()
  @IsNumberString()
  amount?: string;

  @ApiPropertyOptional({ description: 'Referencia devuelta por el gateway' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gatewayTransactionRef?: string;

  @ApiPropertyOptional({ description: 'Código de autorización del emisor' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorizationCode?: string;
}

export class TransactionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  @ApiProperty({ example: '150.00' })
  amount!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional()
  gatewayTransactionRef?: string;
}

/** Cuerpo de `POST /payments/callbacks/{callbackPath}` (UC-42-06). */
export class GatewayCallbackDto {
  @ApiProperty({ description: 'Referencia de la transacción en el gateway' })
  @IsString()
  @MaxLength(200)
  gatewayTransactionRef!: string;

  @ApiProperty({
    description: 'Resultado informado por el gateway',
    enum: ['CAPTURED', 'FAILED', 'AUTHORIZED'],
  })
  @IsIn(['CAPTURED', 'FAILED', 'AUTHORIZED'])
  outcome!: 'CAPTURED' | 'FAILED' | 'AUTHORIZED';

  @ApiPropertyOptional({ description: 'Código de autorización' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorizationCode?: string;

  @ApiPropertyOptional({
    description: 'Firma del proveedor para verificar el origen',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  signature?: string;
}

export class CallbackResultDto {
  @ApiProperty({ description: 'Transacción correlacionada', format: 'uuid' })
  transactionId!: string;

  @ApiProperty({
    description: 'true si el callback ya se había aplicado antes',
  })
  duplicate!: boolean;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /payments/transactions/{id}/refunds` (UC-42-08). */
export class CreateRefundDto {
  @ApiProperty({
    description: 'Importe a reembolsar (parcial o total)',
    example: '50.00',
  })
  @IsNumberString()
  amount!: string;

  @ApiPropertyOptional({
    description: 'Referencia del reembolso en el gateway',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gatewayRefundRef?: string;

  @ApiPropertyOptional({ description: 'Motivo libre del reembolso' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

export class RefundResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  paymentTransactionId!: string;

  @ApiProperty({ example: '50.00' })
  amount!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /payments/transactions/{id}/cancellation-requests` (UC-42-09). */
export class CreateCancellationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Conexión del gateway sobre la que se pide la anulación',
    format: 'uuid',
  })
  @IsUUID()
  gatewayConnectionId!: string;

  @ApiProperty({
    description: 'Número de solicitud, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  requestNumber!: string;

  @ApiPropertyOptional({ description: 'Detalle del motivo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

export class CancellationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  requestNumber!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Resultado de `POST /payments/transactions/{id}/status-inquiry` (UC-42-07). */
export class StatusInquiryResponseDto {
  @ApiProperty({ format: 'uuid' })
  transactionId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'true si la consulta cambió el estado local' })
  reconciled!: boolean;
}
