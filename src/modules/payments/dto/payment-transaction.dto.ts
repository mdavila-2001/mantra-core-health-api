import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Importe monetario positivo con hasta 2 decimales, como cadena. Rechaza
 * negativos y notación con signo: `@IsNumberString()` los aceptaba, lo que
 * permitía reembolsos/capturas negativos que corrompen los totales.
 */
export const POSITIVE_MONEY_REGEX = /^\d+(\.\d{1,2})?$/;
const POSITIVE_MONEY_MESSAGE =
  'El importe debe ser un número positivo con hasta 2 decimales';

/** Operación solicitada al gateway. */
export type TransactionOperation = 'AUTHORIZE' | 'CAPTURE' | 'SALE';
export const TRANSACTION_OPERATIONS: readonly TransactionOperation[] = [
  'AUTHORIZE',
  'CAPTURE',
  'SALE',
];

/** Cuerpo de `POST /payments/intents/{id}/transactions` (UC-42-05). */
export class ProcessTransactionDto {
  /**
   * Valor de operation mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Operación a ejecutar',
    enum: TRANSACTION_OPERATIONS,
  })
  @IsIn(TRANSACTION_OPERATIONS as readonly string[])
  operation!: TransactionOperation;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Importe a procesar. Si se omite se toma el del intent.',
    example: '150.00',
  })
  @IsOptional()
  @IsNumberString()
  @Matches(POSITIVE_MONEY_REGEX, { message: POSITIVE_MONEY_MESSAGE })
  amount?: string;

  /**
   * Valor de gateway transaction ref mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia devuelta por el gateway' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gatewayTransactionRef?: string;

  /**
   * Valor de authorization code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Código de autorización del emisor' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorizationCode?: string;
}

/**
 * Define el contrato validado para transaction response.
 */
export class TransactionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a payment intent.
   */
  @ApiProperty({ format: 'uuid' })
  paymentIntentId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ example: '150.00' })
  amount!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de gateway transaction ref mantenido por la instancia.
   */
  @ApiPropertyOptional()
  gatewayTransactionRef?: string;
}

/** Cuerpo de `POST /payments/callbacks/{callbackPath}` (UC-42-06). */
export class GatewayCallbackDto {
  /**
   * Valor de gateway transaction ref mantenido por la instancia.
   */
  @ApiProperty({ description: 'Referencia de la transacción en el gateway' })
  @IsString()
  @MaxLength(200)
  gatewayTransactionRef!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Resultado informado por el gateway',
    enum: ['CAPTURED', 'FAILED', 'AUTHORIZED'],
  })
  @IsIn(['CAPTURED', 'FAILED', 'AUTHORIZED'])
  outcome!: 'CAPTURED' | 'FAILED' | 'AUTHORIZED';

  /**
   * Valor de authorization code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Código de autorización' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorizationCode?: string;

  /**
   * Valor de signature mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Firma del proveedor para verificar el origen',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  signature?: string;
}

/**
 * Define el contrato validado para callback result.
 */
export class CallbackResultDto {
  /**
   * Identificador asociado a transaction.
   */
  @ApiProperty({ description: 'Transacción correlacionada', format: 'uuid' })
  transactionId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el callback ya se había aplicado antes',
  })
  duplicate!: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Si el evento cambió el estado local. Un callback fuera de orden o
   * contradictorio se acusa recibo sin aplicarse (MCH-011).
   */
  @ApiProperty({
    description: 'true si el evento cambió el estado local de la transacción',
  })
  applied!: boolean;

  /**
   * Decisión de la máquina de estados sobre el evento.
   */
  @ApiProperty({
    description: 'Cómo se interpretó el evento frente al estado ya conocido',
    enum: ['aplicar', 'duplicado', 'obsoleto', 'contradiccion'],
  })
  decision!: string;

  /**
   * Valor de reconciliation required mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'true si el proveedor afirmó algo incompatible con un estado terminal y hace falta conciliar',
  })
  reconciliationRequired!: boolean;
}

/** Cuerpo de `POST /payments/transactions/{id}/refunds` (UC-42-08). */
export class CreateRefundDto {
  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Importe a reembolsar (parcial o total)',
    example: '50.00',
  })
  @IsNumberString()
  @Matches(POSITIVE_MONEY_REGEX, { message: POSITIVE_MONEY_MESSAGE })
  amount!: string;

  /**
   * Valor de gateway refund ref mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia del reembolso en el gateway',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gatewayRefundRef?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Motivo libre del reembolso' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/**
 * Define el contrato validado para refund response.
 */
export class RefundResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a payment transaction.
   */
  @ApiProperty({ format: 'uuid' })
  paymentTransactionId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ example: '50.00' })
  amount!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Cuerpo de `POST /payments/transactions/{id}/cancellation-requests` (UC-42-09). */
export class CreateCancellationDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a gateway connection.
   */
  @ApiProperty({
    description: 'Conexión del gateway sobre la que se pide la anulación',
    format: 'uuid',
  })
  @IsUUID()
  gatewayConnectionId!: string;

  /**
   * Valor de request number mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Número de solicitud, único por tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  requestNumber!: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Detalle del motivo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;
}

/**
 * Define el contrato validado para cancellation response.
 */
export class CancellationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de request number mantenido por la instancia.
   */
  @ApiProperty()
  requestNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Resultado de `POST /payments/transactions/{id}/status-inquiry` (UC-42-07). */
export class StatusInquiryResponseDto {
  /**
   * Identificador asociado a transaction.
   */
  @ApiProperty({ format: 'uuid' })
  transactionId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de reconciled mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la consulta cambió el estado local' })
  reconciled!: boolean;
}
