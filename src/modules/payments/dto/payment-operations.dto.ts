import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Método de cálculo de una tarifa. */
export type FeeMethod = 'PERCENTAGE' | 'FIXED';

/** Cuerpo de `POST /payments/fee-schedules` (UC-42-10). */
export class CreateFeeScheduleDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de la tarifa dentro del tenant',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de fee type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Quién cobra la tarifa',
    enum: ['GATEWAY', 'PLATFORM'],
  })
  @IsIn(['GATEWAY', 'PLATFORM'])
  feeType!: 'GATEWAY' | 'PLATFORM';

  /**
   * Valor de method mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Modo de cálculo',
    enum: ['PERCENTAGE', 'FIXED'],
  })
  @IsIn(['PERCENTAGE', 'FIXED'])
  method!: FeeMethod;

  /**
   * Valor de percentage mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Porcentaje cuando method=PERCENTAGE',
    example: '2.9',
  })
  @IsOptional()
  @IsNumberString()
  percentage?: string;

  /**
   * Valor de fixed amount mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Importe fijo cuando method=FIXED',
    example: '0.30',
  })
  @IsOptional()
  @IsNumberString()
  fixedAmount?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

/**
 * Define el contrato validado para fee schedule response.
 */
export class FeeScheduleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Identificador asociado a superseded.
   */
  @ApiProperty({
    description: 'Id de la versión anterior que quedó superseded, si existía',
    required: false,
  })
  supersededId?: string;
}

/** Línea de una liquidación importada. */
export class SettlementLineDto {
  /**
   * Identificador asociado a payment transaction.
   */
  @ApiPropertyOptional({ description: 'Transacción liquidada', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  paymentTransactionId?: string;

  /**
   * Identificador asociado a refund.
   */
  @ApiPropertyOptional({ description: 'Reembolso liquidado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  refundId?: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ example: '150.00' })
  @IsNumberString()
  amount!: string;

  /**
   * Valor de fee amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '4.65' })
  @IsOptional()
  @IsNumberString()
  feeAmount?: string;
}

/** Cuerpo de `POST /payments/settlements/import` (UC-42-12). */
export class ImportSettlementDto {
  /**
   * Identificador asociado a gateway.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  gatewayId!: string;

  /**
   * Valor de settlement ref mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Referencia del lote en el gateway (única)',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  settlementRef!: string;

  /**
   * Valor de gross amount mantenido por la instancia.
   */
  @ApiProperty({ example: '1500.00' })
  @IsNumberString()
  grossAmount!: string;

  /**
   * Valor de fee amount mantenido por la instancia.
   */
  @ApiProperty({ example: '46.50' })
  @IsNumberString()
  feeAmount!: string;

  /**
   * Valor de net amount mantenido por la instancia.
   */
  @ApiProperty({ example: '1453.50' })
  @IsNumberString()
  netAmount!: string;

  /**
   * Valor de currency mantenido por la instancia.
   */
  @ApiProperty({ enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  currency!: 'BOB' | 'USD';

  /**
   * Valor de settled at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  settledAt?: string;

  /**
   * Valor de lines mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Detalle de la liquidación',
    type: [SettlementLineDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SettlementLineDto)
  lines!: SettlementLineDto[];
}

/**
 * Define el contrato validado para settlement response.
 */
export class SettlementResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de settlement ref mantenido por la instancia.
   */
  @ApiProperty()
  settlementRef!: string;

  /**
   * Valor de line count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Líneas importadas' })
  lineCount!: number;

  /**
   * Valor de settled transactions mantenido por la instancia.
   */
  @ApiProperty({ description: 'Transacciones marcadas como liquidadas' })
  settledTransactions!: number;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el lote ya estaba importado (reintento idempotente)',
  })
  duplicate!: boolean;
}

/** Ítem que compone un payout. */
export class PayoutItemDto {
  /**
   * Identificador asociado a source ref.
   */
  @ApiProperty({
    description: 'Transacción que origina el ítem',
    format: 'uuid',
  })
  @IsUUID()
  sourceRefId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ example: '100.00' })
  @IsNumberString()
  amount!: string;

  /**
   * Valor de commission amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '5.00' })
  @IsOptional()
  @IsNumberString()
  commissionAmount?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

/** Cuerpo de `POST /payments/payouts` (UC-42-13). */
export class CreatePayoutDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a payee ref.
   */
  @ApiProperty({ description: 'Cuenta conectada destinataria', format: 'uuid' })
  @IsUUID()
  payeeRefId!: string;

  /**
   * Identificador asociado a gateway.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  gatewayId!: string;

  /**
   * Valor de currency mantenido por la instancia.
   */
  @ApiProperty({ enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  currency!: 'BOB' | 'USD';

  /**
   * Valor de period start mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodStart!: string;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodEnd!: string;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ description: 'Ítems a liquidar', type: [PayoutItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PayoutItemDto)
  items!: PayoutItemDto[];

  /**
   * Valor de gateway payout ref mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Referencia del payout en el gateway' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gatewayPayoutRef?: string;
}

/**
 * Define el contrato validado para payout response.
 */
export class PayoutResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @ApiProperty({ description: 'Suma de los ítems', example: '300.00' })
  amount!: string;

  /**
   * Valor de item count mantenido por la instancia.
   */
  @ApiProperty()
  itemCount!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

/** Registro del proveedor a contrastar contra el ledger. */
export class ProviderRecordDto {
  /**
   * Identificador asociado a external transaction.
   */
  @ApiProperty({ description: 'Id de la transacción en el proveedor' })
  @IsString()
  @MaxLength(200)
  externalTransactionId!: string;

  /**
   * Valor de provider amount mantenido por la instancia.
   */
  @ApiProperty({ example: '150.00' })
  @IsNumberString()
  providerAmount!: string;

  /**
   * Valor de provider status code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de estado informado por el proveedor' })
  @IsString()
  @MaxLength(50)
  providerStatusCode!: string;

  /**
   * Valor de provider currency code mantenido por la instancia.
   */
  @ApiProperty({ enum: ['BOB', 'USD'] })
  @IsIn(['BOB', 'USD'])
  providerCurrencyCode!: 'BOB' | 'USD';

  /**
   * Valor de provider fee amount mantenido por la instancia.
   */
  @ApiPropertyOptional({ example: '4.65' })
  @IsOptional()
  @IsNumberString()
  providerFeeAmount?: string;
}

/** Cuerpo de `POST /payments/reconciliation-runs` (UC-42-14). */
export class CreateReconciliationRunDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a gateway.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  gatewayId!: string;

  /**
   * Identificador asociado a gateway connection.
   */
  @ApiProperty({
    description: 'Conexión de la que provienen los registros',
    format: 'uuid',
  })
  @IsUUID()
  gatewayConnectionId!: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodStart!: string;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  periodEnd!: string;

  /**
   * Valor de provider records mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Extracto del proveedor',
    type: [ProviderRecordDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProviderRecordDto)
  providerRecords!: ProviderRecordDto[];
}

/**
 * Define el contrato validado para reconciliation run response.
 */
export class ReconciliationRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de matched count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Registros que casaron con una transacción local',
  })
  matchedCount!: number;

  /**
   * Valor de unmatched count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Registros sin contraparte local' })
  unmatchedCount!: number;

  /**
   * Valor de exception count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Excepciones abiertas por el descuadre' })
  exceptionCount!: number;

  /**
   * Valor de total gateway mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Total informado por el proveedor',
    example: '1500.00',
  })
  totalGateway!: string;

  /**
   * Valor de total ledger mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Total según el ledger local',
    example: '1450.00',
  })
  totalLedger!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
